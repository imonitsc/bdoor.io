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

## Addendum — P2 increment shipped (Ask as the Comply funnel)

Ask's exits stop pointing only at formation. What changed:

1. **Rules are citable.** `rulesForQuestion` already fed published rules
   into the prompt; they now appear in the citation list too, numbered
   after the documents, each carrying its responsible authority, legal
   basis and the reviewer's sign-off date — the per-rule review date the
   roadmap requires deadline answers to carry. A retrieval that finds
   only rules no longer records a false `no_match`.
2. **The Comply exit.** When a cited rule carries an analyst-set
   recurrence, the answer ends with "Track this for your company" →
   `/app/compliance?track=<ruleId>`. The exit never fires off an
   inference: recurrence is a P1 scheduling fact a human entered, so
   today — with the corpus unscheduled — the button exists and waits for
   the first structured rules, exactly like the P1 engine.
3. **The existing-entity entry.** /app/compliance shows the tracked rule
   and, for an organisation with no company yet, a one-form entry (legal
   name, structure, optional incorporation date) that inserts the company
   under the existing `companies_org_member` RLS and immediately runs P1
   generation. The "Check annual compliance" starter on /ask routes here
   instead of submitting its label as a question.
4. **The funnel is measured.** `ai_messages.rule_ids` records which rules
   grounded each answer (question → retrieval was already logged);
   `ask_comply_exit` stamps one arrival per organisation and rule;
   `comply_company_tracked` stamps each company added. Unanswered
   questions continue to land in `ai_unanswered_questions` as the ledger
   backlog.

One harness correction found on the way: the local `supabase-shim.sql`
never granted `usage on schema extensions` to the API roles, so any
customer insert touching `companies.bdoor_id` (whose default calls
`extensions.gen_random_bytes`) failed locally with 42501 while working on
real Supabase. The shim now mirrors Supabase's default grant.

Deliberately absent: identifier-led import (RJSC number, e-TIN, BIN) is
P3; the tracked-rule card names the rule but never invents an obligation
for it — the calendar shows only what published, scheduled rules
generate.

## Addendum — P3 increment shipped (identifier-led import)

The existing-entity entry now imports, not just names, a company:

1. **Identifiers.** The track form collects the RJSC registration number,
   e-TIN and BIN into the columns the schema has carried since day one.
   Validation is deliberately permissive — registry formats are regulatory
   facts, and an over-strict pattern would lock a real company out of its
   own calendar. The platform-wide unique registration number returns an
   honest "already tracked" error instead of a silent failure.
2. **Sector, as a data contract.** `companies.sector` and
   `ai_structured_rules.sectors` are both constrained to one shared
   vocabulary (fourteen tokens, `src/features/compliance/sectors.ts`,
   drift-tested against both check constraints). This is a correctness
   requirement: the engine excludes silently on a sector mismatch, so an
   out-of-vocabulary spelling on either side would invisibly suppress a
   real obligation. "Unsure" maps to NULL and sector-scoped rules then
   surface "may apply — confirm". The production corpus held zero
   sector-scoped rules, so the constraint binds from day one.
3. **Generation matches on sector** — `EntityFacts.sector` is now the
   company's own answer rather than a hardcoded null.

Deliberately absent, and why:

- **Registry lookup pre-fill (roadmap P3.2 first clause).** RJSC/NBR
  expose no public lookup API; per the no-invented-credentials rule this
  ships as customer-confirmed facts, and a lookup adapter (mock default)
  can be added the day an official interface exists.
- **UAE same-shape import (P3.3).** Blocked on jurisdiction-typed entity
  vocabulary: `companies.structure` is check-constrained to the six RJSC
  tokens and companies carry no jurisdiction column, so a UAE entity
  cannot yet be represented at all. That refactor (typed identifier
  collection per §6 included) belongs with the P5 jurisdiction template
  work, not squeezed in here.

## Addendum — P4 increment shipped (retention instrumentation)

