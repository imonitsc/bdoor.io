-- =============================================================================
-- Cases: the unit of work. A case belongs to exactly one customer organization,
-- may be assigned to BDoor staff and to at most one active partner org.
-- =============================================================================

create table public.cases (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique,
  organization_id    uuid not null references public.organizations (id) on delete restrict,
  company_id         uuid references public.companies (id) on delete set null,
  session_id         uuid references public.questionnaire_sessions (id) on delete set null,
  title              text not null,
  status             public.case_status not null default 'draft',
  waiting_on         public.case_waiting_on not null default 'none',
  waiting_since      timestamptz,
  -- Working days of elapsed time already "spent". Frozen while waiting_on <>
  -- 'none' so the estimate never counts time we are blocked on someone else.
  elapsed_days_banked integer not null default 0,
  estimated_days_min integer,
  estimated_days_max integer,
  assigned_manager_id uuid references auth.users (id) on delete set null,
  risk_rating        public.risk_rating,
  opened_at          timestamptz not null default now(),
  closed_at          timestamptz,
  created_by         uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint cases_waiting_since check (waiting_on = 'none' or waiting_since is not null),
  constraint cases_elapsed_nonnegative check (elapsed_days_banked >= 0),
  constraint cases_estimate_order
    check (estimated_days_min is null or estimated_days_max is null
           or estimated_days_min <= estimated_days_max)
);

create index cases_org_idx on public.cases (organization_id, updated_at desc);
create index cases_status_idx on public.cases (status) where status not in ('closed', 'cancelled');
create index cases_manager_idx on public.cases (assigned_manager_id)
  where status not in ('closed', 'cancelled');

create trigger cases_touch before update on public.cases
  for each row execute function app.touch_updated_at();

-- Human-readable reference: BD-2026-000123
create sequence if not exists public.case_reference_seq;

create or replace function app.next_case_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'BD-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval('public.case_reference_seq')::text, 6, '0');
$$;

grant execute on function app.next_case_reference() to authenticated;

create table public.case_services (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases (id) on delete cascade,
  service_id  uuid not null references public.services (id) on delete restrict,
  -- Snapshot of the service name at the time it was added, so later catalog
  -- edits never rewrite what the customer agreed to.
  name_snapshot text not null,
  is_primary  boolean not null default false,
  added_at    timestamptz not null default now(),
  unique (case_id, service_id)
);

create index case_services_case_idx on public.case_services (case_id);
create unique index case_services_one_primary on public.case_services (case_id) where is_primary;

create table public.case_participants (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null,
  added_by    uuid references auth.users (id) on delete set null,
  added_at    timestamptz not null default now(),
  unique (case_id, user_id),
  constraint case_participants_role_values
    check (role in ('customer_contact', 'case_manager', 'compliance_officer', 'finance', 'observer'))
);

create index case_participants_user_idx on public.case_participants (user_id);

create table public.case_partner_assignments (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references public.cases (id) on delete cascade,
  partner_org_id    uuid not null references public.organizations (id) on delete restrict,
  status            public.assignment_status not null default 'offered',
  scope_note        text not null default '',
  -- The customer must authorise document sharing before a partner sees files.
  customer_authorized_at timestamptz,
  customer_authorized_by uuid references auth.users (id) on delete set null,
  conflict_check_confirmed boolean not null default false,
  offered_by        uuid references auth.users (id) on delete set null,
  offered_at        timestamptz not null default now(),
  responded_at      timestamptz,
  decline_reason    text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index case_partner_assignments_case_idx on public.case_partner_assignments (case_id);
create index case_partner_assignments_partner_idx on public.case_partner_assignments (partner_org_id, status);
create unique index case_partner_assignments_one_active
  on public.case_partner_assignments (case_id)
  where status in ('offered', 'accepted');

create trigger case_partner_assignments_touch before update on public.case_partner_assignments
  for each row execute function app.touch_updated_at();

-- Only partner organizations can be assigned.
create or replace function app.enforce_partner_org()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.organizations o
    where o.id = new.partner_org_id and o.kind = 'partner'
  ) then
    raise exception 'Organization % is not a partner organization', new.partner_org_id;
  end if;
  return new;
