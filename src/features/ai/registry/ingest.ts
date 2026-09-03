import 'server-only';

import { aiDb, hasAiDatabase } from '../db';
import { getDocument, type RegistryDocument, type RegistrySource } from './documents';
import { detectChanges } from './diff';
import { extractDocument } from './extract';
import { fetchDocument } from './fetcher';
import { claimDueJobs, completeJob, enqueueJob, failJob, type JobRow } from './jobs';
import { logger } from '@/lib/logger';

/**
 * The ingestion workers.
 *
 * One bounded batch per invocation: the cron route claims a handful of due
 * jobs, runs them politely, and stops. Nothing here ever ingests "the whole
 * archive" in one request — big work is many small idempotent jobs, each with
 * its own checkpoint and its own retry budget.
 *
 * And nothing here publishes. The pipeline's terminal state is
 * `review_required`: a human decides what customers may rely on.
 */

const BUCKET = 'ai-source-documents';

function extensionFor(contentType: string): string {
  if (contentType === 'application/pdf') return 'pdf';
  if (contentType === 'text/html' || contentType === 'application/xhtml+xml') return 'html';
  if (contentType === 'text/plain') return 'txt';
  if (contentType.includes('wordprocessingml')) return 'docx';
  if (contentType === 'application/msword') return 'doc';
  if (contentType.includes('spreadsheetml')) return 'xlsx';
  if (contentType === 'application/vnd.ms-excel') return 'xls';
  return 'bin';
}

/**
 * Enqueue checks for every enabled registry source whose check is due, and a
 * re-fetch for every published document whose source frequency says it is
 * stale. Dedupe keys make this idempotent per frequency window: the scheduler
 * can run as often as it likes without stacking duplicate work.
 */
export async function scheduleDueWork(): Promise<{ sourceChecks: number; refetches: number }> {
  if (!hasAiDatabase()) return { sourceChecks: 0, refetches: 0 };
  const db = aiDb();
  const now = Date.now();
  let sourceChecks = 0;
  let refetches = 0;

  const { data: sources } = await db.from('ai_source_registry').select('*').eq('enabled', true);

  for (const source of sources ?? []) {
    const intervalMs = source.check_frequency_hours * 3_600_000;
    const lastChecked = source.last_checked_at ? Date.parse(source.last_checked_at) : 0;
    if (now - lastChecked < intervalMs) continue;
    const bucket = Math.floor(now / intervalMs);
    const id = await enqueueJob({
      type: 'check_source',
      registrySourceId: source.id,
      dedupeKey: `check:${source.code}:${bucket}`,
    });
    if (id) sourceChecks += 1;
  }

  // Published documents are re-fetched on their source's cadence so a silent
  // amendment cannot sit unnoticed until a human happens to look.
  const { data: published } = await db
    .from('ai_registry_documents')
    .select('id, registry_source_id, retrieved_at')
    .eq('lifecycle', 'published')
    .limit(500);

  const sourceById = new Map((sources ?? []).map((source) => [source.id, source]));
  for (const document of published ?? []) {
    const source = sourceById.get(document.registry_source_id);
    if (!source) continue;
    const intervalMs = source.check_frequency_hours * 3_600_000;
    const retrieved = document.retrieved_at ? Date.parse(document.retrieved_at) : 0;
    if (now - retrieved < intervalMs) continue;
    const bucket = Math.floor(now / intervalMs);
    const id = await enqueueJob({
      type: 'fetch_document',
      registrySourceId: document.registry_source_id,
      registryDocumentId: document.id,
      dedupeKey: `refetch:${document.id}:${bucket}`,
    });
    if (id) refetches += 1;
  }

  return { sourceChecks, refetches };
}

/** Check one source's index page for change. Discovery of individual new
 * documents is a review decision, so a change raises an alert, not a crawl. */
async function runCheckSource(job: JobRow): Promise<void> {
  const db = aiDb();
  const { data: source } = await db
    .from('ai_source_registry')
    .select('*')
    .eq('id', job.registry_source_id ?? '')
    .maybeSingle();
  if (!source) {
    await failJob(job, 'source_missing', 'registry source not found', { retryable: false });
    return;
  }

  const outcome = await fetchDocument(source.base_url);
  const checkedAt = new Date().toISOString();

  if (!outcome.ok) {
    await db
      .from('ai_source_registry')
      .update({
        last_checked_at: checkedAt,
        consecutive_failures: source.consecutive_failures + 1,
        robots_state: outcome.failure === 'robots_disallowed' ? 'disallowed' : source.robots_state,
      })
      .eq('id', source.id);
    await failJob(job, outcome.failure, `checking ${source.base_url}`, {
      retryable: outcome.retryable,
    });
    return;
  }

  const checksum = outcome.contentHash;
  const changed =
    source.last_content_checksum !== null && source.last_content_checksum !== checksum;

  await db
    .from('ai_source_registry')
    .update({
      last_checked_at: checkedAt,
      last_changed_at: changed ? checkedAt : source.last_changed_at,
      last_content_checksum: checksum,
      consecutive_failures: 0,
      robots_state: 'allowed',
    })
    .eq('id', source.id);

  if (changed) {
    await db.from('ai_source_change_alerts').insert({
      alert_type: 'new_document',
      registry_source_id: source.id,
      summary: `${source.institution}: index page changed — review for new or amended documents`,
      detail: { base_url: source.base_url },
    });
  }

  await completeJob(job.id, { checksum, changed });
}

