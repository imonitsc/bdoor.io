# Retention reframe — adoption record and honest delta

Date: 1 Sep 2026. The founder's contract of this date replaced the 31 Aug
master instructions as Part I of `CLAUDE.md` (the old Part I is archived at
`docs/BDoor_Master_Instructions_2026-08-31.md`). This document records what
the reframe changes, how the existing schema maps onto the contract's
six-object domain model, and the conflicts §11 ("say when you disagree")
and the archived contract's own Working Rule 1 require flagging rather than
silently resolving.

## What the reframe changes

The governing sentence: _bdoor is not a company formation product; it is a
recurring compliance product that gives formation away free to acquire the
subscription._ The 31 Aug contract already made recurring compliance "the
core" revenue line, but kept **formation packages (one-time, tiered)** as
revenue line 1. The new contract removes that: formation is the free wedge,
and anything treating it as the revenue event is working against the
business. Retention is the load-bearing metric.

## Six-object domain model → current schema

| Contract object  | Current schema                                                                                                                                                                                                                                                                                                                                    | Fit     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Jurisdiction** | No `jurisdictions` table. Countries live as `char(2)` codes on rows plus a code-level catalog (`src/features/packages/`), and country pages render from that catalog data.                                                                                                                                                                        | Partial |
| **Entity**       | `public.companies` — long-lived, org-scoped, carries `bdoor_id` and the `business_profile_facts` provenance layer. No archive flag yet ("never deleted, only archived").                                                                                                                                                                          | Close   |
| **Rule**         | `public.ai_structured_rules` — per-topic, per-entity-type/sector requirements with `responsible_authority`, `legal_authority`, `effective_from`/`effective_to`, `superseded_by_id`, reviewer approval before publish, and fee figures that are unservable to customers until `government_fee_verified`. Provenance chains to the source registry. | Close   |
| **Obligation**   | `public.compliance_obligations` — rule instantiated per company with `due_on`, status machine, reminders (60/30/14/7/1-day), and already `source = 'verified_rule'` + `source_rule_ref` for rule-derived rows.                                                                                                                                    | Close   |
| **Filing**       | Not built. The workspace's §4.8 grouping deliberately omits Filed/Accepted because no filing-evidence object exists; the nearest thing is `evidence_document_id` on an obligation.                                                                                                                                                                | Gap     |
| **Case**         | `public.cases` — state machine, provider assignment with conflict checks, SLAs, take-rate-capable quotes.                                                                                                                                                                                                                                         | Close   |

The largest structural gaps, in the order the reframe prioritises them:

1. **Obligation auto-generation from rules** — obligations exist and can
   reference verified rules, but nothing yet walks the published rules
   corpus for an entity's jurisdiction/type/sector and instantiates its
   obligation set. This is the retention engine and the top build item.
2. **Filing as a first-class object** — evidence, reference numbers,
   discharge dates; unlocks the Filed/Accepted groups and, later, the
   underwriting story.
3. **Jurisdiction as data** — a `jurisdictions` table (fiscal-year start,
   timezone, currency, identifier types) so rules/obligations/pricing scope
   by `jurisdiction_code` rather than scattered `char(2)` defaults, and
   entity identifiers become a typed collection instead of fixed columns.

Already aligned, for the record: money is integer minor units + ISO code
throughout; rules are data with provenance and effective-dating, reviewable
in /admin/ai by a non-engineer; Ask refuses rather than improvises when
retrieval is empty and cites sources; RLS is on every table with
wrong-actor integration tests; documents are private-bucket, signed-URL.

## Conflicts flagged

1. **Free formation vs. the six published BDT packages.** The pricing page
   sells formation packages today at founder-approved prices, and the
   standing instruction (§13.1, unchanged) is that prices change only with
   founder approval. The new contract's framing implies formation goes
   free, but making it free **is a pricing change** — it is not made here.
   The published packages stand until the founder directs the change; when
   directed, the subscription (Comply) becomes the priced object.
2. **BanglaBiz Phase 2 and the §13 statistics** (300k RJSC entities, ~57k
   verified audits, ~10,225 registrations/year) are founder-supplied
   context. They are carried internally but must not reach customer-facing
   copy or the rules corpus without an official source and citation
   metadata, per the corpus provenance rule the contract itself sets in §4.
3. **Stack correction applied, not a conflict resolved silently**: the
   contract's stack table said "Anthropic API only"; reality is multi-model
   via the Vercel AI Gateway, which the founder's own BI-OS instruction
   (§6.1) directed. Corrected in the same PR as the contract's §2 note
   instructs; server-only routing is unchanged.
