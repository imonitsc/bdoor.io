import { describe, expect, it } from 'vitest';

import { groupObligations, obligationGroup } from '@/features/compliance/groups';

/**
 * §4.8 obligation grouping: by status AND calendar, so a stale status row
 * cannot hide a deadline that has already arrived.
 */

const NOW = new Date('2026-08-31T10:00:00Z');

describe('obligationGroup', () => {
  it('moves a nominally upcoming obligation into due-now inside the action window', () => {
    expect(obligationGroup('upcoming', new Date('2026-09-05'), NOW)).toBe('due_now');
    expect(obligationGroup('due', new Date('2026-08-31'), NOW)).toBe('due_now');
    expect(obligationGroup('upcoming', new Date('2026-10-20'), NOW)).toBe('upcoming');
  });

  it('treats a past due date as overdue whatever the stored status says', () => {
    expect(obligationGroup('upcoming', new Date('2026-08-20'), NOW)).toBe('overdue');
    expect(obligationGroup('due', new Date('2026-08-30'), NOW)).toBe('overdue');
    expect(obligationGroup('overdue', new Date('2026-08-01'), NOW)).toBe('overdue');
  });

  it('maps workflow states without inventing an authority outcome', () => {
    // in_progress means bdoor is working on it — under review. completed is
    // completed: the platform tracks no filing/acceptance events, so no
    // "Filed"/"Accepted" claim exists to be made.
    expect(obligationGroup('in_progress', new Date('2026-09-30'), NOW)).toBe('under_review');
    expect(obligationGroup('completed', new Date('2026-08-01'), NOW)).toBe('completed');
    expect(obligationGroup('waived', new Date('2026-09-30'), NOW)).toBe('not_applicable');
  });
});

describe('groupObligations', () => {
  it('buckets in the canonical order and drops empty groups', () => {
    const grouped = groupObligations(
      [
        { status: 'upcoming', due_on: '2026-09-02' },
        { status: 'upcoming', due_on: '2026-11-01' },
        { status: 'completed', due_on: '2026-05-01' },
      ] as const,
      NOW,
    );
    expect(grouped.map((bucket) => bucket.group)).toEqual(['due_now', 'upcoming', 'completed']);
    expect(grouped.every((bucket) => bucket.items.length === 1)).toBe(true);
  });
});