async function storeOriginal(
  document: RegistryDocument,
  bytes: Uint8Array,
  contentType: string,
  checksum: string,
): Promise<string | null> {
  const path = `reg/${document.registry_source_id}/${document.id}/${checksum.slice(0, 16)}.${extensionFor(contentType)}`;
  const { error } = await aiDb()
    .storage.from(BUCKET)
    .upload(path, bytes.slice().buffer as ArrayBuffer, { contentType, upsert: true });
  if (error) {
    logger.warn('ai.ingest.store_failed', { document: document.id, message: error.message });
    return null;
  }
  return path;
}

/** Shared by first fetch and re-fetch: extract, record, and stop at review. */
async function extractInto(document: RegistryDocument, bytes: Uint8Array, contentType: string) {
  const db = aiDb();
  const extraction = await extractDocument(bytes, contentType);

  if (!extraction.ok) {
    await db
      .from('ai_registry_documents')
      .update({ last_error: `${extraction.reason}: ${extraction.detail ?? ''}`.trim() })
      .eq('id', document.id);
    return extraction;
  }

  await db
    .from('ai_registry_documents')
    .update({
      extracted_text: extraction.text,
      extraction_method: extraction.method,
      ocr_applied: extraction.ocrApplied,
      language_detected: extraction.language,
      page_count: extraction.pageCount,
      extracted_at: new Date().toISOString(),
      lifecycle: 'review_required',
      last_error: extraction.encodingSuspect
        ? 'encoding_suspect: verify text against original'
        : null,
    })
    .eq('id', document.id);

  await db.from('ai_registry_audit_log').insert({
    registry_document_id: document.id,
    registry_source_id: document.registry_source_id,
    action: 'document_extracted',
    to_state: 'review_required',
    note: `${extraction.method}, ${extraction.language}${extraction.pageCount ? `, ${extraction.pageCount} pages` : ''}`,
  });

  return extraction;
}

/**
 * Fetch one document. First fetch moves it discovered → downloaded →
 * extracted → review_required. A re-fetch of a known document compares
 * checksums: unchanged bytes are a timestamp update; changed bytes become a
 * NEW version row linked to the old one, with targeted alerts for fee,
 * deadline and form changes so a reviewer sees exactly why it came back.
 */
