import { describe, expect, it } from 'vitest';

import {
  bangladeshCalendar,
  matchRule,
  occurrencesInWindow,
  planObligations,
  rollToWorkingDay,
  type EntityFacts,
  type ScheduledRule,
} from '@/features/compliance/rules-engine';

/**
 * The /newobligation §5 table, as executable cases. Every date below is a
 * fixture chosen for its weekday, and every holiday is a sample — no fixture
 * here is a real gazetted holiday or a real filing deadline, because those
 * are regulatory facts and live only in the ledger.
 *
 * Weekday facts the cases rely on (UTC): 2027-01-01 is a Friday, 2027-01-02
 * a Saturday, 2027-01-03 a Sunday — a working day in Bangladesh.
 */

function rule(overrides: Partial<ScheduledRule>): ScheduledRule {
  return {
    id: 'rule-1',
    title: 'Annual return filing (sample)',
    jurisdictionCode: 'BD',
    entityTypes: ['private_limited'],
    sectors: [],
    responsibleAuthority: 'Registrar (sample)',
    topic: 'annual_return',
    recurrence: 'annual',
    anchor: 'fixed_date',
    offsetDays: 0,
    month: 1,
    day: 1,
    requiredDocuments: [],
    ...overrides,
  };
}

function entity(overrides: Partial<EntityFacts> = {}): EntityFacts {
  return {
    companyId: 'company-1',
    organizationId: 'org-1',
    jurisdictionCode: 'BD',
    structure: 'private_limited',
    sector: null,
    incorporationDate: '2026-03-15',
    ...overrides,
  };
}

/** BD calendar with sample holidays; years listed are "analyst has entered data". */
function calendar(holidays: string[] = [], years: number[] = [2026, 2027, 2028]) {
  return bangladeshCalendar(
    holidays.map((date) => ({ date })),
    years,
  );
}

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const WINDOW_2027 = { from: utc('2027-01-01'), to: utc('2027-12-31') };

describe('matchRule — the over-firing asymmetry', () => {
  it('a non-matching entity gets nothing, silently', () => {
    expect(matchRule(rule({}), entity({ structure: 'partnership' }))).toEqual({
      outcome: 'not_applicable',
      reason: 'entity_type',
    });
    expect(matchRule(rule({ jurisdictionCode: 'AE' }), entity())).toEqual({
      outcome: 'not_applicable',
      reason: 'jurisdiction',
    });
  });

  it('a rule that does not say who owes it is ambiguous, never fired', () => {
    expect(matchRule(rule({ entityTypes: [] }), entity())).toEqual({
      outcome: 'ambiguous',
      reason: 'no_entity_types',
    });
  });

  it('a sector-scoped rule against an entity of unknown sector is ambiguous', () => {
    expect(matchRule(rule({ sectors: ['banking (sample)'] }), entity({ sector: null }))).toEqual({
      outcome: 'ambiguous',
      reason: 'sector_unknown',
    });
  });
});

describe('deadline arithmetic — BD calendar', () => {
  it('fiscal year end anchors to 30 June, not the calendar year', () => {
    const occurrences = occurrencesInWindow(
      rule({ anchor: 'fiscal_year_end', month: null, day: null }),
      entity(),
      calendar(),
      WINDOW_2027.from,
      WINDOW_2027.to,
    );
    expect(occurrences).toEqual([{ ok: true, dueOn: '2027-06-30', rolledFrom: null }]);
  });

  it('a due date landing on Friday rolls to Sunday (BD weekend is Fri–Sat)', () => {
    // 2027-01-01 is a Friday.
    const [occurrence] = occurrencesInWindow(
      rule({}),
      entity(),
      calendar(),
      WINDOW_2027.from,
      WINDOW_2027.to,
    );
    expect(occurrence).toEqual({ ok: true, dueOn: '2027-01-03', rolledFrom: '2027-01-01' });
  });

  it('a due date landing on Saturday rolls to Sunday', () => {
    const [occurrence] = occurrencesInWindow(
      rule({ day: 2 }),
      entity(),
      calendar(),
      WINDOW_2027.from,
      WINDOW_2027.to,
    );
    expect(occurrence).toEqual({ ok: true, dueOn: '2027-01-03', rolledFrom: '2027-01-02' });
  });

  it('rolls through consecutive holidays after the weekend', () => {
    // Weekend Fri 1st / Sat 2nd, then two sample holidays Sun 3rd and Mon 4th.
    const [occurrence] = occurrencesInWindow(
      rule({}),
      entity(),
      calendar(['2027-01-03', '2027-01-04']),
      WINDOW_2027.from,
      WINDOW_2027.to,
    );
    expect(occurrence).toEqual({ ok: true, dueOn: '2027-01-05', rolledFrom: '2027-01-01' });
  });

  it('a 29 February anniversary clamps to 28 February in a non-leap year and returns on the leap year', () => {
    const occurrences = occurrencesInWindow(
      rule({ anchor: 'incorporation', month: null, day: null }),
      entity({ incorporationDate: '2024-02-29' }),
      calendar(),
      utc('2027-01-01'),
      utc('2028-12-31'),
    );
    expect(occurrences.map((o) => (o.ok ? o.dueOn : o.error))).toEqual([
      '2027-02-28',
      '2028-02-29',
    ]);
  });

  it('a month-end period deadline clamps into February instead of rolling to March', () => {
    const occurrences = occurrencesInWindow(
      rule({ anchor: 'period_end', recurrence: 'monthly', month: null, day: null }),
      entity(),
      calendar(),
      utc('2027-02-01'),
      utc('2027-02-28'),
    );
    expect(occurrences).toEqual([{ ok: true, dueOn: '2027-02-28', rolledFrom: null }]);
  });

  it('refuses to compute a due date in a year the holiday set does not cover', () => {
    const occurrences = occurrencesInWindow(
      rule({}),
      entity(),
      calendar([], [2027]), // analyst entered 2027 only
      utc('2027-01-01'),
      utc('2028-12-31'),
    );
    expect(occurrences).toEqual([
      { ok: true, dueOn: '2027-01-03', rolledFrom: '2027-01-01' },
      { ok: false, error: 'missing_holiday_data', year: 2028 },
    ]);
  });

  it('treats sixty consecutive non-working days as corrupt data, not a deadline', () => {
    const everyDay: string[] = [];
    for (let offset = 0; offset < 70; offset += 1) {
      everyDay.push(
        new Date(utc('2027-03-01').getTime() + offset * 86_400_000).toISOString().slice(0, 10),
      );
    }
    const result = rollToWorkingDay(utc('2027-03-01'), calendar(everyDay));
    expect(result).toEqual({ ok: false, error: 'missing_holiday_data', year: 2027 });
  });
});

