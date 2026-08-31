-- Ask bdoor AI performance: split hybrid retrieval into two functions.
--
-- The hybrid function (ai_search_knowledge) needs the query embedding before
-- it can run, so keyword search — which needs only the text — used to wait
-- ~300ms for the embedding call it never uses. These two functions carry the
-- SAME filters and the SAME candidate ranking as their halves of the hybrid
-- function; the application starts the keyword search immediately, runs the
-- embedding + semantic search in parallel, and fuses the two ranked lists
-- with the identical RRF constant (60) and authority bonus in TypeScript.
-- tests/integration/ask-search-split.test.ts pins parity with the hybrid
-- function, which remains in place unchanged.
--
-- Both are SECURITY INVOKER and repeat the published/effective/public-scope
-- filters inside their bodies, exactly like the hybrid function, because the
-- assistant reaches them through the service role where RLS is not a filter.

create or replace function public.ai_search_keyword(
  query_text text,
  p_country text default 'bd',
  candidate_count integer default 40
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
  authority_tier smallint,
  issuing_institution text,
  reference_number text,
  section_ref text,
  page_start integer,
  rank integer
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with live as (
    select s.* from public.ai_knowledge_sources s
    where s.access_scope = 'public'
      and public.ai_source_is_live(s)
      and (s.country = p_country or s.country = 'global')
  )
  select c.id, s.id, c.content, s.title, s.source_url, s.country, s.locale,
         s.source_type, s.last_reviewed_at, s.effective_from,
         s.authority_tier, s.issuing_institution, s.reference_number,
         c.section_ref, c.page_start,
         row_number() over (
           order by ts_rank(c.search_vector, websearch_to_tsquery('simple', query_text)) desc
         )::integer as rank
  from public.ai_knowledge_chunks c
  join live s on s.id = c.source_id
  where query_text <> ''
    and c.search_vector @@ websearch_to_tsquery('simple', query_text)
  order by ts_rank(c.search_vector, websearch_to_tsquery('simple', query_text)) desc
  limit candidate_count;
$$;

create or replace function public.ai_search_semantic(
  query_embedding extensions.vector(768),
  p_country text default 'bd',
  candidate_count integer default 40
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
  authority_tier smallint,
  issuing_institution text,
  reference_number text,
  section_ref text,
  page_start integer,
  rank integer
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with live as (
    select s.* from public.ai_knowledge_sources s
    where s.access_scope = 'public'
      and public.ai_source_is_live(s)
      and (s.country = p_country or s.country = 'global')
  )
  select c.id, s.id, c.content, s.title, s.source_url, s.country, s.locale,
         s.source_type, s.last_reviewed_at, s.effective_from,
         s.authority_tier, s.issuing_institution, s.reference_number,
         c.section_ref, c.page_start,
         row_number() over (order by c.embedding <=> query_embedding)::integer as rank
  from public.ai_knowledge_chunks c
  join live s on s.id = c.source_id
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit candidate_count;
$$;

grant execute on function public.ai_search_keyword(text, text, integer)
  to anon, authenticated, service_role;
grant execute on function public.ai_search_semantic(extensions.vector, text, integer)
  to anon, authenticated, service_role;