The numbers the reframe stands on are now queryable from customer one:

1. **Cohort logo retention** (`metrics_comply_retention`). Cohort = the
   month an organisation's first subscription activated; retained at
   month N = a paid or waived service period overlaps that calendar
   month. Computed from `subscription_periods` — the billed record —
   never from the mutable status column, so the figure is
   reconstructable forever; sandbox activations are excluded. The
   roadmap's "done when" is literally one query (docs/METRIC_DEFINITIONS.md).
2. **Obligation engagement** (`metrics_obligation_engagement`): reminded
   → opened → acted → filed per due month. `compliance_reminders` gains
   `notification_id` and `opened_at` ahead of the reminder dispatcher —
   which still does not exist (scheduling logic does, sending does not)
   and is now the clearest operational gap the funnel itself exposes.
3. **Renewal conversion** (`metrics_renewal_conversion`): offered →
   accepted → completed. Renewal-case generation also does not exist
   yet; the take rate is instrumented first, per the P4 ordering, so it
   is measured from the very first case.

All three are SECURITY INVOKER views (staff RLS aggregates; no new
grants, no SECURITY DEFINER), rendered on /admin/metrics behind
`metrics.read`, and fixture-asserted in integration tests.

Not included, and why: a jurisdiction dimension on the cohort view —
entities carry no jurisdiction column yet (BD by construction), so the
dimension would be a hardcoded constant; it becomes real with the
jurisdiction-typed entity work (P5). Today "BD Comply subscribers" is
all subscribers, and the query still answers exactly.

## Addendum — P5 increment shipped (one country template, confirmed and finished)

The roadmap premise was wrong and the code was right. "UAE is fully
built and is the right shape; the other five vary" — in fact all six
international pages already rendered from one template
(`countries/[country]/page.tsx`, `generateStaticParams` over the
catalog) with zero country-specific components. Per the contract's own
rule (the code is the fact and the doc is the bug), CLAUDE.md §6 and
ROADMAP P5 are corrected in this increment rather than a rebuild
performed. What actually varied was data completeness and drift around
the template:

1. **Navigation and sitemap now derive from the catalog.** The footer's
   six country rows and the sitemap's seven country paths were hardcoded
   in `src/lib/navigation.ts` — the exact edit surface that made a
   seventh country a multi-file task. `countryFooterLinks()` and
   `countrySitemapEntries()` in `src/content/international.ts` now feed
   both, and `tests/unit/country-navigation.test.ts` is the tripwire:
   it fails if a `/countries/*` path is ever hardcoded back into
   `SITEMAP_ROUTES`, and it pins the six footer names the e2e audit
   checks, at unit speed.
