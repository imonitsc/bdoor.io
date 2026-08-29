-- Applications (immediate-operations instructions §4/§11).
--
-- One row per submitted managed application, for every one of the seven
-- countries. The row is written exclusively by the server with the service
-- role after the shared Zod validation has passed — there is no insert or
-- update policy for anon or authenticated at all, so the Data API cannot
-- write here whatever a client sends. Platform staff read the queue through
-- the select policy below.
--
-- The reference is random, not sequential: a guessable sequence would leak
-- application volume and let one applicant probe for another's reference.

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  country text not null check (
    country in ('bangladesh', 'usa', 'uk', 'uae', 'saudi-arabia', 'qatar', 'singapore')
  ),
  objective text not null check (objective in ('new', 'existing', 'expand', 'unsure')),
  locale public.locale_code not null default 'en',
  full_name text not null,
  email text not null,
  phone text,
  -- The catalogue package the applicant arrived from (?package=), validated
  -- against the commercial catalog server-side; null when they came direct.
  package_slug text,
  source_path text,
  -- The questionnaire answers as submitted. Free-text answers only — the
  -- question set collects no identity document, ever.
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (
    status in ('new', 'in_review', 'quoted', 'engaged', 'closed')
  ),
  consent_given boolean not null default false,
  session_id uuid references public.questionnaire_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_status_created_idx on public.applications (status, created_at desc);

create index applications_country_created_idx on public.applications (country, created_at desc);

alter table public.applications enable row level security;

create policy applications_staff_read on public.applications
  for select to authenticated using (app.is_platform_staff());

create trigger applications_touch_updated_at
  before update on public.applications
  for each row execute function app.touch_updated_at();

comment on table public.applications is
  'Managed applications from /start: coordinated by bdoor, reviewed by a '
  'specialist, provider appointed per case. Service-role writes only.';
comment on column public.applications.reference is
  'Customer-facing reference (BD-<year>-<6 random digits>); random so volume '
  'cannot be inferred and references cannot be guessed.';
