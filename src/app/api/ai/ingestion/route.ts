import { NextResponse, type NextRequest } from 'next/server';

import { hasAiDatabase } from '@/features/ai/db';
import { runIngestionBatch, scheduleDueWork } from '@/features/ai/registry/ingest';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Knowledge ingestion tick.
 *
 * One invocation schedules whatever source checks and document re-fetches
 * have come due, then runs a small bounded batch of jobs. Long work is many
 * small idempotent jobs with checkpoints, never one long request — a tick
 * that dies mid-batch loses nothing, because unclaimed jobs stay queued and
 * a claimed-but-crashed job re-queues with backoff.
 *
 * Scheduled with a Vercel cron. Vercel sends `Authorization: Bearer
 * $CRON_SECRET`; nothing else may call this — ingestion touches external
 * sites and must not be triggerable by strangers.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) {
    logger.error('ai.ingestion.no_secret');
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!hasAiDatabase()) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const scheduled = await scheduleDueWork();
  const batch = await runIngestionBatch(5);

  logger.info('ai.ingestion.tick', {
    sourceChecks: scheduled.sourceChecks,
    refetches: scheduled.refetches,
    claimed: batch.claimed,
    succeeded: batch.succeeded,
    failed: batch.failed,
  });

  return NextResponse.json({ scheduled, batch });
}
