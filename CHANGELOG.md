# Changelog

Running record of shipped changes (CLAUDE.md Part I, Working Rule 6). Newest
first; each entry names its merged pull requests. Dates are merge dates.

## 2026-09-01

- **Rules learn to schedule (P1 machinery)** — the structured-rules corpus
  gains machine-readable scheduling (`recurrence`, a deadline anchor with an
  offset in days, `jurisdiction_code`), an analyst-maintained
  `public_holidays` table that ships empty, and a pure obligation engine:
  scope matching where an ambiguous rule never fires (surfaced as
  "may apply" instead), due dates computed as calendar dates against the
  jurisdiction's fiscal year and Friday–Saturday weekend, month-end
  clamping, working-day rolls that refuse loudly when holiday data is
  missing, and a deterministic plan made idempotent by a database unique
  key on (company, rule version, due date). Subscription activation now
  generates the obligations calendar from published rules — zero rows
  until analysts structure the corpus, zero manual entry once they do.

- **bdoor Comply is purchasable (P0 machinery)** — a customer owner can
  subscribe from the workspace: narrow RLS lets them create their own
  `pending_activation` subscription and pending payment, checkout runs
  through the payments abstraction, and the webhook activates on a
  verified payment. Recurring pricing cards gain a Subscribe door,
  `?segment=existing_business` deep-links the pricing tab, /products/comply
  publishes the two approved recurring figures, and the dashboard offers
  Comply after a delivered case. Live charging stays behind the launch
  gates and recorded approval.

- **The site-grounded contract and the roadmap** — the founder's revised
  CLAUDE.md (written against the live site: product vocabulary, positioning
  lines, the Entity–Obligation–Rule–Case diagram, source-ledger
  non-negotiables) becomes Part I, with corrections its own code-is-the-fact
  rule requires (production branch filled in, `bn` live alongside `en`,
  brand ink `#081633`, the multi-model Gateway AI row, scripts verified).
  `docs/ROADMAP.md` installed: P0 purchasable Comply → P1 rules as data →
  P2 Ask-to-Comply funnel → P3 entity import → P4 retention instrumentation
  → P5 one country template. The earlier same-day contract is archived.
  With it, the design brief: `docs/DESIGN.md` (Stripe/Mercury reference
  class; the product as the visual; the obligations calendar as the one
  signature element; the §8 generic-default tells) and the `/redesign`
  command that enforces its audit-plan-critique process; §9 of the contract
  now holds all UI work to the brief.
- **§2 revised: stack facts and the permissions philosophy** — the founder's
  §2 replacement lands with its placeholders filled from the repo (production
  branch `claude/new-session-0n73z6`, script names verified): pnpm declared
  in the stack table, the MCP case-sensitivity warning, and a new §2.1
  splitting committed vs per-machine permission files. The committed
  `settings.json` drops its MCP entries, force-push moves from deny to ask
  (deny caught `--force-with-lease`), and `.claude/settings.local.json` is
  gitignored.
- **Claude Code tooling for the retention contract** — the founder's uploaded
  kit installed under `.claude/`: six slash commands (`/add-rule`,
  `/add-jurisdiction`, `/audit-rls`, `/verify-rules`, `/ship`,
  `/newobligation` — the Rule→Obligation instantiation playbook), the
  `compliance-reviewer` subagent, and a permissions policy; installed
  verbatim except recorded corrections (npm→pnpm, the production branch in
  place of a nonexistent `main`, and an `.env` deny that no longer blocks
  the secret-free `.env.example`).
- **The retention reframe governs the repository** — the founder's 1 Sep
  contract (recurring compliance product; formation as the free wedge;
  six-object domain model; rules corpus as the moat; never hardcode
  Bangladesh) replaces the 31 Aug master instructions as Part I of
  `CLAUDE.md`; the old contract is archived in `docs/`, the schema mapping
  and flagged conflicts are in `docs/RETENTION-REFRAME-STATUS.md`.

## 2026-08-31

- **The whole site says less** — premium copy pass across every public page:
  homepage hero rebuilt around the composer, one-line sections site-wide,
  larger page titles via the shared `PageHeader`; the stale homepage-steps CI
  pin retargeted. (PR #53 + follow-up PR)
- **BI-OS second increment** — /products/start and /products/comply pages
  (only products that operate get a page); `business_profile_facts`
  field-provenance layer (§4.0.1); §4.8 obligation grouping in the workspace
  compliance view; the replacement (Firstbase-inspired) master instruction
  adopted with its delta map. (PRs #51, #52)
- **Business Intelligence OS core** — multi-model role registry with
  provider-locked, counted failover behind one bdoor AI identity; risk-classed
  routing; role/risk/failover recorded in `ai_usage`; /admin/ai/models with the
  gateway's live model list; §5.1 homepage with a working Ask composer; bdoor
  ID (private `BDR-` identifier per company, display flag-gated);
  versioned/sourced calculator framework. (PR #50)
- **Homepage/navigation trims** — header reduced to Start + Ask bdoor AI;
  services/pricing/resources to the footer; Ask card and workspace preview
  removed. (PRs #48, #49)
- **Ask bdoor AI knowledge fixes** — production retrieval repaired (bound
  rpc), keyword search rewritten for natural questions (en+bn), Bangladesh
  registration knowledge seed with authority tiers and official citations,
  official-before-commercial ranking, admin retrieval diagnostics. (PRs #46,
  #47)

## 2026-08-30

- **/ask application shell** — compact AI-first interface, streaming with
  truthful stages, instrumented latency, honest failure paths. (PR #45)
- **Bangladesh authoritative knowledge system** — source registry (31
  institutions, six authority tiers), versioned ingestion with integrity
  checks, structured rules, coverage reporting, 100+ question bilingual eval
  set. (PRs #43, #44)
- **Go-live release** — Ask bdoor AI on by default, legal suite v1.0, pricing
  reconciliation, start-journey fixes. (PRs #41, #42)
- **Fundable core** — first-party analytics events, quote lifecycle with
  immutable accepted snapshots, subscriptions and recurring-revenue records,
  real-data investor metrics. (PRs #39, #40)
