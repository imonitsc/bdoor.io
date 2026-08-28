-- =============================================================================
-- Authorization core: a permission catalogue, role templates, scoped role
-- assignments and per-membership overrides.
--
-- Why this exists. Until now the capability matrix lived only in
-- `src/lib/permissions/roles.ts`. That works, and it is tested, but it cannot
-- express what the backend brief requires: a permission granted for one case,
-- one task or one document rather than for the whole platform; a grant that
-- expires; an override on a single membership; or an audit trail of who
-- granted what and why.
--
-- What this deliberately does NOT do. The existing `platform_roles` and
-- `organization_memberships` tables, and the `platform_role` /
-- `organization_role` enums, are untouched. Every policy already written
-- against them keeps working. Templates are rows keyed by text, so the new
-- roles the brief adds (`operations_manager`, `partner_reviewer`, …) need no
-- enum surgery. The two models run side by side: `app.has_permission()` reads
-- both, so a legacy platform role and a scoped assignment grant the same way.
--
-- The catalogue is seeded from the 27 capabilities the application actually
-- enforces today — not from a longer wish list. A catalogue full of keys that
-- nothing checks is worse than no catalogue, because it reads like a control
-- that exists. New keys land with the code that enforces them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- permission_catalog
-- ---------------------------------------------------------------------------
create table public.permission_catalog (
  key           text primary key,
  category      text not null,
  description   text not null,
  -- Sensitive permissions require a recent second factor at the point of use.
  -- The check belongs in the action as well; this column records the intent so
  -- the admin UI can show it and tests can assert on it.
  requires_aal2 boolean not null default false,
  created_at    timestamptz not null default now(),
  constraint permission_catalog_category_values
    check (category in ('case', 'document', 'compliance', 'commercial', 'partner', 'platform')),
  constraint permission_catalog_key_shape check (key ~ '^[a-z_]+\.[a-z_.]+$')
);

-- ---------------------------------------------------------------------------
-- role_templates — convenient bundles. Permissions remain the source of truth.
-- ---------------------------------------------------------------------------
create table public.role_templates (
  code          text primary key,
  workspace     text not null,
  label_en      text not null,
  label_bn      text not null,
  description   text not null,
  -- A template nobody may assign through the UI, e.g. one kept for historical
  -- assignments after a role is retired.
  is_assignable boolean not null default true,
  requires_mfa  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint role_templates_workspace_values
    check (workspace in ('internal', 'partner', 'customer'))
);

create trigger role_templates_touch before update on public.role_templates
  for each row execute function app.touch_updated_at();

create table public.role_template_permissions (
  template_code  text not null references public.role_templates (code) on delete cascade,
  permission_key text not null references public.permission_catalog (key) on delete restrict,
  primary key (template_code, permission_key)
);

create index role_template_permissions_permission_idx
  on public.role_template_permissions (permission_key);

-- ---------------------------------------------------------------------------
-- role_assignments — a template granted to a user at a specific scope.
-- ---------------------------------------------------------------------------
create table public.role_assignments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  template_code   text not null references public.role_templates (code) on delete restrict,
  scope_kind      text not null,
  -- The case, task or document the grant is limited to. Null only at platform
  -- scope, which is what the constraint below enforces.
  scope_id        uuid,
  -- Denormalised so an RLS predicate can filter by organization without a join.
  organization_id uuid references public.organizations (id) on delete cascade,
  granted_by      uuid references auth.users (id) on delete set null,
  reason          text not null,
  starts_at       timestamptz not null default now(),
  expires_at      timestamptz,
  revoked_at      timestamptz,
  revoked_by      uuid references auth.users (id) on delete set null,
  revoke_reason   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint role_assignments_scope_values
    check (scope_kind in ('platform', 'organization', 'case', 'task', 'document')),
  constraint role_assignments_scope_id_shape
    check ((scope_kind = 'platform' and scope_id is null)
           or (scope_kind <> 'platform' and scope_id is not null)),
  constraint role_assignments_org_scope
    check (scope_kind <> 'organization' or organization_id = scope_id),
  constraint role_assignments_expiry_after_start
    check (expires_at is null or expires_at > starts_at),
  constraint role_assignments_revocation_shape
    check ((revoked_at is null and revoked_by is null and revoke_reason is null)
           or (revoked_at is not null and revoke_reason is not null))
);

