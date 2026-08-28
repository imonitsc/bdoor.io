-- =============================================================================
-- Let the customer actually accept a quote.
--
-- `acceptQuote()` ends by setting status = 'accepted' on the quote version. The
-- customer matched no permissive write policy on `public.quote_versions` —
-- only `quote_versions_customer_read` (select) and `quote_versions_finance_write`
-- (staff) existed — so RLS filtered the update to zero rows. PostgREST does not
-- treat "matched no rows" as an error and the action did not check, so it
-- reported success while the version stayed `sent` with a null accepted_at.
--
-- The engagement_acceptances row and the audit entry were written, so the
-- record of acceptance existed; what was missing was the state change every
-- screen keyed on. The customer was told the quote was accepted and it still
-- looked outstanding.
--
-- Fixed in the database rather than by reaching for the service role, so the
-- rule stays where the other rules are.
-- =============================================================================

/**
 * A customer may move a sent quote version to accepted, and may change nothing
 * else about it.
 *
 * `with check` constrains the shape of the resulting row, but it cannot see the
 * old one, so it cannot by itself stop an amount being edited in the same
 * statement. The trigger below does that. Both are needed: the policy decides
 * who may update at all, the trigger decides what an update may change.
 */
create policy quote_versions_customer_accept on public.quote_versions
  for update to authenticated
  using (
    sent_at is not null
    and accepted_at is null
    and superseded_at is null
    and exists (
      select 1 from public.quotes q
      where q.id = quote_versions.quote_id
        and app.is_org_member(q.organization_id, array['customer_owner']::public.organization_role[])
    )
  )
  with check (
    status = 'accepted'
    and accepted_at is not null
    and exists (
      select 1 from public.quotes q
      where q.id = quote_versions.quote_id
        and app.is_org_member(q.organization_id, array['customer_owner']::public.organization_role[])
    )
  );

/**
 * Accepting changes the status and the timestamp. Nothing else.
 *
 * Without this, the policy above would let a customer owner rewrite the price
 * in the same statement that accepts it — the with-check would still pass,
 * because the row it inspects would be `accepted` either way.
 *
 * Staff writes go through `quote_versions_finance_write` and are not the target
 * here, so the check applies only when the caller is not platform staff.
 *
 * An already-accepted row is left to `quote_versions_immutable_when_accepted`,
 * which refuses every change to one. Both are BEFORE UPDATE triggers and
 * PostgreSQL fires them in name order, so without this early return the
 * narrower message here would pre-empt the immutability message that callers
 * and tests already expect.
 */
create or replace function app.enforce_quote_acceptance_is_narrow()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if app.is_platform_staff() then
    return new;
  end if;

  if old.accepted_at is not null then
    return new;
  end if;

  if new.quote_id            is distinct from old.quote_id
     or new.version_no       is distinct from old.version_no
     or new.currency         is distinct from old.currency
     or new.subtotal_minor   is distinct from old.subtotal_minor
     or new.tax_minor        is distinct from old.tax_minor
     or new.total_minor      is distinct from old.total_minor
     or new.bdoor_revenue_minor is distinct from old.bdoor_revenue_minor
     or new.pass_through_minor  is distinct from old.pass_through_minor
     or new.valid_until      is distinct from old.valid_until
     or new.notes_en         is distinct from old.notes_en
     or new.notes_bn         is distinct from old.notes_bn
     or new.prepared_by      is distinct from old.prepared_by
     or new.approved_by      is distinct from old.approved_by
     or new.approved_at      is distinct from old.approved_at
     or new.sent_at          is distinct from old.sent_at
     or new.superseded_at    is distinct from old.superseded_at
  then
    raise exception 'a customer may accept a quote version, not alter it'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger quote_versions_customer_accept_is_narrow
  before update on public.quote_versions
  for each row execute function app.enforce_quote_acceptance_is_narrow();
