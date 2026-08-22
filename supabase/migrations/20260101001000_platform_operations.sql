-- =============================================================================
-- Partners, integrations, audit log, feature flags and platform settings.
-- =============================================================================

create table public.partners (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null unique references public.organizations (id) on delete cascade,
  legal_name          text not null,
  practice_type       text not null,
  bar_council_ref     text,
  registration_no     text,
  geographic_coverage text[] not null default '{}',
  website             text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  verification_status public.partner_verification_status not null default 'unverified',
  conflict_policy_accepted_at timestamptz,
  dpa_accepted_at     timestamptz,
  insurance_expires_on date,
  -- Restricted to finance. Not selectable by the partner's own staff.
  payment_details     jsonb,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint partners_practice_type_values
    check (practice_type in ('law_firm', 'advocate', 'chartered_accountant', 'consultancy', 'other'))
);

create index partners_status_idx on public.partners (verification_status);

create trigger partners_touch before update on public.partners
  for each row execute function app.touch_updated_at();

create table public.partner_capabilities (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid not null references public.partners (id) on delete cascade,
  service_id   uuid references public.services (id) on delete cascade,
  category_id  uuid references public.service_categories (id) on delete cascade,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint partner_capabilities_target check (num_nonnulls(service_id, category_id) = 1)
);

create index partner_capabilities_partner_idx on public.partner_capabilities (partner_id) where is_active;
create index partner_capabilities_service_idx on public.partner_capabilities (service_id) where is_active;

create table public.partner_verifications (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.partners (id) on delete cascade,
  status        public.partner_verification_status not null,
  evidence_document_id uuid references public.documents (id) on delete set null,
  note          text,
  -- A partner may never approve their own organization: enforced in the policy
  -- below and by this column being restricted to admin writers.
  decided_by    uuid not null references auth.users (id) on delete restrict,
  decided_at    timestamptz not null default now()
);

create index partner_verifications_partner_idx on public.partner_verifications (partner_id, decided_at desc);

create trigger partner_verifications_append_only
  before update or delete on public.partner_verifications
  for each row execute function app.reject_mutation();

-- ---------------------------------------------------------------------------
-- Integration + webhook plumbing
-- ---------------------------------------------------------------------------
create table public.integration_events (
  id            uuid primary key default gen_random_uuid(),
  integration   text not null,
  event_type    text not null,
  status        text not null default 'pending',
  attempts      integer not null default 0,
  next_attempt_at timestamptz,
  correlation_id text,
  -- Redacted payloads only. The notification/email adapters strip PII before
  -- anything is written here.
  payload       jsonb not null default '{}'::jsonb,
  last_error    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint integration_events_status_values
    check (status in ('pending', 'sent', 'failed', 'dead_letter', 'skipped'))
);

create index integration_events_pending_idx on public.integration_events (next_attempt_at)
  where status = 'pending';
create index integration_events_failed_idx on public.integration_events (created_at desc)
  where status in ('failed', 'dead_letter');

create trigger integration_events_touch before update on public.integration_events
  for each row execute function app.touch_updated_at();

create table public.webhook_events (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  event_id      text not null,
  event_type    text not null,
  signature_verified boolean not null default false,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  status        text not null default 'received',
  error         text,
  payload_hash  text,
  unique (source, event_id),
  constraint webhook_events_status_values
    check (status in ('received', 'processed', 'rejected', 'duplicate', 'failed'))
);

create index webhook_events_unprocessed_idx on public.webhook_events (received_at)
  where processed_at is null;

-- ---------------------------------------------------------------------------
-- audit_logs — append-only, insert-only, never edited or deleted.
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id              bigint generated always as identity primary key,
  actor_id        uuid references auth.users (id) on delete set null,
  actor_role      text,
  action          text not null,
  target_type     text not null,
  target_id       text,
  organization_id uuid references public.organizations (id) on delete set null,
  case_id         uuid references public.cases (id) on delete set null,
  correlation_id  text,
  -- Safe metadata only. The audit service refuses to write keys that look like
  -- secrets or identity numbers; see src/lib/audit/redact.ts.
  metadata        jsonb not null default '{}'::jsonb,
  origin          text,
  created_at      timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_target_idx on public.audit_logs (target_type, target_id, created_at desc);
create index audit_logs_case_idx on public.audit_logs (case_id, created_at desc);
create index audit_logs_org_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);

create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function app.reject_mutation();

create table public.feature_flags (
  key           text primary key,
  description   text not null,
  is_enabled    boolean not null default false,
  rollout_note  text,
  updated_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now()
);

create table public.platform_settings (
  key           text primary key,
  value         jsonb not null,
  description   text not null,
  is_public     boolean not null default false,
  updated_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Data subject requests: export / correction / deletion, with a legal hold
-- that can outrank a deletion request.
-- ---------------------------------------------------------------------------
create table public.data_subject_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  request_type    text not null,
  status          text not null default 'received',
  detail          text,
  legal_hold_reason text,
  handled_by      uuid references auth.users (id) on delete set null,
  responded_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint data_subject_requests_type_values
    check (request_type in ('export', 'correction', 'deletion', 'restriction')),
  constraint data_subject_requests_status_values
    check (status in ('received', 'in_progress', 'completed', 'partially_completed', 'refused', 'on_legal_hold'))
);

