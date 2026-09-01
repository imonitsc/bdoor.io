/**
 * Rule → Obligation instantiation (ROADMAP P1, /newobligation).
 *
 * Pure functions only: everything here is table-driven-testable with no
 * database. The asymmetry that governs matching: under-firing costs the
 * customer a penalty, over-firing costs the product its trust — so an
 * ambiguous rule NEVER fires. It is surfaced as "may apply — confirm" and a
 * human decides.
 *
 * Dates are calendar dates in the jurisdiction, never instants. Bangladesh's
 * fiscal year runs July–June and its weekend is Friday–Saturday (CLAUDE.md
 * §6); the Gulf differs on both, so both live in the jurisdiction calendar,
 * not in the arithmetic. Holiday data must exist for a year before any due
 * date is computed in it — a missing holiday set is a loud per-occurrence
 * error, never a silent computation.
 */

export type Recurrence = 'one_off' | 'monthly' | 'quarterly' | 'annual';
export type DeadlineAnchor = 'incorporation' | 'fiscal_year_end' | 'fixed_date' | 'period_end';

export type ScheduledRule = {
  id: string;
  title: string;
  jurisdictionCode: string;
  entityTypes: string[];
  sectors: string[];
  responsibleAuthority: string;
  topic: string;
  recurrence: Recurrence;
  anchor: DeadlineAnchor;
  offsetDays: number;
  month: number | null;
  day: number | null;
  requiredDocuments: string[];
};

export type EntityFacts = {
  companyId: string;
  organizationId: string;
  jurisdictionCode: string;
  /** companies.structure, e.g. 'private_limited'. */
  structure: string;
  /** Not modelled on companies yet; null = unknown. */
  sector: string | null;
  /** ISO date, or null when the entity is not yet incorporated. */
  incorporationDate: string | null;
};

export type JurisdictionCalendar = {
  code: string;
  /** 1-12 / 1-31: the last day of the fiscal year (BD: 30 June). */
  fiscalYearEndMonth: number;
  fiscalYearEndDay: number;
  /** UTC day numbers that are the weekend (BD: [5, 6] = Fri, Sat). */
  weekendDays: number[];
  /** yyyy-mm-dd strings of gazetted holidays. */
  holidays: Set<string>;
  /** Years the holiday set actually covers; others must fail loudly. */
  holidayYearsCovered: Set<number>;
};

/**
 * The one calendar the corpus currently covers. Fiscal year and weekend are
 * stated by CLAUDE.md §6; holidays are loaded from public_holidays and are
 * never hardcoded here.
 */
export function bangladeshCalendar(
  holidays: Iterable<{ date: string }>,
  yearsCovered: Iterable<number>,
): JurisdictionCalendar {
  return {
    code: 'BD',
    fiscalYearEndMonth: 6,
    fiscalYearEndDay: 30,
    weekendDays: [5, 6],
    holidays: new Set([...holidays].map((h) => h.date)),
    holidayYearsCovered: new Set(yearsCovered),
  };
}

export type MatchResult =
  | { outcome: 'matched' }
  | { outcome: 'not_applicable'; reason: string }
  | { outcome: 'ambiguous'; reason: string };

/**
 * Scope matching. A rule fires only when every scoping dimension it carries
 * is affirmatively satisfied; a dimension the rule leaves open where the
 * answer matters makes it ambiguous, not applicable.
 */
export function matchRule(rule: ScheduledRule, entity: EntityFacts): MatchResult {
  if (rule.jurisdictionCode !== entity.jurisdictionCode) {
    return { outcome: 'not_applicable', reason: 'jurisdiction' };
  }
  // An empty entity-type list means the analyst has not said who owes this.
  // Firing it at everyone is the over-firing failure; surface it instead.
  if (rule.entityTypes.length === 0) {
    return { outcome: 'ambiguous', reason: 'no_entity_types' };
  }
  if (!rule.entityTypes.includes(entity.structure)) {
    return { outcome: 'not_applicable', reason: 'entity_type' };
  }
  if (rule.sectors.length > 0) {
    if (!entity.sector) return { outcome: 'ambiguous', reason: 'sector_unknown' };
    if (!rule.sectors.includes(entity.sector)) {
      return { outcome: 'not_applicable', reason: 'sector' };
    }
  }
  return { outcome: 'matched' };
}

const MS_PER_DAY = 86_400_000;

function toUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** Last day of a month, so 31 January + one month clamps to 28/29 February. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * A calendar date from year/month/day with the month-end convention applied:
 * a day past the month's end CLAMPS to the last valid day (31 → 30 → 28/29),
 * never rolls into the next month. Documented here, applied everywhere.
 */
function clampedDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, Math.min(day, daysInMonth(year, month))));
}

export type DueDateResult =
  | { ok: true; dueOn: string; rolledFrom: string | null }
  | { ok: false; error: 'missing_holiday_data'; year: number };

/**
 * Rolls a computed date forward off weekends and holidays to the next
 * working day. Refuses to compute at all when the holiday set does not
 * cover a year it needs — a deadline computed against silently-missing
 * holidays looks exactly like a correct one, which is how customers miss
 * filings.
 */
export function rollToWorkingDay(raw: Date, calendar: JurisdictionCalendar): DueDateResult {
  let cursor = raw;
  let rolled = false;
  for (let i = 0; i < 60; i += 1) {
    const year = cursor.getUTCFullYear();
    if (!calendar.holidayYearsCovered.has(year)) {
      return { ok: false, error: 'missing_holiday_data', year };
    }
    const weekend = calendar.weekendDays.includes(cursor.getUTCDay());
    const holiday = calendar.holidays.has(isoDate(cursor));
    if (!weekend && !holiday) {
      return { ok: true, dueOn: isoDate(cursor), rolledFrom: rolled ? isoDate(raw) : null };
    }
    cursor = addDays(cursor, 1);
    rolled = true;
  }
  // Sixty consecutive non-working days is corrupt calendar data, not a real
  // jurisdiction; treat it as missing data rather than looping further.
  return { ok: false, error: 'missing_holiday_data', year: raw.getUTCFullYear() };
}