create index role_assignments_user_idx on public.role_assignments (user_id)
  where revoked_at is null;
create index role_assignments_org_idx on public.role_assignments (organization_id)
  where revoked_at is null;
create index role_assignments_scope_idx on public.role_assignments (scope_kind, scope_id)
  where revoked_at is null;
create index role_assignments_expiry_idx on public.role_assignments (expires_at)
  where revoked_at is null and expires_at is not null;

-- One live assignment of a template per user per scope. Re-granting after a
-- revocation is allowed; granting the same thing twice is not.
create unique index role_assignments_unique_live
  on public.role_assignments (user_id, template_code, scope_kind, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;

create trigger role_assignments_touch before update on public.role_assignments
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- membership_permission_overrides — narrow the brief's "support narrower
-- permission grants without inventing new global roles".
-- ---------------------------------------------------------------------------
create table public.membership_permission_overrides (
  id             uuid primary key default gen_random_uuid(),
  membership_id  uuid not null references public.organization_memberships (id) on delete cascade,
  permission_key text not null references public.permission_catalog (key) on delete restrict,
  effect         text not null,
  reason         text not null,
  granted_by     uuid references auth.users (id) on delete set null,
  expires_at     timestamptz,
  revoked_at     timestamptz,
  created_at     timestamptz not null default now(),
  constraint membership_permission_overrides_effect_values
    check (effect in ('grant', 'revoke'))
);

create unique index membership_permission_overrides_live
  on public.membership_permission_overrides (membership_id, permission_key)
  where revoked_at is null;

create index membership_permission_overrides_membership_idx
  on public.membership_permission_overrides (membership_id)
  where revoked_at is null;

-- =============================================================================
-- Helpers
--
-- These live in `app`, the repository's existing private schema. The brief
-- names it `private`; the name differs, the properties the brief asks for do
-- not — not in the PostgREST exposed list, `search_path = ''`, subject taken
-- only from `auth.uid()`, execute revoked from public and anon.
-- =============================================================================

/**
 * The assurance level of the current request, from the verified JWT.
 *
 * Returns 'aal1' when the claim is absent so a caller that cannot prove a
 * second factor is never treated as though it had one.
 */
create or replace function app.current_aal()
returns text
language sql
stable
set search_path = ''
as $$ select coalesce(auth.jwt() ->> 'aal', 'aal1') $$;

create or replace function app.current_aal_is_2()
returns boolean
language sql
stable
set search_path = ''
as $$ select app.current_aal() = 'aal2' $$;

/**
 * Every permission the caller holds at platform scope.
 *
 * Reads both models: the legacy `platform_roles` enum, mapped through the
 * template whose code matches the enum value, and unexpired platform-scope
 * `role_assignments`. A row in either grants.
 */
create or replace function app.platform_permissions()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select tp.permission_key
  from public.platform_roles pr
  join public.role_template_permissions tp on tp.template_code = pr.role::text
  where pr.user_id = auth.uid()
    and (pr.expires_at is null or pr.expires_at > now())
  union
  select tp.permission_key
  from public.role_assignments ra
  join public.role_template_permissions tp on tp.template_code = ra.template_code
  where ra.user_id = auth.uid()
    and ra.scope_kind = 'platform'
    and ra.revoked_at is null
    and ra.starts_at <= now()
    and (ra.expires_at is null or ra.expires_at > now());
$$;

create or replace function app.has_platform_permission(v_key text)
returns boolean
language sql
stable
set search_path = ''
as $$ select exists (select 1 from app.platform_permissions() p where p = v_key) $$;

/**
 * Every permission the caller holds inside one organization.
 *
 * Membership role templates, plus organization-scope assignments, minus any
 * live `revoke` override, plus any live `grant` override. Revoke wins over a
 * template because an override is the narrower, more deliberate statement.
 */
create or replace function app.organization_permissions(v_org uuid)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  with granted as (
    select tp.permission_key
    from public.organization_memberships m
    join public.role_template_permissions tp on tp.template_code = m.role::text
    where m.organization_id = v_org
      and m.user_id = auth.uid()
    union
    select tp.permission_key
    from public.role_assignments ra
    join public.role_template_permissions tp on tp.template_code = ra.template_code
    where ra.user_id = auth.uid()
      and ra.scope_kind = 'organization'
      and ra.scope_id = v_org
      and ra.revoked_at is null
      and ra.starts_at <= now()
      and (ra.expires_at is null or ra.expires_at > now())
    union
    select o.permission_key
    from public.membership_permission_overrides o
    join public.organization_memberships m on m.id = o.membership_id
    where m.organization_id = v_org
      and m.user_id = auth.uid()
      and o.effect = 'grant'
      and o.revoked_at is null
      and (o.expires_at is null or o.expires_at > now())
  ),
  revoked as (
    select o.permission_key
    from public.membership_permission_overrides o
    join public.organization_memberships m on m.id = o.membership_id
    where m.organization_id = v_org
      and m.user_id = auth.uid()
      and o.effect = 'revoke'
      and o.revoked_at is null
      and (o.expires_at is null or o.expires_at > now())
  )
  select permission_key from granted
  except
  select permission_key from revoked;
$$;

create or replace function app.has_org_permission(v_org uuid, v_key text)
returns boolean
language sql
stable
set search_path = ''
as $$ select exists (select 1 from app.organization_permissions(v_org) p where p = v_key) $$;

/** Platform-wide or inside this organization. The check most callers want. */
create or replace function app.has_permission(v_key text, v_org uuid default null)
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.has_platform_permission(v_key)
      or (v_org is not null and app.has_org_permission(v_org, v_key));
$$;

revoke all on function app.platform_permissions() from public, anon;
revoke all on function app.organization_permissions(uuid) from public, anon;
revoke all on function app.has_platform_permission(text) from public, anon;
revoke all on function app.has_org_permission(uuid, text) from public, anon;
revoke all on function app.has_permission(text, uuid) from public, anon;
revoke all on function app.current_aal() from public, anon;
revoke all on function app.current_aal_is_2() from public, anon;

grant execute on function app.platform_permissions() to authenticated;
grant execute on function app.organization_permissions(uuid) to authenticated;
grant execute on function app.has_platform_permission(text) to authenticated;
grant execute on function app.has_org_permission(uuid, text) to authenticated;
grant execute on function app.has_permission(text, uuid) to authenticated;
grant execute on function app.current_aal() to authenticated;
grant execute on function app.current_aal_is_2() to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.permission_catalog enable row level security;
alter table public.role_templates enable row level security;
alter table public.role_template_permissions enable row level security;
alter table public.role_assignments enable row level security;
alter table public.membership_permission_overrides enable row level security;

-- The catalogue and templates are configuration, not data: every signed-in user
-- may read them so the UI can explain what a role means. Only an administrator
-- may change them.
create policy permission_catalog_read on public.permission_catalog
  for select to authenticated using (true);
create policy permission_catalog_admin on public.permission_catalog
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy role_templates_read on public.role_templates
  for select to authenticated using (true);
create policy role_templates_admin on public.role_templates
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

create policy role_template_permissions_read on public.role_template_permissions
  for select to authenticated using (true);
create policy role_template_permissions_admin on public.role_template_permissions
  for all to authenticated using (app.is_admin()) with check (app.is_admin());

-- Assignments: you see your own, staff see all, admins write. A user cannot
-- grant themselves anything — the with-check forbids self-assignment, the same
-- separation `platform_roles_admin_write` already enforces for the enum model.
create policy role_assignments_select_self on public.role_assignments
  for select to authenticated using (user_id = auth.uid());

create policy role_assignments_select_staff on public.role_assignments
  for select to authenticated using (app.is_platform_staff());

create policy role_assignments_select_org_owner on public.role_assignments
  for select to authenticated
  using (
    organization_id is not null
    and app.is_org_member(organization_id, array['customer_owner', 'partner_owner']::public.organization_role[])
  );

create policy role_assignments_admin_write on public.role_assignments
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin() and user_id <> auth.uid());

