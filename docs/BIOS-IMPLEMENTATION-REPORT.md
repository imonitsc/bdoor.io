# Business Intelligence OS — implementation report (§18)

Date: 31 Aug 2026. Branch: `feat/bdoor-business-intelligence-os` (preview
only). Governing document (replacement, same day):
`docs/BDoor_Firstbase_Inspired_Business_Intelligence_OS_Master_Claude_Code_Instruction_2026-08-31.md`;
decisions and the delta map in `docs/BIOS-BASELINE.md`. The sections below
marked "PR #50" merged to production earlier today; the "second increment"
sections are this branch's follow-up work.

## Second increment (replacement instruction)

- **Implemented — product surfaces (§4.0/§5.5)**: `/products/start` and
  `/products/comply`, en + bn, describing only real capability. Start states
  plainly that no automated authority submission exists; Comply states that
  its view is bdoor's tracking, never an official good-standing status. No
  tier names or prices (§13.1A); the six approved packages on /pricing remain
  the only published figures. In footer and sitemap; header stays Start + Ask.
- **Deliberately absent — Books, Address, Connect, Discovery**: not built, so
  no route, card, flag-off placeholder or "coming soon" CTA anywhere (§5.1's
  own rule). Each launches only through its §19 gate (premises/authorisation
  for Address, signed partners for Connect, assigned reviewers for Books,
  verified investors before any Discovery language).
