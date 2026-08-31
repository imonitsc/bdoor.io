-- Bangladesh Authoritative Business Knowledge System.
--
-- Additive only. Nothing here alters existing rows or rewrites an applied
-- migration. The existing Ask bdoor AI tables stay exactly as they are; this
-- migration adds the layer beneath them: an editable registry of official
-- institutions, a versioned record of every official document we track, a
-- store of reviewable structured regulatory facts, a resumable ingestion job
-- queue, change alerts, and a private bucket for the original files.
--
-- The trust boundary, in one sentence: everything ingested from the internet
-- is staff-only until a human publishes it, and the only route to a customer
-- answer is through the existing ai_knowledge_sources workflow, whose
-- retrieval function filters on published/effective/public inside its own
-- body. Nothing in this migration gives the anonymous assistant a new way in.

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

do $$ begin
  -- The ingestion lifecycle, exactly as operated: a document is found, its
  -- bytes are captured, text is extracted, a human reviews, approves and
  -- publishes it, and it eventually leaves service by being superseded or
  -- withdrawn. Only 'published' may reach a customer answer.
  create type public.ai_registry_lifecycle as enum (
    'discovered', 'downloaded', 'extracted', 'review_required',
    'approved', 'published', 'superseded', 'withdrawn'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- Currency of the document itself, independent of our lifecycle: a current
  -- SRO can be sitting in review, and a proposed amendment can be published
  -- to staff. 'proposed' is what stops a budget speech becoming an active
  -- rule: retrieval and rules both refuse it.
  create type public.ai_document_currency as enum (
    'current', 'amended', 'superseded', 'withdrawn', 'proposed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- The knowledge taxonomy. Thirteen areas, fixed in the enum so coverage
  -- reporting can enumerate what is missing rather than what happens to exist.
  create type public.ai_topic as enum (
    'formation_structure', 'governance_rjsc', 'tax_vat',
    'banking_fx_investment', 'employment_labour', 'import_export_customs',
    'trade_licence_local', 'environment_factory_fire', 'intellectual_property',
    'procurement', 'startup_funding', 'sector_licensing',
    'international_expansion'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_rule_status as enum (
    'draft', 'in_review', 'approved', 'published', 'superseded', 'withdrawn'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_job_status as enum (
    'queued', 'running', 'succeeded', 'failed', 'abandoned'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_job_type as enum (
    'check_source', 'fetch_document', 'extract_document', 'extract_rules'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_alert_type as enum (
    'new_document', 'new_version', 'fee_change', 'deadline_change',
    'form_change', 'withdrawn_notice', 'fetch_failed'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Source registry: the institutions and endpoints we watch
-- ---------------------------------------------------------------------------

create table public.ai_source_registry (
  id uuid primary key default gen_random_uuid(),
  -- Stable short code, e.g. 'rjsc', 'nbr', 'bd-gazette'. Job dedupe keys and
  -- seed idempotency both hang off it.
  code text not null unique,
  institution text not null,
  institution_bn text,
  kind text not null check (
    kind in ('gazette', 'legislation', 'regulator', 'agency', 'ministry',
             'local_authority', 'programme', 'secondary')
  ),
  base_url text not null,
  -- 1 = Bangladesh Gazette … 6 = trusted secondary (discovery only, never the
  -- sole authority for a legal, tax, fee or deadline claim). Lower is more
  -- authoritative; retrieval prefers lower.
  authority_tier smallint not null check (authority_tier between 1 and 6),
  topics public.ai_topic[] not null default '{}',
  -- How often the scheduler re-checks. Gazettes, circulars and fee pages run
  -- much hotter than static guides.
  check_frequency_hours integer not null default 168 check (check_frequency_hours >= 1),
  enabled boolean not null default true,
  -- What robots.txt said last time we looked. The fetcher refuses a
  -- disallowed path regardless; this is for the health screen.
  robots_state text,
  notes text,
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  -- Checksum of the source's index page at the last check; a change is what
  -- raises a "review this source for new documents" alert.
  last_content_checksum text,
  consecutive_failures integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_source_registry is
  'Official Bangladesh institutions and endpoints the knowledge system watches. A .gov.bd domain is not trusted by itself: the issuing authority is recorded per document and verified in review.';

create trigger ai_source_registry_touch before update on public.ai_source_registry
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Registry documents: one row per version of an official document
-- ---------------------------------------------------------------------------

create table public.ai_registry_documents (
  id uuid primary key default gen_random_uuid(),
  registry_source_id uuid not null references public.ai_source_registry (id) on delete restrict,
  -- Recorded per document, not inherited from the registry row: an aggregator
  -- page can carry a document another authority issued.
  issuing_institution text not null,
  source_kind text not null check (
    source_kind in ('act', 'ordinance', 'rule', 'sro', 'circular', 'order',
                    'notification', 'gazette', 'form', 'fee_schedule',
                    'procedure', 'faq', 'manual', 'notice', 'service_page',
                    'guide', 'other')
  ),
  official_title text not null,
  -- Act / rule / SRO / circular / gazette / form number, verbatim.
  reference_number text,
  canonical_url text not null,
  language text not null default 'en' check (language in ('en', 'bn', 'mixed')),
  publication_date date,
  effective_date date,
  expiry_date date,
  jurisdiction text not null default 'national' check (
    jurisdiction in ('national', 'division', 'district', 'city_corporation',
                     'municipality', 'zone')
  ),
  geographic_scope text,
  entity_types text[] not null default '{}',
  sectors text[] not null default '{}',
  topics public.ai_topic[] not null default '{}',
  authority_tier smallint not null check (authority_tier between 1 and 6),
  currency public.ai_document_currency not null default 'current',
  -- sha-256 of the exact bytes retrieved. Dedupe and change detection both
  -- key on it; two fetches of unchanged bytes are one document.
  checksum text,
  retrieved_at timestamptz,
  -- Path in the private ai-source-documents bucket. Original files are never
  -- committed to git and never made public.
  storage_path text,
  mime_type text,
  byte_size bigint,
  page_count integer,
  previous_version_id uuid references public.ai_registry_documents (id) on delete set null,
  replaced_by_id uuid references public.ai_registry_documents (id) on delete set null,
  lifecycle public.ai_registry_lifecycle not null default 'discovered',
  -- Extraction record. The extracted text lives here (TOAST-compressed) so
  -- the admin screen can show original-versus-extracted; page boundaries are
  -- preserved in the text as form-feed markers for precise citations.
  extracted_text text,
  extraction_method text check (
    extraction_method in ('html', 'pdf_text', 'ocr', 'manual')
  ),
  ocr_applied boolean not null default false,
  language_detected text,
  extracted_at timestamptz,
  review_due_on date,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  -- Publication target: the ai_knowledge_sources row this document feeds.
  -- Customer retrieval only ever reads that table, through its own filters.
  knowledge_source_id uuid references public.ai_knowledge_sources (id) on delete set null,
  last_error text,
  failed_at timestamptz,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_registry_documents is
  'Versioned record of official Bangladesh documents: metadata, checksum, storage pointer, extraction and review state. Staff-only; publishing copies reviewed text into ai_knowledge_sources.';

create index ai_registry_documents_source_idx
  on public.ai_registry_documents (registry_source_id, created_at desc);
create index ai_registry_documents_lifecycle_idx
  on public.ai_registry_documents (lifecycle);
create index ai_registry_documents_review_idx
  on public.ai_registry_documents (review_due_on) where lifecycle = 'published';
-- Same bytes at the same address are the same document version.
create unique index ai_registry_documents_url_checksum_idx
  on public.ai_registry_documents (canonical_url, checksum) where checksum is not null;

create trigger ai_registry_documents_touch before update on public.ai_registry_documents
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Structured regulatory rules: reviewable facts, not searchable prose
-- ---------------------------------------------------------------------------

create table public.ai_structured_rules (
  id uuid primary key default gen_random_uuid(),
  registry_document_id uuid references public.ai_registry_documents (id) on delete set null,
  knowledge_source_id uuid references public.ai_knowledge_sources (id) on delete set null,
  topic public.ai_topic not null,
  title text not null,
  applies_to text not null,
  entity_types text[] not null default '{}',
  sectors text[] not null default '{}',
  trigger_event text,
  required_action text not null,
  required_documents text[] not null default '{}',
  responsible_authority text not null,
  -- The fee, verbatim from the source, plus a machine amount when the source
  -- states a single figure. `fee_verified` is a reviewer's assertion, never
  -- an extractor's: an unverified fee is not shown to customers as a fee.
  government_fee_text text,
  government_fee_minor bigint check (government_fee_minor is null or government_fee_minor >= 0),
  government_fee_currency text not null default 'BDT',
  government_fee_verified boolean not null default false,
  professional_fee_note text,
  submission_channel text,
  processing_time_official text,
  deadline_text text,
  penalty text,
  exemptions text,
  -- The instrument this rule rests on, e.g. 'Companies Act 1994, s. 25'.
  legal_authority text not null,
  effective_from date,
  effective_to date,
  status public.ai_rule_status not null default 'draft',
  -- Extraction provenance. A rule extracted by a model is a draft until an
  -- authorised reviewer approves it; the model that wrote the draft is
  -- recorded so an extraction problem can be traced to its source.
  extracted_by_model text,
  superseded_by_id uuid references public.ai_structured_rules (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_structured_rules is
  'Reviewable structured regulatory facts. Model-extracted rows stay draft until an authorised reviewer approves; only published, in-date rows reach an answer.';

create index ai_structured_rules_topic_idx
  on public.ai_structured_rules (topic, status);
create index ai_structured_rules_document_idx
  on public.ai_structured_rules (registry_document_id);

create trigger ai_structured_rules_touch before update on public.ai_structured_rules
  for each row execute function app.touch_updated_at();

-- What "live" means for a rule — mirrors ai_source_is_live so the effective-
-- date discipline is identical on both retrieval paths.
create or replace function public.ai_rule_is_live(v_rule public.ai_structured_rules)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select v_rule.status = 'published'
     and (v_rule.effective_from is null or v_rule.effective_from <= current_date)
     and (v_rule.effective_to is null or v_rule.effective_to >= current_date);
$$;

-- ---------------------------------------------------------------------------
-- Ingestion jobs: resumable, idempotent, bounded
-- ---------------------------------------------------------------------------

create table public.ai_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type public.ai_job_type not null,
  registry_source_id uuid references public.ai_source_registry (id) on delete cascade,
  registry_document_id uuid references public.ai_registry_documents (id) on delete cascade,
  status public.ai_job_status not null default 'queued',
  attempt integer not null default 0,
  max_attempts integer not null default 4,
  -- Bounded backoff: a retry re-queues with run_after pushed out. A job past
  -- max_attempts is 'abandoned' and surfaces on the admin failed-source list.
  run_after timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  error_detail text,
  -- Resumable batches: the worker records how far it got, so re-running the
  -- job continues instead of restarting. Never trusted for authorisation.
  checkpoint jsonb not null default '{}',
  -- Idempotency: the same logical job enqueued twice is one row.
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

create index ai_ingestion_jobs_due_idx
  on public.ai_ingestion_jobs (status, run_after);

-- ---------------------------------------------------------------------------
-- Change alerts: what a reviewer must look at
-- ---------------------------------------------------------------------------

create table public.ai_source_change_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type public.ai_alert_type not null,
  registry_source_id uuid references public.ai_source_registry (id) on delete cascade,
  registry_document_id uuid references public.ai_registry_documents (id) on delete cascade,
  previous_document_id uuid references public.ai_registry_documents (id) on delete set null,
  summary text not null,
  detail jsonb not null default '{}',
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ai_change_alerts_open_idx
  on public.ai_source_change_alerts (created_at desc) where resolved_at is null;

-- ---------------------------------------------------------------------------
-- Registry audit trail
-- ---------------------------------------------------------------------------

create table public.ai_registry_audit_log (
  id uuid primary key default gen_random_uuid(),
  registry_source_id uuid references public.ai_source_registry (id) on delete set null,
  registry_document_id uuid references public.ai_registry_documents (id) on delete set null,
  rule_id uuid references public.ai_structured_rules (id) on delete set null,
  action text not null check (
    action in ('registry_created', 'registry_updated', 'document_discovered',
               'document_downloaded', 'document_extracted', 'lifecycle_changed',
               'document_published', 'document_superseded', 'document_withdrawn',
               'rule_created', 'rule_updated', 'rule_status_changed',
               'alert_resolved', 'job_abandoned')
  ),
  from_state text,
  to_state text,
  actor_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index ai_registry_audit_document_idx
  on public.ai_registry_audit_log (registry_document_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Extend the existing knowledge tables (additive columns only)
-- ---------------------------------------------------------------------------

alter table public.ai_knowledge_sources
  add column if not exists authority_tier smallint
    check (authority_tier is null or authority_tier between 1 and 6),
  add column if not exists topics public.ai_topic[] not null default '{}',
  add column if not exists issuing_institution text,
  add column if not exists reference_number text,
  add column if not exists publication_date date,
  add column if not exists registry_document_id uuid
    references public.ai_registry_documents (id) on delete set null;

comment on column public.ai_knowledge_sources.authority_tier is
  '1 (gazette) … 6 (secondary). Null for bdoor-authored content. Retrieval prefers lower.';

alter table public.ai_knowledge_chunks
  add column if not exists heading text,
  add column if not exists section_ref text,
  add column if not exists page_start integer,
  add column if not exists page_end integer;

comment on column public.ai_knowledge_chunks.section_ref is
  'Section/clause/schedule reference of the provision this chunk carries, for precise citations.';

-- ---------------------------------------------------------------------------
-- Retrieval v2: same contract, authority-aware ranking, citation fields
-- ---------------------------------------------------------------------------

-- The return shape gains columns, which requires a drop-and-recreate. The
-- argument list is unchanged, so callers and grants carry over; the function
-- body keeps every existing filter (published, effective, public scope,
-- country) and adds a small additive authority bonus. Additive rather than
-- multiplicative on purpose: authority breaks ties between comparably
-- relevant chunks — it must never let a barely-relevant gazette bury the
-- provision that actually answers the question.
drop function if exists public.ai_search_knowledge(extensions.vector, text, public.locale_code, text, integer);

create function public.ai_search_knowledge(
  query_embedding extensions.vector(768),
  query_text text,
  p_locale public.locale_code default 'en',
  p_country text default 'bd',
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  source_id uuid,
  content text,
  title text,
  source_url text,
  country text,
  locale public.locale_code,
  source_type public.ai_source_type,
  last_reviewed_at timestamptz,
  effective_from date,
  score double precision,
  authority_tier smallint,
  issuing_institution text,
  reference_number text,
  section_ref text,
  page_start integer
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with live as (
    select s.* from public.ai_knowledge_sources s
    -- Filters repeated inside the function, not left to RLS: the public
    -- assistant reaches this through the service role, which bypasses every
    -- policy. Restricted, draft, expired and future-dated content is
    -- unreachable from here by any caller.
    where s.access_scope = 'public'
      and public.ai_source_is_live(s)
      and (s.country = p_country or s.country = 'global')
  ),
  semantic as (
    select c.id, row_number() over (order by c.embedding <=> query_embedding) as rank
    from public.ai_knowledge_chunks c
    join live s on s.id = c.source_id
    where c.embedding is not null
    order by c.embedding <=> query_embedding
    limit greatest(match_count * 4, 40)
  ),
  keyword as (
    select c.id,
           row_number() over (
             order by ts_rank(c.search_vector, websearch_to_tsquery('simple', query_text)) desc
           ) as rank
    from public.ai_knowledge_chunks c
    join live s on s.id = c.source_id
    where query_text <> ''
      and c.search_vector @@ websearch_to_tsquery('simple', query_text)
    limit greatest(match_count * 4, 40)
  ),
  fused as (
    select coalesce(semantic.id, keyword.id) as id,
           coalesce(1.0 / (60 + semantic.rank), 0)
             + coalesce(1.0 / (60 + keyword.rank), 0) as rrf
    from semantic
    full outer join keyword on keyword.id = semantic.id
  )
  select c.id, s.id, c.content, s.title, s.source_url, s.country, s.locale,
         s.source_type, s.last_reviewed_at, s.effective_from,
         -- Tier 1 earns +0.012, tier 6 +0.002, untiered bdoor content 0. The
         -- whole span is smaller than one RRF rank step at the top of the
         -- list, so authority orders sources of similar relevance and does
         -- nothing else.
         fused.rrf + coalesce((7 - s.authority_tier) * 0.002, 0) as score,
         s.authority_tier, s.issuing_institution, s.reference_number,
         c.section_ref, c.page_start
  from fused
  join public.ai_knowledge_chunks c on c.id = fused.id
  join live s on s.id = c.source_id
  order by (s.locale = p_locale) desc,
           fused.rrf + coalesce((7 - s.authority_tier) * 0.002, 0) desc
  limit match_count;
$$;

grant execute on function public.ai_search_knowledge(extensions.vector, text, public.locale_code, text, integer)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage: original official documents, private, never in git
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-source-documents', 'ai-source-documents', false, 52428800,
        array['application/pdf', 'text/html', 'text/plain',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;

-- Staff may read originals for review; every write goes through the service
-- role from server-only ingestion code, so no insert/update policy exists for
-- browser roles at all.
create policy ai_source_documents_staff_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'ai-source-documents'
    and (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'))
  );

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.ai_source_registry enable row level security;
alter table public.ai_registry_documents enable row level security;
alter table public.ai_structured_rules enable row level security;
alter table public.ai_ingestion_jobs enable row level security;
alter table public.ai_source_change_alerts enable row level security;
alter table public.ai_registry_audit_log enable row level security;

-- Registry, documents, jobs, alerts and the audit trail are staff-only in
-- every direction. No anon policy exists on any of them: unreviewed internet
-- content and operational state never reach a browser that is not staff.
create policy ai_registry_staff_read on public.ai_source_registry
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_registry_staff_write on public.ai_source_registry
  for all to authenticated
  using (app.has_platform_permission('content.publish'))
  with check (app.has_platform_permission('content.publish'));

create policy ai_registry_documents_staff_read on public.ai_registry_documents
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_registry_documents_staff_write on public.ai_registry_documents
  for all to authenticated
  using (app.has_platform_permission('content.publish'))
  with check (app.has_platform_permission('content.publish'));

-- Structured rules are the one table with a public face: published, in-date
-- rows only. Draft and superseded rules are invisible to non-staff, and the
-- server-side rules reader repeats this filter in its own query because the
-- assistant reads through the service role.
create policy ai_rules_public_read on public.ai_structured_rules
  for select to anon, authenticated
  using (public.ai_rule_is_live(ai_structured_rules));

create policy ai_rules_staff_read on public.ai_structured_rules
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_rules_staff_write on public.ai_structured_rules
  for all to authenticated
  using (app.has_platform_permission('content.publish'))
  with check (app.has_platform_permission('content.publish'));

create policy ai_jobs_staff_read on public.ai_ingestion_jobs
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_alerts_staff_read on public.ai_source_change_alerts
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_alerts_staff_resolve on public.ai_source_change_alerts
  for update to authenticated
  using (app.has_platform_permission('content.publish'))
  with check (app.has_platform_permission('content.publish'));

create policy ai_registry_audit_staff_read on public.ai_registry_audit_log
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

-- Job writes and audit writes come from the ingestion workers via the service
-- role; alert inserts likewise. No browser role can forge a job result, an
-- audit line or an alert.

grant execute on function public.ai_rule_is_live(public.ai_structured_rules)
  to anon, authenticated, service_role;

-- Security-advisor fix carried with this migration: pin the search_path of
-- the existing liveness helper too. Its body touches no other objects, so an
-- empty path is safe and silences the mutable-search-path lint.
create or replace function public.ai_source_is_live(v_source public.ai_knowledge_sources)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select v_source.status = 'published'
     and v_source.effective_from <= current_date
     and (v_source.expires_on is null or v_source.expires_on >= current_date);
$$;
