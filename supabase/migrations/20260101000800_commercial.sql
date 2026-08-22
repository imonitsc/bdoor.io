-- =============================================================================
-- Quotes, invoices, payments, government-fee advances and receipts.
--
-- Two rules shape this schema:
--   1. An accepted quote is a snapshot. Later catalog edits must never change
--      what the customer agreed to, so quote_items carry their own labels and
--      amounts rather than joining back to the service catalog.
--   2. BDoor revenue and money that belongs to somebody else are never mixed.
--      Every line has a `payee` and government advances are tracked separately
--      with their own disbursement + refund ledger.
-- =============================================================================

create table public.quotes (
  id             uuid primary key default gen_random_uuid(),
  case_id        uuid not null references public.cases (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  reference      text not null unique,
  current_version integer not null default 1,
  status         public.quote_status not null default 'draft',
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index quotes_case_idx on public.quotes (case_id, created_at desc);
create index quotes_status_idx on public.quotes (status) where status in ('draft', 'internal_review', 'sent');

create trigger quotes_touch before update on public.quotes
  for each row execute function app.touch_updated_at();

create table public.quote_versions (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references public.quotes (id) on delete cascade,
  version_no      integer not null,
  status          public.quote_status not null default 'draft',
  currency        public.currency_code not null default 'BDT',
  -- Totals are stored, not derived at read time, so an accepted quote keeps the
  -- exact numbers the customer saw. A trigger keeps them consistent with items.
  subtotal_minor  bigint not null default 0,
  tax_minor       bigint not null default 0,
  total_minor     bigint not null default 0,
  bdoor_revenue_minor bigint not null default 0,
  pass_through_minor  bigint not null default 0,
  valid_until     date not null,
  notes_en        text,
  notes_bn        text,
  prepared_by     uuid references auth.users (id) on delete set null,
  approved_by     uuid references auth.users (id) on delete set null,
  approved_at     timestamptz,
  sent_at         timestamptz,
  accepted_at     timestamptz,
  superseded_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (quote_id, version_no)
);

create index quote_versions_quote_idx on public.quote_versions (quote_id, version_no desc);

create trigger quote_versions_touch before update on public.quote_versions
  for each row execute function app.touch_updated_at();

-- Once accepted, a version is frozen.
create or replace function app.quote_versions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.accepted_at is not null then
      raise exception 'An accepted quote version cannot be deleted';
    end if;
    return old;
  end if;
  if old.accepted_at is not null and (
       new.subtotal_minor is distinct from old.subtotal_minor
    or new.total_minor is distinct from old.total_minor
    or new.tax_minor is distinct from old.tax_minor
    or new.currency is distinct from old.currency
    or new.valid_until is distinct from old.valid_until
  ) then
    raise exception 'An accepted quote version is immutable; issue a new version instead';
  end if;
  return new;
end;
$$;

create trigger quote_versions_immutable_when_accepted
  before update or delete on public.quote_versions
  for each row execute function app.quote_versions_guard();

create table public.quote_items (
  id                uuid primary key default gen_random_uuid(),
  quote_version_id  uuid not null references public.quote_versions (id) on delete cascade,
  category          public.quote_item_category not null,
  service_id        uuid references public.services (id) on delete set null,
  -- Snapshot fields. Never re-read from the catalog.
  description_en    text not null,
  description_bn    text not null,
  quantity          numeric(10, 2) not null default 1,
  unit_amount_minor bigint not null,
  currency          public.currency_code not null default 'BDT',
  tax_treatment     text not null default 'exclusive',
  tax_rate_bp       integer not null default 0,
  is_included       boolean not null default true,
  is_refundable     boolean not null default false,
  is_estimate       boolean not null default false,
  payee             public.payee_type not null,
  payee_name        text,
  notes_en          text,
  notes_bn          text,
  sort_order        integer not null default 100,
  created_at        timestamptz not null default now(),
  constraint quote_items_quantity_positive check (quantity > 0),
  constraint quote_items_tax_values check (tax_treatment in ('inclusive', 'exclusive', 'not_applicable')),
  constraint quote_items_tax_rate_range check (tax_rate_bp between 0 and 10000),
  -- Discounts are the only negative lines.
  constraint quote_items_amount_sign
    check ((category = 'discount' and unit_amount_minor <= 0)
           or (category <> 'discount' and unit_amount_minor >= 0)),
  -- Government estimates must be marked as estimates and payable to the authority.
  constraint quote_items_government_shape
    check (category <> 'government_fee_estimate' or (is_estimate and payee = 'government_authority')),
  constraint quote_items_partner_shape
    check (category <> 'partner_professional_fee' or payee = 'partner_firm')
);

create index quote_items_version_idx on public.quote_items (quote_version_id, sort_order);

create table public.engagement_acceptances (
  id               uuid primary key default gen_random_uuid(),
  case_id          uuid not null references public.cases (id) on delete cascade,
  quote_version_id uuid references public.quote_versions (id) on delete set null,
  acceptance_type  public.consent_type not null,
  accepted_by      uuid not null references auth.users (id) on delete restrict,
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  partner_org_id   uuid references public.organizations (id) on delete set null,
  document_version text not null,
  locale           public.locale_code not null default 'en',
  ip_hash          text,
  accepted_at      timestamptz not null default now()
);

create index engagement_acceptances_case_idx on public.engagement_acceptances (case_id, accepted_at desc);

create trigger engagement_acceptances_append_only
  before update or delete on public.engagement_acceptances
  for each row execute function app.reject_mutation();

create table public.invoices (
  id               uuid primary key default gen_random_uuid(),
  case_id          uuid not null references public.cases (id) on delete restrict,
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  quote_version_id uuid references public.quote_versions (id) on delete set null,
  number           text not null unique,
  status           public.invoice_status not null default 'draft',
  currency         public.currency_code not null default 'BDT',
  subtotal_minor   bigint not null default 0,
  tax_minor        bigint not null default 0,
  total_minor      bigint not null default 0,
  paid_minor       bigint not null default 0,
  issued_at        timestamptz,
  due_on           date,
  voided_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint invoices_paid_range check (paid_minor >= 0 and paid_minor <= total_minor + 1)
);

create index invoices_case_idx on public.invoices (case_id, created_at desc);
create index invoices_org_idx on public.invoices (organization_id, status);

create trigger invoices_touch before update on public.invoices
  for each row execute function app.touch_updated_at();

create table public.invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices (id) on delete cascade,
  quote_item_id uuid references public.quote_items (id) on delete set null,
  category      public.quote_item_category not null,
  description_en text not null,
  description_bn text not null,
  quantity      numeric(10, 2) not null default 1,
  unit_amount_minor bigint not null,
  tax_rate_bp   integer not null default 0,
  payee         public.payee_type not null,
  sort_order    integer not null default 100
);

create index invoice_items_invoice_idx on public.invoice_items (invoice_id, sort_order);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid references public.invoices (id) on delete set null,
  case_id         uuid not null references public.cases (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  provider        text not null,
  provider_ref    text,
  checkout_session_id text,
  status          public.payment_status not null default 'pending',
  currency        public.currency_code not null default 'BDT',
  amount_minor    bigint not null,
  refunded_minor  bigint not null default 0,
  is_sandbox      boolean not null default true,
  reconciled_at   timestamptz,
  reconciled_by   uuid references auth.users (id) on delete set null,
  reconcile_note  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint payments_amount_positive check (amount_minor > 0),
  constraint payments_refund_range check (refunded_minor >= 0 and refunded_minor <= amount_minor)
);

create unique index payments_provider_ref_idx on public.payments (provider, provider_ref)
  where provider_ref is not null;
create index payments_case_idx on public.payments (case_id, created_at desc);
create index payments_unreconciled_idx on public.payments (created_at)
  where status = 'paid' and reconciled_at is null;

create trigger payments_touch before update on public.payments
  for each row execute function app.touch_updated_at();

-- Append-only provider event trail. Idempotency is enforced by the unique index
-- on (provider, event_id) — replaying a webhook is a no-op.
create table public.payment_events (
  id           uuid primary key default gen_random_uuid(),
  payment_id   uuid references public.payments (id) on delete cascade,
  provider     text not null,
  event_id     text not null,
  event_type   text not null,
  signature_verified boolean not null default false,
  payload      jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  error        text,
  created_at   timestamptz not null default now(),
  unique (provider, event_id)
);

create index payment_events_payment_idx on public.payment_events (payment_id, created_at desc);
create index payment_events_unprocessed_idx on public.payment_events (created_at) where processed_at is null;

create trigger payment_events_append_only
  before delete on public.payment_events
  for each row execute function app.reject_mutation();

create table public.refunds (
  id            uuid primary key default gen_random_uuid(),
  payment_id    uuid not null references public.payments (id) on delete restrict,
  amount_minor  bigint not null,
  reason        text not null,
  provider_ref  text,
  status        text not null default 'pending',
  requested_by  uuid references auth.users (id) on delete set null,
  approved_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  constraint refunds_amount_positive check (amount_minor > 0),
  constraint refunds_status_values check (status in ('pending', 'approved', 'completed', 'failed', 'rejected'))
);

create index refunds_payment_idx on public.refunds (payment_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Government fee advances: money the customer gives us to pay an authority on
-- their behalf. It is not revenue and any unused balance is returned.
-- ---------------------------------------------------------------------------
create table public.government_fee_advances (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references public.cases (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  payment_id      uuid references public.payments (id) on delete set null,
  currency        public.currency_code not null default 'BDT',
  received_minor  bigint not null default 0,
  disbursed_minor bigint not null default 0,
  refunded_minor  bigint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint government_fee_advances_nonnegative
    check (received_minor >= 0 and disbursed_minor >= 0 and refunded_minor >= 0),
  constraint government_fee_advances_balance
    check (disbursed_minor + refunded_minor <= received_minor)
);

create index government_fee_advances_case_idx on public.government_fee_advances (case_id);

create trigger government_fee_advances_touch before update on public.government_fee_advances
  for each row execute function app.touch_updated_at();

create table public.government_disbursements (
  id              uuid primary key default gen_random_uuid(),
  advance_id      uuid not null references public.government_fee_advances (id) on delete restrict,
  case_id         uuid not null references public.cases (id) on delete restrict,
  authority_name  text not null,
  purpose         text not null,
  amount_minor    bigint not null,
  currency        public.currency_code not null default 'BDT',
  paid_on         date not null,
  challan_no      text,
  receipt_document_id uuid references public.documents (id) on delete set null,
  recorded_by     uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint government_disbursements_amount_positive check (amount_minor > 0)
);

create index government_disbursements_case_idx on public.government_disbursements (case_id, paid_on desc);
create index government_disbursements_advance_idx on public.government_disbursements (advance_id);

create table public.receipts (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references public.cases (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind            text not null,
  payment_id      uuid references public.payments (id) on delete set null,
  disbursement_id uuid references public.government_disbursements (id) on delete set null,
  document_id     uuid references public.documents (id) on delete set null,
  number          text,
  issued_on       date not null default current_date,
  amount_minor    bigint,
  currency        public.currency_code not null default 'BDT',
  created_at      timestamptz not null default now(),
  constraint receipts_kind_values check (kind in ('platform_payment', 'government_official', 'refund')),
  -- An official government receipt has to point at a real uploaded document.
  constraint receipts_official_needs_document
    check (kind <> 'government_official' or document_id is not null)
);

create index receipts_case_idx on public.receipts (case_id, issued_on desc);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.quotes enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_items enable row level security;
alter table public.engagement_acceptances enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;
alter table public.government_fee_advances enable row level security;
alter table public.government_disbursements enable row level security;
alter table public.receipts enable row level security;

-- Customers see quotes for their own cases, but only versions that were
-- actually sent to them — drafts and internal review stay internal.
create policy quotes_customer_read on public.quotes
  for select to authenticated
  using (organization_id in (select app.my_organization_ids()) and status <> 'draft');
create policy quotes_staff_read on public.quotes
  for select to authenticated using (app.is_platform_staff());
create policy quotes_finance_write on public.quotes
  for all to authenticated
  using (app.has_platform_role(array['finance', 'case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['finance', 'case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy quote_versions_customer_read on public.quote_versions
  for select to authenticated
  using (
    sent_at is not null
    and exists (select 1 from public.quotes q
                where q.id = quote_versions.quote_id
                  and q.organization_id in (select app.my_organization_ids()))
  );
create policy quote_versions_staff_read on public.quote_versions
  for select to authenticated using (app.is_platform_staff());
create policy quote_versions_finance_write on public.quote_versions
  for all to authenticated
  using (app.has_platform_role(array['finance', 'case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['finance', 'case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy quote_items_read on public.quote_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.quote_versions v
      join public.quotes q on q.id = v.quote_id
      where v.id = quote_items.quote_version_id
        and (
          (v.sent_at is not null and q.organization_id in (select app.my_organization_ids()))
          or app.is_platform_staff()
        )
    )
  );
create policy quote_items_finance_write on public.quote_items
  for all to authenticated
  using (app.has_platform_role(array['finance', 'case_manager', 'admin', 'super_admin']::public.platform_role[]))
  with check (app.has_platform_role(array['finance', 'case_manager', 'admin', 'super_admin']::public.platform_role[]));

create policy engagement_acceptances_read on public.engagement_acceptances
  for select to authenticated
  using (organization_id in (select app.my_organization_ids()) or app.is_platform_staff());
create policy engagement_acceptances_insert on public.engagement_acceptances
  for insert to authenticated
  with check (accepted_by = auth.uid() and app.is_case_customer(case_id));

create policy invoices_customer_read on public.invoices
  for select to authenticated
  using (organization_id in (select app.my_organization_ids()) and status <> 'draft');
create policy invoices_staff_read on public.invoices
  for select to authenticated using (app.is_platform_staff());
create policy invoices_finance_write on public.invoices
  for all to authenticated
  using (app.is_finance()) with check (app.is_finance());

create policy invoice_items_read on public.invoice_items
  for select to authenticated
  using (
    exists (select 1 from public.invoices i
            where i.id = invoice_items.invoice_id
              and ((i.status <> 'draft' and i.organization_id in (select app.my_organization_ids()))
                   or app.is_platform_staff()))
  );
create policy invoice_items_finance_write on public.invoice_items
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

create policy payments_customer_read on public.payments
  for select to authenticated using (organization_id in (select app.my_organization_ids()));
create policy payments_staff_read on public.payments
  for select to authenticated using (app.is_platform_staff());
-- Compliance can look but must not silently rewrite a finalised payment.
create policy payments_finance_write on public.payments
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

create policy payment_events_finance on public.payment_events
  for select to authenticated using (app.is_finance());
create policy payment_events_admin_insert on public.payment_events
  for insert to authenticated with check (app.is_admin());

create policy refunds_customer_read on public.refunds
  for select to authenticated
  using (
    exists (select 1 from public.payments p
            where p.id = refunds.payment_id
              and p.organization_id in (select app.my_organization_ids()))
  );
create policy refunds_finance on public.refunds
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

create policy government_fee_advances_customer_read on public.government_fee_advances
  for select to authenticated using (organization_id in (select app.my_organization_ids()));
create policy government_fee_advances_finance on public.government_fee_advances
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

create policy government_disbursements_read on public.government_disbursements
  for select to authenticated using (app.can_read_case(case_id));
create policy government_disbursements_finance on public.government_disbursements
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

create policy receipts_customer_read on public.receipts
  for select to authenticated using (organization_id in (select app.my_organization_ids()));
create policy receipts_staff_read on public.receipts
  for select to authenticated using (app.is_platform_staff());
create policy receipts_finance on public.receipts
  for all to authenticated using (app.is_finance()) with check (app.is_finance());
