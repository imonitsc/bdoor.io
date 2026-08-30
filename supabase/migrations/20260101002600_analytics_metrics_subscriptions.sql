-- =============================================================================
-- Fundable-startup core (master instruction 2026-08-30, Phases 0–1).
--
-- Three additions, all additive:
--   1. Recurring-revenue records: plans, subscriptions, service periods. A
--      subscription can never be 'active' without a verified payment or a
--      staff-recorded offline payment — the check constraint enforces what the
--      brief states in §7.2.
--   2. First-party analytics events (§22): server-side, idempotent, test data
--      flagged at write time so investor metrics can exclude it (§13.7).
--   3. Metric definitions and monthly snapshots (§13): append-only, versioned.
--
-- Plus the small state-machine deltas from §8, mapped in
-- docs/fundable-baseline.md: payment_status gains 'processing'/'disputed',
-- quote_status gains 'rejected', quote_versions gains viewed_at + FX stamps.
--
-- Rollback: drop the new tables/policies/functions, drop the new
-- quote_versions columns. The enum additions are permanent (Postgres cannot
-- drop enum values) but harmless — nothing writes them until the code does.
-- =============================================================================

-- New enum values may not be *used* in this migration (same-transaction rule).
alter type public.payment_status add value if not exists 'processing';
alter type public.payment_status add value if not exists 'disputed';
alter type public.quote_status add value if not exists 'rejected';

-- Viewed is a fact about an issued version, not a different lifecycle state.
alter table public.quote_versions
  add column viewed_at timestamptz,
  add column fx_source text,
  add column fx_rate numeric(18, 8),
  add column fx_quoted_at timestamptz;

-- When a converted amount is displayed the whole stamp is recorded, or none.
alter table public.quote_versions
  add constraint quote_versions_fx_stamp check (
    ((fx_source is null)::int + (fx_rate is null)::int + (fx_quoted_at is null)::int) in (0, 3)
  );

-- ---------------------------------------------------------------------------
-- Subscription plans. Amounts mirror the approved commercial baseline that
-- the package catalogue already publishes; the plan row is the contractual
-- record a subscription bills against, versioned by row like package_versions.
-- ---------------------------------------------------------------------------
create table public.subscription_plans (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null,
  version            integer not null default 1,
  service_package_id uuid references public.service_packages (id) on delete set null,
  name_en            text not null,
  name_bn            text not null,
  billing_period     text not null,
  amount_minor       bigint not null,
  currency           public.currency_code not null default 'BDT',
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (code, version),
  constraint subscription_plans_period_values check (billing_period in ('month', 'year')),
  constraint subscription_plans_amount_positive check (amount_minor > 0)
);

create trigger subscription_plans_touch before update on public.subscription_plans
  for each row execute function app.touch_updated_at();

-- The two recurring plans from the approved baseline (§7.1); same figures the
-- package catalogue publishes. A price change is a new version row.
insert into public.subscription_plans
  (code, version, service_package_id, name_en, name_bn, billing_period, amount_minor)
values
  ('annual-compliance', 1,
   (select id from public.service_packages where slug = 'annual-compliance'),
   'Annual Compliance', 'বার্ষিক কমপ্লায়েন্স', 'year', 4990000),
  ('managed-finance-compliance', 1,
   (select id from public.service_packages where slug = 'managed-finance-compliance'),
   'Managed Finance & Compliance', 'ম্যানেজড ফাইন্যান্স ও কমপ্লায়েন্স', 'month', 1190000);

-- ---------------------------------------------------------------------------
-- Subscriptions. Status machine is deliberately small; the trigger rejects
-- jumps and the check constraint makes an unpaid 'active' impossible however
-- the row is written.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  organization_id             uuid not null references public.organizations (id) on delete restrict,
  plan_id                     uuid not null references public.subscription_plans (id) on delete restrict,
  status                      text not null default 'pending_activation',
  started_at                  timestamptz,
  current_period_start        date,
  current_period_end          date,
  cancelled_at                timestamptz,
  cancel_reason               text,
  activation_payment_id       uuid references public.payments (id) on delete set null,
  offline_payment_reference   text,
  offline_payment_verified_by uuid references auth.users (id) on delete set null,
  offline_payment_verified_at timestamptz,
  created_by                  uuid references auth.users (id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint subscriptions_status_values check (
    status in ('pending_activation', 'active', 'past_due', 'paused', 'cancelled')
  ),
  -- §7.2: never active until payment or an authorised offline record is
  -- verified. Absence of both keeps the row in pending_activation forever.
  constraint subscriptions_active_needs_verified_payment check (
    status not in ('active', 'past_due', 'paused')
    or activation_payment_id is not null
    or (offline_payment_reference is not null
        and offline_payment_verified_by is not null
        and offline_payment_verified_at is not null)
  ),
  constraint subscriptions_active_needs_start check (
    status not in ('active', 'past_due', 'paused') or started_at is not null
  ),
  constraint subscriptions_cancelled_shape check (
    status <> 'cancelled' or cancelled_at is not null
  )
);