2. **Ongoing obligations become a view over published rules.** The
   section on each country page now renders the jurisdiction's published
   rules corpus — each rule with its responsible authority and its own
   review date (P1.3's per-rule review dates reach the public pages) —
   and falls back to the human-reviewed guide prose while the corpus is
   empty. Today it is empty for every jurisdiction, so every rendered
   page is byte-identical until analysts publish rules; the read is
   through the cookie-free public client, so the pages stay statically
   renderable, and a build-time query failure degrades to the prose.
3. **Dead module removed.** `src/features/countries/queries.ts` — a
   zero-import Supabase read with a five-country all-"coming soon"
   snapshot fallback that contradicted the catalog — is deleted.

Flagged for the founder, not changed: the KSA and Qatar route fees are
quoted in USD, which violates §6's local-currency rule — but restating
them in SAR/QAR is a new price figure, and prices publish only with
founder approval. Named local providers on country pages remain
unimplemented (the provider section is a generic disclosure); the
jurisdiction-typed entity vocabulary that unblocks UAE import and the
retention jurisdiction dimension remains open.

No migration in this increment; nothing to apply post-merge.

## Addendum — R1 shipped (the reminder dispatcher)

P4 instrumented reminded → opened → acted → filed and recorded that the
first two columns would read zero until a dispatcher existed. This is
that dispatcher, and it is the first increment where the machine acts on
a customer rather than only recording one.

What was actually missing was smaller than it looked and more damaging.
`scheduleReminders()` — which offsets, on which channel, on which date —
had been written, tested and left unwired since the lifecycle migration.
Nothing inserted a `compliance_reminders` row. Nothing inserted a
`notifications` row anywhere in the codebase. So Comply's published
promise, "Reminders that lead the deadline", was carried entirely by an
obligations page the customer had to remember to visit.

1. **Materialise, then send** (`reminder-dispatch.ts`), the two-phase
   shape the ingestion queue already established. A daily cron
   (`/api/compliance/reminders`, `30 2 * * *`) creates the reminder rows
   for obligations coming due, then delivers the in-app ones. Both
   phases are idempotent — materialisation on the table's own
   `unique (obligation_id, offset_days, channel)`, sending on a
   `sent_at is null` claim guard — so a retry or two overlapping ticks
   cost nothing and can never remind anyone twice. The route refuses
   (503) without `CRON_SECRET` rather than defaulting open.
2. **The published promise is the specification.** "Ahead of every due
   date — never five at once" is now two testable properties:
   `triageReminders` (pure, unit-tested) retires rather than sends when
   the deadline has passed, when the obligation was filed or waived, or
   when a backlog would arrive as a burst after an outage; and
   everything due for one recipient in one run becomes a single
   notification listing the deadlines, not one per obligation.
3. **"Opened" is a click-through**, stamped when the customer follows
   the reminder link into their calendar — the same landing-stamp
   precedent the Ask→Comply exit uses — rather than a bulk
   mark-all-read, which would measure a button instead of attention.
   An integration test pins that a customer can read their reminders
   but can write neither `sent_at` nor `opened_at`: the subject of a
   metric must not be able to inflate it.

**Email is deliberately still unsent.** The only implemented email
adapter is the mock, and stamping `sent_at` because a mock logged a line
would make `metrics_obligation_engagement` report reminders that reached
nobody — the precise failure P4 was built to avoid. `channel = 'email'`
rows are created and left pending; they begin sending when the owner
configures `EMAIL_PROVIDER`/`EMAIL_FROM` and the email leg is wired. That
is now the clearest operational gap, and the runbook says so in place of
the line claiming reminders had no scheduler at all.

Still open, unchanged: renewal-case generation (so
`metrics_renewal_conversion` still reads zero by construction), the
jurisdiction-typed entity vocabulary, and named local providers. And the
whole chain remains dark until analysts structure rule scheduling and
enter gazetted holidays — with no rules there are no obligations, and
with no obligations there is nothing to remind anyone about.

No migration in this increment; nothing to apply post-merge. `CRON_SECRET`
must be set in production for the job to run at all.

## Addendum — R2 shipped (renewal cases)

The second of the two gaps P4 exposed, and the same shape as the first.
`renewal_cases`, its RLS, `metrics_renewal_conversion` and the admin card
have existed since P4; nothing had ever inserted a row. Tracing it back
turned up something larger: **no code in the application had ever created
a `case`.** Cases existed only as seed fixtures. This increment writes the
first one.

1. **An offer, not work.** A daily job (`/api/compliance/renewals`,
   `45 2 * * *`) opens a draft renewal case for each obligation coming due
   on a subscribed company's profile, sixty days ahead — deliberately the
   longest reminder lead, so the offer arrives in the same run as the
   first reminder about that deadline rather than as a second message on
   a different day. The case is created in `draft`, unpriced, with no
   provider assigned, which is exactly what /products/comply promises:
   "a specialist takes it up; you approve before anything is filed."
   This is also a measurement requirement, not only a product one — the
   view counts `accepted` as any case past `draft`, so generating
   anything further along would make every offer instantly accepted and
   the take rate meaningless. An integration test pins that property.
2. **Idempotent, and safe under a race.** `renewal_cases (obligation_id,
period_label)` is the key; both it and the obligation's own
   `renewal_case_id` shortcut are checked, so a half-written previous run
   cannot produce a second offer. The case row must be created before the
   link row that references it, so if a concurrent run wins the unique
   key the just-created draft is deleted — there is no multi-statement
   transaction through this client, and a phantom case in a customer's
   workspace is worse than a compensating delete.
3. **Subscribers only.** Obligations exist for any tracked company (P2/P3
   generate them without a subscription), but a renewal case is a Comply
   benefit. Opening unsolicited managed cases for a company that never
   subscribed would be an unasked-for offer rather than a service.

**Found, reported, not worked around: a customer cannot accept the offer.**
`public.case_status_transitions` authorises `draft → awaiting_kyc` for the
actor `customer`, and `state-machine.ts` agrees — but the
`cases_customer_update_draft` RLS policy's `with check (status = 'draft')`
rejects any status change at all. Verified against the database, not
inferred: SQLSTATE 42501, "new row violates row-level security policy".
So two authorization sources disagree, and today acceptance requires
staff. `metrics_renewal_conversion.offered` becomes real with this
increment; `accepted` moves only when staff advance a case.

Reconciling that is an RLS change, which the contract (§11) says to ask
about rather than decide. The minimal fix, for the owner to approve:
widen the customer update policy's `with check` to the statuses the
transitions table already authorises for `customer`, and let the existing
`app.enforce_case_transition()` trigger keep validating the edge — the
trigger, not the policy, is what should decide which move is legal.

Still open, unchanged: the email leg of reminders, the jurisdiction-typed
entity vocabulary, and named local providers. And the whole chain still
produces nothing until analysts structure rule scheduling and enter
gazetted holidays.

No migration in this increment; nothing to apply post-merge. Verified
this session: `CRON_SECRET` is **not set in production** — the reminder
and renewal jobs both answer 503 and neither will run until it is.

## Addendum — R3 shipped (email leaves the building)

R1 shipped the reminder dispatcher with its email leg deliberately dark,
because the only implemented adapter was the mock and stamping `sent_at`
for a mock would have made `metrics_obligation_engagement` report
reminders that reached nobody. The owner has connected a provider, so
that objection is gone.

Worth recording, because it was latent and would have surfaced badly:
`getEmailProvider()` **threw** for any non-mock `EMAIL_PROVIDER`. Setting
the variable in production without this change would not have started
sending mail — it would have broken every mail path in the product at
once (invitations, acknowledgements, provider applications), some of
which do not wrap the call. `EMAIL_API_KEY` was likewise documented in
`.env.example` and absent from the env schema, so it was never validated
or read.

1. **Resend, behind the existing interface**, over `fetch` — one POST
   with a bearer token is the whole integration, and a dependency that
   ships its own HTTP stack is not worth adding for it. Failure is
   returned, never thrown: several callers send mail as a side-effect of
   a customer action and do not wrap it, and failing an invitation
   because a message bounced is the wrong trade. A ten-second timeout
   keeps a hung provider off a Server Action. Recipient and subject are
   redacted in every log line and the body never appears — a unit test
   pins that, alongside the provider-error, no-id, timeout and network
   cases, all with `fetch` stubbed so no test can ever send.
2. **The reminder email leg.** Each channel is its own bounded batch, so
   an email outage cannot stop in-app reminders; members are written to
   in the locale their profile carries; a member with no address is
   skipped rather than guessed at; and only what the provider actually
   accepted is stamped.
3. **The mock stays the default and stays honest.** With
   `EMAIL_PROVIDER=mock` the email batch returns immediately and touches
   nothing, so those rows go out on the first run after a real provider
   is configured rather than being silently consumed.

SMTP remains unimplemented — it needs a mail library, and §11 says a new
dependency is the owner's call.

No migration in this increment. Still true, and still the thing that
gates everything: `CRON_SECRET` is not set in production, so neither
compliance job runs at all yet.
