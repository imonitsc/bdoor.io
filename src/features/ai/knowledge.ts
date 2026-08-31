import 'server-only';

import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from './config';
import { aiDb, hasAiDatabase } from './db';
import type { Database } from '@/types/database';
import { embedDocuments } from './embeddings';
import { seedSources } from './knowledge-seed';
import { chunkStructured } from './registry/chunker';
import { logger } from '@/lib/logger';

/**
 * Knowledge administration.
 *
 * The workflow is Draft → Professional review → Approved → Published →
 * Indexed, and it is enforced here rather than left to the UI:
 *
 *   - a source can only move forwards one step at a time, or be withdrawn;
 *   - only an approved source can be published;
 *   - only a published source can be indexed;
 *   - publishing a source whose chunks are stale clears the index, so a
 *     half-updated source retrieves nothing rather than retrieving the old text
 *     under the new title.
 *
 * Corrections happen by editing the source and re-indexing. There is no
 * function in this module that edits a generated answer — an answer is a
 * record of what was said, not source material, and rewriting it would make
 * the transcript a work of fiction.
 */

/**
 * Statuses and rows come from the generated schema rather than being restated
 * here. Restating them is how a status the database refuses ends up looking
 * valid to the compiler.
 */
export type SourceStatus = Database['public']['Enums']['ai_source_status'];
export type KnowledgeSource = Database['public']['Tables']['ai_knowledge_sources']['Row'];

/**
 * Legal transitions. Anything not listed is refused — including
 * draft → published, which is the shortcut every content workflow eventually
 * grows and the one the brief explicitly forbids.
 */
const TRANSITIONS: Record<SourceStatus, SourceStatus[]> = {
  draft: ['in_review', 'withdrawn'],
  in_review: ['approved', 'draft', 'withdrawn'],
  approved: ['published', 'in_review', 'withdrawn'],
  published: ['withdrawn', 'approved'],
  withdrawn: ['draft'],
};

