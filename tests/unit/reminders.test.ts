import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_OFFSETS,
  obligationStatusFor,
  scheduleReminders,
} from '@/features/compliance/reminders';

const DUE = new Date('2026-09-30T00:00:00Z');

describe('scheduleReminders', () => {
  it('schedules each offset before the due date', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    const reminders = scheduleReminders({ dueOn: DUE, now });

    const inApp = reminders.filter((r) => r.channel === 'in_app').map((r) => r.offsetDays);
    expect(inApp).toEqual([...DEFAULT_REMINDER_OFFSETS]);
    expect(reminders.find((r) => r.offsetDays === 30 && r.channel === 'in_app')?.scheduledFor).toBe(
      '2026-08-31',
    );
  });

  it('does not email about a deadline that is a day away', () => {
    const reminders = scheduleReminders({ dueOn: DUE, now: new Date('2026-06-01T00:00:00Z') });
    const emailOffsets = reminders.filter((r) => r.channel === 'email').map((r) => r.offsetDays);

    expect(emailOffsets).toContain(30);
    expect(emailOffsets).not.toContain(1);
  });

  it('drops reminders that would already be in the past', () => {
    // Added ten days before the deadline: the 60, 30 and 14 day reminders are
    // gone, and we do not fire three notifications at once to make up for it.
    const reminders = scheduleReminders({ dueOn: DUE, now: new Date('2026-09-20T00:00:00Z') });
    const offsets = [...new Set(reminders.map((r) => r.offsetDays))];

    expect(offsets).toEqual([7, 1]);
  });

  it('schedules nothing for a deadline that has passed', () => {
    expect(scheduleReminders({ dueOn: DUE, now: new Date('2026-10-05T00:00:00Z') })).toEqual([]);
  });
});

describe('obligationStatusFor', () => {
  const now = new Date('2026-06-01T00:00:00Z');

  it('is overdue the day after the deadline', () => {
    expect(obligationStatusFor(new Date('2026-05-31T00:00:00Z'), now, false)).toBe('overdue');
  });

  it('is still due on the deadline itself', () => {
    expect(obligationStatusFor(new Date('2026-06-01T00:00:00Z'), now, false)).toBe('due');
  });

  it('becomes due inside thirty days', () => {
    expect(obligationStatusFor(new Date('2026-06-25T00:00:00Z'), now, false)).toBe('due');
    expect(obligationStatusFor(new Date('2026-08-01T00:00:00Z'), now, false)).toBe('upcoming');
  });

  it('reports completion regardless of the date', () => {
    expect(obligationStatusFor(new Date('2020-01-01T00:00:00Z'), now, true)).toBe('completed');
  });
});
