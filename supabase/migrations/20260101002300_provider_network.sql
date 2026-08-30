-- Provider network (Admin & Professional Partner Portals spec, 30 Aug 2026).
--
-- Three additive changes:
--   1. provider_applications — the real provider application-and-verification
--      journey behind /partners/apply, replacing the "Register interest"
--      contact-form detour. Service-role writes only (same trust model as
--      public.applications); platform staff read the queue via RLS.
--   2. Firm categories and jurisdictions — partners.practice_type widened to
--      the specification's category list, and partner_capabilities gains a
--      country_code so approval is recorded per jurisdiction+service and one
--      country's approval never implies another's.
--   3. Structured conflict check and disclosure on assignments — the old
--      conflict_check_confirmed boolean becomes a recorded outcome, and
--      customer disclosure gets its own timestamp so the order
--      (conflict check → disclosure → customer consent → sharing) is
--      enforceable. Partner document access now also requires a clean
--      recorded conflict result.
--
-- Rollback notes: every change is additive except the practice_type check
-- (widened — old values remain valid) and the partner_may_see_case_documents
-- redefinition (reverting means restoring the previous function body from
-- 20260101000500). Dropping the new table/columns loses only data created by
-- the new flows.

-- ---------------------------------------------------------------------------
-- 1. Provider applications
-- ---------------------------------------------------------------------------