create policy membership_permission_overrides_select on public.membership_permission_overrides
  for select to authenticated
  using (
    app.is_platform_staff()
    or exists (
      select 1 from public.organization_memberships m
      where m.id = membership_permission_overrides.membership_id
        and (m.user_id = auth.uid()
             or app.is_org_member(m.organization_id,
                  array['customer_owner', 'partner_owner']::public.organization_role[]))
    )
  );

create policy membership_permission_overrides_admin on public.membership_permission_overrides
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- =============================================================================
-- Seed: the capabilities the application enforces today.
--
-- Kept identical to `src/lib/permissions/roles.ts`. A drift test fails if the
-- two disagree, the same way `case_status_transitions` is guarded.
-- =============================================================================

insert into public.permission_catalog (key, category, description, requires_aal2) values
  ('case.read.own',              'case',       'Read cases the actor is entitled to see', false),
  ('case.create',                'case',       'Open a new case', false),
  ('case.manage',                'case',       'Edit case details, milestones and tasks', false),
  ('case.transition',            'case',       'Move a case to another status', false),
  ('case.assign_partner',        'case',       'Offer a case to a partner organisation', false),
  ('document.upload',            'document',   'Upload a document', false),
  ('document.review',            'document',   'Accept, reject or request replacement', false),
  ('document.quarantine',        'document',   'Quarantine a document', true),
  ('kyc.read',                   'compliance', 'Read KYC status and checks', false),
  ('kyc.decide',                 'compliance', 'Approve, reject or escalate a KYC case', true),
  ('risk.read',                  'compliance', 'Read risk assessments and flags', false),
  ('risk.write',                 'compliance', 'Record risk assessments and flags', true),
  ('quote.read',                 'commercial', 'Read quotes', false),
  ('quote.prepare',              'commercial', 'Draft and revise a quote', false),
  ('quote.approve',              'commercial', 'Approve a quote for sending', false),
  ('quote.accept',               'commercial', 'Accept a quote as the customer', false),
  ('payment.read',               'commercial', 'Read payments and invoices', false),
  ('payment.reconcile',          'commercial', 'Reconcile a payment against a gateway event', true),
  ('refund.approve',             'commercial', 'Approve a refund', true),
  ('partner.read_assigned',      'partner',    'Read cases assigned to the partner organisation', false),
  ('partner.respond_assignment', 'partner',    'Accept or decline an assignment', false),
  ('partner.verify',             'partner',    'Verify a partner organisation', true),
  ('content.publish',            'platform',   'Publish catalogue and resource content', false),
  ('service.manage',             'platform',   'Manage the service catalogue and pricing', false),
  ('user.manage',                'platform',   'Invite users and manage memberships', true),
  ('audit.read',                 'platform',   'Read the audit log', false),
  ('settings.manage',            'platform',   'Change platform settings and integrations', true);

