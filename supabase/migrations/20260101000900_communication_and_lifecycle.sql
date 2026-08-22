-- =============================================================================
-- Messaging, notifications, compliance obligations and renewals.
--
-- Messaging is deliberately case-scoped. There is no general chat: a thread
-- always belongs to a case, participants are derived from case access, and
-- internal messages are a separate visibility rather than a separate table so
-- the ordering of a conversation is preserved for auditors.
-- =============================================================================

create table public.message_threads (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases (id) on delete cascade,
  subject      text not null,
  -- 'customer' threads include the customer; 'internal' ones never do;
  -- 'partner' ones include BDoor and the assigned partner only.
  audience     text not null default 'customer',
  is_closed    boolean not null default false,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint message_threads_audience_values check (audience in ('customer', 'internal', 'partner'))
);

create index message_threads_case_idx on public.message_threads (case_id, updated_at desc);

create trigger message_threads_touch before update on public.message_threads
  for each row execute function app.touch_updated_at();

create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null references public.message_threads (id) on delete cascade,
  author_id    uuid references auth.users (id) on delete set null,
  author_kind  text not null default 'customer',
  body         text not null,
  is_internal_note boolean not null default false,
  document_id  uuid references public.documents (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint messages_author_kind_values check (author_kind in ('customer', 'staff', 'partner', 'system')),
  constraint messages_body_len check (char_length(body) between 1 and 20000)
);

create index messages_thread_idx on public.messages (thread_id, created_at);

-- Messages are part of the audit trail: edit and delete are not offered.
create trigger messages_append_only
  before update or delete on public.messages
  for each row execute function app.reject_mutation();

create table public.message_reads (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  read_at    timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index message_reads_user_idx on public.message_reads (user_id, read_at desc);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  case_id      uuid references public.cases (id) on delete cascade,
  kind         text not null,
  title_en     text not null,
  title_bn     text not null,
  body_en      text,
  body_bn      text,
  href         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, created_at desc)
  where read_at is null;
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id       uuid not null references auth.users (id) on delete cascade,
  kind          text not null,
  channel       public.notification_channel not null,
  enabled       boolean not null default true,
  updated_at    timestamptz not null default now(),
  primary key (user_id, kind, channel)
);

-- ---------------------------------------------------------------------------
-- Compliance obligations. These are never auto-created from a guess: a
-- verified rule (or an admin) creates them, and `source` records which.
-- ---------------------------------------------------------------------------
create table public.compliance_obligations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete cascade,
  case_id          uuid references public.cases (id) on delete set null,
  obligation_type  text not null,
  label_en         text not null,
  label_bn         text not null,
  authority_name   text,
  responsible_kind text not null default 'customer',
  owner_user_id    uuid references auth.users (id) on delete set null,
  due_on           date not null,
  status           public.obligation_status not null default 'upcoming',
  source           text not null default 'admin',
  source_rule_ref  text,
  required_documents text[] not null default '{}',
  renewal_case_id  uuid references public.cases (id) on delete set null,
  evidence_document_id uuid references public.documents (id) on delete set null,
  completed_at     timestamptz,
  completed_by     uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint compliance_obligations_responsible_values
    check (responsible_kind in ('customer', 'bdoor', 'partner')),
  constraint compliance_obligations_source_values
    check (source in ('admin', 'verified_rule', 'imported'))
);

create index compliance_obligations_org_due_idx on public.compliance_obligations (organization_id, due_on)
  where status in ('upcoming', 'due', 'overdue', 'in_progress');
create index compliance_obligations_due_idx on public.compliance_obligations (due_on)
  where status in ('upcoming', 'due');

create trigger compliance_obligations_touch before update on public.compliance_obligations
  for each row execute function app.touch_updated_at();

create table public.compliance_reminders (
  id             uuid primary key default gen_random_uuid(),
  obligation_id  uuid not null references public.compliance_obligations (id) on delete cascade,
  offset_days    integer not null,
  channel        public.notification_channel not null default 'in_app',
  scheduled_for  date not null,
  sent_at        timestamptz,
  failed_at      timestamptz,
  failure_reason text,
  created_at     timestamptz not null default now(),
  unique (obligation_id, offset_days, channel)
);