async function runFetchDocument(job: JobRow): Promise<void> {
  const db = aiDb();
  const document = job.registry_document_id ? await getDocument(job.registry_document_id) : null;
  if (!document) {
    await failJob(job, 'document_missing', 'registry document not found', { retryable: false });
    return;
  }

  const outcome = await fetchDocument(document.canonical_url);
  if (!outcome.ok) {
    await db
      .from('ai_registry_documents')
      .update({
        last_error: `fetch ${outcome.failure}${outcome.status ? ` (${outcome.status})` : ''}`,
        failed_at: new Date().toISOString(),
      })
      .eq('id', document.id);
    await failJob(job, outcome.failure, document.canonical_url, { retryable: outcome.retryable });
    return;
  }

  const checksum = outcome.contentHash;
  const retrievedAt = new Date().toISOString();

  // Unchanged content: the record is current; nothing else to do.
  if (document.checksum === checksum) {
    await db
      .from('ai_registry_documents')
      .update({ retrieved_at: retrievedAt, last_error: null })
      .eq('id', document.id);
    await completeJob(job.id, { unchanged: true });
    return;
  }

  if (document.checksum === null) {
    // First capture of this document.
    const storagePath = await storeOriginal(document, outcome.bytes, outcome.contentType, checksum);
    await db
      .from('ai_registry_documents')
      .update({
        checksum,
        retrieved_at: retrievedAt,
        storage_path: storagePath,
        mime_type: outcome.contentType,
        byte_size: outcome.bytes.byteLength,
        lifecycle: 'downloaded',
        last_error: null,
      })
      .eq('id', document.id);
    await db.from('ai_registry_audit_log').insert({
      registry_document_id: document.id,
      registry_source_id: document.registry_source_id,
      action: 'document_downloaded',
      to_state: 'downloaded',
      note: `${outcome.contentType}, ${outcome.bytes.byteLength} bytes`,
    });

    const extraction = await extractInto(
      { ...document, checksum, storage_path: storagePath },
      outcome.bytes,
      outcome.contentType,
    );
    if (!extraction.ok) {
      await failJob(job, extraction.reason, extraction.detail ?? '', {
        retryable: extraction.reason === 'failed',
      });
      return;
    }
    await completeJob(job.id, { checksum });
    return;
  }

  // Changed content: a new version, never an in-place overwrite. The old row
  // keeps serving until a reviewer publishes the new one.
  const { data: inserted, error } = await db
    .from('ai_registry_documents')
    .insert({
      registry_source_id: document.registry_source_id,
      issuing_institution: document.issuing_institution,
      source_kind: document.source_kind,
      official_title: document.official_title,
      reference_number: document.reference_number,
      canonical_url: document.canonical_url,
      language: document.language,
      jurisdiction: document.jurisdiction,
      geographic_scope: document.geographic_scope,
      entity_types: document.entity_types,
      sectors: document.sectors,
      topics: document.topics,
      authority_tier: document.authority_tier,
      previous_version_id: document.id,
      lifecycle: 'discovered',
    })
    .select('*');

  const next = inserted?.[0];
  if (error || !next) {
    await failJob(job, 'version_insert_failed', error?.message ?? 'unknown', { retryable: true });
    return;
  }

  const storagePath = await storeOriginal(next, outcome.bytes, outcome.contentType, checksum);
  await db
    .from('ai_registry_documents')
    .update({
      checksum,
      retrieved_at: retrievedAt,
      storage_path: storagePath,
      mime_type: outcome.contentType,
      byte_size: outcome.bytes.byteLength,
      lifecycle: 'downloaded',
    })
    .eq('id', next.id);
  await db
    .from('ai_registry_documents')
    .update({ replaced_by_id: next.id, currency: 'amended' })
    .eq('id', document.id);

  const extraction = await extractInto(next, outcome.bytes, outcome.contentType);

  await db.from('ai_source_change_alerts').insert({
    alert_type: 'new_version',
    registry_source_id: document.registry_source_id,
    registry_document_id: next.id,
    previous_document_id: document.id,
    summary: `${document.official_title}: content changed at source — new version awaiting review`,
    detail: { canonical_url: document.canonical_url },
  });

  // Targeted alerts: the lines that moved money, dates or forms.
  if (extraction.ok && document.extracted_text) {
    const signals = detectChanges(document.extracted_text, extraction.text);
    const byType = new Map<string, string[]>();
    for (const signal of signals) {
      const lines = byType.get(signal.type) ?? [];
      lines.push(`${signal.direction}: ${signal.line}`);
      byType.set(signal.type, lines);
    }
    for (const [type, lines] of byType) {
      await db.from('ai_source_change_alerts').insert({
        alert_type: type as 'fee_change',
        registry_source_id: document.registry_source_id,
        registry_document_id: next.id,
        previous_document_id: document.id,
        summary: `${document.official_title}: ${type.replace('_', ' ')} detected (${lines.length} line${lines.length === 1 ? '' : 's'})`,
        detail: { lines: lines.slice(0, 10) },
      });
    }
  }

  if (!extraction.ok) {
    await failJob(job, extraction.reason, extraction.detail ?? '', {
      retryable: extraction.reason === 'failed',
    });
    return;
  }
  await completeJob(job.id, { checksum, newVersionId: next.id });
}

export type BatchSummary = {
  claimed: number;
  succeeded: number;
  failed: number;
  byType: Record<string, number>;
};

/** Run one bounded batch. The cron route is the only caller. */
export async function runIngestionBatch(limit = 5): Promise<BatchSummary> {
  const jobs = await claimDueJobs(limit);
  const summary: BatchSummary = { claimed: jobs.length, succeeded: 0, failed: 0, byType: {} };

  for (const job of jobs) {
    summary.byType[job.job_type] = (summary.byType[job.job_type] ?? 0) + 1;
    try {
      if (job.job_type === 'check_source') await runCheckSource(job);
      else if (job.job_type === 'fetch_document') await runFetchDocument(job);
      else {
        // extract_document / extract_rules run from admin actions today; a
        // queued row of those types is completed as a no-op rather than
        // wedging the queue.
        await completeJob(job.id, { skipped: true });
      }
      summary.succeeded += 1;
    } catch (error) {
      summary.failed += 1;
      logger.error('ai.ingest.job_crashed', { job: job.id, message: (error as Error).message });
      await failJob(job, 'crashed', (error as Error).message);
    }
  }
  return summary;
}

/** Signed URL for a stored original — review UI only, short-lived. */
export async function originalDocumentUrl(document: RegistryDocument): Promise<string | null> {
  if (!document.storage_path || !hasAiDatabase()) return null;
  const { data } = await aiDb().storage.from(BUCKET).createSignedUrl(document.storage_path, 600);
  return data?.signedUrl ?? null;
}

export type SourceHealth = RegistrySource & { openAlerts: number };