create index data_subject_requests_open_idx on public.data_subject_requests (created_at)
  where status in ('received', 'in_progress');

create trigger data_subject_requests_touch before update on public.data_subject_requests
  for each row execute function app.touch_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.partners enable row level security;
alter table public.partner_capabilities enable row level security;
alter table public.partner_verifications enable row level security;
alter table public.integration_events enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.platform_settings enable row level security;
alter table public.data_subject_requests enable row level security;

-- A partner sees its own record; verified partners are listed publicly by name
-- only, through the view below.
create policy partners_own_read on public.partners
  for select to authenticated
  using (organization_id in (select app.my_partner_organization_ids()));
create policy partners_own_update on public.partners
  for update to authenticated
  using (app.is_org_member(organization_id, array['partner_owner']::public.organization_role[]))
  -- Note: a partner cannot change its own verification status. The BEFORE
  -- trigger below rejects that, and only admins hold the write policy for it.
  with check (app.is_org_member(organization_id, array['partner_owner']::public.organization_role[]));
create policy partners_staff_read on public.partners
  for select to authenticated using (app.is_platform_staff());
create policy partners_admin on public.partners
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

/**
 * Guards the two fields a partner must not be able to set for itself.
 *
 * The checks apply to Data API callers only: when `auth.uid()` is null there is
 * no end user, which means the service role or a migration is writing. Those
 * paths are trusted by definition and are constrained in application code
 * instead — blocking them here would make the column unwritable by any backfill
 * or admin tool, which is not the intent.
 */
create or replace function app.partners_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status
     and not app.is_admin() then
    raise exception 'Only a BDoor administrator may change partner verification status';
  end if;

  if new.payment_details is distinct from old.payment_details
     and not app.is_finance() and not app.is_org_member(
       old.organization_id, array['partner_owner']::public.organization_role[]) then
    raise exception 'Not permitted to change partner payment details';
  end if;

  return new;
end;
$$;

create trigger partners_verification_guard
  before update on public.partners
  for each row execute function app.partners_guard();

-- Public directory: name and coverage only. No contact details, no payment
-- details, no notes. security_invoker keeps the caller's RLS in force.
create view public.verified_partners_public
with (security_invoker = true) as
  select p.id, o.name, p.practice_type, p.geographic_coverage
  from public.partners p
  join public.organizations o on o.id = p.organization_id
  where p.verification_status = 'verified' and o.is_active;

revoke all on public.verified_partners_public from public;
grant select on public.verified_partners_public to anon, authenticated;

create policy partner_capabilities_read on public.partner_capabilities
  for select to authenticated
  using (
    app.is_platform_staff()
    or exists (select 1 from public.partners p
               where p.id = partner_capabilities.partner_id
                 and p.organization_id in (select app.my_partner_organization_ids()))
  );
create policy partner_capabilities_admin on public.partner_capabilities
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy partner_verifications_read on public.partner_verifications
  for select to authenticated
  using (
    app.is_platform_staff()
    or exists (select 1 from public.partners p
               where p.id = partner_verifications.partner_id
                 and p.organization_id in (select app.my_partner_organization_ids()))
  );
-- Admins only, and never for an organization the actor belongs to.
create policy partner_verifications_admin_insert on public.partner_verifications
  for insert to authenticated
  with check (
    app.is_admin()
    and decided_by = auth.uid()
    and not exists (
      select 1 from public.partners p
      where p.id = partner_verifications.partner_id
        and app.is_org_member(p.organization_id)
    )
  );

create policy integration_events_admin on public.integration_events
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy webhook_events_admin on public.webhook_events
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- Audit: readable by admins (all) and by users for their own actions. No
-- UPDATE or DELETE policy exists at all, and the trigger blocks it anyway.
create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated using (app.is_admin());
create policy audit_logs_self_read on public.audit_logs
  for select to authenticated using (actor_id = auth.uid());
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated with check (actor_id = auth.uid() or app.is_platform_staff());

create policy feature_flags_read on public.feature_flags
  for select to anon, authenticated using (true);
create policy feature_flags_admin on public.feature_flags
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy platform_settings_public_read on public.platform_settings
  for select to anon, authenticated using (is_public);
create policy platform_settings_staff_read on public.platform_settings
  for select to authenticated using (app.is_platform_staff());
create policy platform_settings_admin on public.platform_settings
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy data_subject_requests_self on public.data_subject_requests
  for select to authenticated using (user_id = auth.uid());
create policy data_subject_requests_self_insert on public.data_subject_requests
  for insert to authenticated with check (user_id = auth.uid() and status = 'received');
create policy data_subject_requests_admin on public.data_subject_requests
  for all to authenticated using (app.is_admin()) with check (app.is_admin());
