-- =============================================================================
-- Companies, the people attached to them, and beneficial ownership.
--
-- Identity documents and identifiers are deliberately NOT stored here in the
-- clear. `identity_records` keeps only a last-four fragment plus a SHA-256
-- token of the full number, so duplicate detection still works while the schema
-- itself never becomes a store of readable passport/NID numbers.
-- =============================================================================

create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  legal_name       text not null,
  trading_name     text,
  structure        text not null,
  registration_no  text,
  incorporation_date date,
  etin             text,
  bin              text,
  status           text not null default 'proposed',
  authorized_capital numeric(18, 2),
  paid_up_capital  numeric(18, 2),
  currency         public.currency_code not null default 'BDT',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint companies_status_values
    check (status in ('proposed', 'name_reserved', 'incorporated', 'dissolved', 'dormant')),
  constraint companies_structure_values
    check (structure in ('private_limited', 'one_person', 'partnership', 'sole_proprietorship',
                         'branch_office', 'liaison_office'))
);

create index companies_org_idx on public.companies (organization_id);
create unique index companies_registration_no_idx on public.companies (registration_no)
  where registration_no is not null;

create trigger companies_touch before update on public.companies
  for each row execute function app.touch_updated_at();

create table public.company_addresses (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  kind        text not null default 'registered',
  line1       text not null,
  line2       text,
  city        text not null,
  district    text,
  postcode    text,
  country     char(2) not null default 'BD',
  is_current  boolean not null default true,
  valid_from  date,
  valid_to    date,
  created_at  timestamptz not null default now(),
  constraint company_addresses_kind_values
    check (kind in ('registered', 'operating', 'factory', 'branch', 'correspondence'))
);

create index company_addresses_company_idx on public.company_addresses (company_id) where is_current;

create table public.company_people (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies (id) on delete cascade,
  user_id        uuid references auth.users (id) on delete set null,
  full_name      text not null,
  role           text not null,
  email          text,
  phone          text,
  nationality    char(2),
  country_of_residence char(2),
  date_of_birth  date,
  occupation     text,
  is_signatory   boolean not null default false,
  appointed_on   date,
  resigned_on    date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint company_people_role_values
    check (role in ('director', 'shareholder', 'partner', 'proprietor', 'authorized_signatory',
                    'company_secretary', 'nominee', 'contact'))
);

create index company_people_company_idx on public.company_people (company_id);
create index company_people_user_idx on public.company_people (user_id) where user_id is not null;

create trigger company_people_touch before update on public.company_people
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- ownership_links — supports both natural-person and entity shareholders, so a
-- corporate owner can be traced through to the people behind it.
-- ---------------------------------------------------------------------------
create table public.ownership_links (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies (id) on delete cascade,
  owner_person_id    uuid references public.company_people (id) on delete cascade,
  owner_company_id   uuid references public.companies (id) on delete cascade,
  owner_entity_name  text,
  owner_entity_country char(2),
  ownership_percent  numeric(6, 3) not null,
  control_method     text not null default 'shareholding',
  is_direct          boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint ownership_links_percent_range check (ownership_percent >= 0 and ownership_percent <= 100),
  constraint ownership_links_owner_present check (
    num_nonnulls(owner_person_id, owner_company_id, owner_entity_name) = 1
  ),
  constraint ownership_links_control_values
    check (control_method in ('shareholding', 'voting_rights', 'board_control', 'contractual', 'other'))
);

create index ownership_links_company_idx on public.ownership_links (company_id);

create table public.beneficial_owners (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies (id) on delete cascade,
  person_id          uuid references public.company_people (id) on delete set null,
  full_name          text not null,
  nationality        char(2),
  country_of_residence char(2),
  date_of_birth      date,
  effective_ownership_percent numeric(6, 3),
  control_description text,
  is_pep             boolean not null default false,
  pep_details        text,
  declared_by        uuid references auth.users (id) on delete set null,
  declared_at        timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint beneficial_owners_percent_range
    check (effective_ownership_percent is null
           or (effective_ownership_percent >= 0 and effective_ownership_percent <= 100))
);

create index beneficial_owners_company_idx on public.beneficial_owners (company_id);

