import 'server-only';

import { aiDb, hasAiDatabase } from '../db';
import type { Database, Json } from '@/types/database';
import { logger } from '@/lib/logger';

/**
 * The ingestion job queue.
 *
 * Small, boring and resumable on purpose: jobs are rows, a worker claims what
 * is due, a transient failure re-queues with bounded backoff, and a job that
 * keeps failing is abandoned onto the admin failed-source list instead of
 * retrying forever against a government server. `dedupe_key` makes enqueueing
 * idempotent — scheduling the same logical work twice is one row — and
 * `checkpoint` lets a batch job continue where it stopped rather than
 * restarting the whole archive.
 */

export type JobType = Database['public']['Enums']['ai_job_type'];
export type JobRow = Database['public']['Tables']['ai_ingestion_jobs']['Row'];

/** Backoff: 5m, 20m, 80m… capped at a day. Retrying a government site faster
 * than this helps nobody. */
export function backoffMinutes(attempt: number): number {
  return Math.min(5 * 4 ** Math.max(attempt - 1, 0), 1_440);
}

export async function enqueueJob(input: {
  type: JobType;
  registrySourceId?: string | null;
  registryDocumentId?: string | null;
  dedupeKey?: string;
  runAfter?: Date;
  maxAttempts?: number;
}): Promise<string | null> {
  if (!hasAiDatabase()) return null;

  const { data, error } = await aiDb()
    .from('ai_ingestion_jobs')
    .upsert(
      {
        job_type: input.type,
        registry_source_id: input.registrySourceId ?? null,
        registry_document_id: input.registryDocumentId ?? null,
        dedupe_key: input.dedupeKey ?? null,
        run_after: (input.runAfter ?? new Date()).toISOString(),
        max_attempts: input.maxAttempts ?? 4,
      },
      // A job already queued under this key stays as it is; enqueue is idempotent.
      { onConflict: 'dedupe_key', ignoreDuplicates: true },
    )
    .select('id');

  if (error) {
    logger.warn('ai.jobs.enqueue_failed', { code: error.code ?? null });
    return null;
  }
  return data?.[0]?.id ?? null;
}

/**
 * Claim up to `limit` due jobs. Claiming is an update guarded by the current
 * status, so two overlapping cron invocations cannot both run the same job:
 * whichever update lands second matches zero rows.
 */
export async function claimDueJobs(limit: number): Promise<JobRow[]> {
  if (!hasAiDatabase()) return [];
  const db = aiDb();

  const { data: due } = await db
    .from('ai_ingestion_jobs')
    .select('id')
    .eq('status', 'queued')
    .lte('run_after', new Date().toISOString())
    .order('run_after', { ascending: true })
    .limit(limit);

  const claimed: JobRow[] = [];
  for (const candidate of due ?? []) {
    const { data } = await db
      .from('ai_ingestion_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', candidate.id)
      .eq('status', 'queued')
      .select('*');
    const row = data?.[0];
    if (row) claimed.push(row);
  }
  return claimed;
}

export async function completeJob(id: string, checkpoint?: Record<string, unknown>) {
  await aiDb()
    .from('ai_ingestion_jobs')
    .update({
      status: 'succeeded',
      finished_at: new Date().toISOString(),
      ...(checkpoint ? { checkpoint: checkpoint as Json } : {}),
    })
    .eq('id', id);
}

/**
 * Record a failure. Retryable failures re-queue with backoff until
 * `max_attempts`; a permanent failure (or the last attempt) becomes
 * 'abandoned', which is what the admin failed-source alert list reads.
 */
export async function failJob(
  job: JobRow,
  errorCode: string,
  errorDetail: string,
  options?: { retryable?: boolean; checkpoint?: Record<string, unknown> },
) {
  const db = aiDb();
  const attempt = job.attempt + 1;
  const retryable = options?.retryable ?? true;
  const abandoned = !retryable || attempt >= job.max_attempts;

  await db
    .from('ai_ingestion_jobs')
    .update({
      status: abandoned ? 'abandoned' : 'queued',
      attempt,
      error_code: errorCode,
      error_detail: errorDetail.slice(0, 2_000),
      finished_at: abandoned ? new Date().toISOString() : null,
      run_after: abandoned
        ? job.run_after
        : new Date(Date.now() + backoffMinutes(attempt) * 60_000).toISOString(),
      ...(options?.checkpoint ? { checkpoint: options.checkpoint as Json } : {}),
    })
    .eq('id', job.id);

  if (abandoned) {
    logger.warn('ai.jobs.abandoned', { job: job.id, type: job.job_type, code: errorCode });
    await db.from('ai_source_change_alerts').insert({
      alert_type: 'fetch_failed',
      registry_source_id: job.registry_source_id,
      registry_document_id: job.registry_document_id,
      summary: `Ingestion job ${job.job_type} abandoned after ${attempt} attempts: ${errorCode}`,
      detail: { error_code: errorCode, error_detail: errorDetail.slice(0, 500) },
    });
    await db.from('ai_registry_audit_log').insert({
      registry_source_id: job.registry_source_id,
      registry_document_id: job.registry_document_id,
      action: 'job_abandoned',
      note: `${job.job_type}: ${errorCode}`,
    });
  }
}