end;
$$;

create trigger case_partner_assignments_kind
  before insert or update on public.case_partner_assignments
  for each row execute function app.enforce_partner_org();

create table public.case_milestones (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases (id) on delete cascade,
  code          text not null,
  label_en      text not null,
  label_bn      text not null,
  description_en text,
  description_bn text,
  owner_kind    text not null default 'bdoor',
  status        public.milestone_status not null default 'pending',
  weight        integer not null default 1,
  sort_order    integer not null default 100,
  due_on        date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (case_id, code),
  constraint case_milestones_owner_values
    check (owner_kind in ('bdoor', 'customer', 'partner', 'authority')),
  constraint case_milestones_weight_positive check (weight > 0)
);

create index case_milestones_case_idx on public.case_milestones (case_id, sort_order);

create trigger case_milestones_touch before update on public.case_milestones
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- case_status_history — append-only. Public note is customer-visible; internal
-- note is not, and the RLS policy below enforces that separation.
-- ---------------------------------------------------------------------------
create table public.case_status_history (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references public.cases (id) on delete cascade,
  from_status     public.case_status,
  to_status       public.case_status not null,
  from_waiting_on public.case_waiting_on,
  to_waiting_on   public.case_waiting_on,
  reason          text not null,
  public_note     text,
  internal_note   text,
  actor_id        uuid references auth.users (id) on delete set null,
  actor_kind      text not null default 'staff',
  created_at      timestamptz not null default now(),
  constraint case_status_history_actor_values
    check (actor_kind in ('customer', 'staff', 'partner', 'system'))
);

create index case_status_history_case_idx on public.case_status_history (case_id, created_at desc);

create trigger case_status_history_append_only
  before update or delete on public.case_status_history
  for each row execute function app.reject_mutation();

-- A customer-safe projection: internal_note is simply not present.
create view public.case_status_history_public
with (security_invoker = true) as
  select id, case_id, from_status, to_status, from_waiting_on, to_waiting_on,
         public_note, actor_kind, created_at
  from public.case_status_history;

revoke all on public.case_status_history_public from public, anon;
grant select on public.case_status_history_public to authenticated;

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases (id) on delete cascade,
  title         text not null,
  description   text,
  visibility    public.task_visibility not null default 'internal',
  status        public.task_status not null default 'open',
  owner_kind    text not null default 'bdoor',
  assigned_user_id uuid references auth.users (id) on delete set null,
  assigned_org_id  uuid references public.organizations (id) on delete set null,
  due_on        date,
  completed_at  timestamptz,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint tasks_owner_values check (owner_kind in ('bdoor', 'customer', 'partner', 'authority'))
);

create index tasks_case_idx on public.tasks (case_id, status);
create index tasks_due_idx on public.tasks (due_on) where status in ('open', 'in_progress');
create index tasks_assignee_idx on public.tasks (assigned_user_id) where status in ('open', 'in_progress');
create index tasks_assigned_org_idx on public.tasks (assigned_org_id) where status in ('open', 'in_progress');

create trigger tasks_touch before update on public.tasks
  for each row execute function app.touch_updated_at();

create table public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  author_id   uuid references auth.users (id) on delete set null,
  body        text not null,
  is_internal boolean not null default true,
  created_at  timestamptz not null default now()
);

create index task_comments_task_idx on public.task_comments (task_id, created_at);

create table public.authority_submissions (
  id             uuid primary key default gen_random_uuid(),
  case_id        uuid not null references public.cases (id) on delete cascade,
  authority_name text not null,
  submission_type text not null,
  reference_no   text,
  submitted_on   date not null,
  submitted_by_org_id uuid references public.organizations (id) on delete set null,
  submitted_by_user_id uuid references auth.users (id) on delete set null,
  outcome        text,
  outcome_on     date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint authority_submissions_outcome_values
    check (outcome is null or outcome in ('pending', 'approved', 'rejected', 'query_raised', 'withdrawn'))
);

