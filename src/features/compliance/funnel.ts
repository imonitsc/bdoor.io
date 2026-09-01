import 'server-only';

import { recordAnalyticsEvent } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { StructuredRule } from '@/features/ai/registry/rules';

/**
 * The Ask → Comply funnel's landing side (ROADMAP P2.4).
 *
 * An answer's "track this" exit carries the rule id into /app/compliance;
 * this module resolves that rule for display and records the arrival, so
 * "answered but not converted" is a query instead of a guess. Question and
 * retrieval are already logged on the Ask side (ai_messages.source_ids and
 * rule_ids); the exit is the missing third leg.
 */

export type TrackedRule = {
  id: string;
  title: string;
  responsibleAuthority: string;
  legalAuthority: string;
  /** The reviewer's sign-off date, falling back to publication. */
  lastReviewed: string | null;
  /** Analyst-set recurrence token, when the rule is scheduled (P1). */
  recurrence: string | null;
};

/**
 * The rule a track link points at, through the caller's own client — the
 * `ai_rules_public_read` policy already scopes reads to live published
 * rules, so a withdrawn or superseded id simply resolves to nothing.
 */
export async function trackedRule(ruleId: string): Promise<TrackedRule | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_structured_rules')
    .select(
      'id, title, responsible_authority, legal_authority, reviewed_at, published_at, recurrence',
    )
    .eq('id', ruleId)
    .maybeSingle();
  if (!data) return null;

  type Row = Pick<
    StructuredRule,
    | 'id'
    | 'title'
    | 'responsible_authority'
    | 'legal_authority'
    | 'reviewed_at'
    | 'published_at'
    | 'recurrence'
  >;
  const rule = data as Row;
  const reviewed = rule.reviewed_at ?? rule.published_at;
  return {
    id: rule.id,
    title: rule.title,
    responsibleAuthority: rule.responsible_authority,
    legalAuthority: rule.legal_authority,
    lastReviewed: reviewed ? reviewed.slice(0, 10) : null,
    recurrence: rule.recurrence,
  };
}

/**
 * One arrival per organisation and rule — the funnel counts distinct exits
 * taken, not page reloads. Fire-and-forget from the page render, like the
 * quote-viewed stamp.
 */
export async function recordComplyExit(
  organizationId: string,
  ruleId: string,
  actorEmail: string | null,
): Promise<void> {
  await recordAnalyticsEvent({
    event: 'ask_comply_exit',
    idempotencyKey: `ask_comply_exit:${organizationId}:${ruleId}`,
    actorEmail,
    organizationId,
    properties: { ruleId },
  });
}

/**
 * The reminder funnel's "opened" leg.
 *
 * A dispatched reminder links a customer to their calendar through a
 * notification id, and following that link is what stamps `opened_at` —
 * a truer signal than a bulk mark-all-read, and the step between "reminded"
 * and "acted" in `metrics_obligation_engagement`.
 *
 * Ownership is proved with the caller's own client first: `notifications_self`
 * only returns the signed-in user's rows, so an id belonging to someone else
 * resolves to nothing and stamps nothing. The stamp itself needs the service
 * role, because `compliance_reminders` accepts staff writes only — the same
 * split as the track-company entry, and the narrowest possible use of it.
 */
export async function recordReminderOpened(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: notification } = await supabase
    .from('notifications')
    .select('id, read_at')
    .eq('id', notificationId)
    .eq('kind', 'compliance_reminder')
    .maybeSingle();

  if (!notification) return;

  if (!notification.read_at) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notification.id);
  }

  if (!hasServiceRole()) return;

  // Idempotent: the first open is the one the funnel counts.
  const { error } = await createAdminClient()
    .from('compliance_reminders')
    .update({ opened_at: new Date().toISOString() })
    .eq('notification_id', notification.id)
    .is('opened_at', null);

  if (error) {
    logger.error('reminders.opened_stamp_failed', { message: error.message });
  }
}
