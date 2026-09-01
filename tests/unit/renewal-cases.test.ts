import { describe, expect, it } from 'vitest';

import { renewalCandidates, renewalPeriodLabel } from '@/features/compliance/renewal-cases';

/**
 * Eligibility decides whether a customer finds a case in their workspace that
 * they did not ask for, so it is tested the way CLAUDE.md §10 asks: the
 * boundaries, the double-offer, and the two records that must agree.
 */

const WINDOW = { today: '2026-09-01', horizon: '2026-10-31' };

type Obligation = Parameters<typeof renewalCandidates>[0][number];

function obligation(overrides: Partial<Obligation> = {}): Obligation {
  return {
    id: 'obl-1',
    organization_id: 'org-1',
    company_id: 'co-1',
    label_en: 'Annual return',
    due_on: '2026-09-30',
    status: 'upcoming',
    renewal_case_id: null,
    ...overrides,
  };
}

describe('renewalPeriodLabel', () => {
  it('is the occurrence date, so a corrected deadline is a different period', () => {
    expect(renewalPeriodLabel('2026-09-30')).toBe('2026-09-30');
    expect(renewalPeriodLabel('2026-10-01')).not.toBe(renewalPeriodLabel('2026-09-30'));
  });
});

describe('renewalCandidates', () => {
  it('offers a case for an actionable obligation inside the window', () => {
    const { candidates, alreadyOffered } = renewalCandidates([obligation()], new Set(), WINDOW);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.periodLabel).toBe('2026-09-30');
    expect(candidates[0]!.companyId).toBe('co-1');
    expect(alreadyOffered).toBe(0);
  });

  it('never offers twice — the obligation shortcut counts', () => {
    const { candidates, alreadyOffered } = renewalCandidates(
      [obligation({ renewal_case_id: 'case-1' })],
      new Set(),
      WINDOW,
    );

    expect(candidates).toEqual([]);
    expect(alreadyOffered).toBe(1);
  });

  it('never offers twice — the link table counts', () => {
    const { candidates, alreadyOffered } = renewalCandidates(
      [obligation()],
      new Set(['obl-1:2026-09-30']),
      WINDOW,
    );

    expect(candidates).toEqual([]);
    expect(alreadyOffered).toBe(1);
  });

  it('offers again for a different period of the same obligation', () => {
    // The link is keyed by period, so next year's occurrence is a fresh offer.
    const { candidates } = renewalCandidates(
      [obligation({ due_on: '2026-10-15' })],
      new Set(['obl-1:2026-09-30']),
      WINDOW,
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.periodLabel).toBe('2026-10-15');
  });

  it('skips an obligation with no company — the promise is "on the same profile"', () => {
    const { candidates } = renewalCandidates([obligation({ company_id: null })], new Set(), WINDOW);
    expect(candidates).toEqual([]);
  });

  it('skips work already filed or waived', () => {
    for (const status of ['completed', 'waived']) {
      const { candidates } = renewalCandidates([obligation({ status })], new Set(), WINDOW);
      expect(candidates).toEqual([]);
    }
  });

  it('offers on the due date itself but never after it', () => {
    expect(
      renewalCandidates([obligation({ due_on: '2026-09-01' })], new Set(), WINDOW).candidates,
    ).toHaveLength(1);
    // A deadline already passed is a conversation, not an offer.
    expect(
      renewalCandidates([obligation({ due_on: '2026-08-31' })], new Set(), WINDOW).candidates,
    ).toEqual([]);
  });

  it('does not reach past the horizon', () => {
    expect(
      renewalCandidates([obligation({ due_on: '2026-10-31' })], new Set(), WINDOW).candidates,
    ).toHaveLength(1);
    expect(
      renewalCandidates([obligation({ due_on: '2026-11-01' })], new Set(), WINDOW).candidates,
    ).toEqual([]);
  });

  it('orders by deadline so the soonest is offered first, deterministically', () => {
    const rows = [
      obligation({ id: 'c', due_on: '2026-10-20' }),
      obligation({ id: 'a', due_on: '2026-09-10' }),
      obligation({ id: 'b', due_on: '2026-09-10' }),
    ];

    const first = renewalCandidates(rows, new Set(), WINDOW).candidates;
    const second = renewalCandidates([...rows].reverse(), new Set(), WINDOW).candidates;

    expect(first.map((c) => c.obligationId)).toEqual(['a', 'b', 'c']);
    expect(first).toEqual(second);
  });

  it('accounts for every obligation it was given', () => {
    const rows = [
      obligation({ id: 'new' }),
      obligation({ id: 'taken', renewal_case_id: 'case-9' }),
      obligation({ id: 'done', status: 'completed' }),
      obligation({ id: 'late', due_on: '2026-01-01' }),
    ];

    const { candidates, alreadyOffered } = renewalCandidates(rows, new Set(), WINDOW);

    expect(candidates.map((c) => c.obligationId)).toEqual(['new']);
    expect(alreadyOffered).toBe(1);
  });
});