- **Implemented — one-time data capture (§4.0.1)**: `business_profile_facts`
  with supplier, moment, evidence document, verification status; superseded
  never edited; one current value per field enforced by the database; RLS
  rides the companies tenancy (wrong-actor integration tests). The
  `recordFact`/`currentFacts` module is the single write path. **Incomplete**:
  no workflow consumes it yet — wiring Start/roadmap reuse ("confirm or
  update", never silent reuse) is the next increment.
- **Implemented — Comply v1 grouping (§4.8)**: the workspace compliance page
  groups by status AND calendar into due now / upcoming / under review /
  overdue / completed / not applicable. **Incomplete**: "awaiting
  information" and the filed/accepted split need filing-workflow states
  (document request, submission, acknowledgement) that do not exist;
  approximating them would imply an authority outcome bdoor never tracked.
  Configurable Monitor/Prepare/Managed service levels: not built (names and
  prices await founder approval).
- **Implemented — homepage below-fold (§5.1 replacement list)**: sections
  renamed to "Start or add your business" (existing-business path named) and
  "Run it from one workspace" (deadlines/renewals/reminders that exist);
  Books/Address/Connect unmentioned.
- **Incomplete — the wider replacement scope**, recorded so nothing reads as
  quietly done: field-provenance consumption in Start; the §4.3 roadmap
  artefact; provider-firm portal gaps vs §10.2 (capacity, SLA metrics
  surfaces); §9.5 subscriptions/entitlements beyond the existing Fundable
  records; §13.1A packaging architecture; §14 product-event expansion; §15
  golden set beyond 124 questions; §16's journey-level Playwright tests for
  flows that do not exist yet (Books, Address, Connect).

Every claim below is one of four honest states: **implemented** (built and
tested on this branch), **already live** (existed before this branch, in
production), **gated** (infrastructure built, off until configured/approved),
**incomplete** (not built; what remains is stated).

## §6 Multi-model AI core

- **Implemented** — role registry (`src/features/ai/models.ts`): answer /
  expert / verifier / extraction / embedding chains; deterministic classifier
  documented as the router, RRF fusion as the reranker. Risk classification
  routes tax/VAT, customs, investment/FX and licensing questions to the
  expert chain. Failover walks the chain explicitly — per-slug vendor lock,
  every hop counted, identical prompt and citation contract — only before the
  first streamed word and inside the one request budget. `ai_usage` records
  `model_role`, `risk_class`, `failover_count` (additive migration).
  `/admin/ai/models` shows configured chains beside the gateway's live model
  listing. The old Claude-only boundary test was deliberately rewritten to
  the new contract (owner supersession, baseline decision 1).
- **Gated** — the verifier chain ships empty (`AI_VERIFIER_MODEL` unset) and
  cross-provider fallbacks ship empty: an admin configures them from the
  runtime model list, so no model ID is hardcoded to go stale. The verifier
  _execution pass_ (running a second model over a high-risk answer) is
  **incomplete**: chain resolution, risk tagging and configuration exist, but
  no verification call runs yet — a pre-stream verifier conflicts with the
  §11 latency budget and needs an evaluated design, not a default.

## §5.1 Homepage

- **Implemented** — the §5.1 layout exactly: mandated headline, working
  composer above the fold (a plain GET form to `/ask?q=…`, working before
  hydration; `/ask` reads the query behind Suspense and auto-sends), the four
  starters, one Start now secondary, restrained trust line, five sections
  below the fold, no country grid / service catalogue / statistics. En + bn.
  e2e covers the composer round-trip and a starter's full question arriving
  in the transcript.
- **Note for the founder** — this reverses the same-day earlier request that
  removed Ask entry points from the homepage; §5.1 (later instruction) wins,
  and the change ships preview-only for the founder's decision. The homepage
  workspace section mentions bdoor ID; enable `BDOOR_ID_ENABLED` with it (or
  trim that sentence) so page and product say the same thing.

## §4.2 bdoor ID

- **Implemented** — database-generated `BDR-XXXXXX-XXXXXX` identifier on
  every company, random (non-enumerable), unique, backfilled additively,
  inside the existing companies tenancy; §4.2 disclaimers rendered beside it.
  `public_verification_opt_in` exists, defaults false, is read by nothing.
- **Gated** — display behind `BDOOR_ID_ENABLED` (default off).
- **Incomplete** — verified profile fields beyond what `companies` already
  holds, and any public verification surface (deliberately: opt-in first).

## §4.3 Roadmap / §4.4 Compliance workspace

- **Already live** — the assessment → recommendation flow (/start), the
  compliance obligations + reminders + renewal-cases schema, the workspace
  (cases, documents, deadlines, quotes, payments, audit history).
- **Incomplete** — the §4.3 personalised roadmap document (entity trade-offs,
  sequenced checklist with dependencies, evidence-typed time estimates) as a
  generated, saveable artefact; "ask AI with business context after consent";
  "create tasks from an answer". These need their own phased increment.

## §4.5 Deterministic calculators

- **Implemented** — the framework (`src/features/calculators/framework.ts`):
  versioned, sourced, frozen definitions with fixture tests; and the package
  estimate calculator over bdoor's published catalog, which structurally
  cannot blend an unverified figure into a total.
- **Incomplete** — RJSC fee components, authorised-capital scenarios, filing
  calendars, customs estimates: each needs verified official figures first
  (the knowledge base deliberately carries none yet), then a calculator per
  rule with its source provision. The framework is ready for them.

## §7–§8 Knowledge & retrieval, §13 revenue, provider network

- **Already live** (previous PRs #43–#47): registry, lifecycle, hybrid
  retrieval with authority ranking, diagnostics, BD registration seed
  (awaiting the owner's Import + "Publish and index" clicks on /admin/ai),
  quote lifecycle and real-data investor metrics, provider applications with
  verification and conflict checks.

## §15 Evaluation

- **Implemented** — the four starter questions added to the eval set in both
  languages; structural pins (taxonomy coverage, bilingual coverage,
  high-stakes marking) hold. Honest count: **124 questions**, against the
  §15 target of ≥500. The gap is reported, not manufactured; expanding the
  set is content-review work for the next increment.

## §11 Latency

- Unchanged by this branch (streaming ack, parallel retrieval already live).
  The Vercel function-region move to Singapore remains an owner dashboard
  step; `AI_IDENTITY_SALT` and `CRON_SECRET` remain unset in production
  (boot warnings say so).

## Verification on this branch

- `pnpm run verify` (format, lint, typecheck, unit, build) — green.
- Integration suite (RLS, real Postgres, both new migrations applied) —
  208 tests green, including the new bdoor ID and calculator fixtures.
- Playwright e2e — full affected set green (homepage composer round-trip,
  ask failure paths, marketing, remediation).
- Preview: Vercel builds this branch on push; the PR carries the link.