4. **`ai_structured_rules` naming.** The contract says rules are the moat,
   not the AI; the corpus currently lives under `ai_`-prefixed tables
   because it grew out of the Ask feature. The data already behaves as §4
   requires, so no migration is done for naming alone — a rename can ride
   the jurisdiction refactor if the founder wants it.

## Addendum — 1 Sep 2026, evening

The founder's site-grounded contract revision and `docs/ROADMAP.md` now
govern. Two things change against this document:

1. **Order.** The roadmap puts P0 — a purchasable Comply subscription —
   ahead of the rules/obligation engine (its P1, this document's gap #1).
   The engine remains the retention machinery; purchasability comes first.
2. **P0's "done" sits behind two founder inputs** that cannot be produced
   here: the BDT monthly/annual subscription amounts (prices are published
   only with founder approval), and the recorded approval to collect live
   payment (the standing legal gate). The machinery — plans, pricing-page
   section, attach-at-formation, existing-business entry — is buildable
   ahead of both.

The domain mapping and remaining flags above stand unchanged.

## Addendum — P0 increment shipped (machinery)

The purchase path now exists end to end: a customer owner subscribes from
/app/compliance, the subscription is born `pending_activation`, checkout
runs through the payments abstraction, and the webhook activates on a
verified payment (`activation_payment_id` + period row + `active`). The
prices needed no founder input after all — `subscription_plans` and the
catalogue have carried the approved figures (BDT 49,900/year; from BDT
11,900/month) since the fundable-core increment, and a parity test now
pins the two sources together. Surfaces: recurring pricing cards carry a
Subscribe door, `?segment=existing_business` deep-links the tab,
/products/comply publishes the two figures, and the dashboard offers
Comply when a case reaches approved/closed and no subscription exists.

Still gated or deliberately absent:

- **Payment go-live** remains behind `PAYMENTS_STATUS` /
  `BANGLADESH_CHECKOUT_STATUS` (both default disabled) and the recorded
  legal approval — the one founder input P0 still needs. Until then the
  workspace shows the plans with an honest "online payment is not open
  yet" line and no charge CTA.
- **P0.3 (Comply-included formation option)** is not built: a reduced or
  waived formation fee is a new price, and no approved figure exists.
- **Obligation pre-population at attach** rides P1's rules engine; today
  the offer opens the calendar the team maintains per case.
- Customer-side cancellation is an admin/contact path for now; only
  finance can change a subscription's status.

## Addendum — P1 increment shipped (rules as data)

The corpus can now say _when_, not only _what_. `ai_structured_rules`
carries `jurisdiction_code` plus five scheduling fields — a recurrence
(one_off / monthly / quarterly / annual) and a deadline anchor
(incorporation / fiscal_year_end / fixed_date / period_end) with an offset
in days — all nullable: a rule stays prose-only until the analyst who
verifies it structures the deadline, exactly as with fees. A new
`public_holidays` table (world-readable, compliance-writable) ships
empty because holiday dates are regulatory facts.

The engine (`src/features/compliance/rules-engine.ts`, pure and
table-tested) implements the /newobligation playbook: an ambiguous rule
never fires and is surfaced as "may apply"; due dates are calendar dates
computed against the jurisdiction's July–June fiscal year and
Friday–Saturday weekend; day-past-month-end clamps rather than rolling
over; weekend/holiday rolls refuse loudly (`missing_holiday_data`) for
any year the analyst-entered holiday set does not cover; plans are
deterministic and the unique index on (company, rule version, due date)
makes regeneration a no-op. Subscription activation in the payment
webhook now calls generation for the organisation's companies.

What this deliberately does not do yet:

- **Generates nothing today.** No published rule carries scheduling
  fields and `public_holidays` is empty; the first analyst pass over the
  corpus (structure the deadline, enter the gazetted holidays) is the
  switch that turns the calendar on. Verification remains a human act.
- **Supersession regeneration is manual.** Publishing a superseding rule
  does not yet rewrite future obligations from the old version; past
  periods are never touched by design.
- **Sector scoping waits on entity data.** Companies carry no sector, so
  any sector-scoped rule resolves "may apply — confirm" rather than
  firing. Companies also carry no jurisdiction column yet — they are
  Bangladesh by construction (RJSC structure vocabulary) and generation
  states that assumption in one place.
- **Bengali rule labels ride P2.** Both obligation labels carry the
  reviewed English title; regulatory terms are never machine-translated.