create index subscriptions_org_idx on public.subscriptions (organization_id, created_at desc);
create index subscriptions_status_idx on public.subscriptions (status)
  where status in ('active', 'past_due');

create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function app.touch_updated_at();

create or replace function app.enforce_subscription_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then
    return new;
  end if;
  if (old.status = 'pending_activation' and new.status in ('active', 'cancelled'))
     or (old.status = 'active' and new.status in ('past_due', 'paused', 'cancelled'))
     or (old.status = 'past_due' and new.status in ('active', 'cancelled'))
     or (old.status = 'paused' and new.status in ('active', 'cancelled')) then
    return new;
  end if;
  raise exception 'invalid subscription transition: % -> %', old.status, new.status;
end;
$$;

create trigger subscriptions_enforce_transition
  before update on public.subscriptions
  for each row execute function app.enforce_subscription_transition();

-- ---------------------------------------------------------------------------
-- Service periods: what a subscription actually delivered and billed, one row
-- per period, so renewal rate and revenue retention have real denominators.
-- ---------------------------------------------------------------------------
create table public.subscription_periods (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  period_start    date not null,
  period_end      date not null,
  amount_minor    bigint not null,
  currency        public.currency_code not null default 'BDT',
  status          text not null default 'scheduled',
  invoice_id      uuid references public.invoices (id) on delete set null,
  payment_id      uuid references public.payments (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (subscription_id, period_start),
  constraint subscription_periods_range check (period_end > period_start),
  constraint subscription_periods_status_values check (
    status in ('scheduled', 'invoiced', 'paid', 'waived')
  ),
  constraint subscription_periods_amount_nonnegative check (amount_minor >= 0)
);

create index subscription_periods_subscription_idx
  on public.subscription_periods (subscription_id, period_start desc);

-- ---------------------------------------------------------------------------
-- First-party analytics events. Written exclusively with the service role
-- from Server Actions, route handlers and webhooks — there is no insert
-- policy for anon or authenticated, so the Data API cannot fabricate a
-- commercial milestone whatever a client sends.
--
-- The event_name list mirrors ANALYTICS_EVENTS in
-- src/lib/analytics/taxonomy.ts; tests/unit/analytics-taxonomy.test.ts parses
-- this constraint and fails if the two drift.
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id               uuid primary key default gen_random_uuid(),
  event_name       text not null,
  occurred_at      timestamptz not null default now(),
  idempotency_key  text not null,
  is_test          boolean not null default false,
  organization_id  uuid references public.organizations (id) on delete set null,
  case_id          uuid references public.cases (id) on delete set null,
  application_id   uuid references public.applications (id) on delete set null,
  quote_version_id uuid references public.quote_versions (id) on delete set null,
  payment_id       uuid references public.payments (id) on delete set null,
  subscription_id  uuid references public.subscriptions (id) on delete set null,
  country          text,
  locale           public.locale_code,
  package_slug     text,
  source_path      text,
  utm              jsonb not null default '{}'::jsonb,
  properties       jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  constraint analytics_events_name_values check (
    event_name in (
      'application_started',
      'application_submitted',
      'contact_submitted',
      'provider_application_submitted',
      'provider_application_approved',
      'provider_assignment_accepted',
      'quote_issued',
      'quote_viewed',
      'quote_accepted',
      'payment_confirmed',
      'case_completed',
      'subscription_started',
      'subscription_renewed'
    )
  )
);

create unique index analytics_events_idempotency_idx
  on public.analytics_events (idempotency_key);
create index analytics_events_funnel_idx
  on public.analytics_events (event_name, occurred_at desc)
  where is_test = false;
create index analytics_events_occurred_idx on public.analytics_events (occurred_at);

-- Milestones are history: no update or delete path, even for super_admin.
create trigger analytics_events_append_only
  before update or delete on public.analytics_events
  for each row execute function app.reject_mutation();

-- ---------------------------------------------------------------------------
-- Metric definitions (§13.3): the formula a number was computed under, by
-- version. Changing a formula is a new version row; the old one stays.
-- ---------------------------------------------------------------------------
create table public.metric_definitions (
  id             uuid primary key default gen_random_uuid(),
  key            text not null,
  version        integer not null,
  formula        text not null,
  notes          text,
  effective_from date not null default current_date,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (key, version)
);

create trigger metric_definitions_append_only
  before update or delete on public.metric_definitions
  for each row execute function app.reject_mutation();

