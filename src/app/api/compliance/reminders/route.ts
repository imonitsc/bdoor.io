import { NextResponse, type NextRequest } from 'next/server';

import {
  dispatchDueReminders,
  materializeReminders,
} from '@/features/compliance/reminder-dispatch';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * The compliance reminder run.
 *
 * Materialises reminder rows for obligations coming due, then sends the in-app
 * reminders that have reached their date. Both phases are idempotent, so a
 * retry or an overlapping tick costs nothing.
 *
 * Scheduled with a Vercel cron (see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; nothing else may call this. It writes
 * customer-visible notifications, so it refuses to run unauthenticated rather
 * than defaulting open.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = serverEnv().CRON_SECRET;

  if (!secret) {
    logger.error('reminders.no_secret');
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!hasServiceRole()) {
    logger.error('reminders.no_service_role');
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const scheduled = await materializeReminders(admin, { now });
  // Each channel runs its own bounded batch, so a provider outage on the
  // email leg cannot stop in-app reminders reaching the workspace.
  const dispatched = await dispatchDueReminders(admin, { now, channel: 'in_app' });
  const emailed = await dispatchDueReminders(admin, { now, channel: 'email' });

  logger.info('reminders.run', {
    obligationsConsidered: scheduled.obligationsConsidered,
    remindersCreated: scheduled.remindersCreated,
    claimed: dispatched.claimed,
    sent: dispatched.sent,
    notified: dispatched.notified,
    retired: dispatched.retired,
    emailClaimed: emailed.claimed,
    emailSent: emailed.sent,
    emailRetired: emailed.retired,
  });

  return NextResponse.json({ scheduled, dispatched, emailed });
}
