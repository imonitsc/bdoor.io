import type { Enums } from '@/types/database';

export type WaitingOn = Enums<'case_waiting_on'>;

export type EstimateInput = {
  /** Working days already spent while the case was actively being worked. */
  elapsedDaysBanked: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  waitingOn: WaitingOn;
  /** When the current wait began. Ignored when `waitingOn` is 'none'. */
  waitingSince: Date | null;
  now: Date;
  openedAt: Date;
};

export type EstimateResult =
  | { available: false }
  | {
      available: true;
      /** True when the clock is stopped because we are blocked on someone else. */
      paused: boolean;
      pausedReason: Exclude<WaitingOn, 'none'> | null;
      /** Working days consumed so far, excluding paused time. */
      elapsedWorkingDays: number;
      remainingMinDays: number;
      remainingMaxDays: number;
      earliestCompletion: Date;
      latestCompletion: Date;
    };

const MS_PER_DAY = 86_400_000;

/** Bangladesh working week: Friday and Saturday are the weekend. */
export function isWorkingDay(date: Date): boolean {
  const day = date.getUTCDay(); // 0 Sun … 5 Fri, 6 Sat
  return day !== 5 && day !== 6;
}

export function workingDaysBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let count = 0;
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));

  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWorkingDay(cursor)) count += 1;
  }
  return count;
}

export function addWorkingDays(from: Date, days: number): Date {
  const cursor = new Date(from.getTime());
  let remaining = Math.max(0, Math.round(days));
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWorkingDay(cursor)) remaining -= 1;
  }
  return cursor;
}

/**
 * An estimate that pauses.
 *
 * While the case is waiting on the customer, a partner, an authority or a
 * payment, no working days accrue — so the projected completion date slides
 * forward rather than silently going overdue. That is the honest behaviour:
 * we are not late, we are blocked, and the customer can see which.
 */
export function estimateCompletion(input: EstimateInput): EstimateResult {
  const { estimatedDaysMin, estimatedDaysMax } = input;
  if (estimatedDaysMin === null || estimatedDaysMax === null) {
    return { available: false };
  }

  const paused = input.waitingOn !== 'none';

  // Time accrued since the case last started moving again.
  const activeSince = paused ? (input.waitingSince ?? input.now) : input.openedAt;
  const accrued = paused ? 0 : workingDaysBetween(activeSince, input.now);
  const elapsedWorkingDays = input.elapsedDaysBanked + accrued;

  const remainingMinDays = Math.max(0, estimatedDaysMin - elapsedWorkingDays);
  const remainingMaxDays = Math.max(0, estimatedDaysMax - elapsedWorkingDays);

  return {
    available: true,
    paused,
    pausedReason: paused ? (input.waitingOn as Exclude<WaitingOn, 'none'>) : null,
    elapsedWorkingDays,
    remainingMinDays,
    remainingMaxDays,
    earliestCompletion: addWorkingDays(input.now, remainingMinDays),
    latestCompletion: addWorkingDays(input.now, remainingMaxDays),
  };
}

export function daysUntil(due: Date, now: Date): number {
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((dueDay - nowDay) / MS_PER_DAY);
}