create index authority_submissions_case_idx on public.authority_submissions (case_id, submitted_on desc);

create trigger authority_submissions_touch before update on public.authority_submissions
  for each row execute function app.touch_updated_at();

create table public.authority_queries (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.authority_submissions (id) on delete cascade,
  case_id        uuid not null references public.cases (id) on delete cascade,
  raised_on      date not null,
  respond_by     date,
  question       text not null,
  response       text,
  responded_on   date,
  responded_by   uuid references auth.users (id) on delete set null,
  status         text not null default 'open',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint authority_queries_status_values check (status in ('open', 'answered', 'closed'))
);

create index authority_queries_case_idx on public.authority_queries (case_id, status);
create index authority_queries_due_idx on public.authority_queries (respond_by) where status = 'open';

create trigger authority_queries_touch before update on public.authority_queries
  for each row execute function app.touch_updated_at();

-- =============================================================================
-- Case access predicates.
-- =============================================================================

/** The caller's own customer organizations own the case. */
create or replace function app.can_read_case(v_case uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cases c
    where c.id = v_case
      and (
        -- customer side
        exists (select 1 from public.organization_memberships m
                where m.organization_id = c.organization_id and m.user_id = auth.uid())
        -- BDoor staff
        or exists (select 1 from public.platform_roles pr
                   where pr.user_id = auth.uid()
                     and (pr.expires_at is null or pr.expires_at > now()))
        -- assigned partner staff
        or exists (select 1
                   from public.case_partner_assignments a
                   join public.organization_memberships m
                     on m.organization_id = a.partner_org_id
                   where a.case_id = c.id
                     and a.status in ('offered', 'accepted')
                     and m.user_id = auth.uid())
      )
  );
$$;

/** Customer-side membership only. */
create or replace function app.is_case_customer(v_case uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cases c
    join public.organization_memberships m on m.organization_id = c.organization_id
    where c.id = v_case and m.user_id = auth.uid()
  );
$$;

/** Staff of a partner organization currently assigned to this case. */
create or replace function app.is_case_partner(v_case uuid, v_require_accepted boolean default true)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.case_partner_assignments a
    join public.organization_memberships m on m.organization_id = a.partner_org_id
    where a.case_id = v_case
      and m.user_id = auth.uid()
      and (case when v_require_accepted then a.status = 'accepted'
                else a.status in ('offered', 'accepted') end)
  );
$$;

/** A partner may only see customer documents once the customer has authorised it. */
create or replace function app.partner_may_see_case_documents(v_case uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.case_partner_assignments a
    join public.organization_memberships m on m.organization_id = a.partner_org_id
    where a.case_id = v_case
      and m.user_id = auth.uid()
      and a.status = 'accepted'
      and a.customer_authorized_at is not null
  );
$$;

revoke all on function app.can_read_case(uuid) from public, anon;
revoke all on function app.is_case_customer(uuid) from public, anon;
revoke all on function app.is_case_partner(uuid, boolean) from public, anon;
revoke all on function app.partner_may_see_case_documents(uuid) from public, anon;
grant execute on function app.can_read_case(uuid) to authenticated;
grant execute on function app.is_case_customer(uuid) to authenticated;
grant execute on function app.is_case_partner(uuid, boolean) to authenticated;
grant execute on function app.partner_may_see_case_documents(uuid) to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.cases enable row level security;
alter table public.case_services enable row level security;
alter table public.case_participants enable row level security;
alter table public.case_partner_assignments enable row level security;
alter table public.case_milestones enable row level security;
alter table public.case_status_history enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.authority_submissions enable row level security;
alter table public.authority_queries enable row level security;

create policy cases_read on public.cases
  for select to authenticated using (app.can_read_case(id));

create policy cases_customer_insert on public.cases
  for insert to authenticated
  with check (
    app.is_org_member(organization_id, array['customer_owner', 'customer_member']::public.organization_role[])
    and status = 'draft'
    and created_by = auth.uid()
  );

