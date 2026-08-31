# Business Intelligence OS — baseline and decisions (BIOS-0)

Date: 31 Aug 2026. Branch: `feat/bdoor-business-intelligence-os`, cut from
production merge `d1d28ad` (PR #49). Governing document:
`docs/BDoor_Business_Intelligence_OS_Master_Claude_Code_Instruction_2026-08-31.md`.
Preview-only until founder approval; nothing on this branch deploys production.

## What already exists (do not rebuild)

| Instruction area            | State at d1d28ad                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §5.2 compact /ask interface | Live (PR #45). App shell, streaming ack, truthful stages, timings instrumentation. Must be preserved.                                                                       |
| §7 knowledge lifecycle      | Live (PRs #43/#44/#47): registry, documents, structured rules, jobs, alerts, coverage, draft→in_review→approved→published workflow, authority tiers, retrieval diagnostics. |
| §8 retrieval                | Live (PRs #46/#47): hybrid keyword+vector with RRF fusion, authority bonus, `keywordQuery()` OR-rewrite (en+bn), official-before-commercial presentation ordering.          |
| §11 latency work            | Live (PR #45/#46): ack streams on first round-trip, retrieval parallelised, `model_start` marked. Region move to sin1 is an owner dashboard step, still pending.            |
| §13 revenue instrumentation | Live in part (Fundable core, PR #39–#42 era): quote lifecycle, analytics events, investor metrics from real data only.                                                      |
| Provider network            | Live: provider applications, conflict/disclosure/consent chain.                                                                                                             |
| BD registration knowledge   | In repo (PR #47). Awaiting the owner's two clicks on /admin/ai: “Import reviewed site content”, then “Publish and index imported content”.                                  |

## What this branch adds (new work)

- **BIOS-1** — §6 multi-model roles: a role registry (`src/features/ai/models.ts`),
  env-configured fallback chains via AI Gateway, risk-classed routing, failover
  that never weakens the citation contract, role/risk/failover recorded in
  `ai_usage` (additive migration), and an admin view of configured routes
  against the gateway's live model list.
- **BIOS-2** — §5.1 homepage: BI-OS positioning with a working Ask composer
  above the fold.
- **BIOS-3** — §4.2–§4.4 bdoor ID, roadmap, compliance workspace (flagged).
- **BIOS-4** — §10 deterministic calculators, §15 evaluation expansion, §18
  implementation report.

## Recorded decisions

1. **Supersession of the Anthropic-only rule.** The /ask brief (30 Aug 2026)
   required "Claude, always — no silent fallback to a different answer model",
   pinned by `tests/unit/ai-boundaries.test.ts`. The BI-OS instruction §6.1
   (31 Aug 2026, owner) supersedes it: providers "from at least OpenAI,
   Anthropic and Google with automatic fallback", no provider names shown to
   customers. What survives the supersession: fallback is **explicit
   configuration, never silence** — a model slug serves only from its own
   vendor's routes (`only` lock per model), every failover is counted and
   logged, and the citation contract is identical on every model in a chain.
   The boundary test is rewritten to pin the new contract, not deleted.
2. **No hardcoded obsolete model IDs.** Defaults stay the production-verified
   `anthropic/claude-sonnet-5`. Cross-provider fallback chains ship **empty**
   and are configured by the admin from the gateway's runtime model listing
   (shown on /admin/ai/models), satisfying §6.1's "retrieve current model IDs
   at runtime" without inventing slugs in code.
3. **The router is deterministic.** §6.1 names a "router" role; the existing
   free, synchronous classifier (greeting / scope / topic / risk) already does
   that job with zero latency and zero spend. A paid router model would add a
   round-trip before the ack. Documented as the router implementation, not
   hidden.
4. **Verifier ships gated.** §6.2 wants a verifier for high-risk answers. The
   infrastructure (role, chain, risk classing) ships now; the verifier chain
   is empty by default and turns on by configuration once evaluated (§17
   phased, §15 no manufactured scores).
5. **Embedding role does not fail over.** A different embedding model is a
   different vector space; failover would silently corrupt retrieval. A change
   there is a migration plus reindex, never a runtime fallback.

## Production baseline measurements (before this branch)

- `model_start` 1.3–1.9 s from iad1 (region move pending, owner step).
- Retrieval fixed (`boundRpc`), `ai.retrieval.error` absent from runtime logs.
- Knowledge base: 19 published bdoor sources; BD registration seed awaiting
  owner import+publish.