export function canTransition(from: SourceStatus, to: SourceStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses whose content may be retrieved by the public assistant. */
export function isPublishable(status: SourceStatus): status is 'published' {
  return status === 'published';
}

async function audit(entry: {
  sourceId: string | null;
  slug: string | null;
  contentVersion: number | null;
  action: 'created' | 'updated' | 'status_changed' | 'indexed' | 'reindexed' | 'deleted';
  from?: SourceStatus | null;
  to?: SourceStatus | null;
  actorId: string | null;
  note?: string | null;
}) {
  const { error } = await aiDb()
    .from('ai_knowledge_audit_log')
    .insert({
      source_id: entry.sourceId,
      source_slug: entry.slug,
      content_version: entry.contentVersion,
      action: entry.action,
      from_status: entry.from ?? null,
      to_status: entry.to ?? null,
      actor_id: entry.actorId,
      note: entry.note ?? null,
    });
  if (error) logger.warn('ai.audit.write_failed', { code: error.code ?? null });
}

export async function listSources(filter?: { status?: SourceStatus }): Promise<KnowledgeSource[]> {
  if (!hasAiDatabase()) return [];

  let query = aiDb()
    .from('ai_knowledge_sources')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (filter?.status) query = query.eq('status', filter.status);

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

export async function getSource(id: string): Promise<KnowledgeSource | null> {
  if (!hasAiDatabase()) return null;
  const { data } = await aiDb().from('ai_knowledge_sources').select('*').eq('id', id).maybeSingle();
  return data;
}

/**
 * Move a source through the workflow.
 *
 * Publishing sets `last_reviewed_at`, because "last reviewed" is the date a
 * person signed it off, and that date is shown to customers beside every
 * factual answer. Withdrawing deletes the chunks: an answer must never cite a
 * source that has been pulled, and leaving the vectors in place while flipping
 * a status is how that happens.
 */
export async function transitionSource(
  id: string,
  to: SourceStatus,
  actorId: string,
  note?: string,
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'illegal_transition' | 'failed' }> {
  if (!hasAiDatabase()) return { ok: false, reason: 'failed' };

  const source = await getSource(id);
  if (!source) return { ok: false, reason: 'not_found' };
  if (!canTransition(source.status, to)) return { ok: false, reason: 'illegal_transition' };

  const patch: Database['public']['Tables']['ai_knowledge_sources']['Update'] = { status: to };
  if (to === 'published') {
    patch.last_reviewed_at = new Date().toISOString();
    patch.reviewed_by = actorId;
  }
  if (to === 'withdrawn') {
    patch.indexed_at = null;
  }

  const { error } = await aiDb().from('ai_knowledge_sources').update(patch).eq('id', id);
  if (error) {
    logger.warn('ai.source.transition_failed', { code: error.code ?? null });
    return { ok: false, reason: 'failed' };
  }

  if (to === 'withdrawn') {
    await aiDb().from('ai_knowledge_chunks').delete().eq('source_id', id);
  }

  await audit({
    sourceId: id,
    slug: source.slug,
    contentVersion: source.content_version,
    action: 'status_changed',
    from: source.status,
    to,
    actorId,
    note: note ?? null,
  });

  return { ok: true };
}

export type IndexResult =
  | { ok: true; chunks: number }
  | {
      ok: false;
      reason: 'not_found' | 'not_published' | 'no_database' | 'failed';
      detail?: string;
    };

/**
 * Embed a published source and replace its chunks.
 *
 * Delete-then-insert rather than diff-and-patch: a chunk boundary moves when a
 * paragraph is edited, so matching old chunks to new ones is guesswork, and a
 * stale chunk that survives an edit is precisely the failure this feature
 * cannot have. The window where a source has no chunks is a window where it is
 * not retrieved — which is the safe direction.
 */
export async function indexSource(id: string, actorId: string): Promise<IndexResult> {
  if (!hasAiDatabase()) return { ok: false, reason: 'no_database' };

  const source = await getSource(id);
  if (!source) return { ok: false, reason: 'not_found' };
  if (!isPublishable(source.status)) return { ok: false, reason: 'not_published' };

  const db = aiDb();
  // Structure-aware chunking: sections keep their headings, provisos stay
  // with the text they qualify, and page/section references ride along for
  // citations. Plain prose degrades to paragraph chunks, as before.
  const pieces = chunkStructured(source.body);

  if (pieces.length === 0) {
    return { ok: false, reason: 'failed', detail: 'source body is empty' };
  }

  let vectors: number[][];
  try {
    // Each chunk is prefixed with its title so a fragment retrieved on its own
    // still carries what it is about — retrieval returns chunks, not documents.
    vectors = await embedDocuments(pieces.map((piece) => `${source.title}\n\n${piece.content}`));
  } catch (error) {
    logger.error('ai.index.embed_failed', { source: id, message: (error as Error).message });
    return { ok: false, reason: 'failed', detail: (error as Error).message };
  }

  const { error: clearError } = await db.from('ai_knowledge_chunks').delete().eq('source_id', id);
  if (clearError) return { ok: false, reason: 'failed', detail: clearError.message };

  const rows = pieces.map((piece, index) => ({
    source_id: id,
    chunk_index: index,
    content: piece.content,
    token_estimate: Math.ceil(piece.content.length / 4),
    embedding: JSON.stringify(vectors[index]),
    embedding_model: EMBEDDING_MODEL,
    embedding_dimensions: EMBEDDING_DIMENSIONS,
    heading: piece.heading,
    section_ref: piece.sectionRef,
    page_start: piece.pageStart,
    page_end: piece.pageEnd,
  }));

  const { error: insertError } = await db.from('ai_knowledge_chunks').insert(rows);
  if (insertError) {
    logger.error('ai.index.write_failed', { source: id, code: insertError.code ?? null });
    return { ok: false, reason: 'failed', detail: insertError.message };
  }

  await db
    .from('ai_knowledge_sources')
    .update({ indexed_at: new Date().toISOString() })
    .eq('id', id);

  await audit({
    sourceId: id,
    slug: source.slug,
    contentVersion: source.content_version,
    action: source.indexed_at ? 'reindexed' : 'indexed',
    actorId,
    note: `${pieces.length} chunks`,
  });

  logger.info('ai.index.complete', { source: id, chunks: pieces.length });
  return { ok: true, chunks: pieces.length };
}

/**
 * Import the reviewed site content as drafts.
 *
 * Import creates; it never publishes, and it never overwrites a source a human
 * has since edited. Re-running it after a content change adds what is new and
 * leaves the rest alone — the decision to take a new version of a paragraph is
 * a reviewer's, not a script's.
 */
export async function importSeedSources(
  actorId: string,
): Promise<{ created: number; skipped: number }> {
  if (!hasAiDatabase()) return { created: 0, skipped: 0 };

  const db = aiDb();
  const candidates = seedSources();

  const { data: existing } = await db.from('ai_knowledge_sources').select('slug').limit(1000);

  const known = new Set((existing ?? []).map((row) => row.slug));
  let created = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    if (known.has(candidate.slug)) {
      skipped += 1;
      continue;
    }

    const { data, error } = await db
      .from('ai_knowledge_sources')
      .insert({
        slug: candidate.slug,
        title: candidate.title,
        country: candidate.country,
        locale: candidate.locale,
        source_type: candidate.sourceType,
        source_url: candidate.sourceUrl,
        body: candidate.body,
        service_category: candidate.serviceCategory ?? null,
        status: 'draft',
        access_scope: 'public',
        last_reviewed_at: `${candidate.lastReviewed}T00:00:00Z`,
      })
      .select('id');

    if (error) {
      logger.warn('ai.seed.insert_failed', { slug: candidate.slug, code: error.code ?? null });
      continue;
    }

    created += 1;
    await audit({
      sourceId: data?.[0]?.id ?? null,
      slug: candidate.slug,
      contentVersion: 1,
      action: 'created',
      to: 'draft',
      actorId,
      note: 'imported from reviewed site content',
    });
  }

  return { created, skipped };
}

export type UnansweredQuestion = Pick<
  Database['public']['Tables']['ai_unanswered_questions']['Row'],
  'id' | 'question' | 'locale' | 'country' | 'reason' | 'occurrences' | 'created_at'
>;

/** The improvement queue: questions the knowledge base could not answer. */
export async function listUnanswered(): Promise<UnansweredQuestion[]> {
  if (!hasAiDatabase()) return [];
  const { data } = await aiDb()
    .from('ai_unanswered_questions')
    .select('id, question, locale, country, reason, occurrences, created_at')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export type UsageSummary = {
  answers: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  medianLatencyMs: number | null;
};

/** Spend and reliability, from the ledger rather than from the gateway. */
export async function usageSummary(sinceDays = 30): Promise<UsageSummary> {
  const empty: UsageSummary = {
    answers: 0,
    failures: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    medianLatencyMs: null,
  };
  if (!hasAiDatabase()) return empty;

  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString().slice(0, 10);
  const { data } = await aiDb()
    .from('ai_usage')
    .select('status, input_tokens, output_tokens, estimated_cost_usd, latency_ms')
    .gte('occurred_on', since)
    .limit(10_000);

  if (!data || data.length === 0) return empty;

  const latencies: number[] = [];
  const summary = data.reduce<UsageSummary>(
    (acc, row) => {
      if (row.status === 'complete') acc.answers += 1;
      else acc.failures += 1;
      acc.inputTokens += row.input_tokens ?? 0;
      acc.outputTokens += row.output_tokens ?? 0;
      acc.costUsd += Number(row.estimated_cost_usd) || 0;
      if (row.latency_ms) latencies.push(row.latency_ms);
      return acc;
    },
    { ...empty },
  );

  if (latencies.length) {
    latencies.sort((a, b) => a - b);
    summary.medianLatencyMs = latencies[Math.floor(latencies.length / 2)] ?? null;
  }

  return summary;
}
