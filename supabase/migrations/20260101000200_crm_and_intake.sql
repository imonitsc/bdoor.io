-- =============================================================================
-- CRM and intake: the guided questionnaire, deterministic recommendations,
-- leads and contact requests.
-- =============================================================================

create table public.questionnaire_sessions (
  id               uuid primary key default gen_random_uuid(),
  -- Anonymous drafts have no user yet. `anon_key` is a high-entropy value the
  -- browser holds; it is never guessable and is dropped the moment the session
  -- is claimed by a signed-in user.
  user_id          uuid references auth.users (id) on delete set null,
  organization_id  uuid references public.organizations (id) on delete set null,
  anon_key_hash    text,
  locale           public.locale_code not null default 'en',
  current_step     text not null default 'founder_location',
  completed_at     timestamptz,
  claimed_at       timestamptz,
  expires_at       timestamptz not null default (now() + interval '30 days'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint questionnaire_sessions_owner
    check (user_id is not null or anon_key_hash is not null)
);

create index questionnaire_sessions_user_idx on public.questionnaire_sessions (user_id, updated_at desc);
create unique index questionnaire_sessions_anon_idx on public.questionnaire_sessions (anon_key_hash)
  where anon_key_hash is not null;
create index questionnaire_sessions_expiry_idx on public.questionnaire_sessions (expires_at)
  where completed_at is null;

create trigger questionnaire_sessions_touch before update on public.questionnaire_sessions
  for each row execute function app.touch_updated_at();

create table public.questionnaire_answers (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.questionnaire_sessions (id) on delete cascade,
  question_key text not null,
  value      jsonb not null,
  answered_at timestamptz not null default now(),
  unique (session_id, question_key)
);

create index questionnaire_answers_session_idx on public.questionnaire_answers (session_id);

-- ---------------------------------------------------------------------------
-- recommendation_rules — admin-editable, deterministic. The engine never needs
-- an LLM: it evaluates these rules against the answers.
-- ---------------------------------------------------------------------------
create table public.recommendation_rules (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  description text not null,
  -- A small JSON predicate DSL evaluated in TypeScript (see
  -- src/features/intake/rules.ts). Kept in the database so operations can tune
  -- branching without a deploy.
  conditions  jsonb not null,
  outcome     jsonb not null,
  priority    integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index recommendation_rules_active_idx on public.recommendation_rules (priority) where is_active;

create trigger recommendation_rules_touch before update on public.recommendation_rules
  for each row execute function app.touch_updated_at();

create table public.recommendation_results (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.questionnaire_sessions (id) on delete cascade,
  suggested_structure text,
  service_slugs      text[] not null default '{}',
  assumptions        text[] not null default '{}',
  partner_questions  text[] not null default '{}',
  requires_manual_review boolean not null default false,
  manual_review_reasons text[] not null default '{}',
  rule_keys_matched  text[] not null default '{}',
  engine_version     text not null default 'rules-1',
  created_at         timestamptz not null default now()
);

create index recommendation_results_session_idx on public.recommendation_results (session_id, created_at desc);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references public.questionnaire_sessions (id) on delete set null,
  user_id         uuid references auth.users (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  full_name       text,
  email           text,
  phone           text,
  country         char(2),
  intent          text,
  source          text not null default 'questionnaire',
  status          text not null default 'new',
  assigned_to     uuid references auth.users (id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint leads_status_values
    check (status in ('new', 'contacted', 'qualified', 'converted', 'closed', 'spam'))
);

create index leads_status_idx on public.leads (status, created_at desc);
create index leads_assigned_idx on public.leads (assigned_to) where status <> 'closed';

create trigger leads_touch before update on public.leads
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- contact_requests
-- ---------------------------------------------------------------------------
create table public.contact_requests (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text not null,
  phone        text,
  topic        text not null,
  message      text not null,
  locale       public.locale_code not null default 'en',
  consent_given boolean not null default false,
  handled_by   uuid references auth.users (id) on delete set null,
  handled_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint contact_requests_message_len check (char_length(message) between 10 and 5000),
  constraint contact_requests_consent check (consent_given)
);

create index contact_requests_open_idx on public.contact_requests (created_at desc) where handled_at is null;

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.questionnaire_sessions enable row level security;
alter table public.questionnaire_answers enable row level security;
alter table public.recommendation_rules enable row level security;
alter table public.recommendation_results enable row level security;
alter table public.leads enable row level security;
alter table public.contact_requests enable row level security;

-- Questionnaire sessions belong to the signed-in user who owns them. Anonymous
-- drafts are NOT reachable through the Data API at all — they are read and
-- written by server actions using the service role after verifying the browser
-- cookie, so a leaked anon key alone cannot be replayed against PostgREST.
create policy questionnaire_sessions_owner on public.questionnaire_sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy questionnaire_sessions_staff_read on public.questionnaire_sessions
  for select to authenticated
  using (app.is_platform_staff());

create policy questionnaire_answers_owner on public.questionnaire_answers
  for all to authenticated
  using (
    exists (
      select 1 from public.questionnaire_sessions s
      where s.id = questionnaire_answers.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.questionnaire_sessions s
      where s.id = questionnaire_answers.session_id and s.user_id = auth.uid()
    )
  );

create policy questionnaire_answers_staff_read on public.questionnaire_answers
  for select to authenticated
  using (app.is_platform_staff());

-- Recommendation rules are configuration: readable by staff, writable by admin.
create policy recommendation_rules_staff_read on public.recommendation_rules
  for select to authenticated
  using (app.is_platform_staff());

create policy recommendation_rules_admin_write on public.recommendation_rules
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

create policy recommendation_results_owner on public.recommendation_results
  for select to authenticated
  using (
    exists (
      select 1 from public.questionnaire_sessions s
      where s.id = recommendation_results.session_id and s.user_id = auth.uid()
    )
  );

create policy recommendation_results_staff on public.recommendation_results
  for select to authenticated
  using (app.is_platform_staff());

-- Leads are an internal CRM object. Customers never read them.
create policy leads_staff_read on public.leads
  for select to authenticated
  using (app.is_platform_staff());

create policy leads_staff_write on public.leads
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

-- Contact requests are written by an unauthenticated server action using the
-- service role (behind rate limiting), never by the browser directly.
create policy contact_requests_staff_read on public.contact_requests
  for select to authenticated
  using (app.is_platform_staff());

create policy contact_requests_staff_update on public.contact_requests
  for update to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));
