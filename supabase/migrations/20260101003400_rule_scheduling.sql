-- ---------------------------------------------------------------------------
-- Rules learn to schedule (ROADMAP P1).
--
-- The corpus already carries provenance, effective dating and review-gated
-- publication; what it cannot yet say is WHEN an obligation falls due, other
-- than as prose in deadline_text. These columns make the deadline machine-
-- readable — expressed as a recurrence plus an offset from an anchor, never a
-- hardcoded calendar date — so the obligation engine can instantiate a
-- calendar from published rules with zero manual entry.
--
-- No scheduling data is populated here. A deadline is a regulatory fact:
-- the analyst who verifies the rule sets these fields, exactly as they set
-- the fee. Until they do, the rule stays prose-only and the engine skips it.
--
-- Anchors:
--   incorporation    — offset from the entity's incorporation date
--                      (one_off), or its anniversary (annual)
--   fiscal_year_end  — offset from the jurisdiction's fiscal year end
--   fixed_date       — the same month/day each period (deadline_month/day)
--   period_end       — offset from the end of the monthly/quarterly period
--
-- Reversal: drop the six columns, the check constraints, the
-- public_holidays table and the obligations unique index.
-- ---------------------------------------------------------------------------

alter table public.ai_structured_rules
  -- §6: every rule is jurisdiction-scoped. The corpus to date is Bangladesh
  -- by construction, so the backfill default states the fact; new rules for
  -- other jurisdictions set their own code.
  add column jurisdiction_code char(2) not null default 'BD',
  add column recurrence text,
  add column deadline_anchor text,
  add column deadline_offset_days integer not null default 0,
  add column deadline_month smallint,
  add column deadline_day smallint;

alter table public.ai_structured_rules
  add constraint ai_structured_rules_recurrence_values
    check (recurrence is null or recurrence in ('one_off', 'monthly', 'quarterly', 'annual')),
  add constraint ai_structured_rules_anchor_values
    check (deadline_anchor is null
           or deadline_anchor in ('incorporation', 'fiscal_year_end', 'fixed_date', 'period_end')),
  add constraint ai_structured_rules_offset_range
    check (deadline_offset_days >= 0 and deadline_offset_days <= 730),
  -- fixed_date needs its month and day; every other anchor must not carry
  -- them, so a half-edited row cannot be half-interpreted. The explicit
  -- IS NOT NULL conjuncts matter: `null between 1 and 12` is NULL, and a
  -- NULL check result is treated as satisfied.
  add constraint ai_structured_rules_fixed_date_shape
    check (
      (deadline_anchor = 'fixed_date'
        and deadline_month is not null and deadline_month between 1 and 12
        and deadline_day is not null and deadline_day between 1 and 31)
      or (deadline_anchor is distinct from 'fixed_date'
        and deadline_month is null
        and deadline_day is null)
    );

comment on column public.ai_structured_rules.recurrence is
  'How often the obligation recurs. NULL = not yet structured by an analyst; the engine only instantiates rules where recurrence and deadline_anchor are set.';

-- ---------------------------------------------------------------------------
-- Public holidays, per jurisdiction. Deadline arithmetic must roll a due
-- date off a holiday using real gazetted dates — never invented ones — so
-- the table ships EMPTY and rows are entered by compliance staff with the
-- same provenance discipline as a rule. The engine fails loudly when it
-- needs holiday data for a year that has none, rather than silently
-- computing against an empty set.
-- ---------------------------------------------------------------------------
create table public.public_holidays (
  id                uuid primary key default gen_random_uuid(),
  jurisdiction_code char(2) not null,
  holiday_date      date not null,
  label             text not null,
  source_authority  text,
  source_url        text,
  verified_by       uuid references auth.users (id) on delete set null,
  verified_at       timestamptz,
  created_at        timestamptz not null default now(),
  unique (jurisdiction_code, holiday_date)
);

create index public_holidays_lookup_idx
  on public.public_holidays (jurisdiction_code, holiday_date);

alter table public.public_holidays enable row level security;

-- Holiday dates are public facts: anyone may read; only compliance staff
-- may write, because a wrong holiday moves real filing deadlines.
create policy public_holidays_read on public.public_holidays
  for select to anon, authenticated using (true);

create policy public_holidays_compliance_write on public.public_holidays
  for all to authenticated
  using (app.is_compliance())
  with check (app.is_compliance());

-- ---------------------------------------------------------------------------
-- Idempotency at the database: one obligation per (company, rule version,
-- due date). The engine keys on this — running generation twice must be a
-- no-op, and source_rule_ref holds the exact ai_structured_rules row id so
-- "why does the product say this is due on the 30th?" always has an answer.
-- ---------------------------------------------------------------------------
create unique index compliance_obligations_rule_period_idx
  on public.compliance_obligations (company_id, source_rule_ref, due_on)
  where source = 'verified_rule' and source_rule_ref is not null and company_id is not null;