describe('recurrence and anchors', () => {
  it('one_off from incorporation fires once, offset in days', () => {
    const occurrences = occurrencesInWindow(
      rule({
        anchor: 'incorporation',
        recurrence: 'one_off',
        offsetDays: 30,
        month: null,
        day: null,
      }),
      entity({ incorporationDate: '2027-03-15' }),
      calendar(),
      WINDOW_2027.from,
      WINDOW_2027.to,
    );
    // 2027-04-14 is a Wednesday: no roll.
    expect(occurrences).toEqual([{ ok: true, dueOn: '2027-04-14', rolledFrom: null }]);
  });

  it('a one_off already due before the window produces nothing — past periods are never regenerated', () => {
    const occurrences = occurrencesInWindow(
      rule({
        anchor: 'incorporation',
        recurrence: 'one_off',
        offsetDays: 30,
        month: null,
        day: null,
      }),
      entity({ incorporationDate: '2026-01-01' }),
      calendar(),
      WINDOW_2027.from,
      WINDOW_2027.to,
    );
    expect(occurrences).toEqual([]);
  });

  it('quarterly period ends step three months', () => {
    const occurrences = occurrencesInWindow(
      rule({
        anchor: 'period_end',
        recurrence: 'quarterly',
        offsetDays: 15,
        month: null,
        day: null,
      }),
      entity(),
      calendar(),
      utc('2027-01-01'),
      utc('2027-06-30'),
    );
    const dues = occurrences.map((o) => (o.ok ? o.dueOn : o.error));
    // Jan 31 + 15 = Feb 15 (Monday), Apr 30 + 15 = May 15 (Saturday → Sunday 16).
    expect(dues).toEqual(['2027-02-15', '2027-05-16']);
  });

  it('an incoherent recurrence/anchor pair is a loud error, not a guess', () => {
    expect(
      occurrencesInWindow(
        rule({ anchor: 'fixed_date', recurrence: 'monthly' }),
        entity(),
        calendar(),
        WINDOW_2027.from,
        WINDOW_2027.to,
      ),
    ).toEqual([{ ok: false, error: 'unsupported_combination' }]);
  });

  it('an incorporation-anchored rule against an unincorporated entity is a loud error', () => {
    expect(
      occurrencesInWindow(
        rule({ anchor: 'incorporation', month: null, day: null }),
        entity({ incorporationDate: null }),
        calendar(),
        WINDOW_2027.from,
        WINDOW_2027.to,
      ),
    ).toEqual([{ ok: false, error: 'missing_incorporation_date' }]);
  });
});

describe('planObligations', () => {
  const rules = [
    rule({ id: 'fires', title: 'Fires (sample)' }),
    rule({ id: 'wrong-structure', entityTypes: ['partnership'], title: 'Not ours (sample)' }),
    rule({ id: 'unscoped', entityTypes: [], title: 'May apply (sample)' }),
  ];

  it('separates fired, silent and may-apply — ambiguous never becomes an obligation', () => {
    const plan = planObligations(rules, entity(), calendar(), WINDOW_2027);
    expect(plan.obligations).toEqual([
      {
        ruleId: 'fires',
        ruleTitle: 'Fires (sample)',
        dueOn: '2027-01-03',
        rolledFrom: '2027-01-01',
      },
    ]);
    expect(plan.ambiguous).toEqual([
      { ruleId: 'unscoped', ruleTitle: 'May apply (sample)', reason: 'no_entity_types' },
    ]);
    expect(plan.errors).toEqual([]);
  });

  it('is deterministic — the same inputs plan the same calendar twice', () => {
    const first = planObligations(rules, entity(), calendar(), WINDOW_2027);
    const second = planObligations(rules, entity(), calendar(), WINDOW_2027);
    expect(second).toEqual(first);
  });

  it('surfaces per-occurrence failures without suppressing the occurrences that worked', () => {
    const plan = planObligations([rule({})], entity(), calendar([], [2027]), {
      from: utc('2027-01-01'),
      to: utc('2028-12-31'),
    });
    expect(plan.obligations).toHaveLength(1);
    expect(plan.errors).toEqual([
      {
        ruleId: 'rule-1',
        ruleTitle: 'Annual return filing (sample)',
        error: 'missing_holiday_data',
        year: 2028,
      },
    ]);
  });
});
