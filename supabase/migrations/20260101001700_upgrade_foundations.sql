-- =============================================================================
-- Production upgrade foundations: evidence claims, countries, industries,
-- authorities, social profiles, and service delivery classification.
-- Additive only. Does not modify or delete existing production rows.
-- =============================================================================

create type public.evidence_claim_status as enum (
  'draft',
  'verified',
  'expired',
  'withdrawn'
);

create type public.delivery_mode as enum ('online', 'hybrid', 'in_person');

create type public.country_availability as enum (
  'active',
  'pilot',
  'coming_soon',
  'inactive'
);

create type public.social_profile_status as enum (
  'reserved',
  'verified',
  'active',
  'inactive'
);

-- ---------------------------------------------------------------------------
-- evidence_claims — public claim gate
-- ---------------------------------------------------------------------------
create table public.evidence_claims (
  id                   uuid primary key default gen_random_uuid(),
  claim_code           text not null unique,
  claim_text_en        text not null,
  claim_text_bn        text not null,
  source_type          text not null,
  official_source_url  text,
  source_published_at  date,
  last_verified_at     date,
  reviewer             text,
  status               public.evidence_claim_status not null default 'draft',
  countries            text[] not null default '{}',
  service_slugs        text[] not null default '{}',
  may_render_publicly  boolean not null default false,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint evidence_claims_verified_needs_date
    check (status <> 'verified' or last_verified_at is not null),
  constraint evidence_claims_public_needs_verified
    check (not may_render_publicly or status = 'verified')
);

create index evidence_claims_status_idx on public.evidence_claims (status)
  where may_render_publicly and status = 'verified';

