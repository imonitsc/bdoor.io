import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_OFFSETS,
  obligationStatusFor,
  scheduleReminders,
  triageReminders,
  type TriageObligation,
  type TriageReminder,
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

describe('triageReminders', () => {
  const WINDOW = { today: '2026-09-01', staleBefore: '2026-08-29' };

  function reminder(overrides: Partial<TriageReminder> = {}): TriageReminder {
    return { id: 'rem-1', obligationId: 'obl-1', scheduledFor: '2026-09-01', ...overrides };
  }

  function obligation(overrides: Partial<TriageObligation> = {}): TriageObligation {
    return {
      id: 'obl-1',
      organizationId: 'org-1',
      dueOn: '2026-09-15',
      status: 'upcoming',
      ...overrides,
    };
  }

  function map(...rows: TriageObligation[]) {
    return new Map(rows.map((row) => [row.id, row]));
  }

  it('sends a reminder that still leads its deadline', () => {
    const triage = triageReminders([reminder()], map(obligation()), WINDOW);

    expect(triage.send).toHaveLength(1);
    expect(triage.retire).toEqual([]);
  });

  it('still reminds about an obligation the customer has started', () => {
    const triage = triageReminders(
      [reminder()],
      map(obligation({ status: 'in_progress' })),
      WINDOW,
    );
    expect(triage.send).toHaveLength(1);
  });

  it('never nags about work already filed or waived', () => {
    for (const status of ['completed', 'waived']) {
      const triage = triageReminders([reminder()], map(obligation({ status })), WINDOW);
      expect(triage.send).toEqual([]);
      expect(triage.retire[0]!.reason).toBe('obligation_closed');
    }
  });

  it('retires a reminder whose deadline has already passed', () => {
    // "Ahead of every due date": a late reminder is not sent as a chaser.
    const triage = triageReminders([reminder()], map(obligation({ dueOn: '2026-08-31' })), WINDOW);

    expect(triage.send).toEqual([]);
    expect(triage.retire[0]!.reason).toBe('deadline_passed');
  });

  it('sends on the due date itself but not the day after', () => {
    expect(
      triageReminders([reminder()], map(obligation({ dueOn: '2026-09-01' })), WINDOW).send,
    ).toHaveLength(1);
    expect(
      triageReminders([reminder()], map(obligation({ dueOn: '2026-08-31' })), WINDOW).send,
    ).toEqual([]);
  });

  it('retires a backlog rather than delivering a burst after an outage', () => {
    const triage = triageReminders(
      [reminder({ scheduledFor: '2026-08-20' })],
      map(obligation()),
      WINDOW,
    );

    expect(triage.send).toEqual([]);
    expect(triage.retire[0]!.reason).toBe('stale');
  });

  it('still sends one that slipped by less than the staleness window', () => {
    const triage = triageReminders(
      [reminder({ scheduledFor: '2026-08-30' })],
      map(obligation()),
      WINDOW,
    );
    expect(triage.send).toHaveLength(1);
  });

  it('retires a reminder whose obligation has gone', () => {
    const triage = triageReminders([reminder()], map(), WINDOW);
    expect(triage.retire[0]!.reason).toBe('obligation_missing');
  });

  it('accounts for every reminder exactly once', () => {
    const due = [
      reminder({ id: 'a', obligationId: 'send' }),
      reminder({ id: 'b', obligationId: 'closed' }),
      reminder({ id: 'c', obligationId: 'gone' }),
      reminder({ id: 'd', obligationId: 'late' }),
    ];
    const triage = triageReminders(
      due,
      map(
        obligation({ id: 'send' }),
        obligation({ id: 'closed', status: 'completed' }),
        obligation({ id: 'late', dueOn: '2026-08-01' }),
      ),
      WINDOW,
    );

    expect(triage.send.length + triage.retire.length).toBe(due.length);
    expect(
      [...triage.send.map((s) => s.reminder.id), ...triage.retire.map((r) => r.reminder.id)]
        .sort()
        .join(','),
    ).toBe('a,b,c,d');
  });
});
