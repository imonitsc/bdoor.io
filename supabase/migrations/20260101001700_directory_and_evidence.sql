-- =============================================================================
-- Directory, evidence, social profiles and legal-policy versioning.
-- Additive. Existing catalogue rows keep working via column defaults.
-- =============================================================================

create type public.operational_status as enum ('active', 'pilot', 'coming_soon');
create type public.evidence_status as enum ('draft', 'verified', 'expired', 'withdrawn');
create type public.social_network as enum (
  'facebook', 'linkedin', 'instagram', 'youtube', 'x', 'tiktok',
  'threads', 'whatsapp', 'google_business'
);
create type public.social_profile_status as enum ('reserved', 'verified', 'active', 'inactive');
create type public.legal_policy_state as enum ('draft', 'approved', 'published', 'withdrawn');
create type public.delivery_mode as enum ('online', 'hybrid', 'in_person');
create type public.ownership_scope as enum ('local', 'foreign', 'nrb', 'any');

-- ---------------------------------------------------------------------------
-- Extra columns on services. Defaults preserve every existing row.
-- ---------------------------------------------------------------------------
alter table public.services
  add column if not exists country_code text not null default 'BD',
  add column if not exists delivery_mode public.delivery_mode not null default 'hybrid',
  add column if not exists ownership_scope public.ownership_scope not null default 'any',
  add column if not exists is_recurring boolean not null default false,
  add column if not exists finder_intent text;

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
  operational_status   public.operational_status not null default 'coming_soon',
  is_flagship          boolean not null default false,
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
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name_en              text not null,
  name_bn              text not null,
  summary_en           text not null,
  summary_bn           text not null,
  related_category_slugs text[] not null default '{}',
  operational_status   public.operational_status not null default 'coming_soon',
  sort_order           integer not null default 100,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger industries_touch before update on public.industries
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- authorities — informational. official_url is only selected by public
-- queries when url_verified is true (enforced in application code as well).
-- ---------------------------------------------------------------------------
create table public.authorities (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name_en              text not null,
  name_bn              text not null,
  role_en              text not null,
  role_bn              text not null,
  official_url         text,
  url_verified         boolean not null default false,
  related_category_slugs text[] not null default '{}',
  operational_status   public.operational_status not null default 'coming_soon',
  sort_order           integer not null default 100,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint authorities_verified_url_has_value
    check (url_verified = false or official_url is not null)
);

create trigger authorities_touch before update on public.authorities
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- evidence_claims
-- ---------------------------------------------------------------------------
create table public.evidence_claims (
  id                   text primary key,
  text_en              text not null,
  text_bn              text not null,
  source_type          text not null,
  official_source_url  text,
  source_published_at  date,
  last_verified_at     date,
  reviewer             text,
  status               public.evidence_status not null default 'draft',
  countries            text[] not null default '{}',
  services             text[] not null default '{}',
  is_public            boolean not null default false,
  note                 text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint evidence_verified_needs_date
    check (status <> 'verified' or last_verified_at is not null)
);

create trigger evidence_claims_touch before update on public.evidence_claims
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- social_profiles
-- ---------------------------------------------------------------------------
create table public.social_profiles (
  network              public.social_network primary key,
  handle               text,
  url                  text,
  status               public.social_profile_status not null default 'inactive',
  verified             boolean not null default false,
  last_verified_at     date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint social_active_needs_verified_url
    check (status <> 'active' or (verified and url is not null))
);

create trigger social_profiles_touch before update on public.social_profiles
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- legal_policy_versions — snapshots. Public read of published only.
-- This branch inserts none as published.
-- ---------------------------------------------------------------------------
create table public.legal_policy_versions (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null,
  version              text not null,
  state                public.legal_policy_state not null default 'draft',
  title_en             text not null,
  title_bn             text not null,
  body_en              text not null default '',
  body_bn              text not null default '',
  approved_at          timestamptz,
  approved_by          uuid references auth.users (id) on delete set null,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  unique (slug, version),
  constraint legal_published_needs_approval
    check (state <> 'published' or (approved_at is not null and published_at is not null))
);

create index legal_policy_versions_slug_idx on public.legal_policy_versions (slug, state);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.countries enable row level security;
alter table public.industries enable row level security;
alter table public.authorities enable row level security;
alter table public.evidence_claims enable row level security;
alter table public.social_profiles enable row level security;
alter table public.legal_policy_versions enable row level security;

create policy countries_public_read on public.countries
  for select to anon, authenticated using (true);
create policy countries_admin on public.countries
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy industries_public_read on public.industries
  for select to anon, authenticated using (true);
create policy industries_admin on public.industries
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy authorities_public_read on public.authorities
  for select to anon, authenticated using (true);
create policy authorities_admin on public.authorities
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- Only verified+public claims are readable by anon. Staff see drafts.
create policy evidence_claims_public_read on public.evidence_claims
  for select to anon, authenticated using (status = 'verified' and is_public);
create policy evidence_claims_staff_read on public.evidence_claims
  for select to authenticated using (app.is_platform_staff());
create policy evidence_claims_admin on public.evidence_claims
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy social_profiles_public_read on public.social_profiles
  for select to anon, authenticated using (status = 'active' and verified);
create policy social_profiles_staff_read on public.social_profiles
  for select to authenticated using (app.is_platform_staff());
create policy social_profiles_admin on public.social_profiles
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy legal_policy_versions_public_read on public.legal_policy_versions
  for select to anon, authenticated using (state = 'published');
create policy legal_policy_versions_staff_read on public.legal_policy_versions
  for select to authenticated using (app.is_platform_staff());
create policy legal_policy_versions_admin on public.legal_policy_versions
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- Explicit grants so production projects whose default privileges were set
-- before this migration still expose the public-read half.
grant select, insert, update, delete on
  public.countries,
  public.industries,
  public.authorities,
  public.evidence_claims,
  public.social_profiles,
  public.legal_policy_versions
  to authenticated;
grant select on
  public.countries,
  public.industries,
  public.authorities,
  public.evidence_claims,
  public.social_profiles,
  public.legal_policy_versions
  to anon;
