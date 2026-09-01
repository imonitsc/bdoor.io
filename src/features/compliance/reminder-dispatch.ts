import 'server-only';

import { getTranslations } from 'next-intl/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';
import {
  ACTIONABLE_STATUSES,
  DEFAULT_REMINDER_OFFSETS,
  scheduleReminders,
  triageReminders,
} from './reminders';

/**
 * The reminder dispatcher.
 *
 * P1 generates obligations and P4 measures whether customers act on them, but
 * between those two nothing ever sent anything: `scheduleReminders` was pure
 * and unwired, no code inserted a `compliance_reminders` row, and no code
 * created a `notification`. The engagement funnel therefore read zero by
 * construction. This closes that gap in two phases, mirroring the ingestion
 * queue: materialise the work that is due, then run a bounded batch.
 *
 * Service role throughout — `compliance_reminders` and `notifications` only
 * accept staff writes under RLS, and this runs from a cron route where no
 * user session exists.
 *
 * Two published promises constrain the batch (/products/comply, "Reminders
 * that lead the deadline"):
 *
 *   "Ahead of every due date" → a reminder whose deadline has passed is
 *                               retired, never sent as a chaser.
 *   "never five at once"      → one notification per recipient per run,
 *                               however many obligations came due together.
 *
 * Only the in-app channel is dispatched here. An in-app notification is a real
 * delivery, so stamping `sent_at` for it is honest today. Email reminders stay
 * pending until an email provider is configured: the only implemented adapter
 * is the mock, and stamping `sent_at` because a mock logged a line would make
 * `metrics_obligation_engagement` report reminders that never reached anyone.
 */

/** Longest lead time we schedule, and so the window worth materialising. */
const MAX_OFFSET_DAYS = Math.max(...DEFAULT_REMINDER_OFFSETS);

/**
 * How far behind schedule a reminder may be and still go out. Beyond this it
 * is retired: after an outage the customer should not receive a burst of
 * reminders for dates they have already lived through.
 */
const STALE_AFTER_DAYS = 3;

export type MaterializeReport = {
  obligationsConsidered: number;
  remindersCreated: number;
};

/**
 * Renders the notification title in both locales. Injectable so the batch can
 * be exercised without a request context; the default reads the message
 * catalogue, which is where the ICU plural rules for `bn` live.
 */
export type ReminderTitles = (count: number) => Promise<{ en: string; bn: string }>;

const i18nTitles: ReminderTitles = async (count) => {
  const [tEn, tBn] = await Promise.all([
    getTranslations({ locale: 'en', namespace: 'workspace.compliance.reminder' }),
    getTranslations({ locale: 'bn', namespace: 'workspace.compliance.reminder' }),
  ]);
  return { en: tEn('title', { count }), bn: tBn('title', { count }) };
};

export type DispatchReport = {
  /** Due in-app reminders examined this run. */
  claimed: number;
  /** Reminder rows stamped `sent_at` against a delivered notification. */
  sent: number;
  /** Notifications created (one per recipient per run). */
  notified: number;
  /** Rows closed without sending — deadline passed, obligation done, stale. */
  retired: number;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/**
 * Create the reminder rows for obligations coming due.
 *
 * Idempotent by the table's own `unique (obligation_id, offset_days, channel)`:
 * re-running inserts nothing new, and an obligation created late gets only the
 * offsets still ahead of it (`scheduleReminders` drops the ones already past,
 * which is what keeps a late arrival from firing five reminders at once).
 */
export async function materializeReminders(
  admin: SupabaseClient<Database>,
  options: { now?: Date; limit?: number } = {},
): Promise<MaterializeReport> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 500;
  const report: MaterializeReport = { obligationsConsidered: 0, remindersCreated: 0 };

  const { data: obligations, error } = await admin
    .from('compliance_obligations')
    .select('id, due_on')
    .in('status', [...ACTIONABLE_STATUSES])
    .gte('due_on', isoDate(now))
    .lte('due_on', isoDate(addDays(now, MAX_OFFSET_DAYS)))
    .order('due_on')
    .limit(limit);

  if (error) {
    logger.error('reminders.materialize_query_failed', { message: error.message });
    return report;
  }

  const rows = obligations ?? [];
  report.obligationsConsidered = rows.length;
  if (rows.length === 0) return report;

  const pending = rows.flatMap((obligation) =>
    scheduleReminders({ dueOn: new Date(`${obligation.due_on}T00:00:00Z`), now }).map(
      (reminder) => ({
        obligation_id: obligation.id,
        offset_days: reminder.offsetDays,
        channel: reminder.channel,
        scheduled_for: reminder.scheduledFor,
      }),
    ),
  );
  if (pending.length === 0) return report;

  const { data: inserted, error: insertError } = await admin
    .from('compliance_reminders')
    .upsert(pending, { onConflict: 'obligation_id,offset_days,channel', ignoreDuplicates: true })
    .select('id');

  if (insertError) {
    logger.error('reminders.materialize_insert_failed', { message: insertError.message });
    return report;
  }

  report.remindersCreated = inserted?.length ?? 0;
  return report;
}

type DueReminder = {
  id: string;
  obligation_id: string;
  scheduled_for: string;
};

type ReminderObligation = {
  id: string;
  organization_id: string;
  label_en: string;
  label_bn: string;
  due_on: string;
  status: string;
};

/**
 * Send the in-app reminders that are due.
 *
 * Recipients are the customer members of the organisation the obligation
 * belongs to. Everything due for one recipient in one run becomes a single
 * notification listing the deadlines, so a company with six obligations
 * landing together gets one message rather than six.
 */
