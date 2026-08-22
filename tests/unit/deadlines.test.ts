import { describe, expect, it } from 'vitest';
import {
  addWorkingDays,
  daysUntil,
  estimateCompletion,
  isWorkingDay,
  workingDaysBetween,
} from '@/features/cases/deadlines';

// 2026-06-01 is a Monday.
const MONDAY = new Date('2026-06-01T00:00:00Z');

describe('working days', () => {
  it('treats Friday and Saturday as the Bangladesh weekend', () => {
    expect(isWorkingDay(new Date('2026-06-04T00:00:00Z'))).toBe(true); // Thursday
    expect(isWorkingDay(new Date('2026-06-05T00:00:00Z'))).toBe(false); // Friday
    expect(isWorkingDay(new Date('2026-06-06T00:00:00Z'))).toBe(false); // Saturday
    expect(isWorkingDay(new Date('2026-06-07T00:00:00Z'))).toBe(true); // Sunday
  });

  it('skips the weekend when counting between two dates', () => {
    // Mon -> next Mon is 7 calendar days but 5 working days.
    expect(workingDaysBetween(MONDAY, new Date('2026-06-08T00:00:00Z'))).toBe(5);
  });

  it('never counts backwards', () => {
    expect(workingDaysBetween(new Date('2026-06-08T00:00:00Z'), MONDAY)).toBe(0);
  });

  it('adds working days by skipping the weekend', () => {
    // Monday + 5 working days lands on the following Monday.
    expect(addWorkingDays(MONDAY, 5).toISOString().slice(0, 10)).toBe('2026-06-08');
  });
});

describe('estimateCompletion', () => {
  const base = {
    elapsedDaysBanked: 0,
    estimatedDaysMin: 7,
    estimatedDaysMax: 21,
    waitingOn: 'none' as const,
    waitingSince: null,
    openedAt: MONDAY,
    now: new Date('2026-06-08T00:00:00Z'),
  };

  it('reports no estimate when the service has not published one', () => {
    expect(estimateCompletion({ ...base, estimatedDaysMin: null, estimatedDaysMax: null })).toEqual(
      { available: false },
    );
  });

  it('consumes working days while the case is actively moving', () => {
    const result = estimateCompletion(base);
    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(result.paused).toBe(false);
    expect(result.elapsedWorkingDays).toBe(5);
    expect(result.remainingMinDays).toBe(2);
    expect(result.remainingMaxDays).toBe(16);
  });

  it('stops the clock while waiting on someone else', () => {
    const result = estimateCompletion({
      ...base,
      elapsedDaysBanked: 5,
      waitingOn: 'customer',
      waitingSince: new Date('2026-06-08T00:00:00Z'),
      // Two weeks pass while we wait.
      now: new Date('2026-06-22T00:00:00Z'),
    });

    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(result.paused).toBe(true);
    expect(result.pausedReason).toBe('customer');
    // The banked total is unchanged: waiting time did not consume the estimate.
    expect(result.elapsedWorkingDays).toBe(5);
    expect(result.remainingMinDays).toBe(2);
  });

  it('never reports negative remaining time once the estimate is used up', () => {
    const result = estimateCompletion({ ...base, elapsedDaysBanked: 40 });
    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(result.remainingMinDays).toBe(0);
    expect(result.remainingMaxDays).toBe(0);
  });

  it('projects completion onto working days only', () => {
    const result = estimateCompletion({ ...base, elapsedDaysBanked: 0, now: MONDAY });
    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(isWorkingDay(result.earliestCompletion)).toBe(true);
    expect(isWorkingDay(result.latestCompletion)).toBe(true);
  });
});

describe('daysUntil', () => {
  it('ignores the time of day', () => {
    expect(daysUntil(new Date('2026-06-10T01:00:00Z'), new Date('2026-06-08T23:00:00Z'))).toBe(2);
  });

  it('is negative once the date has passed', () => {
    expect(daysUntil(new Date('2026-06-01T00:00:00Z'), new Date('2026-06-08T00:00:00Z'))).toBe(-7);
  });
});
