-- =============================================================================
-- Identity, tenancy and the authorization predicates the rest of the schema
-- depends on.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user. Never holds a role.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text not null default '',
  display_name      text,
  email             text,
  phone             text,
  country_of_residence char(2),
  preferred_locale  public.locale_code not null default 'en',
  avatar_url        text,
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(full_name) <= 200)
);

create trigger profiles_touch before update on public.profiles
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- platform_roles — BDoor staff. Server-controlled: no self-service INSERT.
-- ---------------------------------------------------------------------------
create table public.platform_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.platform_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  primary key (user_id, role)
);

create index platform_roles_role_idx on public.platform_roles (role);

-- ---------------------------------------------------------------------------
-- organizations — the tenancy boundary. Customers and partners share the table
-- but are separated by `kind`, so a partner can never be treated as a customer
-- org by accident.
-- ---------------------------------------------------------------------------
create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  kind          public.organization_kind not null,
  name          text not null,
  slug          text not null unique,
  country       char(2) not null default 'BD',
  contact_email text,
  contact_phone text,
  locale        public.locale_code not null default 'en',
  is_active     boolean not null default true,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint organizations_name_len check (char_length(name) between 2 and 200)
);

create index organizations_kind_idx on public.organizations (kind) where is_active;

create trigger organizations_touch before update on public.organizations
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- organization_memberships — the single source of truth for org access.
-- ---------------------------------------------------------------------------
create table public.organization_memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            public.organization_role not null,
  invited_by      uuid references auth.users (id) on delete set null,
  joined_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_memberships_user_idx on public.organization_memberships (user_id);
create index organization_memberships_org_role_idx on public.organization_memberships (organization_id, role);

create trigger organization_memberships_touch before update on public.organization_memberships
  for each row execute function app.touch_updated_at();

-- Customer orgs only take customer roles; partner orgs only partner roles.
create or replace function app.enforce_membership_role_matches_org_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind public.organization_kind;
begin
  select kind into v_kind from public.organizations where id = new.organization_id;
  if v_kind is null then
    raise exception 'Organization % does not exist', new.organization_id;
  end if;
  if v_kind = 'customer' and new.role not in ('customer_owner', 'customer_member') then
    raise exception 'Role % is not valid for a customer organization', new.role;
  end if;
  if v_kind = 'partner' and new.role not in ('partner_owner', 'partner_staff') then
    raise exception 'Role % is not valid for a partner organization', new.role;
  end if;
  return new;
end;
$$;

create trigger organization_memberships_role_kind
  before insert or update on public.organization_memberships
  for each row execute function app.enforce_membership_role_matches_org_kind();

-- ---------------------------------------------------------------------------
-- organization_invitations
-- ---------------------------------------------------------------------------
create table public.organization_invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           text not null,
  role            public.organization_role not null,
  status          public.invitation_status not null default 'pending',
  token_hash      text not null unique,
  invited_by      uuid references auth.users (id) on delete set null,
  accepted_by     uuid references auth.users (id) on delete set null,
  expires_at      timestamptz not null,
  accepted_at     timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint organization_invitations_email_lower check (email = lower(email))
);

create unique index organization_invitations_pending_unique
  on public.organization_invitations (organization_id, email)
  where status = 'pending';
create index organization_invitations_email_idx on public.organization_invitations (email) where status = 'pending';
create index organization_invitations_expiry_idx on public.organization_invitations (expires_at) where status = 'pending';

create trigger organization_invitations_touch before update on public.organization_invitations
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- user_security_settings
-- ---------------------------------------------------------------------------
create table public.user_security_settings (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  mfa_required         boolean not null default false,
  mfa_enrolled_at      timestamptz,
  last_password_change timestamptz,
  last_sign_in_at      timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger user_security_settings_touch before update on public.user_security_settings
  for each row execute function app.touch_updated_at();

-- =============================================================================
-- Authorization predicates.
--
-- These are SECURITY DEFINER because RLS policies on `organization_memberships`
-- would otherwise recurse when a policy on another table needs to read it.
-- Each one:
--   * lives in the private `app` schema (never exposed to PostgREST),
--   * pins `search_path` to '' so every reference is schema-qualified,
--   * reads only auth.uid() as its subject and takes no privileged shortcut.
-- =============================================================================

create or replace function app.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$ select auth.uid() $$;

create or replace function app.has_platform_role(v_roles public.platform_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_roles pr
    where pr.user_id = auth.uid()
      and pr.role = any(v_roles)
      and (pr.expires_at is null or pr.expires_at > now())
  );
$$;

create or replace function app.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_roles pr
    where pr.user_id = auth.uid()
      and (pr.expires_at is null or pr.expires_at > now())
  );
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$ select app.has_platform_role(array['admin', 'super_admin']::public.platform_role[]) $$;

