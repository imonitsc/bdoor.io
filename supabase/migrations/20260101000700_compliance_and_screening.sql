-- =============================================================================
-- KYC, beneficial ownership review, screening and risk.
--
-- Split deliberately in two:
--
--   public.kyc_cases / public.kyc_checks
--       The *status* of each check. A customer is entitled to know that their
--       identity verification is pending; that is all this half exposes.
--
--   compliance.*
--       Screening hits, risk analysis, decisions and internal notes. This
--       schema is NOT in the PostgREST exposed-schema list, so no Data API
--       call can reach it regardless of what the UI does. Server code reaches
--       it with the service role after an explicit role check, and the
--       `tipping_off_sensitive` flag marks rows that must never be disclosed
--       to the customer or to partner staff.
-- =============================================================================

create table public.kyc_cases (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references public.cases (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  subject_type    public.kyc_subject_type not null default 'individual',
  subject_person_id uuid references public.company_people (id) on delete set null,
  subject_company_id uuid references public.companies (id) on delete set null,
  subject_label   text not null,
  overall_status  public.kyc_check_status not null default 'not_started',
  -- Duplicated from compliance.risk_assessments so the case list can be sorted
  -- without granting risk-schema access. Only ever written by compliance code.
  risk_rating     public.risk_rating,
  opened_at       timestamptz not null default now(),
  decided_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint kyc_cases_subject check (num_nonnulls(subject_person_id, subject_company_id) <= 1)
);

create index kyc_cases_case_idx on public.kyc_cases (case_id);
create index kyc_cases_status_idx on public.kyc_cases (overall_status)
  where overall_status in ('pending', 'manual_review');

create trigger kyc_cases_touch before update on public.kyc_cases
  for each row execute function app.touch_updated_at();

create table public.kyc_checks (
  id            uuid primary key default gen_random_uuid(),
  kyc_case_id   uuid not null references public.kyc_cases (id) on delete cascade,
  check_type    public.kyc_check_type not null,
  status        public.kyc_check_status not null default 'not_started',
  -- Customer-safe summary only. Nothing here may reveal a screening hit.
  customer_note text,
  performed_by  uuid references auth.users (id) on delete set null,
  performed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (kyc_case_id, check_type)
);

create index kyc_checks_case_idx on public.kyc_checks (kyc_case_id);

create trigger kyc_checks_touch before update on public.kyc_checks
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Restricted schema
-- ---------------------------------------------------------------------------

create table compliance.screening_results (
  id            uuid primary key default gen_random_uuid(),
  kyc_case_id   uuid not null references public.kyc_cases (id) on delete cascade,
  check_type    public.kyc_check_type not null,
  provider      text not null,
  -- True whenever the provider was the development mock. Every surface that
  -- renders these rows must say so; a mock result is not a screening.
  is_mock       boolean not null default true,
  matched       boolean not null default false,
  match_count   integer not null default 0,
  payload       jsonb not null default '{}'::jsonb,
  reviewed_by   uuid references auth.users (id) on delete set null,
  reviewed_at   timestamptz,
  review_outcome text,
  created_at    timestamptz not null default now(),
  constraint screening_results_review_outcome_values
    check (review_outcome is null or review_outcome in ('false_positive', 'true_match', 'inconclusive'))
);

create index screening_results_kyc_idx on compliance.screening_results (kyc_case_id, created_at desc);

create table compliance.risk_flags (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases (id) on delete cascade,
  kyc_case_id   uuid references public.kyc_cases (id) on delete cascade,
  code          text not null,
  severity      text not null default 'medium',
  detail        text not null,
  tipping_off_sensitive boolean not null default true,
  raised_by     uuid references auth.users (id) on delete set null,
  raised_at     timestamptz not null default now(),
  cleared_by    uuid references auth.users (id) on delete set null,
  cleared_at    timestamptz,
  clear_reason  text,
  constraint risk_flags_severity_values check (severity in ('low', 'medium', 'high', 'critical'))
);

create index risk_flags_case_idx on compliance.risk_flags (case_id) where cleared_at is null;

create table compliance.risk_assessments (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases (id) on delete cascade,
  kyc_case_id   uuid references public.kyc_cases (id) on delete set null,
  rating        public.risk_rating not null,
  rationale     text not null,
  factors       jsonb not null default '{}'::jsonb,
  assessed_by   uuid references auth.users (id) on delete set null,
  assessed_at   timestamptz not null default now(),
  supersedes_id uuid references compliance.risk_assessments (id) on delete set null
);

create index risk_assessments_case_idx on compliance.risk_assessments (case_id, assessed_at desc);

create table compliance.compliance_decisions (
  id            uuid primary key default gen_random_uuid(),
  kyc_case_id   uuid not null references public.kyc_cases (id) on delete cascade,
  case_id       uuid not null references public.cases (id) on delete cascade,
  decision      public.compliance_decision_type not null,
  reason        text not null,
  -- What the customer is allowed to be told, if anything.
  customer_facing_note text,
  decided_by    uuid not null references auth.users (id) on delete restrict,
  decided_at    timestamptz not null default now(),
  policy_version text not null default 'draft-1'
);

create index compliance_decisions_kyc_idx on compliance.compliance_decisions (kyc_case_id, decided_at desc);

create trigger compliance_decisions_append_only
  before update or delete on compliance.compliance_decisions
  for each row execute function app.reject_mutation();

create table compliance.restricted_case_notes (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases (id) on delete cascade,
  author_id     uuid references auth.users (id) on delete set null,
  body          text not null,
  classification text not null default 'restricted',
  tipping_off_sensitive boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint restricted_case_notes_classification_values
    check (classification in ('restricted', 'suspicious_activity', 'reporting_decision', 'legal_privileged'))
);

create index restricted_case_notes_case_idx on compliance.restricted_case_notes (case_id, created_at desc);

create trigger restricted_case_notes_append_only
  before update or delete on compliance.restricted_case_notes
  for each row execute function app.reject_mutation();

-- Belt and braces: RLS on the restricted schema too, so even if the schema were
-- ever exposed by mistake, only compliance staff could read it.
alter table compliance.screening_results enable row level security;
alter table compliance.risk_flags enable row level security;
alter table compliance.risk_assessments enable row level security;
alter table compliance.compliance_decisions enable row level security;
alter table compliance.restricted_case_notes enable row level security;

create policy screening_results_compliance on compliance.screening_results
  for all to authenticated using (app.is_compliance()) with check (app.is_compliance());
create policy risk_flags_compliance on compliance.risk_flags
  for all to authenticated using (app.is_compliance()) with check (app.is_compliance());
create policy risk_assessments_compliance on compliance.risk_assessments
  for all to authenticated using (app.is_compliance()) with check (app.is_compliance());
create policy compliance_decisions_compliance on compliance.compliance_decisions
  for all to authenticated using (app.is_compliance()) with check (app.is_compliance());
create policy restricted_case_notes_compliance on compliance.restricted_case_notes
  for all to authenticated using (app.is_compliance()) with check (app.is_compliance());

revoke all on all tables in schema compliance from anon, authenticated;
grant all on all tables in schema compliance to service_role;

-- =============================================================================
-- RLS on the customer-visible half
-- =============================================================================

alter table public.kyc_cases enable row level security;
alter table public.kyc_checks enable row level security;

create policy kyc_cases_customer_read on public.kyc_cases
  for select to authenticated
  using (organization_id in (select app.my_organization_ids()));

create policy kyc_cases_staff_read on public.kyc_cases
  for select to authenticated using (app.is_platform_staff());

-- Only compliance writes KYC state. Finance explicitly cannot.
create policy kyc_cases_compliance_write on public.kyc_cases
  for all to authenticated using (app.is_compliance()) with check (app.is_compliance());

create policy kyc_checks_customer_read on public.kyc_checks
  for select to authenticated
  using (
    exists (
      select 1 from public.kyc_cases k
      where k.id = kyc_checks.kyc_case_id
        and k.organization_id in (select app.my_organization_ids())
    )
  );

create policy kyc_checks_staff_read on public.kyc_checks
  for select to authenticated using (app.is_platform_staff());

create policy kyc_checks_compliance_write on public.kyc_checks
  for all to authenticated using (app.is_compliance()) with check (app.is_compliance());