create table public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'draft' check (
    status in (
      'draft', 'submitted', 'under_review', 'needs_information',
      'verification_in_progress', 'approved', 'rejected', 'withdrawn',
      'suspended', 'offboarded'
    )
  ),
  locale public.locale_code not null default 'en',

  -- Step 1 · Firm identity
  legal_name text not null default '',
  trading_name text,
  registration_no text,
  established_on date,
  firm_category text not null default 'other' check (
    firm_category in (
      'law_firm', 'advocate', 'chartered_accountant', 'tax_vat_practice',
      'company_secretarial', 'trade_licence_specialist', 'accounting_payroll',
      'immigration_specialist', 'overseas_formation_provider',
      'registered_agent', 'foreign_tax_agent', 'bank_support_provider',
      'notary_legalisation', 'translation_provider', 'consultancy', 'other'
    )
  ),
  registered_address text,
  operating_address text,
  website text,
  official_email_domain text,
  contact_name text not null default '',
  contact_email text not null default '' check (contact_email = lower(contact_email)),
  contact_phone text,
  signatory_name text,

  -- Step 2 · Ownership and control (structured but flexible; no identity
  -- documents are collected here — evidence follows the document-request
  -- workflow after approval, behind its own gate)
  owners jsonb not null default '[]'::jsonb,
  related_entities_note text,
  sanctions_declaration boolean not null default false,
  integrity_declaration boolean not null default false,

  -- Step 3 · Professional standing
  regulator_name text,
  licence_no text,
  licence_expires_on date,
  disciplinary_declaration boolean not null default false,
  indemnity_insurer text,
  indemnity_expires_on date,
  responsible_professionals jsonb not null default '[]'::jsonb,

  -- Step 4 · Services and jurisdictions
  requested_categories text[] not null default '{}',
  jurisdictions text[] not null default '{}',
  services_note text,
  languages text[] not null default '{}',
  turnaround_note text,
  capacity_note text,
  fee_note text,

  -- Step 5 · Operational controls
  conflict_process_note text,
  complaint_process_note text,
  security_note text,
  retention_note text,
  subcontractors_note text,
  continuity_note text,

  -- Step 7 · Declarations (versions recorded so we know which text was seen)
  declarations_accepted_at timestamptz,
  terms_version text,

  -- Save-and-resume: only the SHA-256 of the resume key is stored, exactly
  -- like the questionnaire draft session. No account is required to apply.
  resume_key_hash text unique,

  submitted_at timestamptz,
  -- Review trail. decision_reason is applicant-visible ("needs information"
  -- requests and rejection summaries); internal analysis stays in the
  -- restricted compliance/notes systems, never here.
  reviewer_id uuid references auth.users (id) on delete set null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  decision_reason text,
  information_request text,
  -- Set on approval, linking the application to the organisation it created.
  organization_id uuid references public.organizations (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index provider_applications_status_idx
  on public.provider_applications (status, created_at desc);
create index provider_applications_org_idx
  on public.provider_applications (organization_id)
  where organization_id is not null;

alter table public.provider_applications enable row level security;

-- Service-role writes only; staff read the queue. The applicant reads and
-- edits their draft exclusively through server actions holding the resume
-- key, so no anon/authenticated write surface exists at all.
create policy provider_applications_staff_read on public.provider_applications
  for select to authenticated using (app.is_platform_staff());

create trigger provider_applications_touch before update on public.provider_applications
  for each row execute function app.touch_updated_at();

-- Validated status machine: free-text jumps are rejected in the database, so
-- a bug in an action cannot invent a transition the spec does not define.
create or replace function app.enforce_provider_application_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = new.status then
    return new;
  end if;
  if not (
    (old.status = 'draft' and new.status in ('submitted', 'withdrawn')) or
    (old.status = 'submitted' and new.status in ('under_review', 'withdrawn')) or
    (old.status = 'under_review'
      and new.status in ('needs_information', 'verification_in_progress', 'rejected', 'withdrawn')) or
    (old.status = 'needs_information'
      and new.status in ('under_review', 'submitted', 'withdrawn')) or
    (old.status = 'verification_in_progress'
      and new.status in ('approved', 'needs_information', 'rejected', 'withdrawn')) or
    (old.status = 'approved' and new.status in ('suspended', 'offboarded')) or
    (old.status = 'suspended' and new.status in ('approved', 'offboarded'))
  ) then
    raise exception 'invalid provider application transition % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger provider_applications_transition
  before update of status on public.provider_applications
  for each row execute function app.enforce_provider_application_transition();

comment on table public.provider_applications is
  'Provider firm applications from /partners/apply. Service-role writes only; '
  'the applicant holds a hashed resume key, staff review via RLS. No identity '
  'documents are collected at application time.';

-- ---------------------------------------------------------------------------
-- 2. Firm categories and jurisdiction-scoped approvals
-- ---------------------------------------------------------------------------

alter table public.partners
  drop constraint partners_practice_type_values;
alter table public.partners
  add constraint partners_practice_type_values check (
    practice_type in (
      'law_firm', 'advocate', 'chartered_accountant', 'tax_vat_practice',
      'company_secretarial', 'trade_licence_specialist', 'accounting_payroll',
      'immigration_specialist', 'overseas_formation_provider',
      'registered_agent', 'foreign_tax_agent', 'bank_support_provider',
      'notary_legalisation', 'translation_provider', 'consultancy', 'other'
    )
  );

-- Which country an approval covers. Null means the row predates jurisdiction
-- scoping and is treated as Bangladesh-only by the eligibility check in
-- application code — approval for one country must never imply another.
alter table public.partner_capabilities
  add column country_code text references public.countries (code) on delete restrict;

create index partner_capabilities_country_idx
  on public.partner_capabilities (country_code)
  where is_active;

-- ---------------------------------------------------------------------------
-- 3. Structured conflict check and customer disclosure on assignments
-- ---------------------------------------------------------------------------

alter table public.case_partner_assignments
  add column conflict_check_result text check (
    conflict_check_result in (
      'none_identified', 'potential_conflict', 'conflict_declined',
      'insufficient_information'
    )
  ),
  add column conflict_check_recorded_by uuid references auth.users (id) on delete set null,
  add column conflict_check_recorded_at timestamptz,
  add column disclosed_at timestamptz,
  add column disclosed_by uuid references auth.users (id) on delete set null;

-- Data migration: assignments that already passed the old boolean conflict
-- confirmation keep working — the boolean maps onto the structured value.
update public.case_partner_assignments
  set conflict_check_result = 'none_identified',
      conflict_check_recorded_at = coalesce(responded_at, updated_at)
  where conflict_check_confirmed
    and conflict_check_result is null;

-- Sharing order (spec §10): the partner sees customer documents only when the
-- assignment is accepted, the recorded conflict result is clean AND the
-- customer has authorised sharing. This tightens the previous rule (which
-- checked only acceptance + authorisation).
create or replace function app.partner_may_see_case_documents(v_case uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.case_partner_assignments a
    join public.organization_memberships m on m.organization_id = a.partner_org_id
    where a.case_id = v_case
      and m.user_id = auth.uid()
      and a.status = 'accepted'
      and a.conflict_check_result = 'none_identified'
      and a.customer_authorized_at is not null
  );
$$;

revoke all on function app.enforce_provider_application_transition() from public, anon;
