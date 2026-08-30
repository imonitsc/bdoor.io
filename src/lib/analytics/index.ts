import 'server-only';

import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { isTestActorEmail, type AnalyticsEvent } from './taxonomy';

/**
 * First-party commercial milestones (master instruction §22).
 *
 * Server-side only: events are written with the service role from Server
 * Actions, route handlers and webhooks — `analytics_events` has no insert
 * policy for anon or authenticated, so nothing a browser sends can fabricate
 * a milestone. Recording is best-effort by design: the milestone itself (the
 * stored application, the accepted quote, the confirmed payment) is the
 * source of truth, and a metrics failure must never break the action it
 * measures.
 */

export type RecordAnalyticsEventInput = {
  event: AnalyticsEvent;
  /** Replays with the same key count once (unique index; 23505 is a no-op). */
  idempotencyKey: string;
  /**
   * Used only to derive `is_test` (docs/EVENT_TAXONOMY.md §13.7). The address
   * itself is never written to the event.
   */
  actorEmail?: string | null;
  /** Force the test flag regardless of the actor (CI, rehearsals). */
  isTest?: boolean;
  organizationId?: string | null;
  caseId?: string | null;
  applicationId?: string | null;
  quoteVersionId?: string | null;
  paymentId?: string | null;
  subscriptionId?: string | null;
  country?: string | null;
  locale?: 'en' | 'bn' | null;
  packageSlug?: string | null;
  sourcePath?: string | null;
  utm?: Record<string, string>;
  /** Category-level facts only — never a name, email, phone or free text. */
  properties?: Record<string, string | number | boolean | null>;
};

export async function recordAnalyticsEvent(input: RecordAnalyticsEventInput): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    const isTest =
      input.isTest === true ||
      process.env.ANALYTICS_TEST_MODE === '1' ||
      isTestActorEmail(input.actorEmail);

    const admin = createAdminClient();
    const { error } = await admin.from('analytics_events').insert({
      event_name: input.event,
      idempotency_key: input.idempotencyKey,
      is_test: isTest,
      organization_id: input.organizationId ?? null,
      case_id: input.caseId ?? null,
      application_id: input.applicationId ?? null,
      quote_version_id: input.quoteVersionId ?? null,
      payment_id: input.paymentId ?? null,
      subscription_id: input.subscriptionId ?? null,
      country: input.country ?? null,
      locale: input.locale ?? null,
      package_slug: input.packageSlug ?? null,
      source_path: input.sourcePath ?? null,
      utm: input.utm ?? {},
      properties: input.properties ?? {},
    });

    // 23505 is the idempotency index doing its job on a replay.
    if (error && error.code !== '23505') {
      logger.warn('analytics.record_failed', { event: input.event, code: error.code });
    }
  } catch (error) {
    logger.warn('analytics.record_failed', {
      event: input.event,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}