export type Occurrence =
  | { ok: true; dueOn: string; rolledFrom: string | null }
  | { ok: false; error: 'missing_holiday_data'; year: number }
  | { ok: false; error: 'missing_incorporation_date' }
  | { ok: false; error: 'unsupported_combination' };

/**
 * Every raw due date a rule produces inside [from, to], before rolling.
 * Pure date arithmetic; the roll happens per occurrence so one missing
 * holiday year fails only the occurrences that touch it.
 */
export function occurrencesInWindow(
  rule: ScheduledRule,
  entity: EntityFacts,
  calendar: JurisdictionCalendar,
  from: Date,
  to: Date,
): Occurrence[] {
  const raw: Date[] = [];

  const pushIfInWindow = (date: Date) => {
    if (date >= from && date <= to) raw.push(date);
  };

  switch (rule.anchor) {
    case 'incorporation': {
      if (!entity.incorporationDate) return [{ ok: false, error: 'missing_incorporation_date' }];
      const inc = toUtcDate(entity.incorporationDate);
      if (rule.recurrence === 'one_off') {
        pushIfInWindow(addDays(inc, rule.offsetDays));
      } else if (rule.recurrence === 'annual') {
        for (let year = from.getUTCFullYear() - 1; year <= to.getUTCFullYear() + 1; year += 1) {
          const anniversary = clampedDate(year, inc.getUTCMonth() + 1, inc.getUTCDate());
          pushIfInWindow(addDays(anniversary, rule.offsetDays));
        }
      } else {
        return [{ ok: false, error: 'unsupported_combination' }];
      }
      break;
    }
    case 'fiscal_year_end': {
      if (rule.recurrence !== 'annual' && rule.recurrence !== 'one_off') {
        return [{ ok: false, error: 'unsupported_combination' }];
      }
      for (let year = from.getUTCFullYear() - 1; year <= to.getUTCFullYear() + 1; year += 1) {
        const fyEnd = clampedDate(year, calendar.fiscalYearEndMonth, calendar.fiscalYearEndDay);
        pushIfInWindow(addDays(fyEnd, rule.offsetDays));
        if (rule.recurrence === 'one_off' && raw.length > 0) break;
      }
      break;
    }
    case 'fixed_date': {
      if (rule.recurrence !== 'annual' || rule.month === null || rule.day === null) {
        return [{ ok: false, error: 'unsupported_combination' }];
      }
      for (let year = from.getUTCFullYear() - 1; year <= to.getUTCFullYear() + 1; year += 1) {
        pushIfInWindow(addDays(clampedDate(year, rule.month, rule.day), rule.offsetDays));
      }
      break;
    }
    case 'period_end': {
      if (rule.recurrence !== 'monthly' && rule.recurrence !== 'quarterly') {
        return [{ ok: false, error: 'unsupported_combination' }];
      }
      const step = rule.recurrence === 'monthly' ? 1 : 3;
      const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - step, 1));
      while (cursor <= to) {
        const periodEnd = clampedDate(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 31);
        pushIfInWindow(addDays(periodEnd, rule.offsetDays));
        cursor.setUTCMonth(cursor.getUTCMonth() + step);
      }
      break;
    }
  }

  return raw
    .sort((a, b) => a.getTime() - b.getTime())
    .map((date) => rollToWorkingDay(date, calendar));
}

export type GenerationPlanItem = {
  ruleId: string;
  ruleTitle: string;
  dueOn: string;
  rolledFrom: string | null;
};

export type GenerationPlan = {
  obligations: GenerationPlanItem[];
  /** Rules a human must confirm before they ever fire ("may apply"). */
  ambiguous: Array<{ ruleId: string; ruleTitle: string; reason: string }>;
  /** Loud failures: nothing was created for these, and someone must look. */
  errors: Array<{ ruleId: string; ruleTitle: string; error: string; year?: number }>;
};

/**
 * The full plan for one entity: match every rule, compute every occurrence,
 * separate what fires from what a human must decide. Deterministic — the
 * caller supplies the window, so two runs over the same inputs produce the
 * same plan and the database's unique key makes re-inserting it a no-op.
 */
export function planObligations(
  rules: ScheduledRule[],
  entity: EntityFacts,
  calendar: JurisdictionCalendar,
  window: { from: Date; to: Date },
): GenerationPlan {
  const plan: GenerationPlan = { obligations: [], ambiguous: [], errors: [] };

  for (const rule of rules) {
    const match = matchRule(rule, entity);
    if (match.outcome === 'not_applicable') continue;
    if (match.outcome === 'ambiguous') {
      plan.ambiguous.push({ ruleId: rule.id, ruleTitle: rule.title, reason: match.reason });
      continue;
    }

    for (const occurrence of occurrencesInWindow(rule, entity, calendar, window.from, window.to)) {
      if (occurrence.ok) {
        plan.obligations.push({
          ruleId: rule.id,
          ruleTitle: rule.title,
          dueOn: occurrence.dueOn,
          rolledFrom: occurrence.rolledFrom,
        });
      } else {
        plan.errors.push({
          ruleId: rule.id,
          ruleTitle: rule.title,
          error: occurrence.error,
          year: 'year' in occurrence ? occurrence.year : undefined,
        });
      }
    }
  }

  return plan;
}
