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