-- Templates whose code matches an existing enum value keep the legacy roles
-- working through `app.platform_permissions()` and `app.organization_permissions()`.
-- The remainder are the roles the brief adds; they carry no enum value and are
-- reached only through `role_assignments`.
insert into public.role_templates (code, workspace, label_en, label_bn, description, requires_mfa) values
  ('super_admin',           'internal', 'Super administrator',      'সুপার অ্যাডমিনিস্ট্রেটর',  'Exceptional platform access. Keep the number of holders small.', true),
  ('admin',                 'internal', 'Administrator',            'অ্যাডমিনিস্ট্রেটর',        'Platform administration without compliance decisions or refunds.', true),
  ('operations_manager',    'internal', 'Operations manager',       'অপারেশনস ম্যানেজার',       'Case queues, assignment and escalation.', true),
  ('case_manager',          'internal', 'Case manager',             'কেস ম্যানেজার',            'Assigned cases, milestones, documents and partner coordination.', true),
  ('compliance_officer',    'internal', 'Compliance officer',       'কমপ্লায়েন্স অফিসার',       'KYC, beneficial ownership and risk decisions.', true),
  ('finance',               'internal', 'Finance',                  'ফাইন্যান্স',                'Quotes, invoices, payments and refunds. No compliance decisions.', true),
  ('content_editor',        'internal', 'Content editor',           'কনটেন্ট এডিটর',            'Service and resource content. Cannot publish legal policy.', true),
  ('legal_policy_publisher','internal', 'Legal policy publisher',   'আইনি নীতি প্রকাশক',        'Publishes counsel-approved policy versions.', true),
  ('auditor',               'internal', 'Auditor',                  'নিরীক্ষক',                 'Read-only, explicitly scoped audit evidence.', true),
  ('support',               'internal', 'Support',                  'সাপোর্ট',                  'Limited support metadata. No KYC or document access by default.', true),
  ('partner_owner',         'partner',  'Partner owner',            'পার্টনার মালিক',           'Firm profile, credentials, staff and assigned matters.', true),
  ('partner_admin',         'partner',  'Partner administrator',    'পার্টনার অ্যাডমিন',        'Staff and firm administration without ownership transfer.', true),
  ('partner_professional',  'partner',  'Partner professional',     'পার্টনার পেশাজীবী',        'Assigned cases, tasks, messages and permitted documents.', true),
  ('partner_reviewer',      'partner',  'Partner reviewer',         'পার্টনার পর্যালোচক',       'Reviews and approves firm work product where assigned.', true),
  ('partner_staff',         'partner',  'Partner staff',            'পার্টনার স্টাফ',           'Narrow task execution and permitted uploads.', true),
  ('partner_finance',       'partner',  'Partner finance',          'পার্টনার ফাইন্যান্স',      'Partner fee statements and payout records only.', true),
  ('customer_owner',        'customer', 'Customer owner',           'গ্রাহক মালিক',             'Owns the customer organisation and its cases.', false),
  ('customer_member',       'customer', 'Customer member',          'গ্রাহক সদস্য',             'Works on the cases the organisation allows.', false);

