# Metric definitions

Versioned definitions for every investor-facing number (master instruction
§13). The formulas live in `src/features/metrics/formulas.ts` as pure,
unit-tested functions; the same definitions are seeded into
`public.metric_definitions` so a dashboard or export can cite the exact
version a number was computed under. Changing a formula means a **new
version row**, never a silent edit — `metric_definitions` is append-only.

All revenue figures are integer minor units (poisha) in BDT unless stated.
Every input query excludes `is_test` events, seed organisations and sandbox
payments (`payments.is_sandbox = true`).

## Definitions (v1, 2026-08-30)

| Key                       | Definition                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gross_transaction_value` | Sum of `payments.amount_minor` with status `paid`/`partially_refunded`/`refunded`, before refunds, including pass-through.                                                                                   |
| `collected_cash`          | Gross transaction value minus `refunded_minor`.                                                                                                                                                              |
| `pass_through_fees`       | Sum of accepted-quote `pass_through_minor` attributable to paid invoices — government/statutory money that is not bdoor revenue.                                                                             |
| `net_revenue`             | Collected cash minus pass-through fees.                                                                                                                                                                      |
| `gross_margin`            | `(net_revenue − direct_delivery_costs) / net_revenue`. Direct delivery costs = provider costs + payment fees recorded against cases.                                                                         |
| `contribution_margin`     | `net_revenue − provider_costs − payment_fees − case_variable_costs`.                                                                                                                                         |
| `mrr`                     | Sum over subscriptions with status `active` of the period-normalised amount: monthly plans as-is, annual plans ÷ 12.                                                                                         |
| `arr`                     | `mrr × 12`.                                                                                                                                                                                                  |
| `cac`                     | `attributable_acquisition_spend / new_paying_customers` in the window. Spend is entered by finance (no ad platforms are connected); until a spend record exists CAC reports "no spend recorded", never 0.    |
| `cac_payback_months`      | `cac / average_monthly_gross_profit_per_new_customer`.                                                                                                                                                       |
| `renewal_rate`            | `renewed_eligible_subscriptions / subscriptions_due_for_renewal` in the window.                                                                                                                              |
| `funnel_*`                | Counts of taxonomy events (`application_started`, `application_submitted`, `quote_issued`, `quote_accepted`, `payment_confirmed`, `case_completed`) with `is_test = false`, deduplicated by idempotency key. |

## Exclusion rules (§13.7)

Excluded from every metric: `analytics_events.is_test = true`, payments with
`is_sandbox = true`, organisations whose name carries the seed suffix
`(sample)`, and staff rehearsal accounts flagged via test-email patterns.
The exclusion predicates are part of the definition version.

## Snapshots

`public.metric_snapshots` records a monthly, append-only copy of the computed
values with the definition version used, who computed it and when. Snapshots
are the numbers used in investor conversations; the live dashboard recomputes
on demand and may differ from a snapshot as late data arrives — the snapshot
is never edited to match.

## Retention instrumentation (ROADMAP P4)

Three SECURITY INVOKER views, added 1 Sep 2026; the caller's staff RLS is
what aggregates. Fixture-asserted in `tests/integration/retention-metrics.test.ts`.

| Metric                          | Definition                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metrics_comply_retention`      | Monthly cohort **logo retention**. Cohort = the month an organisation's first subscription activated (`started_at`), sandbox activations excluded. Retained at month N = some `subscription_periods` row with status `paid` or `waived` overlaps calendar month (cohort + N). Computed from the billed record, never the mutable `status` column, so the number is reconstructable forever. |
| `metrics_obligation_engagement` | Per due month: obligations, reminded (a reminder with `sent_at`), opened (`opened_at`, stamped when the customer follows the reminder link into the calendar — a click-through, not a bulk mark-all-read; in-app only, so email reminders do not yet contribute to either column), acted (status `in_progress`/`completed`/`waived`), filed (`completed`).                                  |
| `metrics_renewal_conversion`    | Per offered month: offered = renewal cases created; accepted = case moved past `draft` and not `cancelled` (an authority rejection still counts as accepted — the filing failing is not the offer failing); completed = `approved` or `closed`. Reads zero until renewal-case generation exists.                                                                                            |

The P4 "done when" query — month-3 logo retention for subscribers who
onboarded in July:

```sql
select retention_rate from public.metrics_comply_retention
where cohort_month = '2026-07-01' and months_since = 3;
```
