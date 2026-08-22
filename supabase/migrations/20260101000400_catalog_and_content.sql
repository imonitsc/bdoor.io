-- =============================================================================
-- Service catalog and editorial content. Everything the public site renders
-- comes from here, in both English and Bangla, with a review date and an
-- internal source reference for anything a regulator would care about.
-- =============================================================================

create table public.service_categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_en      text not null,
  name_bn      text not null,
  summary_en   text,
  summary_bn   text,
  icon         text,
  sort_order   integer not null default 100,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger service_categories_touch before update on public.service_categories
  for each row execute function app.touch_updated_at();

create table public.services (
  id                 uuid primary key default gen_random_uuid(),
  category_id        uuid not null references public.service_categories (id) on delete restrict,
  slug               text not null unique,
  name_en            text not null,
  name_bn            text not null,
  summary_en         text not null,
  summary_bn         text not null,
  who_for_en         text,
  who_for_bn         text,
  included_en        text[] not null default '{}',
  included_bn        text[] not null default '{}',
  not_included_en    text[] not null default '{}',
  not_included_bn    text[] not null default '{}',
  eligibility_en     text,
  eligibility_bn     text,
  authority_name_en  text,
  authority_name_bn  text,
  -- Fees. NULL means "quoted after review" — we never invent a number.
  starting_fee_bdt   numeric(12, 2),
  fee_notes_en       text,
  fee_notes_bn       text,
  -- Time estimates are only rendered when `time_reviewed_at` is set.
  estimated_days_min integer,
  estimated_days_max integer,
  time_reviewed_at   date,
  time_reviewed_by   uuid references auth.users (id) on delete set null,
  -- Internal only. Never selected by a public query; see the RLS policies.
  internal_source_ref text,
  requires_partner   boolean not null default false,
  is_regulated       boolean not null default false,
  status             public.publication_status not null default 'draft',
  next_review_due    date,
  sort_order         integer not null default 100,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint services_estimate_order
    check (estimated_days_min is null or estimated_days_max is null
           or estimated_days_min <= estimated_days_max),
  constraint services_estimate_needs_review
    check ((estimated_days_min is null and estimated_days_max is null) or time_reviewed_at is not null),
  constraint services_fee_nonnegative check (starting_fee_bdt is null or starting_fee_bdt >= 0)
);

create index services_category_idx on public.services (category_id, sort_order);
create index services_status_idx on public.services (status) where status = 'published';
create index services_review_due_idx on public.services (next_review_due)
  where status = 'published' and next_review_due is not null;

create trigger services_touch before update on public.services
  for each row execute function app.touch_updated_at();

create table public.service_requirements (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references public.services (id) on delete cascade,
  code          text not null,
  label_en      text not null,
  label_bn      text not null,
  help_en       text,
  help_bn       text,
  applies_to    text not null default 'company',
  is_mandatory  boolean not null default true,
  sort_order    integer not null default 100,
  created_at    timestamptz not null default now(),
  unique (service_id, code),
  constraint service_requirements_applies_to_values
    check (applies_to in ('company', 'director', 'shareholder', 'signatory', 'beneficial_owner', 'premises'))
);

create index service_requirements_service_idx on public.service_requirements (service_id, sort_order);

create table public.service_milestone_templates (
  id             uuid primary key default gen_random_uuid(),
  service_id     uuid not null references public.services (id) on delete cascade,
  code           text not null,
  label_en       text not null,
  label_bn       text not null,
  description_en text,
  description_bn text,
  owner_kind     text not null default 'bdoor',
  typical_days   integer,
  weight         integer not null default 1,
  sort_order     integer not null default 100,
  created_at     timestamptz not null default now(),
  unique (service_id, code),
  constraint service_milestone_owner_values
    check (owner_kind in ('bdoor', 'customer', 'partner', 'authority')),
  constraint service_milestone_weight_positive check (weight > 0)
);

create index service_milestone_templates_service_idx on public.service_milestone_templates (service_id, sort_order);

create table public.service_fee_components (
  id             uuid primary key default gen_random_uuid(),
  service_id     uuid not null references public.services (id) on delete cascade,
  category       public.quote_item_category not null,
  label_en       text not null,
  label_bn       text not null,
  payee          public.payee_type not null,
  amount_bdt     numeric(12, 2),
  is_estimate    boolean not null default true,
  is_refundable  boolean not null default false,
  tax_treatment  text not null default 'exclusive',
  -- A displayed government fee must carry a source and a review date.
  source_ref     text,
  reviewed_at    date,
  sort_order     integer not null default 100,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint service_fee_components_tax_values
    check (tax_treatment in ('inclusive', 'exclusive', 'not_applicable')),
  constraint service_fee_components_amount_nonnegative check (amount_bdt is null or amount_bdt >= 0),
  constraint service_fee_components_government_needs_source
    check (category <> 'government_fee_estimate' or amount_bdt is null
           or (source_ref is not null and reviewed_at is not null))
);

create index service_fee_components_service_idx on public.service_fee_components (service_id, sort_order);

create trigger service_fee_components_touch before update on public.service_fee_components
  for each row execute function app.touch_updated_at();