create index compliance_reminders_due_idx on public.compliance_reminders (scheduled_for)
  where sent_at is null and failed_at is null;

create table public.renewal_cases (
  id                uuid primary key default gen_random_uuid(),
  obligation_id     uuid not null references public.compliance_obligations (id) on delete cascade,
  case_id           uuid not null references public.cases (id) on delete cascade,
  previous_case_id  uuid references public.cases (id) on delete set null,
  period_label      text not null,
  created_at        timestamptz not null default now(),
  unique (obligation_id, period_label)
);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.compliance_obligations enable row level security;
alter table public.compliance_reminders enable row level security;
alter table public.renewal_cases enable row level security;

create policy message_threads_customer on public.message_threads
  for select to authenticated
  using (audience = 'customer' and app.is_case_customer(case_id));
create policy message_threads_partner on public.message_threads
  for select to authenticated
  using (audience in ('partner', 'customer') and app.is_case_partner(case_id));
create policy message_threads_staff on public.message_threads
  for all to authenticated
  using (app.is_platform_staff() and app.can_read_case(case_id))
  with check (app.is_platform_staff() and app.can_read_case(case_id));
create policy message_threads_customer_create on public.message_threads
  for insert to authenticated
  with check (audience = 'customer' and created_by = auth.uid() and app.is_case_customer(case_id));

create policy messages_customer_read on public.messages
  for select to authenticated
  using (
    not is_internal_note
    and exists (select 1 from public.message_threads t
                where t.id = messages.thread_id
                  and t.audience = 'customer'
                  and app.is_case_customer(t.case_id))
  );

create policy messages_partner_read on public.messages
  for select to authenticated
  using (
    not is_internal_note
    and exists (select 1 from public.message_threads t
                where t.id = messages.thread_id
                  and t.audience in ('partner', 'customer')
                  and app.is_case_partner(t.case_id))
  );

create policy messages_staff_read on public.messages
  for select to authenticated
  using (
    exists (select 1 from public.message_threads t
            where t.id = messages.thread_id and app.is_platform_staff() and app.can_read_case(t.case_id))
  );

create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.message_threads t
      where t.id = messages.thread_id
        and t.is_closed = false
        and (
          (t.audience = 'customer' and app.is_case_customer(t.case_id) and not messages.is_internal_note)
          or (t.audience in ('partner', 'customer') and app.is_case_partner(t.case_id) and not messages.is_internal_note)
          or (app.is_platform_staff() and app.can_read_case(t.case_id))
        )
    )
  );

create policy message_reads_self on public.message_reads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notifications_self on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_self_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_staff_insert on public.notifications
  for insert to authenticated with check (app.is_platform_staff());

create policy notification_preferences_self on public.notification_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy compliance_obligations_customer on public.compliance_obligations
  for select to authenticated using (organization_id in (select app.my_organization_ids()));
create policy compliance_obligations_customer_complete on public.compliance_obligations
  for update to authenticated
  using (responsible_kind = 'customer'
         and app.is_org_member(organization_id, array['customer_owner', 'customer_member']::public.organization_role[]))
  with check (responsible_kind = 'customer'
              and app.is_org_member(organization_id, array['customer_owner', 'customer_member']::public.organization_role[]));
create policy compliance_obligations_staff on public.compliance_obligations
  for all to authenticated
  using (app.is_platform_staff())
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy compliance_reminders_read on public.compliance_reminders
  for select to authenticated
  using (
    exists (select 1 from public.compliance_obligations o
            where o.id = compliance_reminders.obligation_id
              and (o.organization_id in (select app.my_organization_ids()) or app.is_platform_staff()))
  );
create policy compliance_reminders_staff on public.compliance_reminders
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy renewal_cases_read on public.renewal_cases
  for select to authenticated using (app.can_read_case(case_id));
create policy renewal_cases_staff on public.renewal_cases
  for all to authenticated
  using (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['case_manager', 'admin', 'super_admin']::public.platform_role[]));
