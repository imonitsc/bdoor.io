import { NextResponse, type NextRequest } from 'next/server';

import { LIMITS } from '@/features/ai/config';
import { aiDb, hasAiDatabase } from '@/features/ai/db';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Retention sweep.
 *
 * Conversations carry a `delete_after` instant set when they are created, and
 * this deletes the ones that have passed it. Messages and feedback cascade;
 * `ai_usage` does not, because its conversation reference is `on delete set
 * null` — the spend ledger has to survive the transcript, or the monthly
 * budget check starts lying the first time a sweep runs.
 *
 * Scheduled with a Vercel cron (see vercel.json / project settings). Vercel
 * sends `Authorization: Bearer $CRON_SECRET`; nothing else may call this.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = serverEnv().CRON_SECRET;

  // Refuse rather than run unauthenticated. An endpoint that deletes rows is
  // not one to leave open because a variable was forgotten.
  if (!secret) {
    logger.error('ai.retention.no_secret');
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!hasAiDatabase()) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const now = new Date().toISOString();
  const { data, error } = await aiDb()
    .from('ai_conversations')
    .delete()
    .lte('delete_after', now)
    .select('id');

  if (error) {
    logger.error('ai.retention.failed', { code: error.code ?? null });
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }

  const deleted = data?.length ?? 0;
  logger.info('ai.retention.swept', { deleted, retentionDays: LIMITS.retentionDays });
  return NextResponse.json({ deleted });
}
