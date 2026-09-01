import { NextResponse, type NextRequest } from 'next/server';

import { generateRenewalCases } from '@/features/compliance/renewal-cases';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * The renewal-offer run.
 *
 * Opens a draft renewal case for each obligation coming due on a subscribed
 * company's profile. Idempotent on `renewal_cases (obligation_id,
 * period_label)`, so a retry or an overlapping tick costs nothing.
 *
 * Its own route rather than a second phase of the reminder run: a failure
 * here must not stop reminders going out, and one job per route keeps each
 * one named for what it actually does. Scheduled with a Vercel cron (see
 * vercel.json). It creates customer-visible cases, so it refuses to run
 * unauthenticated rather than defaulting open.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = serverEnv().CRON_SECRET;

  if (!secret) {
    logger.error('renewals.no_secret');
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!hasServiceRole()) {
    logger.error('renewals.no_service_role');
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const report = await generateRenewalCases(createAdminClient(), { now: new Date() });

  logger.info('renewals.run', {
    considered: report.considered,
    offered: report.offered,
    alreadyOffered: report.alreadyOffered,
  });

  return NextResponse.json(report);
}