export async function dispatchDueReminders(
  admin: SupabaseClient<Database>,
  options: { now?: Date; limit?: number; titles?: ReminderTitles } = {},
): Promise<DispatchReport> {
  const now = options.now ?? new Date();
  const titles = options.titles ?? i18nTitles;
  const today = isoDate(now);
  const limit = options.limit ?? 200;
  const report: DispatchReport = { claimed: 0, sent: 0, notified: 0, retired: 0 };

  const { data: dueRows, error: dueError } = await admin
    .from('compliance_reminders')
    .select('id, obligation_id, scheduled_for')
    .eq('channel', 'in_app')
    .is('sent_at', null)
    .is('failed_at', null)
    .lte('scheduled_for', today)
    .order('scheduled_for')
    .limit(limit);

  if (dueError) {
    logger.error('reminders.dispatch_query_failed', { message: dueError.message });
    return report;
  }

  const due = (dueRows ?? []) as DueReminder[];
  report.claimed = due.length;
  if (due.length === 0) return report;

  const { data: obligationRows, error: obligationError } = await admin
    .from('compliance_obligations')
    .select('id, organization_id, label_en, label_bn, due_on, status')
    .in(
      'id',
      due.map((row) => row.obligation_id),
    );

  if (obligationError) {
    logger.error('reminders.dispatch_obligations_failed', { message: obligationError.message });
    return report;
  }

  const obligations = new Map(
    ((obligationRows ?? []) as ReminderObligation[]).map((row) => [row.id, row]),
  );

  const triage = triageReminders(
    due.map((row) => ({
      id: row.id,
      obligationId: row.obligation_id,
      scheduledFor: row.scheduled_for,
    })),
    new Map(
      [...obligations.values()].map((row) => [
        row.id,
        { id: row.id, organizationId: row.organization_id, dueOn: row.due_on, status: row.status },
      ]),
    ),
    { today, staleBefore: isoDate(addDays(now, -STALE_AFTER_DAYS)) },
  );

  for (const row of triage.retire) {
    // `failed_at` is the table's terminal, not-sent column; the reason says
    // plainly that this was a retirement rather than a delivery failure.
    const { error } = await admin
      .from('compliance_reminders')
      .update({ failed_at: now.toISOString(), failure_reason: row.reason })
      .eq('id', row.reminder.id)
      .is('sent_at', null);
    if (error) {
      logger.error('reminders.retire_failed', {
        reminderId: row.reminder.id,
        message: error.message,
      });
    } else {
      report.retired += 1;
    }
  }

  const sendable = triage.send.map((entry) => ({
    reminder: entry.reminder,
    obligation: obligations.get(entry.obligation.id)!,
  }));
  if (sendable.length === 0) return report;

  // Group by organisation: one notification per recipient, per run.
  const byOrganization = new Map<string, typeof sendable>();
  for (const entry of sendable) {
    const bucket = byOrganization.get(entry.obligation.organization_id);
    if (bucket) bucket.push(entry);
    else byOrganization.set(entry.obligation.organization_id, [entry]);
  }

  for (const [organizationId, entries] of byOrganization) {
    const { data: members, error: membersError } = await admin
      .from('organization_memberships')
      .select('user_id, role, joined_at')
      .eq('organization_id', organizationId)
      .in('role', ['customer_owner', 'customer_member'])
      .order('joined_at');

    if (membersError) {
      logger.error('reminders.members_failed', { organizationId, message: membersError.message });
      continue;
    }
    if (!members || members.length === 0) {
      logger.warn('reminders.no_recipients', { organizationId, due: entries.length });
      continue;
    }

    // Soonest deadline first — the customer reads the list in the order they
    // have to act on it.
    const items = [...entries].sort(
      (a, b) =>
        a.obligation.due_on.localeCompare(b.obligation.due_on) ||
        a.obligation.id.localeCompare(b.obligation.id),
    );
    const title = await titles(items.length);
    const line = (label: string, dueOn: string) => `${label} — ${dueOn}`;
    const bodyEn = items.map((i) => line(i.obligation.label_en, i.obligation.due_on)).join('\n');
    const bodyBn = items.map((i) => line(i.obligation.label_bn, i.obligation.due_on)).join('\n');

    // The primary recipient is the owner who joined first; their notification
    // is the one each reminder row links to, so `opened_at` has a single
    // unambiguous meaning. Every member still receives their own copy.
    let primaryNotificationId: string | null = null;

    for (const member of members) {
      // The id is chosen here rather than by the default so the link can carry
      // it: following the reminder into the calendar is what stamps
      // `opened_at`, and that is a truer engagement signal than a bulk
      // mark-all-read.
      const notificationId = crypto.randomUUID();
      const { error: notificationError } = await admin.from('notifications').insert({
        id: notificationId,
        user_id: member.user_id,
        organization_id: organizationId,
        kind: 'compliance_reminder',
        title_en: title.en,
        title_bn: title.bn,
        body_en: bodyEn,
        body_bn: bodyBn,
        href: `/app/compliance?n=${notificationId}`,
      });

      if (notificationError) {
        logger.error('reminders.notification_failed', {
          organizationId,
          message: notificationError.message,
        });
        continue;
      }
      report.notified += 1;
      primaryNotificationId ??= notificationId;
    }

    if (!primaryNotificationId) continue;

    for (const item of items) {
      // Claim-guarded: two overlapping cron ticks cannot both stamp the same
      // reminder, because the second update matches zero rows.
      const { data: claimed, error: claimError } = await admin
        .from('compliance_reminders')
        .update({ sent_at: now.toISOString(), notification_id: primaryNotificationId })
        .eq('id', item.reminder.id)
        .is('sent_at', null)
        .select('id');

      if (claimError) {
        logger.error('reminders.stamp_failed', {
          reminderId: item.reminder.id,
          message: claimError.message,
        });
        continue;
      }
      report.sent += claimed?.length ?? 0;
    }
  }

  return report;
}