insert into public.metric_definitions (key, version, formula, notes) values
  ('gross_transaction_value', 1,
   'sum(payments.amount_minor) where status in (paid, partially_refunded, refunded) and is_sandbox = false',
   'Before refunds, includes pass-through money.'),
  ('collected_cash', 1,
   'gross_transaction_value - sum(payments.refunded_minor)', null),
  ('pass_through_fees', 1,
   'sum(accepted quote_versions.pass_through_minor attributable to paid invoices)',
   'Government and statutory money; never bdoor revenue.'),
  ('net_revenue', 1, 'collected_cash - pass_through_fees', null),
  ('gross_margin', 1, '(net_revenue - direct_delivery_costs) / net_revenue', null),
  ('contribution_margin', 1,
   'net_revenue - provider_costs - payment_fees - case_variable_costs', null),
  ('mrr', 1,
   'sum over active subscriptions of amount_minor normalised to a month (year plans / 12)',
   null),
  ('arr', 1, 'mrr * 12', null),
  ('cac', 1, 'attributable_acquisition_spend / new_paying_customers',
   'Reports "no spend recorded" until finance enters spend; never 0.'),
  ('cac_payback_months', 1, 'cac / average_monthly_gross_profit_per_new_customer', null),
  ('renewal_rate', 1, 'renewed_eligible_subscriptions / subscriptions_due_for_renewal', null),
  ('funnel_counts', 1,
   'count of taxonomy events with is_test = false, deduplicated by idempotency_key',
   'Exclusions: is_test events, sandbox payments, (sample) seed organisations.');

-- ---------------------------------------------------------------------------
-- Monthly snapshots (§14): the numbers shown to investors. Append-only; a
-- recomputation is a new row, never an edit, and every row names its author.
-- ---------------------------------------------------------------------------
create table public.metric_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  month               date not null,
  payload             jsonb not null,
  definitions_version integer not null default 1,
  note                text,
  computed_by         uuid references auth.users (id) on delete set null,
  computed_at         timestamptz not null default now(),
  constraint metric_snapshots_month_is_first check (extract(day from month) = 1)
);

create index metric_snapshots_month_idx on public.metric_snapshots (month desc, computed_at desc);

create trigger metric_snapshots_append_only
  before update or delete on public.metric_snapshots
  for each row execute function app.reject_mutation();

-- ---------------------------------------------------------------------------
-- Capabilities for the metrics module, mirrored in src/lib/permissions/roles.ts
-- (the authorization-core drift test holds the two together).
-- ---------------------------------------------------------------------------
insert into public.permission_catalog (key, category, description, requires_aal2) values
  ('metrics.read', 'platform', 'Read the internal investor-metrics dashboard.', false),
  ('metrics.snapshot', 'platform', 'Record a monthly metric snapshot.', false);

-- The template bundles mirror PLATFORM_CAPABILITIES for the roles that gained
-- the metrics capabilities; the authorization-core test compares the two.
insert into public.role_template_permissions (template_code, permission_key)
select roles.code, perms.key
from (values ('finance'), ('admin'), ('super_admin')) as roles (code)
cross join (values ('metrics.read'), ('metrics.snapshot')) as perms (key);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_periods enable row level security;
alter table public.analytics_events enable row level security;
alter table public.metric_definitions enable row level security;
alter table public.metric_snapshots enable row level security;

-- Plans are commercial catalogue: readable like published pricing. The staff
-- policy is separate because anon may not execute app.is_platform_staff().
create policy subscription_plans_read on public.subscription_plans
  for select to anon, authenticated using (is_active);
create policy subscription_plans_staff_read on public.subscription_plans
  for select to authenticated using (app.is_platform_staff());
create policy subscription_plans_finance_write on public.subscription_plans
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

create policy subscriptions_customer_read on public.subscriptions
  for select to authenticated
  using (organization_id in (select app.my_organization_ids()));
create policy subscriptions_staff_read on public.subscriptions
  for select to authenticated using (app.is_platform_staff());
create policy subscriptions_finance_write on public.subscriptions
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

create policy subscription_periods_read on public.subscription_periods
  for select to authenticated
  using (
    exists (select 1 from public.subscriptions s
            where s.id = subscription_periods.subscription_id
              and (s.organization_id in (select app.my_organization_ids())
                   or app.is_platform_staff()))
  );
create policy subscription_periods_finance_write on public.subscription_periods
  for all to authenticated using (app.is_finance()) with check (app.is_finance());

-- Events: staff with the metrics roles read; nobody inserts through the Data
-- API (service-role writes only, from the server-side recorder).
create policy analytics_events_metrics_read on public.analytics_events
  for select to authenticated
  using (app.has_platform_role(array['finance', 'admin', 'super_admin']::public.platform_role[]));

create policy metric_definitions_staff_read on public.metric_definitions
  for select to authenticated using (app.is_platform_staff());
create policy metric_definitions_finance_insert on public.metric_definitions
  for insert to authenticated with check (app.is_finance());

create policy metric_snapshots_metrics_read on public.metric_snapshots
  for select to authenticated
  using (app.has_platform_role(array['finance', 'admin', 'super_admin']::public.platform_role[]));
create policy metric_snapshots_finance_insert on public.metric_snapshots
  for insert to authenticated
  with check (app.is_finance() and computed_by = auth.uid());

comment on table public.analytics_events is
  'First-party commercial milestones (master instruction §22). Service-role '
  'writes only; idempotent by key; is_test rows are excluded from every metric.';
comment on table public.subscriptions is
  'Recurring compliance subscriptions (§7.2). Active requires a verified '
  'payment or a staff-verified offline payment record — constraint-enforced.';
comment on table public.metric_snapshots is
  'Append-only monthly investor metrics (§14). A recomputation is a new row.';
