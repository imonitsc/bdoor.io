# Changelog

Running record of shipped changes (CLAUDE.md Part I, Working Rule 6). Newest
first; each entry names its merged pull requests. Dates are merge dates.

## 2026-09-01

- **Claude Code tooling for the retention contract** — the founder's uploaded
  kit installed under `.claude/`: five slash commands (`/add-rule`,
  `/add-jurisdiction`, `/audit-rls`, `/verify-rules`, `/ship`), the
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
