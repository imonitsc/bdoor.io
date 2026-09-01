import type { Enums } from '@/types/database';

export type NotificationChannel = Enums<'notification_channel'>;
export type ObligationStatus = Enums<'obligation_status'>;

export const DEFAULT_REMINDER_OFFSETS = [60, 30, 14, 7, 1] as const;

export type ScheduledReminder = {
  offsetDays: number;
  channel: NotificationChannel;
  scheduledFor: string;
};

/**
 * Turns a due date into a reminder schedule.
 *
 * Reminders that would already be in the past are dropped rather than fired
 * immediately — an obligation added late should not produce five notifications
 * at once. Email is reserved for the longer-lead reminders so a customer is not
 * emailed five times about one deadline.
 */
export function scheduleReminders(params: {
  dueOn: Date;
  now: Date;
  offsets?: readonly number[];
  channels?: readonly NotificationChannel[];
  emailOffsetThreshold?: number;
}): ScheduledReminder[] {
  const offsets = params.offsets ?? DEFAULT_REMINDER_OFFSETS;
  const channels = params.channels ?? (['in_app', 'email'] as const);
  const emailThreshold = params.emailOffsetThreshold ?? 7;

  const out: ScheduledReminder[] = [];

  for (const offsetDays of offsets) {
    const scheduled = new Date(params.dueOn.getTime());
    scheduled.setUTCDate(scheduled.getUTCDate() - offsetDays);
    if (scheduled.getTime() < params.now.getTime()) continue;

    for (const channel of channels) {
      if (channel === 'email' && offsetDays < emailThreshold) continue;
      out.push({
        offsetDays,
        channel,
        scheduledFor: scheduled.toISOString().slice(0, 10),
      });
    }
  }

  return out.sort((a, b) => b.offsetDays - a.offsetDays || a.channel.localeCompare(b.channel));
}

/** Statuses that still need the customer to act. */
export const ACTIONABLE_STATUSES = ['upcoming', 'due', 'overdue', 'in_progress'] as const;

export type TriageObligation = {
  id: string;
  organizationId: string;
  dueOn: string;
  status: string;
};

export type TriageReminder = {
  id: string;
  obligationId: string;
  scheduledFor: string;
};

export type RetireReason = 'obligation_missing' | 'obligation_closed' | 'deadline_passed' | 'stale';

export type Triage = {
  send: Array<{ reminder: TriageReminder; obligation: TriageObligation }>;
  retire: Array<{ reminder: TriageReminder; reason: RetireReason }>;
};

/**
 * Decide, for each due reminder, whether it still deserves to be sent.
 *
 * Pure so the decision that reaches a customer can be tested exhaustively;
 * the dispatcher only performs what this returns. Three of the four retirement
 * reasons protect the subscription rather than the system: nagging someone
 * about a filing they have completed, or about a deadline they have already
 * lived through, is how a Comply subscriber decides to cancel.
 */
export function triageReminders(
  due: readonly TriageReminder[],
  obligations: ReadonlyMap<string, TriageObligation>,
  window: { today: string; staleBefore: string },
): Triage {
  const triage: Triage = { send: [], retire: [] };

  for (const reminder of due) {
    const obligation = obligations.get(reminder.obligationId);
    if (!obligation) {
      triage.retire.push({ reminder, reason: 'obligation_missing' });
      continue;
    }
    if (!(ACTIONABLE_STATUSES as readonly string[]).includes(obligation.status)) {
      triage.retire.push({ reminder, reason: 'obligation_closed' });
      continue;
    }
    // "Ahead of every due date" — a reminder is never a chaser.
    if (obligation.dueOn < window.today) {
      triage.retire.push({ reminder, reason: 'deadline_passed' });
      continue;
    }
    // After an outage, do not deliver a burst of dates already lived through.
    if (reminder.scheduledFor < window.staleBefore) {
      triage.retire.push({ reminder, reason: 'stale' });
      continue;
    }
    triage.send.push({ reminder, obligation });
  }

  return triage;
}

export function obligationStatusFor(dueOn: Date, now: Date, completed: boolean): ObligationStatus {
  if (completed) return 'completed';

  const msPerDay = 86_400_000;
  const diff = Math.round(
    (Date.UTC(dueOn.getUTCFullYear(), dueOn.getUTCMonth(), dueOn.getUTCDate()) -
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) /
      msPerDay,
  );

  if (diff < 0) return 'overdue';
  if (diff <= 30) return 'due';
  return 'upcoming';
}