-- Customers may only edit their own draft cases. Everything after that is a
-- validated server-side transition performed by staff.
create policy cases_customer_update_draft on public.cases
  for update to authenticated
  using (status = 'draft' and app.is_case_customer(id))
  with check (status = 'draft' and app.is_case_customer(id));

create policy cases_staff_write on public.cases
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy case_services_read on public.case_services
  for select to authenticated using (app.can_read_case(case_id));
create policy case_services_staff on public.case_services
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy case_participants_read on public.case_participants
  for select to authenticated using (app.can_read_case(case_id));
create policy case_participants_staff on public.case_participants
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy case_partner_assignments_read on public.case_partner_assignments
  for select to authenticated using (app.can_read_case(case_id));

-- A partner may accept or decline their own offer, and nothing else.
create policy case_partner_assignments_partner_respond on public.case_partner_assignments
  for update to authenticated
  using (
    status = 'offered'
    and app.is_org_member(partner_org_id, array['partner_owner', 'partner_staff']::public.organization_role[])
  )
  with check (
    status in ('accepted', 'declined')
    and app.is_org_member(partner_org_id, array['partner_owner', 'partner_staff']::public.organization_role[])
  );

-- The customer grants document-sharing authorisation on their own case.
create policy case_partner_assignments_customer_authorize on public.case_partner_assignments
  for update to authenticated
  using (app.is_case_customer(case_id))
  with check (app.is_case_customer(case_id));

create policy case_partner_assignments_staff on public.case_partner_assignments
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy case_milestones_read on public.case_milestones
  for select to authenticated using (app.can_read_case(case_id));
create policy case_milestones_partner_update on public.case_milestones
  for update to authenticated
  using (owner_kind = 'partner' and app.is_case_partner(case_id))
  with check (owner_kind = 'partner' and app.is_case_partner(case_id));
create policy case_milestones_staff on public.case_milestones
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

-- Customers and partners read the *public* projection of history. Only staff
-- may read the base table, which carries internal notes.
create policy case_status_history_staff_read on public.case_status_history
  for select to authenticated using (app.is_platform_staff() and app.can_read_case(case_id));
create policy case_status_history_insert on public.case_status_history
  for insert to authenticated
  with check (app.is_platform_staff() and app.can_read_case(case_id));

create policy tasks_customer_read on public.tasks
  for select to authenticated
  using (visibility = 'customer' and app.is_case_customer(case_id));
create policy tasks_partner_read on public.tasks
  for select to authenticated
  using (visibility in ('partner', 'customer') and app.is_case_partner(case_id));
create policy tasks_partner_update on public.tasks
  for update to authenticated
  using (visibility = 'partner' and app.is_case_partner(case_id))
  with check (visibility = 'partner' and app.is_case_partner(case_id));
create policy tasks_staff on public.tasks
  for all to authenticated
  using (app.is_platform_staff() and app.can_read_case(case_id))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy task_comments_read on public.task_comments
  for select to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and (
          (not task_comments.is_internal and t.visibility = 'customer' and app.is_case_customer(t.case_id))
          or (t.visibility = 'partner' and app.is_case_partner(t.case_id))
          or app.is_platform_staff()
        )
    )
  );
create policy task_comments_insert on public.task_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.tasks t where t.id = task_comments.task_id and app.can_read_case(t.case_id))
  );

create policy authority_submissions_read on public.authority_submissions
  for select to authenticated using (app.can_read_case(case_id));
create policy authority_submissions_partner_write on public.authority_submissions
  for insert to authenticated with check (app.is_case_partner(case_id));
create policy authority_submissions_staff on public.authority_submissions
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy authority_queries_read on public.authority_queries
  for select to authenticated using (app.can_read_case(case_id));
create policy authority_queries_staff on public.authority_queries
  for all to authenticated
  using (app.is_platform_staff() and app.can_read_case(case_id))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));