create trigger beneficial_owners_touch before update on public.beneficial_owners
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- identity_records — minimised on purpose.
-- ---------------------------------------------------------------------------
create table public.identity_records (
  id              uuid primary key default gen_random_uuid(),
  subject_person_id uuid references public.company_people (id) on delete cascade,
  subject_user_id uuid references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_type   text not null,
  issuing_country char(2),
  -- Only the last four characters are stored readable. The full value is kept
  -- as a salted hash purely so we can spot the same document twice.
  identifier_last4 text,
  identifier_token text,
  issued_on       date,
  expires_on      date,
  verified_at     timestamptz,
  verified_by     uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint identity_records_subject check (num_nonnulls(subject_person_id, subject_user_id) >= 1),
  constraint identity_records_type_values
    check (document_type in ('nid', 'passport', 'birth_certificate', 'driving_licence',
                             'trade_licence', 'incorporation_certificate', 'other')),
  constraint identity_records_last4_len check (identifier_last4 is null or char_length(identifier_last4) <= 4)
);

create index identity_records_org_idx on public.identity_records (organization_id);
create index identity_records_token_idx on public.identity_records (identifier_token)
  where identifier_token is not null;

create trigger identity_records_touch before update on public.identity_records
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- consent_records — append-only. One row per acceptance, with the policy
-- version that was actually shown.
-- ---------------------------------------------------------------------------
create table public.consent_records (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  case_id         uuid,
  consent_type    public.consent_type not null,
  policy_version  text not null,
  locale          public.locale_code not null default 'en',
  granted         boolean not null default true,
  ip_hash         text,
  user_agent_hash text,
  created_at      timestamptz not null default now()
);

create index consent_records_user_idx on public.consent_records (user_id, consent_type, created_at desc);
create index consent_records_org_idx on public.consent_records (organization_id, created_at desc);

create trigger consent_records_append_only
  before update or delete on public.consent_records
  for each row execute function app.reject_mutation();

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.companies enable row level security;
alter table public.company_addresses enable row level security;
alter table public.company_people enable row level security;
alter table public.ownership_links enable row level security;
alter table public.beneficial_owners enable row level security;
alter table public.identity_records enable row level security;
alter table public.consent_records enable row level security;

create policy companies_org_member on public.companies
  for all to authenticated
  using (organization_id in (select app.my_organization_ids()))
  with check (organization_id in (select app.my_organization_ids()));

create policy companies_staff on public.companies
  for select to authenticated
  using (app.is_platform_staff());

create policy companies_staff_write on public.companies
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy company_addresses_scope on public.company_addresses
  for all to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_addresses.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = company_addresses.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  );

create policy company_addresses_staff on public.company_addresses
  for all to authenticated
  using (app.is_platform_staff())
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy company_people_scope on public.company_people
  for all to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = company_people.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = company_people.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  );

create policy company_people_staff on public.company_people
  for all to authenticated
  using (app.is_platform_staff())
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy ownership_links_scope on public.ownership_links
  for all to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = ownership_links.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = ownership_links.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  );

create policy ownership_links_staff on public.ownership_links
  for all to authenticated
  using (app.is_platform_staff())
  with check (app.is_compliance() or app.has_platform_role(array['case_manager']::public.platform_role[]));

-- Beneficial ownership is customer-declared but compliance-reviewed. Customers
-- may declare and read their own; only compliance may amend after the fact.
create policy beneficial_owners_customer_read on public.beneficial_owners
  for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = beneficial_owners.company_id
        and c.organization_id in (select app.my_organization_ids())
    )
  );

create policy beneficial_owners_customer_declare on public.beneficial_owners
  for insert to authenticated
  with check (
    declared_by = auth.uid()
    and exists (
      select 1 from public.companies c
      where c.id = beneficial_owners.company_id
        and app.is_org_member(c.organization_id, array['customer_owner']::public.organization_role[])
    )
  );

create policy beneficial_owners_compliance on public.beneficial_owners
  for all to authenticated
  using (app.is_platform_staff())
  with check (app.is_compliance());

-- Identity records are readable by the subject's own organization owners and by
-- compliance. Ordinary customer members do not get them.
create policy identity_records_org_owner on public.identity_records
  for all to authenticated
  using (
    subject_user_id = auth.uid()
    or app.is_org_member(organization_id, array['customer_owner']::public.organization_role[])
  )
  with check (
    subject_user_id = auth.uid()
    or app.is_org_member(organization_id, array['customer_owner']::public.organization_role[])
  );

create policy identity_records_compliance on public.identity_records
  for all to authenticated
  using (app.is_compliance())
  with check (app.is_compliance());

create policy consent_records_self on public.consent_records
  for select to authenticated
  using (user_id = auth.uid() or organization_id in (select app.my_organization_ids()));

create policy consent_records_insert_self on public.consent_records
  for insert to authenticated
  with check (user_id = auth.uid());

create policy consent_records_staff on public.consent_records
  for select to authenticated
  using (app.is_platform_staff());
