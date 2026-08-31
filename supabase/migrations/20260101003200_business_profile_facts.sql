-- One-time data capture (replacement BI-OS instruction §4.0.1): every fact on
-- a business profile records who supplied it, when, on what evidence, and its
-- verification status — so a workflow can reuse a verified value instead of
-- asking again, and can show the customer what it is about to reuse rather
-- than silently trusting a stale answer.
--
-- Facts are superseded, never edited in place: a new value closes the old row
-- (`superseded_at`) and inserts a fresh one, so the provenance trail survives
-- every correction. The partial unique index keeps exactly one current row
-- per field. Additive and reversible; nothing reads it yet — the module in
-- src/features/companies/facts.ts is the only write path.

create table public.business_profile_facts (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete cascade,
  field_key           text not null,
  value               text not null,
  supplied_by         uuid references auth.users (id) on delete set null,
  supplied_at         timestamptz not null default now(),
  source_document_id  uuid references public.documents (id) on delete set null,
  verification_status text not null default 'unverified',
  verified_by         uuid references auth.users (id) on delete set null,
  verified_at         timestamptz,
  superseded_at       timestamptz,
  created_at          timestamptz not null default now(),
  constraint business_profile_facts_key_shape
    check (field_key ~ '^[a-z][a-z0-9_.]{0,99}$'),
  constraint business_profile_facts_value_len
    check (char_length(value) between 1 and 2000),
  constraint business_profile_facts_verification_values
    check (verification_status in
      ('unverified', 'customer_confirmed', 'document_verified', 'authority_verified')),
  -- A verified fact names its verifier and moment; an unverified one has
  -- neither. The check keeps the columns honest in both directions.
  constraint business_profile_facts_verifier_consistency
    check (
      (verification_status = 'unverified' and verified_by is null and verified_at is null)
      or (verification_status <> 'unverified' and verified_at is not null)
    )
);

create unique index business_profile_facts_current_idx
  on public.business_profile_facts (company_id, field_key)
  where superseded_at is null;
create index business_profile_facts_company_idx
  on public.business_profile_facts (company_id);

alter table public.business_profile_facts enable row level security;

-- Same tenancy as the companies row the fact describes.
create policy business_profile_facts_org_member on public.business_profile_facts
  for all to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = business_profile_facts.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = business_profile_facts.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  );

create policy business_profile_facts_staff on public.business_profile_facts
  for select to authenticated
  using (app.is_platform_staff());

create policy business_profile_facts_staff_write on public.business_profile_facts
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));
