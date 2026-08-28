-- =============================================================================
-- Assurance level in the policies themselves.
--
-- permission_catalog.requires_aal2 records which operations need a second
-- factor presented on the request, and requireCapability() now enforces it. The
-- repository's own rule is that authorisation is enforced in the Server Action
-- *and* in RLS, both, every time. This is the second half.
--
-- Every policy here is RESTRICTIVE. A permissive policy is OR-ed with the
-- others and so can only widen access; a restrictive one is AND-ed and is the
-- only kind that can add a condition to rules already written. That also means
-- nothing below rewrites an existing policy — this migration adds and takes
-- nothing away, which is what makes it safe to apply to a live database.
--
-- Each is scoped to a single command rather than `for all`. The read half of
-- these tables must keep working at aal1: `kyc.read` and `risk.read` are not
-- step-up capabilities, and a compliance officer who has not yet presented a
-- factor should still be able to look. Only the deciding is held back.
--
-- All are `to authenticated`. The service role is a different role and does not
-- match, so webhook and background writes are unaffected — they carry no JWT
-- and therefore no assurance level to check.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- kyc.decide
-- ---------------------------------------------------------------------------
create policy kyc_cases_decide_needs_aal2 on public.kyc_cases
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());

-- ---------------------------------------------------------------------------
-- risk.write, and the compliance decision record itself
-- ---------------------------------------------------------------------------
create policy risk_flags_write_needs_aal2 on compliance.risk_flags
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy risk_flags_update_needs_aal2 on compliance.risk_flags
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());

create policy risk_assessments_write_needs_aal2 on compliance.risk_assessments
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy risk_assessments_update_needs_aal2 on compliance.risk_assessments
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());

create policy compliance_decisions_write_needs_aal2 on compliance.compliance_decisions
  as restrictive for insert to authenticated with check (app.current_aal_is_2());

-- ---------------------------------------------------------------------------
-- refund.approve and payment.reconcile
--
-- Insert is left alone on both: raising a refund request and recording an
-- incoming payment are not the approval. It is the state change that moves
-- money, and that is an update.
-- ---------------------------------------------------------------------------
create policy refunds_approve_needs_aal2 on public.refunds
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());

create policy payments_reconcile_needs_aal2 on public.payments
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());

-- ---------------------------------------------------------------------------
-- partner.verify
-- ---------------------------------------------------------------------------
create policy partner_verifications_needs_aal2 on public.partner_verifications
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy partner_verifications_update_needs_aal2 on public.partner_verifications
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());

-- ---------------------------------------------------------------------------
-- user.manage — every table that decides who holds what
-- ---------------------------------------------------------------------------
create policy platform_roles_write_needs_aal2 on public.platform_roles
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy platform_roles_update_needs_aal2 on public.platform_roles
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());
create policy platform_roles_delete_needs_aal2 on public.platform_roles
  as restrictive for delete to authenticated using (app.current_aal_is_2());

create policy platform_invitations_write_needs_aal2 on public.platform_invitations
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy platform_invitations_update_needs_aal2 on public.platform_invitations
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());
create policy platform_invitations_delete_needs_aal2 on public.platform_invitations
  as restrictive for delete to authenticated using (app.current_aal_is_2());

create policy role_assignments_write_needs_aal2 on public.role_assignments
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy role_assignments_update_needs_aal2 on public.role_assignments
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());
create policy role_assignments_delete_needs_aal2 on public.role_assignments
  as restrictive for delete to authenticated using (app.current_aal_is_2());

create policy membership_overrides_write_needs_aal2 on public.membership_permission_overrides
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy membership_overrides_update_needs_aal2 on public.membership_permission_overrides
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());

-- ---------------------------------------------------------------------------
-- settings.manage
-- ---------------------------------------------------------------------------
create policy platform_settings_write_needs_aal2 on public.platform_settings
  as restrictive for insert to authenticated with check (app.current_aal_is_2());
create policy platform_settings_update_needs_aal2 on public.platform_settings
  as restrictive for update to authenticated
  using (app.current_aal_is_2()) with check (app.current_aal_is_2());
create policy platform_settings_delete_needs_aal2 on public.platform_settings
  as restrictive for delete to authenticated using (app.current_aal_is_2());

-- ---------------------------------------------------------------------------
-- Deliberately NOT covered, so the omissions are a decision and not an oversight
--
-- quotes / quote_versions — `quote.approve` is step-up in the application, but
--   a customer accepting a quote updates `quote_versions` as themselves at
--   aal1. A restrictive policy here would refuse the customer's acceptance
--   along with the staff approval, and the two cannot be told apart by command
--   alone. Splitting them needs the acceptance path reworked first.
--
-- documents — `document.quarantine` is step-up, but `document.review` is not
--   and both are updates to the same table, as is a customer replacing a file.
--   Restricting the command would stop ordinary review and upload.
--
-- Both are enforced in the Server Action today. Neither is enforced in RLS, and
-- that gap is real: something reaching the table by another route would not be
-- held to a second factor. It wants a column-aware or status-aware predicate
-- rather than a blunt command-level one.
-- =============================================================================