create table public.service_faqs (
  id              uuid primary key default gen_random_uuid(),
  service_id      uuid references public.services (id) on delete cascade,
  question_en     text not null,
  question_bn     text not null,
  answer_en       text not null,
  answer_bn       text not null,
  is_global       boolean not null default false,
  is_compliance_sensitive boolean not null default false,
  internal_source_ref text,
  last_reviewed_at date,
  reviewed_by     uuid references auth.users (id) on delete set null,
  status          public.publication_status not null default 'draft',
  sort_order      integer not null default 100,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint service_faqs_scope check (is_global or service_id is not null),
  constraint service_faqs_sensitive_needs_review
    check (not is_compliance_sensitive or status <> 'published' or last_reviewed_at is not null)
);

create index service_faqs_service_idx on public.service_faqs (service_id, sort_order);
create index service_faqs_global_idx on public.service_faqs (sort_order) where is_global and status = 'published';

create trigger service_faqs_touch before update on public.service_faqs
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- content_pages / revisions / sources — the resources section and legal pages.
-- ---------------------------------------------------------------------------
create table public.content_pages (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  kind           text not null default 'resource',
  title_en       text not null,
  title_bn       text not null,
  excerpt_en     text,
  excerpt_bn     text,
  body_en        text not null default '',
  body_bn        text not null default '',
  status         public.publication_status not null default 'draft',
  is_compliance_sensitive boolean not null default false,
  last_reviewed_at date,
  reviewed_by    uuid references auth.users (id) on delete set null,
  next_review_due date,
  published_at   timestamptz,
  reading_minutes integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint content_pages_kind_values check (kind in ('resource', 'legal', 'page'))
);

create index content_pages_status_idx on public.content_pages (kind, status, published_at desc);

create trigger content_pages_touch before update on public.content_pages
  for each row execute function app.touch_updated_at();

create table public.content_revisions (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references public.content_pages (id) on delete cascade,
  revision_no   integer not null,
  title_en      text not null,
  title_bn      text not null,
  body_en       text not null,
  body_bn       text not null,
  change_note   text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (page_id, revision_no)
);

create index content_revisions_page_idx on public.content_revisions (page_id, revision_no desc);

create trigger content_revisions_append_only
  before update or delete on public.content_revisions
  for each row execute function app.reject_mutation();

create table public.content_sources (
  id           uuid primary key default gen_random_uuid(),
  page_id      uuid references public.content_pages (id) on delete cascade,
  service_id   uuid references public.services (id) on delete cascade,
  label        text not null,
  reference    text not null,
  url          text,
  checked_at   date,
  checked_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint content_sources_target check (num_nonnulls(page_id, service_id) = 1)
);

create index content_sources_page_idx on public.content_sources (page_id);
create index content_sources_service_idx on public.content_sources (service_id);

-- =============================================================================
-- RLS
--
-- Published catalog rows are readable by anon so the marketing site can be
-- statically rendered. Internal columns (`internal_source_ref`) are excluded by
-- the public views below rather than by trusting the client to not ask.
-- =============================================================================

alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.service_requirements enable row level security;
alter table public.service_milestone_templates enable row level security;
alter table public.service_fee_components enable row level security;
alter table public.service_faqs enable row level security;
alter table public.content_pages enable row level security;
alter table public.content_revisions enable row level security;
alter table public.content_sources enable row level security;

create policy service_categories_public_read on public.service_categories
  for select to anon, authenticated using (is_active);
create policy service_categories_admin on public.service_categories
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy services_public_read on public.services
  for select to anon, authenticated using (status in ('published', 'coming_soon'));
create policy services_staff_read on public.services
  for select to authenticated using (app.is_platform_staff());
create policy services_admin on public.services
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy service_requirements_public_read on public.service_requirements
  for select to anon, authenticated
  using (exists (select 1 from public.services s
                 where s.id = service_requirements.service_id
                   and s.status in ('published', 'coming_soon')));
create policy service_requirements_admin on public.service_requirements
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy service_milestone_templates_public_read on public.service_milestone_templates
  for select to anon, authenticated
  using (exists (select 1 from public.services s
                 where s.id = service_milestone_templates.service_id
                   and s.status in ('published', 'coming_soon')));
create policy service_milestone_templates_admin on public.service_milestone_templates
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy service_fee_components_public_read on public.service_fee_components
  for select to anon, authenticated
  using (exists (select 1 from public.services s
                 where s.id = service_fee_components.service_id
                   and s.status in ('published', 'coming_soon')));
create policy service_fee_components_admin on public.service_fee_components
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy service_faqs_public_read on public.service_faqs
  for select to anon, authenticated using (status = 'published');
create policy service_faqs_staff_read on public.service_faqs
  for select to authenticated using (app.is_platform_staff());
create policy service_faqs_admin on public.service_faqs
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy content_pages_public_read on public.content_pages
  for select to anon, authenticated using (status = 'published');
create policy content_pages_staff_read on public.content_pages
  for select to authenticated using (app.is_platform_staff());
create policy content_pages_admin on public.content_pages
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- Revisions and sources are internal editorial metadata: staff only.
create policy content_revisions_staff on public.content_revisions
  for select to authenticated using (app.is_platform_staff());
create policy content_revisions_admin_insert on public.content_revisions
  for insert to authenticated with check (app.is_admin());

create policy content_sources_staff on public.content_sources
  for select to authenticated using (app.is_platform_staff());
create policy content_sources_admin on public.content_sources
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
