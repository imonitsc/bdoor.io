-- ---------------------------------------------------------------------------
-- Comply subscription checkout (ROADMAP P0).
--
-- The catalogue and subscription_plans have carried approved recurring prices
-- since the fundable-core migration, but nothing could create or activate a
-- subscription: inserts were finance-only and no code path ever wrote
-- activation_payment_id. This migration opens the narrowest customer path:
--
--   1. payments learns an optional subscription target, and case_id becomes
--      optional — a payment must aim at a case or a subscription, never
--      neither. Invoice/case billing is unchanged.
--   2. A customer OWNER may insert a subscription for their own organisation,
--      but only in pending_activation and only bare — the same shape as the
--      draft-only case insert. Activation stays impossible without a verified
--      payment (subscriptions_active_needs_verified_payment) written by the
--      webhook or a finance user.
--   3. Org members may insert their own pending payment rows. This is also
--      the fix for a latent gap: startCheckout has always inserted payments
--      under the customer's session, which no policy permitted.
--
-- Reversal: drop the two policies, drop payments_target_present, drop
-- payments.subscription_id, and restore the NOT NULL on payments.case_id
-- (requires deleting any case-less rows first — there are none before this
-- migration ships).
-- ---------------------------------------------------------------------------

alter table public.payments
  add column subscription_id uuid references public.subscriptions (id) on delete set null;

alter table public.payments
  alter column case_id drop not null;

alter table public.payments
  add constraint payments_target_present
    check (case_id is not null or subscription_id is not null);

create index payments_subscription_idx on public.payments (subscription_id)
  where subscription_id is not null;

comment on column public.payments.subscription_id is
  'Set when the payment activates or renews a subscription; such payments may have no case. Every payment targets a case or a subscription.';

-- ---------------------------------------------------------------------------
-- A customer owner requests a subscription: pending_activation only, own
-- organisation only, no activation fields. The status machine and the
-- verified-payment constraint keep it inert until money is confirmed.
-- ---------------------------------------------------------------------------
create policy subscriptions_customer_request on public.subscriptions
  for insert to authenticated
  with check (
    app.is_org_member(organization_id, array['customer_owner']::public.organization_role[])
    and status = 'pending_activation'
    and created_by = (select auth.uid())
    and started_at is null
    and activation_payment_id is null
    and offline_payment_reference is null
    and offline_payment_verified_by is null
    and offline_payment_verified_at is null
  );

-- ---------------------------------------------------------------------------
-- An org member starts a checkout: the pending payment row they create must
-- belong to their organisation, and every target it names (case, invoice,
-- subscription) must belong to that same organisation. Amounts are still
-- computed server-side from the invoice or plan, never trusted from a form,
-- but that is the action's job — the policy pins tenancy and status.
-- ---------------------------------------------------------------------------
create policy payments_customer_create on public.payments
  for insert to authenticated
  with check (
    organization_id in (select app.my_organization_ids())
    and status = 'pending'
    and refunded_minor = 0
    and reconciled_at is null
    and (case_id is null or exists (
      select 1 from public.cases c
      where c.id = case_id and c.organization_id = payments.organization_id
    ))
    and (invoice_id is null or exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.organization_id = payments.organization_id
    ))
    and (subscription_id is null or exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.organization_id = payments.organization_id
    ))
  );
