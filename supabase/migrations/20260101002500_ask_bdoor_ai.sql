-- Ask bdoor AI: knowledge base, conversations, usage and audit.
--
-- Additive only. Nothing here alters an existing table, and every table is
-- new, so the migration is safe to apply ahead of the feature being switched
-- on: with no published sources the assistant simply has nothing to retrieve.
--
-- Access model, in one sentence: anonymous visitors may read published,
-- public, currently-effective knowledge and nothing else; a signed-in user may
-- read their own conversation and nothing else; staff read through the
-- existing platform-permission helpers. The public assistant is deliberately
-- not connected to cases, KYC, documents or payments — there is no policy here
-- that could reach them.

-- pgvector lives in the `extensions` schema rather than `public` so the
-- application schema stays free of vendor types. Functions that use the
-- distance operators therefore pin `extensions` on their search_path.
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.ai_source_status as enum (
    -- 'withdrawn' rather than 'archived': archiving sounds like tidying, and
    -- this status has teeth — a withdrawn source has its chunks deleted and
    -- stops being retrievable immediately.
    'draft', 'in_review', 'approved', 'published', 'withdrawn'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_access_scope as enum ('public', 'restricted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_source_type as enum (
    'website_page', 'service_page', 'country_page', 'package', 'faq',
    'requirement', 'legal_policy', 'provider_disclosure', 'procedure',
    'guide', 'government_reference', 'internal_article'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_message_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_completion_status as enum (
    'pending', 'streaming', 'complete', 'stopped', 'error', 'refused'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Knowledge sources
-- ---------------------------------------------------------------------------

create table public.ai_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  -- Stable identity across versions: a new version of the same document keeps
  -- the slug and increments content_version.
  slug text not null,
  title text not null,
  -- Bangladesh-first: 'bd' plus the six supported international markets, or
  -- 'global' for content that is not country-specific.
  country text not null default 'bd' check (
    country in ('bd', 'us', 'gb', 'ae', 'sg', 'sa', 'qa', 'global')
  ),
  service_category text,
  locale public.locale_code not null default 'en',
  source_type public.ai_source_type not null,
  source_url text,
  body text not null,
  content_version integer not null default 1 check (content_version > 0),
  effective_from date not null default current_date,
  -- Expiry is the hard boundary: an expired source is never retrieved, even
  -- while it is still marked published. Review is the soft warning.
  expires_on date,
  review_due_on date,
  last_reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  status public.ai_source_status not null default 'draft',
  access_scope public.ai_access_scope not null default 'public',
  -- Set when the current body has been embedded; cleared on every edit so the
  -- admin screen can show what still needs indexing.
  indexed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, content_version)
);

comment on table public.ai_knowledge_sources is
  'Approved content Ask bdoor AI may answer from. Only published, in-date, public rows reach anonymous retrieval.';

create index ai_knowledge_sources_live_idx
  on public.ai_knowledge_sources (status, access_scope, country, locale);
create index ai_knowledge_sources_review_idx
  on public.ai_knowledge_sources (review_due_on) where status = 'published';

create trigger ai_knowledge_sources_touch before update on public.ai_knowledge_sources
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Chunks
-- ---------------------------------------------------------------------------

create table public.ai_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ai_knowledge_sources (id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  token_estimate integer,
  -- google/gemini-embedding-001 at 768 dimensions, used for both documents and
  -- queries. Changing either the model or the dimension count requires a full
  -- re-index, which is why both are recorded on the row.
  embedding extensions.vector(768),
  embedding_model text not null default 'google/gemini-embedding-001',
  embedding_dimensions integer not null default 768 check (embedding_dimensions = 768),
  -- Generated, not maintained by the application, so it can never drift from
  -- `content`. 'simple' rather than 'english': the corpus is bilingual and the
  -- English stemmer mangles transliterated Bangla.
  search_vector tsvector generated always as (to_tsvector('simple', content)) stored,
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create index ai_knowledge_chunks_source_idx on public.ai_knowledge_chunks (source_id);
create index ai_knowledge_chunks_fts_idx on public.ai_knowledge_chunks using gin (search_vector);
-- HNSW over cosine distance. Built unconditionally: on an empty table it costs
-- nothing, and creating it later would lock a populated table.
create index ai_knowledge_chunks_embedding_idx
  on public.ai_knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Conversations and messages
-- ---------------------------------------------------------------------------

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  -- Exactly one of these identifies the owner. Anonymous sessions are a random
  -- client-held id; they are never joined to a customer record.
  user_id uuid references auth.users (id) on delete set null,
  anonymous_session_id text,
  country text not null default 'bd',
  locale public.locale_code not null default 'en',
  title text,
  -- Retention: a nightly job deletes rows past this instant. Null means the
  -- configured default has not been applied yet.
  delete_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_owner_present
    check (user_id is not null or anonymous_session_id is not null)
);

create index ai_conversations_user_idx on public.ai_conversations (user_id, created_at desc);
create index ai_conversations_anon_idx on public.ai_conversations (anonymous_session_id, created_at desc);
create index ai_conversations_retention_idx on public.ai_conversations (delete_after);

create trigger ai_conversations_touch before update on public.ai_conversations
  for each row execute function app.touch_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role public.ai_message_role not null,
  -- Redacted before it is written: see src/features/ai/redaction.ts. Anything
  -- that looks like an identity number, card, phone or email is replaced with a
  -- placeholder, so this column never becomes a store of customer identifiers.
  content text not null,
  -- Chunks the answer was grounded in, in the order they were cited.
  source_ids uuid[] not null default '{}',
  model text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(12, 6),
  latency_ms integer,
  status public.ai_completion_status not null default 'complete',
  error_code text,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Feedback, usage, gaps, audit
-- ---------------------------------------------------------------------------

create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ai_messages (id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  reason text,
  created_at timestamptz not null default now(),
  unique (message_id)
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null default current_date,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  model text not null,
  provider text,
  country text,
  locale public.locale_code,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  latency_ms integer,
  status public.ai_completion_status not null,
  error_code text,
  created_at timestamptz not null default now()
);

-- The spend guard reads this index every request, so it is the one index that
-- has to exist before the first answer is served.
create index ai_usage_day_idx on public.ai_usage (occurred_on);
create index ai_usage_model_idx on public.ai_usage (model, occurred_on);

create table public.ai_unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  question text not null,
  locale public.locale_code not null default 'en',
  country text,
  -- Why it could not be answered: nothing retrieved, everything expired, or
  -- the assistant declined as out of scope.
  reason text not null check (reason in ('no_match', 'expired_only', 'out_of_scope', 'low_confidence')),
  occurrences integer not null default 1,
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ai_unanswered_open_idx on public.ai_unanswered_questions (created_at desc)
  where resolved_at is null;

create table public.ai_knowledge_audit_log (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.ai_knowledge_sources (id) on delete set null,
  source_slug text,
  content_version integer,
  -- The verbs the application actually writes. `from_status`/`to_status`
  -- carry which step of the workflow a `status_changed` row represents, so
  -- this list stays short instead of duplicating the enum.
  action text not null check (
    action in ('created', 'updated', 'status_changed', 'indexed', 'reindexed', 'deleted')
  ),
  from_status public.ai_source_status,
  to_status public.ai_source_status,
  actor_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index ai_knowledge_audit_source_idx on public.ai_knowledge_audit_log (source_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Retrieval
-- ---------------------------------------------------------------------------

-- What "live" means, in one place. Every retrieval path and every policy uses
-- this definition, so published-but-expired content cannot leak through one
-- route while being correctly excluded on another.
create or replace function public.ai_source_is_live(v_source public.ai_knowledge_sources)
returns boolean
language sql
immutable
as $$
  select v_source.status = 'published'
     and v_source.effective_from <= current_date
     and (v_source.expires_on is null or v_source.expires_on >= current_date);
$$;

-- Hybrid retrieval: cosine similarity over the embedding and full-text rank
-- over the same chunk, combined with reciprocal rank fusion. RRF rather than a
-- weighted score sum because the two scores are not on comparable scales, and
-- a weighting that suits English queries does not suit Bangla ones.
--
-- SECURITY INVOKER on purpose: the caller's RLS decides which sources are
-- visible, so an anonymous request cannot retrieve restricted content even if
-- this function is called with different arguments.
create or replace function public.ai_search_knowledge(
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
  score double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with live as (
    select s.* from public.ai_knowledge_sources s
    -- `access_scope = 'public'` is repeated here rather than left to RLS. The
    -- public assistant reaches this function through the service role, which
    -- bypasses every policy, so a filter that lives only in a policy is not a
    -- filter at all on that path. Restricted knowledge is unreachable from
    -- this function by any caller; staff tooling reads the table directly.
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
           -- k = 60 is the conventional RRF constant; it damps the difference
           -- between the top few ranks so one strong keyword hit cannot
           -- dominate a semantically better set.
           coalesce(1.0 / (60 + semantic.rank), 0)
             + coalesce(1.0 / (60 + keyword.rank), 0) as score
    from semantic
    full outer join keyword on keyword.id = semantic.id
  )
  select c.id, s.id, c.content, s.title, s.source_url, s.country, s.locale,
         s.source_type, s.last_reviewed_at, s.effective_from, fused.score
  from fused
  join public.ai_knowledge_chunks c on c.id = fused.id
  join live s on s.id = c.source_id
  -- Same-language chunks first, but never exclude the other language: much of
  -- the government-reference material exists in English only.
  order by (s.locale = p_locale) desc, fused.score desc
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.ai_knowledge_sources enable row level security;
alter table public.ai_knowledge_chunks enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_feedback enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_unanswered_questions enable row level security;
alter table public.ai_knowledge_audit_log enable row level security;

-- Knowledge: the public may read published, in-date, public-scope rows. That
-- is the whole of the anonymous surface area.
create policy ai_sources_public_read on public.ai_knowledge_sources
  for select to anon, authenticated
  using (access_scope = 'public' and public.ai_source_is_live(ai_knowledge_sources));

create policy ai_sources_staff_read on public.ai_knowledge_sources
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_sources_staff_write on public.ai_knowledge_sources
  for all to authenticated
  using (app.has_platform_permission('content.publish'))
  with check (app.has_platform_permission('content.publish'));

create policy ai_chunks_public_read on public.ai_knowledge_chunks
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.ai_knowledge_sources s
      where s.id = ai_knowledge_chunks.source_id
        and s.access_scope = 'public'
        and public.ai_source_is_live(s)
    )
  );

create policy ai_chunks_staff_read on public.ai_knowledge_chunks
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_chunks_staff_write on public.ai_knowledge_chunks
  for all to authenticated
  using (app.has_platform_permission('content.publish'))
  with check (app.has_platform_permission('content.publish'));

-- Conversations: a signed-in user sees their own and no one else's. Anonymous
-- conversations are written by the service role and are not readable by anon
-- at all — the browser already holds the transcript it just received, so there
-- is nothing to gain from exposing them and a great deal to lose.
create policy ai_conversations_own_read on public.ai_conversations
  for select to authenticated
  using (user_id = auth.uid());

create policy ai_conversations_own_delete on public.ai_conversations
  for delete to authenticated
  using (user_id = auth.uid());

create policy ai_conversations_staff_read on public.ai_conversations
  for select to authenticated
  using (app.has_platform_permission('audit.read'));

create policy ai_messages_own_read on public.ai_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
    )
  );