create trigger evidence_claims_touch before update on public.evidence_claims
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- countries
-- ---------------------------------------------------------------------------
create table public.countries (
  code                 text primary key,
  slug                 text not null unique,
  name_en              text not null,
  name_bn              text not null,
  summary_en           text not null,
  summary_bn           text not null,
  status               public.country_availability not null default 'inactive',
  is_flagship          boolean not null default false,
  currency_code        text not null default 'BDT',
  entities             text[] not null default '{}',
  sources_reviewed_at  date,
  sort_order           integer not null default 100,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger countries_touch before update on public.countries
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- industries
-- ---------------------------------------------------------------------------
create table public.industries (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_en      text not null,
  name_bn      text not null,
  summary_en   text not null,
  summary_bn   text not null,
  status       public.publication_status not null default 'draft',
  sort_order   integer not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger industries_touch before update on public.industries
  for each row execute function app.touch_updated_at();

create table public.industry_service_categories (
  industry_id  uuid not null references public.industries (id) on delete cascade,
  category_id  uuid not null references public.service_categories (id) on delete cascade,
  primary key (industry_id, category_id)
);

-- ---------------------------------------------------------------------------
-- authorities (informational; independent-platform disclaimer required in UI)
-- ---------------------------------------------------------------------------
create table public.authorities (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name_en              text not null,
  name_bn              text not null,
  role_en              text not null,
  role_bn              text not null,
  official_website     text,
  status               public.publication_status not null default 'draft',
  last_verified_at     date,
  sort_order           integer not null default 100,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint authorities_published_needs_review
    check (status <> 'published' or last_verified_at is not null)
);

create trigger authorities_touch before update on public.authorities
  for each row execute function app.touch_updated_at();

create table public.authority_service_categories (
  authority_id uuid not null references public.authorities (id) on delete cascade,
  category_id  uuid not null references public.service_categories (id) on delete cascade,
  primary key (authority_id, category_id)
);

-- ---------------------------------------------------------------------------
-- social_profiles
-- ---------------------------------------------------------------------------
create table public.social_profiles (
  id                  uuid primary key default gen_random_uuid(),
  network             text not null,
  handle              text not null,
  public_url          text,
  status              public.social_profile_status not null default 'reserved',
  locale              text not null default 'all',
  last_verified_at    date,
  display_permission  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (network, handle),
  constraint social_profiles_active_needs_url
    check (
      status <> 'active'
      or (public_url is not null and last_verified_at is not null and display_permission)
    )
);

create trigger social_profiles_touch before update on public.social_profiles
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- services: delivery classification (nullable until reviewed per service)
-- ---------------------------------------------------------------------------
alter table public.services
  add column if not exists delivery_mode public.delivery_mode,
  add column if not exists country_code text references public.countries (code) on delete set null;

create index if not exists services_country_idx on public.services (country_code)
  where country_code is not null;

-- ---------------------------------------------------------------------------
-- Seed framework rows (inactive / coming_soon — safe for production apply)
-- ---------------------------------------------------------------------------
insert into public.countries (
  code, slug, name_en, name_bn, summary_en, summary_bn, status, is_flagship, currency_code, entities, sort_order
) values
  (
    'BD', 'bangladesh', 'Bangladesh', 'বাংলাদেশ',
    'Company formation, licences, tax coordination and ongoing compliance through one secure workspace.',
    'একটি সুরক্ষিত ওয়ার্কস্পেসের মাধ্যমে কোম্পানি গঠন, লাইসেন্স, কর সমন্বয় ও চলমান কমপ্লায়েন্স।',
    'active', true, 'BDT',
    array['private_limited','opc','public_limited','sole_proprietorship','partnership','foreign_owned','branch','liaison'],
    10
  ),
  (
    'US', 'united-states', 'United States', 'যুক্তরাষ্ট্র',
    'LLC and C-Corp routes through verified country specialists — not yet available.',
    'যাচাইকৃত দেশ বিশেষজ্ঞের মাধ্যমে এলএলসি ও সি-কর্প — এখনো উপলব্ধ নয়।',
    'coming_soon', false, 'USD', array['llc','c_corp'], 20
  ),
  (
    'GB', 'united-kingdom', 'United Kingdom', 'যুক্তরাজ্য',
    'Private limited company and Companies House coordination — not yet available.',
    'প্রাইভেট লিমিটেড কোম্পানি ও কোম্পানিজ হাউস সমন্বয় — এখনো উপলব্ধ নয়।',
    'coming_soon', false, 'GBP', array['private_limited'], 30
  ),
  (
    'AE', 'united-arab-emirates', 'United Arab Emirates', 'সংযুক্ত আরব আমিরাত',
    'Supported free-zone and mainland options after provider verification — not yet available.',
    'প্রদানকারী যাচাইয়ের পর ফ্রি-জোন ও মেইনল্যান্ড বিকল্প — এখনো উপলব্ধ নয়।',
    'coming_soon', false, 'AED', array['free_zone','mainland'], 40
  ),
  (
    'SG', 'singapore', 'Singapore', 'সিঙ্গাপুর',
    'Pte Ltd and ACRA coordination through verified specialists — not yet available.',
    'যাচাইকৃত বিশেষজ্ঞের মাধ্যমে প্রাইভেট লিমিটেড ও এসিআরএ সমন্বয় — এখনো উপলব্ধ নয়।',
    'coming_soon', false, 'SGD', array['pte_ltd'], 50
  )
on conflict (code) do nothing;

update public.services set country_code = 'BD' where country_code is null;

insert into public.evidence_claims (
  claim_code, claim_text_en, claim_text_bn, source_type, status,
  last_verified_at, reviewer, may_render_publicly, countries, notes
) values (
  'POS-001',
  'bdoor is an independent business setup, administrative-support and professional-coordination platform. Government decisions remain with the responsible authorities.',
  'বিডোর একটি স্বাধীন ব্যবসা সেটআপ, প্রশাসনিক সহায়তা ও পেশাদার সমন্বয় প্ল্যাটফর্ম। সরকারি সিদ্ধান্ত সংশ্লিষ্ট কর্তৃপক্ষের কাছেই থাকে।',
  'product_positioning',
  'verified',
  '2026-08-28',
  'engineering',
  true,
  array['BD'],
  'Standing disclosure; not a government affiliation claim.'
) on conflict (claim_code) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.evidence_claims enable row level security;
alter table public.countries enable row level security;
alter table public.industries enable row level security;
alter table public.industry_service_categories enable row level security;
alter table public.authorities enable row level security;
alter table public.authority_service_categories enable row level security;
alter table public.social_profiles enable row level security;

create policy evidence_claims_public_read on public.evidence_claims
  for select to anon, authenticated
  using (may_render_publicly and status = 'verified');
create policy evidence_claims_admin on public.evidence_claims
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy countries_public_read on public.countries
  for select to anon, authenticated
  using (status in ('active', 'pilot', 'coming_soon'));
create policy countries_admin on public.countries
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy industries_public_read on public.industries
  for select to anon, authenticated
  using (status in ('published', 'coming_soon'));
create policy industries_admin on public.industries
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy industry_service_categories_public_read on public.industry_service_categories
  for select to anon, authenticated
  using (exists (
    select 1 from public.industries i
    where i.id = industry_service_categories.industry_id
      and i.status in ('published', 'coming_soon')
  ));
create policy industry_service_categories_admin on public.industry_service_categories
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy authorities_public_read on public.authorities
  for select to anon, authenticated
  using (status in ('published', 'coming_soon'));
create policy authorities_admin on public.authorities
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy authority_service_categories_public_read on public.authority_service_categories
  for select to anon, authenticated
  using (exists (
    select 1 from public.authorities a
    where a.id = authority_service_categories.authority_id
      and a.status in ('published', 'coming_soon')
  ));
create policy authority_service_categories_admin on public.authority_service_categories
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy social_profiles_public_read on public.social_profiles
  for select to anon, authenticated
  using (
    status = 'active'
    and display_permission
    and public_url is not null
    and last_verified_at is not null
  );
create policy social_profiles_admin on public.social_profiles
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
