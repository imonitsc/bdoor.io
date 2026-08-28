-- =============================================================================
-- Service packages, versioned pricing and international offer scaffolding.
-- Additive only. Published rows are readable by anon; drafts are staff-only.
-- =============================================================================

alter type public.currency_code add value if not exists 'GBP';
alter type public.currency_code add value if not exists 'AED';
alter type public.currency_code add value if not exists 'SGD';

create type public.package_segment as enum ('new_business', 'existing_business');

create type public.tax_treatment_status as enum (
  'pending_review',
  'inclusive',
  'exclusive',
  'not_applicable'
);

create table public.service_packages (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  segment           public.package_segment not null,
  jurisdiction_code text not null default 'BD',
  name_en           text not null,
  name_bn           text not null,
  sort_order        integer not null default 100,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger service_packages_touch before update on public.service_packages
  for each row execute function app.touch_updated_at();

create table public.package_versions (
  id                uuid primary key default gen_random_uuid(),
  package_id        uuid not null references public.service_packages (id) on delete cascade,
  version_no        integer not null,
  status            public.publication_status not null default 'draft',
  effective_from    date not null,
  effective_to      date,
  checkout_enabled  boolean not null default false,
  public_label_en   text not null,
  public_label_bn   text not null,
  summary_en        text not null,
  summary_bn        text not null,
  inclusions        jsonb not null default '[]'::jsonb,
  exclusions        jsonb not null default '[]'::jsonb,
  limits            jsonb not null default '[]'::jsonb,
  assumptions       jsonb not null default '[]'::jsonb,
  approved_by       uuid references auth.users (id) on delete set null,
  approved_at       timestamptz,
  source_reviewed_at date,
  source_url        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (package_id, version_no),
  constraint package_versions_range
    check (effective_to is null or effective_to >= effective_from)
);

create trigger package_versions_touch before update on public.package_versions
  for each row execute function app.touch_updated_at();

create table public.package_fee_components (
  id                uuid primary key default gen_random_uuid(),
  package_version_id uuid not null references public.package_versions (id) on delete cascade,
  layer             public.quote_item_category not null,
  label_en          text not null,
  label_bn          text not null,
  amount_minor      bigint not null,
  currency          public.currency_code not null,
  is_estimate       boolean not null default false,
  is_refundable     boolean not null default false,
  payee             public.payee_type not null,
  tax_treatment     public.tax_treatment_status not null default 'pending_review',
  source_url        text,
  reviewed_at       date,
  sort_order        integer not null default 100,
  created_at        timestamptz not null default now(),
  constraint package_fee_amount_nonnegative check (amount_minor >= 0)
);

create index package_fee_components_version_idx
  on public.package_fee_components (package_version_id, sort_order);

create table public.international_offers (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  country_code      text not null,
  route_en          text not null,
  route_bn          text not null,
  status            public.publication_status not null default 'draft',
  checkout_enabled  boolean not null default false,
  public_label_en   text not null,
  public_label_bn   text not null,
  summary_en        text not null,
  summary_bn        text not null,
  disclosures       jsonb not null default '[]'::jsonb,
  fee_components    jsonb not null default '[]'::jsonb,
  partner_agreement_id uuid,
  source_reviewed_at date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger international_offers_touch before update on public.international_offers
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.service_packages enable row level security;
alter table public.package_versions enable row level security;
alter table public.package_fee_components enable row level security;
alter table public.international_offers enable row level security;

create policy service_packages_public_read on public.service_packages
  for select to anon, authenticated using (true);
create policy service_packages_admin on public.service_packages
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy package_versions_public_read on public.package_versions
  for select to anon, authenticated
  using (status = 'published');
create policy package_versions_staff_read on public.package_versions
  for select to authenticated using (app.is_platform_staff());
create policy package_versions_admin on public.package_versions
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy package_fee_components_public_read on public.package_fee_components
  for select to anon, authenticated
  using (exists (
    select 1 from public.package_versions pv
    where pv.id = package_fee_components.package_version_id
      and pv.status = 'published'
  ));
create policy package_fee_components_staff on public.package_fee_components
  for select to authenticated using (app.is_platform_staff());
create policy package_fee_components_admin on public.package_fee_components
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy international_offers_public_read on public.international_offers
  for select to anon, authenticated
  using (status in ('published', 'coming_soon'));
create policy international_offers_staff on public.international_offers
  for select to authenticated using (app.is_platform_staff());
create policy international_offers_admin on public.international_offers
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