-- Bundles. Every row below mirrors `PLATFORM_CAPABILITIES` or
-- `ORGANIZATION_CAPABILITIES` for the templates that have an enum counterpart.
insert into public.role_template_permissions (template_code, permission_key)
select 'case_manager', k from unnest(array[
  'case.read.own','case.create','case.manage','case.transition','case.assign_partner',
  'document.upload','document.review','kyc.read','quote.read','quote.prepare',
  'payment.read','partner.read_assigned']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'compliance_officer', k from unnest(array[
  'case.read.own','case.manage','document.review','document.quarantine',
  'kyc.read','kyc.decide','risk.read','risk.write','quote.read','payment.read']) k;

-- Finance deliberately has no KYC or risk capability.
insert into public.role_template_permissions (template_code, permission_key)
select 'finance', k from unnest(array[
  'case.read.own','quote.read','quote.prepare','quote.approve',
  'payment.read','payment.reconcile','refund.approve']) k;

-- admin deliberately has neither kyc.decide nor refund.approve.
insert into public.role_template_permissions (template_code, permission_key)
select 'admin', k from unnest(array[
  'case.read.own','case.create','case.manage','case.transition','case.assign_partner',
  'document.upload','document.review','document.quarantine','kyc.read','risk.read',
  'quote.read','quote.prepare','quote.approve','payment.read','payment.reconcile',
  'partner.read_assigned','partner.verify','content.publish','service.manage',
  'user.manage','audit.read','settings.manage']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'super_admin', k from unnest(array[
  'case.read.own','case.create','case.manage','case.transition','case.assign_partner',
  'document.upload','document.review','document.quarantine','kyc.read','kyc.decide',
  'risk.read','risk.write','quote.read','quote.prepare','quote.approve','payment.read',
  'payment.reconcile','refund.approve','partner.read_assigned','partner.verify',
  'content.publish','service.manage','user.manage','audit.read','settings.manage']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'customer_owner', k from unnest(array[
  'case.read.own','case.create','document.upload','kyc.read',
  'quote.read','quote.accept','payment.read']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'customer_member', k from unnest(array[
  'case.read.own','document.upload','quote.read']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'partner_owner', k from unnest(array[
  'partner.read_assigned','partner.respond_assignment','document.upload','document.review']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'partner_staff', k from unnest(array[
  'partner.read_assigned','document.upload']) k;

-- Templates the brief adds. Each is composed only from permissions the
-- application already enforces; a template stays deliberately thin rather than
-- claiming a control that does not exist yet.
insert into public.role_template_permissions (template_code, permission_key)
select 'operations_manager', k from unnest(array[
  'case.read.own','case.create','case.manage','case.transition','case.assign_partner',
  'document.review','quote.read','payment.read','partner.read_assigned']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'content_editor', k from unnest(array['service.manage']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'legal_policy_publisher', k from unnest(array['content.publish']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'auditor', k from unnest(array['audit.read']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'support', k from unnest(array['case.read.own']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'partner_admin', k from unnest(array[
  'partner.read_assigned','partner.respond_assignment','document.upload']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'partner_professional', k from unnest(array[
  'partner.read_assigned','document.upload','document.review']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'partner_reviewer', k from unnest(array[
  'partner.read_assigned','document.review']) k;

insert into public.role_template_permissions (template_code, permission_key)
select 'partner_finance', k from unnest(array['payment.read']) k;
