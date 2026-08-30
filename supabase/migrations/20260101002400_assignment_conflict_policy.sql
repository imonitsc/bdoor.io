-- Structured conflict-check flow on assignments (portals spec §10), part 2.
--
-- Two changes:
--   1. The partner-respond policy previously demanded that any partner update
--      land on accepted/declined, which made it impossible to *record* a
--      "potential conflict" or "insufficient information" outcome while the
--      offer stays open for bdoor review. The WITH CHECK now also admits a row
--      that remains 'offered'.
--   2. A column guard closes a latent hole that widening would otherwise make
--      worse: the row-level policies constrain which rows a partner or
--      customer may update, but not which columns — so a partner's accept
--      could also have written customer_authorized_at and self-granted
--      document access. The trigger pins each actor to their own columns:
--      customers may only grant/withdraw their authorisation; partners may
--      never touch the customer-authorisation or disclosure columns, may not
--      reassign the row, and any conflict result they record is stamped with
--      their own identity.
--
-- Rollback: drop trigger + function, and restore the previous WITH CHECK
-- (status in ('accepted','declined')) from 20260101000500.

drop policy case_partner_assignments_partner_respond on public.case_partner_assignments;
create policy case_partner_assignments_partner_respond on public.case_partner_assignments
  for update to authenticated
  using (
    status = 'offered'
    and app.is_org_member(partner_org_id, array['partner_owner', 'partner_staff']::public.organization_role[])
  )
  with check (
    status in ('offered', 'accepted', 'declined')
    and app.is_org_member(partner_org_id, array['partner_owner', 'partner_staff']::public.organization_role[])
  );

create or replace function app.guard_assignment_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service role and platform staff manage every column through their own
  -- policies and server-side authorisation.
  if auth.uid() is null or app.is_platform_staff() then
    return new;
  end if;

  -- Nobody below staff may move the assignment to another case or firm.
  if new.case_id is distinct from old.case_id
     or new.partner_org_id is distinct from old.partner_org_id then
    raise exception 'assignment scope is fixed';
  end if;

  if app.is_org_member(
       new.partner_org_id,
       array['partner_owner', 'partner_staff']::public.organization_role[]
     ) then
    -- Partner path: never the customer's consent, never the disclosure
    -- record, never the offer metadata or scope.
    if new.customer_authorized_at is distinct from old.customer_authorized_at
       or new.customer_authorized_by is distinct from old.customer_authorized_by
       or new.disclosed_at is distinct from old.disclosed_at
       or new.disclosed_by is distinct from old.disclosed_by
       or new.scope_note is distinct from old.scope_note
       or new.offered_by is distinct from old.offered_by
       or new.offered_at is distinct from old.offered_at then
      raise exception 'column restricted to bdoor staff or the customer';
    end if;
    -- A recorded conflict outcome carries the recorder's own identity.
    if new.conflict_check_result is distinct from old.conflict_check_result then
      new.conflict_check_recorded_by := auth.uid();
      new.conflict_check_recorded_at := now();
    end if;
    return new;
  end if;

  -- Customer path (the authorize policy): only the authorisation columns.
  if new.status is distinct from old.status
     or new.conflict_check_result is distinct from old.conflict_check_result
     or new.conflict_check_confirmed is distinct from old.conflict_check_confirmed
     or new.disclosed_at is distinct from old.disclosed_at
     or new.disclosed_by is distinct from old.disclosed_by
     or new.scope_note is distinct from old.scope_note
     or new.decline_reason is distinct from old.decline_reason then
    raise exception 'column restricted to bdoor staff or the assigned partner';
  end if;
  return new;
end;
$$;

create trigger case_partner_assignments_column_guard
  before update on public.case_partner_assignments
  for each row execute function app.guard_assignment_columns();

revoke all on function app.guard_assignment_columns() from public, anon;
