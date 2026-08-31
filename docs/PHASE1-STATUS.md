# Phase 1 status — against CLAUDE.md Part I acceptance criteria

Date: 31 Aug 2026. Honest mapping of P1.1–P1.6 to what the repository and
production actually hold, plus the conflicts Part I's own Working Rule 1
requires flagging. States: **live**, **built (gated)**, **partial**, **not
built**.

| Item                      | State              | Detail                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1.1 Monetization rails   | Built, gated       | A `payments` abstraction exists (`PAYMENT_PROVIDER`: mock / sslcommerz / stripe) with webhook HMAC + idempotency; tiered pricing page live with approved BDT packages. **Gated**: no live gateway credential is configured, and the earlier owner instructions gate live payment collection behind professional legal/compliance review. Turning P1.1 on = credentials + that recorded approval, not new code. |
| P1.2 Case management core | Live               | Cases with a state machine (`public.case_status_transitions` + code, drift-tested), assigned professionals with conflict checks, SLA timestamps, document checklists, client-visible timeline, RLS on every table with wrong-actor integration tests.                                                                                                                                                          |
| P1.3 Compliance calendar  | Live (core)        | `compliance_obligations` + reminder scheduling (60/30/14/7/1-day leads, in-app + email) + renewal cases; workspace view grouped by due-now/upcoming/…. **Partial**: auto-generation of an entity's full obligation set from formation data, and WhatsApp delivery (P2.5), are not built.                                                                                                                       |
| P1.4 bdoor AI hardening   | Live               | RAG over the official-sources corpus in pgvector with claim-level citations; every Q/A pair, retrieval run and feedback stored; guardrails (no definitive advice, specialist CTA); anonymous rate limits; multi-model failover that never weakens the citation contract. **Owner step outstanding**: the BD registration seed awaits the Import + "Publish and index" clicks on /admin/ai.                     |
| P1.5 Analytics & metrics  | Live (first-party) | First-party analytics events across the funnel + `/admin/metrics` (funnel, cases by state, revenue-capable, real data only). **Conflict flagged** below re PostHog.                                                                                                                                                                                                                                            |
| P1.6 Trust surface        | Partial            | Professional verification/credentials model, provider standards page, security and data-protection statements, full en+bn i18n. **Not built**: public professional profiles with completed-case counts and reviews (needs real completed cases first — never fabricated).                                                                                                                                      |

## Conflicts flagged (Part I, Working Rule 1)

1. **PostHog (P1.5) vs. Part I §5 and prior instruction.** §5 says no new
   paid vendors without approval, and the Fundable instruction (30 Aug) built
   first-party analytics instead of a vendor. The first-party layer already
   answers P1.5's requirements. Recommendation: keep first-party; adopt
   PostHog only on your explicit approval.
2. **Payments live (P1.1 exit criterion) vs. the standing legal gates.** The
   Fundable and BI-OS instructions both gate live payment collection behind
   recorded professional review. Code is ready; the gate is yours to lift —
   flag, not blocker, but it cannot be lifted from here.
3. **Free applications today vs. tiered pricing.** Part I §2 records today's
   free-with-review model; §3/P1.1 want paid tiers. New public prices require
   founder approval (§13.1 of the BI-OS instruction, unchanged by Part I).
4. **Reviews/case counts (P1.6).** Will be shown only from real completed
   cases — Part I's own "never hand-made numbers" rule applies to the trust
   surface too.

## Nearest Phase-1 exit gaps, in order

1. Owner: publish the BD knowledge seed (two clicks on /admin/ai).
2. Owner: approve pricing tiers + payment go-live (then: configure gateway
   credentials; the flow is coded and webhook-tested).
3. Build: obligation auto-generation from a completed formation case
   (turns P1.3 from tracking into the retention engine).
4. Build: professional public profiles fed by real case data as it accrues.
