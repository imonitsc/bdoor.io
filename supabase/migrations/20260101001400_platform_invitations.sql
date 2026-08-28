-- =============================================================================
-- Platform invitations — the only way an internal account comes into existence.
--
-- `public.organization_invitations` already covers customers and partner firms.
-- Nothing equivalent existed for BDoor staff: a platform role could only be
-- created by inserting straight into `platform_roles`, so there was no record
-- of who invited whom, no expiry, no revocation and no acceptance step that
-- proves the invitee controls the address the invitation was sent to.
--
-- The brief is explicit that no public signup may create an admin, case
-- manager, compliance officer, finance user, partner owner or partner
-- professional. This table is the controlled path.
--
-- The invited role is a `role_templates` code, not a `platform_role` enum
-- value. Typing it as the enum would mean the roles the brief adds —
-- operations_manager, auditor, content_editor, support, legal_policy_publisher
-- — could not be invited at all, which is the enum surgery the template model
-- exists to avoid.
-- =============================================================================

create table public.platform_invitations (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  template_code text not null references public.role_templates (code) on delete restrict,
  status        public.invitation_status not null default 'pending',
  -- Only the hash is stored. The token itself exists in the invitation email
  -- and nowhere else, so a read of this table does not yield a usable link.
  token_hash    text not null unique,
  invited_by    uuid references auth.users (id) on delete set null,
  accepted_by   uuid references auth.users (id) on delete set null,
  reason        text not null,
  expires_at    timestamptz not null,
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  revoked_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint platform_invitations_email_lower check (email = lower(email)),
  constraint platform_invitations_acceptance_shape
    check ((status <> 'accepted') or (accepted_by is not null and accepted_at is not null))
);

-- One live invitation per address. A second invitation to the same person has
-- to wait for the first to be accepted, revoked or to expire, so two links are
-- never valid at once.
create unique index platform_invitations_pending_unique
  on public.platform_invitations (email)
  where status = 'pending';

create index platform_invitations_expiry_idx
  on public.platform_invitations (expires_at) where status = 'pending';

create trigger platform_invitations_touch before update on public.platform_invitations
  for each row execute function app.touch_updated_at();

/**
 * Only an internal template may be invited here.
 *
 * A foreign key cannot express "a row of `role_templates` whose workspace is
 * internal", and this must hold for the service role too — the acceptance path
 * runs with it — so the check is a trigger rather than a policy.
 */
create or replace function app.enforce_internal_invitation_template()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.role_templates t
    where t.code = new.template_code and t.workspace = 'internal'
  ) then
    raise exception 'platform invitations carry an internal role template, not %', new.template_code
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger platform_invitations_internal_only
  before insert or update on public.platform_invitations
  for each row execute function app.enforce_internal_invitation_template();

-- ---------------------------------------------------------------------------
-- The escalation rule
-- ---------------------------------------------------------------------------

/**
 * Whether the caller may invite somebody into `v_code`.
 *
 * The rule is that an inviter cannot hand out a permission they do not
 * themselves hold. Naming which roles may invite which other roles would drift
 * the moment a bundle changes; comparing the permission sets cannot.
 *
 * What it means in practice, given the bundles seeded in the previous
 * migration:
 *
 *   - super_admin holds everything, so super_admin may invite any role.
 *   - admin may invite admin, case_manager, operations_manager, support,
 *     content_editor, legal_policy_publisher and auditor.
 *   - admin may NOT invite compliance_officer (kyc.decide, risk.write) or
 *     finance (refund.approve). Those are exactly the permissions admin is
 *     deliberately denied, and inviting a second account that holds them is
 *     the obvious way around that denial.
 *
 * This closes the escalation that runs through the invitation table. It does
 * not, and cannot, stop a super_admin from creating another super_admin — that
 * is what the role is. Keep the number of holders small and watch the audit log.
 */
create or replace function app.may_invite_template(v_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_admin()
     and not exists (
       select tp.permission_key
       from public.role_template_permissions tp
       where tp.template_code = v_code
       except
       select p from app.platform_permissions() p
     );
$$;

revoke all on function app.may_invite_template(text) from public, anon;
grant execute on function app.may_invite_template(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.platform_invitations enable row level security;

-- Staff may see that an invitation exists; only an administrator may act on
-- one. The token hash is a column like any other here, which is why the
-- acceptance path reads it with the service role rather than as the invitee —
-- the invitee holds no platform role yet and matches no policy below.
create policy platform_invitations_select_staff on public.platform_invitations
  for select to authenticated
  using (app.is_platform_staff());

create policy platform_invitations_insert on public.platform_invitations
  for insert to authenticated
  with check (
    app.is_admin()
    and app.may_invite_template(template_code)
    and expires_at > now()
    and status = 'pending'
  );

-- Update is for revoking and for the bookkeeping an administrator does; the
-- same role gate applies so a row cannot be edited into a role the caller
-- could not have created.
create policy platform_invitations_update on public.platform_invitations
  for update to authenticated
  using (app.is_admin())
  with check (app.is_admin() and app.may_invite_template(template_code));

create policy platform_invitations_delete on public.platform_invitations
  for delete to authenticated
  using (app.has_platform_role(array['super_admin']::public.platform_role[]));