create or replace function app.is_compliance()
returns boolean
language sql
stable
set search_path = ''
as $$ select app.has_platform_role(array['compliance_officer', 'admin', 'super_admin']::public.platform_role[]) $$;

create or replace function app.is_finance()
returns boolean
language sql
stable
set search_path = ''
as $$ select app.has_platform_role(array['finance', 'admin', 'super_admin']::public.platform_role[]) $$;

/**
 * Membership of a specific organization, optionally narrowed to given roles.
 */
create or replace function app.is_org_member(v_org uuid, v_roles public.organization_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = v_org
      and m.user_id = auth.uid()
      and (v_roles is null or m.role = any(v_roles))
  );
$$;

/** Every organization the caller belongs to. Used by `in (select ...)` policies. */
create or replace function app.my_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.organization_memberships m
  where m.user_id = auth.uid();
$$;

create or replace function app.my_partner_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = auth.uid()
    and o.kind = 'partner';
$$;

revoke all on function app.has_platform_role(public.platform_role[]) from public, anon;
revoke all on function app.is_platform_staff() from public, anon;
revoke all on function app.is_org_member(uuid, public.organization_role[]) from public, anon;
revoke all on function app.my_organization_ids() from public, anon;
revoke all on function app.my_partner_organization_ids() from public, anon;

grant execute on function app.current_user_id() to authenticated;
grant execute on function app.has_platform_role(public.platform_role[]) to authenticated;
grant execute on function app.is_platform_staff() to authenticated;
grant execute on function app.is_admin() to authenticated;
grant execute on function app.is_compliance() to authenticated;
grant execute on function app.is_finance() to authenticated;
grant execute on function app.is_org_member(uuid, public.organization_role[]) to authenticated;
grant execute on function app.my_organization_ids() to authenticated;
grant execute on function app.my_partner_organization_ids() to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.platform_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.user_security_settings enable row level security;

-- profiles: you see yourself; staff see everyone; org members see co-members.
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_co_members on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships mine
      join public.organization_memberships theirs
        on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.profiles.id
    )
  );

create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (app.is_platform_staff());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- platform_roles: readable by staff, writable only by admins. Nobody can grant
-- themselves a role through the Data API.
create policy platform_roles_select_self on public.platform_roles
  for select to authenticated
  using (user_id = auth.uid());

create policy platform_roles_select_staff on public.platform_roles
  for select to authenticated
  using (app.is_platform_staff());

create policy platform_roles_admin_write on public.platform_roles
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin() and user_id <> auth.uid());

-- organizations
create policy organizations_select_member on public.organizations
  for select to authenticated
  using (id in (select app.my_organization_ids()));

create policy organizations_select_staff on public.organizations
  for select to authenticated
  using (app.is_platform_staff());

create policy organizations_insert_self on public.organizations
  for insert to authenticated
  with check (kind = 'customer' and created_by = auth.uid());

create policy organizations_update_owner on public.organizations
  for update to authenticated
  using (app.is_org_member(id, array['customer_owner', 'partner_owner']::public.organization_role[]))
  with check (app.is_org_member(id, array['customer_owner', 'partner_owner']::public.organization_role[]));

create policy organizations_admin_all on public.organizations
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- organization_memberships
create policy organization_memberships_select_own_orgs on public.organization_memberships
  for select to authenticated
  using (organization_id in (select app.my_organization_ids()));

create policy organization_memberships_select_staff on public.organization_memberships
  for select to authenticated
  using (app.is_platform_staff());

create policy organization_memberships_owner_write on public.organization_memberships
  for all to authenticated
  using (app.is_org_member(organization_id, array['customer_owner', 'partner_owner']::public.organization_role[]))
  with check (app.is_org_member(organization_id, array['customer_owner', 'partner_owner']::public.organization_role[]));

create policy organization_memberships_admin_all on public.organization_memberships
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- organization_invitations. The token hash is never selectable by the invitee
-- through this table; acceptance goes through a server action that looks the
-- hash up with the service role.
create policy organization_invitations_select_org on public.organization_invitations
  for select to authenticated
  using (app.is_org_member(organization_id, array['customer_owner', 'partner_owner']::public.organization_role[]));

create policy organization_invitations_select_staff on public.organization_invitations
  for select to authenticated
  using (app.is_platform_staff());

create policy organization_invitations_owner_write on public.organization_invitations
  for all to authenticated
  using (app.is_org_member(organization_id, array['customer_owner', 'partner_owner']::public.organization_role[]))
  with check (
    app.is_org_member(organization_id, array['customer_owner', 'partner_owner']::public.organization_role[])
    and expires_at > now()
  );

create policy organization_invitations_admin_all on public.organization_invitations
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- user_security_settings
create policy user_security_settings_self on public.user_security_settings
  for select to authenticated
  using (user_id = auth.uid());

create policy user_security_settings_self_update on public.user_security_settings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_security_settings_admin on public.user_security_settings
  for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());
