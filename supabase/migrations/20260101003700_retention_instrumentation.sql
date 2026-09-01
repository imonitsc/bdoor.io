-- ---------------------------------------------------------------------------
-- Instrument retention before anything else scales (ROADMAP P4).
--
-- Three views, all SECURITY INVOKER: the caller's own RLS decides what they
-- aggregate (staff read policies exist on every underlying table), and the
-- metrics capability decides who reaches the page that renders them. No
-- SECURITY DEFINER, no new grants, no new write paths.
--
-- Definitions live in docs/METRIC_DEFINITIONS.md. The load-bearing choice:
-- retention is computed from subscription_periods — the billed record of
-- what was actually delivered — never from the mutable `status` column,
-- because a point-in-time status cannot be reconstructed later and a
-- retention number that changes when a row is edited is not a metric.
--
-- Also: two instrumentation-ready columns on compliance_reminders. The
-- reminder DISPATCHER does not exist yet (scheduling logic does); when it
-- lands it stamps sent_at (already present), records the in-app
-- notification it created, and the notification read handler stamps
-- opened_at. The engagement funnel below reads them from day one and
-- honestly shows zero until then.
--
-- Reversal: drop the three views and the two columns.
-- ---------------------------------------------------------------------------

alter table public.compliance_reminders
  add column notification_id uuid references public.notifications (id) on delete set null,
  add column opened_at timestamptz;

comment on column public.compliance_reminders.opened_at is
  'When the customer opened the reminder (in-app notification read, or email open where measurable). Stamped by the dispatcher/read handler; NULL until those land.';

-- ---------------------------------------------------------------------------
-- P4.1 — Monthly cohort logo retention for Comply subscriptions.
--
-- Cohort: the month an organisation''s FIRST subscription activated.
-- Retained at month N: some paid or waived service period overlaps calendar
-- month (cohort + N). Waived counts as retained — the logo stayed; revenue
-- retention is a different metric. Sandbox-activated subscriptions are test
-- traffic and excluded, as everywhere in metrics (§13.7).
--
-- The "done when" question — month-3 logo retention for subscribers who
-- onboarded in July —
--   select * from metrics_comply_retention
--   where cohort_month = '2026-07-01' and months_since = 3;
-- ---------------------------------------------------------------------------
create view public.metrics_comply_retention
with (security_invoker = true) as
with cohorts as (
  select s.organization_id,
         (date_trunc('month', min(s.started_at)))::date as cohort_month
  from public.subscriptions s
  left join public.payments ap on ap.id = s.activation_payment_id
  where s.started_at is not null
    and coalesce(ap.is_sandbox, false) = false
  group by s.organization_id
),
served as (
  select s.organization_id, p.period_start, p.period_end
  from public.subscription_periods p
  join public.subscriptions s on s.id = p.subscription_id
  where p.status in ('paid', 'waived')
),
grid as (
  select c.organization_id, c.cohort_month, gs.months_since
  from cohorts c
  cross join lateral generate_series(0, 24) as gs (months_since)
  where (c.cohort_month + make_interval(months => gs.months_since))::date
        <= (date_trunc('month', now()))::date
)
select g.cohort_month,
       g.months_since,
       count(*) filter (
         where exists (
           select 1
           from served v
           where v.organization_id = g.organization_id
             and v.period_start < (g.cohort_month + make_interval(months => g.months_since + 1))::date
             and v.period_end   > (g.cohort_month + make_interval(months => g.months_since))::date
         )
       ) as retained_organizations,
       count(*) as cohort_organizations,
       round(
         count(*) filter (
           where exists (
             select 1
             from served v
             where v.organization_id = g.organization_id
               and v.period_start < (g.cohort_month + make_interval(months => g.months_since + 1))::date
               and v.period_end   > (g.cohort_month + make_interval(months => g.months_since))::date
           )
         )::numeric / count(*),
         4
       ) as retention_rate
from grid g
group by g.cohort_month, g.months_since
order by g.cohort_month, g.months_since;

comment on view public.metrics_comply_retention is
  'Monthly cohort logo retention for Comply (ROADMAP P4.1), from paid/waived subscription_periods. SECURITY INVOKER: staff RLS applies. Definition in docs/METRIC_DEFINITIONS.md.';

-- ---------------------------------------------------------------------------
-- P4.2 — Obligation-level engagement, by due month.
--
-- reminded: at least one reminder actually sent (sent_at).
-- opened:   at least one sent reminder opened (opened_at; zero until the
--           dispatcher and read handler land — see column comments).
-- acted:    the obligation left upcoming/due/overdue by a customer or staff
--           act (in_progress, completed or waived).
-- filed:    completed.
-- The drop-off between adjacent columns is the product roadmap.
-- ---------------------------------------------------------------------------
create view public.metrics_obligation_engagement
with (security_invoker = true) as
select (date_trunc('month', o.due_on))::date as due_month,
       count(*) as obligations,
       count(*) filter (where exists (
         select 1 from public.compliance_reminders r
         where r.obligation_id = o.id and r.sent_at is not null
       )) as reminded,
       count(*) filter (where exists (
         select 1 from public.compliance_reminders r
         where r.obligation_id = o.id and r.opened_at is not null
       )) as opened,
       count(*) filter (where o.status in ('in_progress', 'completed', 'waived')) as acted,
       count(*) filter (where o.status = 'completed') as filed
from public.compliance_obligations o
group by 1
order by 1;

comment on view public.metrics_obligation_engagement is
  'Reminder sent → opened → acted → filed per due month (ROADMAP P4.2). SECURITY INVOKER. Definition in docs/METRIC_DEFINITIONS.md.';

-- ---------------------------------------------------------------------------
-- P4.3 — Renewal-case conversion: the marketplace take rate.
--
-- offered:  a renewal case created from an obligation.
-- accepted: its case moved past draft and was not cancelled — the customer
--           took the offer. A later authority rejection still counts as
--           accepted; the filing failing is not the offer failing.
-- completed: approved or closed.
-- Reads zero until renewal-case generation exists — instrumented first, per
-- the P4 ordering, so the number is never retrofitted.
-- ---------------------------------------------------------------------------
create view public.metrics_renewal_conversion
with (security_invoker = true) as
select (date_trunc('month', r.created_at))::date as offered_month,
       count(*) as offered,
       count(*) filter (where c.status not in ('draft', 'cancelled')) as accepted,
       count(*) filter (where c.status in ('approved', 'closed')) as completed
from public.renewal_cases r
join public.cases c on c.id = r.case_id
group by 1
order by 1;

comment on view public.metrics_renewal_conversion is
  'Renewal-case offered → accepted → completed per month (ROADMAP P4.3). SECURITY INVOKER. Definition in docs/METRIC_DEFINITIONS.md.';