create policy ai_messages_staff_read on public.ai_messages
  for select to authenticated
  using (app.has_platform_permission('audit.read'));

create policy ai_feedback_own_write on public.ai_feedback
  for insert to authenticated
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_feedback.conversation_id and c.user_id = auth.uid()
    )
  );

create policy ai_feedback_staff_read on public.ai_feedback
  for select to authenticated
  using (app.has_platform_permission('audit.read'));

-- Usage, gaps and the audit trail are staff-only in every direction. No anon
-- policy exists, so PostgREST returns nothing for them to an anonymous caller.
create policy ai_usage_staff_read on public.ai_usage
  for select to authenticated
  using (app.has_platform_permission('audit.read') or app.has_platform_permission('settings.manage'));

create policy ai_unanswered_staff_read on public.ai_unanswered_questions
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

create policy ai_unanswered_staff_write on public.ai_unanswered_questions
  for update to authenticated
  using (app.has_platform_permission('content.publish'))
  with check (app.has_platform_permission('content.publish'));

create policy ai_audit_staff_read on public.ai_knowledge_audit_log
  for select to authenticated
  using (app.has_platform_permission('content.publish') or app.has_platform_permission('audit.read'));

-- Writes from the assistant itself go through the service role, which bypasses
-- RLS. No anon or authenticated insert policy is granted on conversations,
-- messages or usage on purpose: a browser must not be able to forge a
-- transcript, a token count or a cost line.

grant execute on function public.ai_search_knowledge(extensions.vector, text, public.locale_code, text, integer)
  to anon, authenticated, service_role;
grant execute on function public.ai_source_is_live(public.ai_knowledge_sources)
  to anon, authenticated, service_role;
