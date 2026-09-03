# P0 evidence report

CLAUDE.md §24 lists sixteen things a release-gate evidence report must confirm. This is that
report, for the commit named below. It is item 15 of §22.

**It does not confirm all sixteen, and it is not an approval request.** Where evidence exists
it is quoted with the query or run that produced it. Where it does not, the line says so and
says why. A report that asserted the missing lines would be the "manufactured quality" §15
forbids, and would defeat the only purpose a gate has.

Read the [verdict](#verdict) first if you read nothing else.

- **Compiled:** 3 September 2026
- **Author:** Claude Code, from live production data and local test runs
- **Method:** every number below was measured, not estimated. Production figures come from
  SQL against the live Supabase project; test figures from runs on this machine whose output
  is quoted verbatim in the pull requests that produced them.

---

## Verdict

**Do not promote to production on the strength of this report.** Three findings block it, and
one of them is a defect nobody had noticed.

1. **The AI budget guard is inert.** `ai_usage.estimated_cost_usd` is `0` on all 27 rows ever
   written — never null, never positive. `checkBudget()` sums that column, so
   `AI_DAILY_BUDGET_USD` and the monthly limit cannot trip. §4.1 requires budget limits
   "enforced server-side"; they are present in code and ineffective in fact. See
   [AI evaluation](#5-ai-evaluation-citations-latency-cost-and-failover).
2. **Answer latency fails the §7.3 gate.** Measured p75 for a complete answer is **14,288 ms**
   against a required **< 12,000 ms**. This is production data, not a lab estimate.
3. **The compliance engine cannot produce anything.** Zero published structured rules and zero
   rows in `public_holidays`. Even a paying subscriber would generate no obligations.

None of these is a reason for alarm about customer harm today, because — the fourth finding —
**the platform has never had a customer.** See [feature availability](#14-feature-availability-matches-operations-and-provider-capacity).

---

## 1. Exact branch and commit

|                    |                                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| Production branch  | `claude/new-session-0n73z6`                                                     |
| Commit             | `0d1e751` (merge of PR #77)                                                     |
| Development branch | `claude/deployment-status-check-ucci3m`, reset from production after each merge |

Branch protection is **not** configured, and a merge to the production branch deploys
immediately. That conflicts with §3.1 ("never deploy production from a feature branch") and
with this section's own existence: a gate that runs after deployment is a report, not a gate.
Recorded as an owner blocker rather than worked around.

## 2. Vercel preview URL and build success

Every pull request in this series produced a Vercel preview that reached **Ready**, and every
merge produced a production deployment that reached **Ready**. Project
`prj_rCwzaAIa8tTxxjHGV16UWzABWCVK`. The most recent production deployment for `0d1e751` is
Ready with no runtime errors in the following hour.

## 3. Migration list and advisor results

**39 migrations**, most recently `20260101003800_citation_audit.sql`, applied to production on
3 September 2026 and verified by querying `information_schema.columns` and `pg_indexes`
directly rather than trusting the apply's success flag.

Advisors, run after that apply:

- **Security — 2 findings, both pre-existing.** `public.verified_partners_public` is a
  `SECURITY DEFINER` view (ERROR); Auth leaked-password protection is disabled (WARN, and a
  dashboard toggle).
- **Performance — 472 lints**, of which three name `ai_messages`: two pre-existing policy-shape
  warnings (`auth_rls_initplan`, `multiple_permissive_policies`) and one `unused_index` on the
  index created minutes earlier, which has nothing to index yet.

No advisor finding is attributable to the recent migrations.

## 4. RLS and tenant tests

**261 integration tests pass** against a local Postgres with the full migration set, covering
tenant isolation, partner and staff boundaries, storage rules and the AI transcript policies.

One caution worth recording, because it cost a false green: **the integration suite skips
silently when it cannot reach Postgres**, and "258 skipped" reads almost identically to
"258 passed" in the summary line. Any future report must quote the word, not the number.

## 5. AI evaluation, citations, latency, cost and failover

Measured over the whole production history of `ai_usage` (27 answers, 30 August – 3 September):

| Metric                       | Measured                 | §7.3 target     |                      |
| ---------------------------- | ------------------------ | --------------- | -------------------- |
| Complete answer p50          | 9,967 ms                 | —               |                      |
| Complete answer **p75**      | **14,288 ms**            | < 12,000 ms     | ❌ **fails**         |
| Complete answer p95          | 16,612 ms                | —               |                      |
| Failures                     | 0 of 27                  | —               | ✅                   |
| Automatic failovers          | 0                        | ≤ 1 per request | ✅ (never exercised) |
| Estimated cost recorded      | **$0.0000 on every row** | recorded        | ❌ **fails**         |
| Provider recorded            | **null on every row**    | recorded        | ❌ **fails**         |
| Input/output tokens recorded | 24 of 27                 | recorded        | ⚠️ mostly            |

**The cost and provider failure is a defect, not a gap.** Both values come from
`generationInfo()` in `src/features/ai/chat.ts`, which calls the gateway's
`getGenerationInfo` and catches any failure at `logger.debug`. Production's minimum log level
is `info`, so **the failure has been invisible since the first answer on 30 August**. Tokens
survive because they come from the SDK's own `usage` object instead.

The consequence is the blocking one: `checkBudget()` sums `estimated_cost_usd`, so the daily
and monthly spend guards have been summing zero. They would not trip under any load.

Citations: every completed answer is now audited against the sources it was given
(`src/features/ai/citations.ts`), and the counts are persisted per answer with a review queue
at `/admin/ai`. The audit establishes that material claims carry a marker and that no marker
names an unretrieved source; it does **not** establish entailment, which §6.7 assigns to a
verifier model that is configured empty.

Evaluation: an evaluation set and answer-contract tests exist and run in CI. There is **no
enforced latency or cost gate in CI** — §7.3's thresholds fail nothing today, which is how the
p75 above went unnoticed.

## 6. Official-domain policy, web-search/fetch security and PII-redaction tests

The strongest section of this report.

- **Official-domain allowlist** exists, versioned by `AI_OFFICIAL_DOMAIN_POLICY_VERSION`, and
  **ships empty** — which domains carry the authority of Bangladeshi law is a regulatory fact
  and §3.3 forbids inventing one. A unit test fails if the list gains an entry.
- **Fetch security**: private-IP blocking across IPv4 and every IPv6 notation that can carry an
  IPv4 address; redirects followed one hop at a time with every hop re-checked; HTTPS downgrade
  refused; an overall call deadline; a streaming size cap that cancels the response rather than
  measuring after the fact. All covered by unit tests.
- **Prompt injection**: the extractor strips scripts, styles, comments and navigation, and the
  system prompt states the data-not-instructions boundary before the retrieved context. Tested,
  including the deliberate decision _not_ to strip hostile text a human would see on the page.
- **PII redaction** before persistence is tested, and the citation audit's telemetry is asserted
  to contain no answer text.

**Not evidenced:** no web _search_ has ever run, because no search tool is configured. §6.7's
PII-redaction-of-outgoing-queries requirement is therefore untested in practice.

## 7. Legal-domain coverage, source-monitor freshness, unresolved conflicts

Measured in production:

|                                          | Count  |
| ---------------------------------------- | ------ |
| Knowledge sources (all published)        | 19     |
| **Knowledge chunks — the entire corpus** | **25** |
| Structured rules                         | **0**  |
| Registry sources seeded                  | 31     |
| **Registry documents ever ingested**     | **0**  |
| Source-change alerts                     | 0      |

The assistant answers Bangladesh legal questions from **25 chunks**. The ingestion pipeline has
produced zero documents because its cron refuses without `CRON_SECRET`. There is no
legal-instrument or provision schema (item 9), so amendment awareness and a coverage matrix do
not exist to report on.

There are no unresolved source conflicts, because there are almost no sources to conflict.

## 8–9. WhatsApp and Meta

**Out of scope.** P0W has not started; no WhatsApp code, credentials, templates or Meta business
configuration exist. §24's WhatsApp lines are "not applicable", not "passed".

## 10. Start journey for Bangladesh and all six international countries

Covered by the Playwright suite across desktop and mobile projects: the Bangladesh path, the
Outside-Bangladesh country selector, deep-link precedence over stored drafts, stage labelling
and progress, Back behaviour, and submission. **318 tests pass, 8 skipped.**

**Not evidenced:** no human has walked the six international journeys end to end on a real
device, and no application has ever been submitted in production (see §14).

## 11. Mobile and accessibility results

The Playwright suite runs a `chromium-mobile` project alongside desktop and includes an
accessibility spec and horizontal-overflow checks at 320–1920px. All pass.

**Not evidenced:** no screen-reader walkthrough, and no audit against a named WCAG level.
"Automated accessibility tests pass" is a weaker claim than "the product is accessible", and
§23.6 asks for both.

## 12. Policy and consent impact assessment

Ten policies are public at **Version 1.0, effective 30 August 2026**, indexed and reachable,
and none of the work in this series changed a policy's meaning, so no new version is required
and none has been published.

`consent_records` contains **0 rows** — consistent with §14: nobody has signed up.

## 13. Rollback or forward-fix plan

- **Code:** every change in this series is additive and revertable by reverting its merge
  commit. No destructive migration, no data backfill, no dropped column.
- **`20260101003800_citation_audit.sql`:** drop the six columns and the partial index. Nothing
  reads them that does not tolerate null.
- **The latency and budget findings need no rollback** — they are pre-existing conditions this
  report discovered, not regressions it introduced.

## 14. Feature availability matches operations and provider capacity

The finding that reframes everything else. Production, measured:

| Table                    | Rows  |
| ------------------------ | ----- |
| `profiles`               | **0** |
| `applications`           | **0** |
| `leads`                  | **0** |
| `companies`              | **0** |
| `cases`                  | **0** |
| `consent_records`        | **0** |
| `subscriptions`          | **0** |
| `partners`               | **0** |
| `provider_applications`  | **0** |
| `compliance_obligations` | **0** |
| `public_holidays`        | **0** |
| `ai_messages`            | 54    |

**bdoor has never had a customer.** People have asked the assistant 54 questions; nobody has
ever created an account, submitted an application, or become a lead.

So feature availability trivially matches capacity — zero demand meets zero fulfilment — but
not in the way §24 intends. Two consequences are worth stating plainly:

- **No provider has been approved**, so the "application open — specialist reviewed" mode that
  §8.3 requires for every live service door has never been exercised against a real provider.
- **`public_holidays` is empty and no rule is published**, so the deadline engine §23.3 says
  must "fail loudly rather than silently inventing a date" has never had the chance to do
  either. Comply would generate nothing for a subscriber today.

## 15. Explicit owner approval

**Not given, and not requested by this document.** Three §24 lines fail and several are not
applicable. Promotion should wait on at least the budget-telemetry fix.

---

## What would close the gaps

Ordered by what unblocks the most, and separating what needs an owner decision from what does
not.

**No owner input needed:**

1. Fix `generationInfo` cost and provider capture, and raise its swallowed `debug` to `warn`
   so the next failure is visible within hours rather than after a month. This restores budget
   enforcement.
2. Add the §7.3 latency gate to CI so a 14-second p75 fails a build instead of a report.
3. Investigate the p75 itself: retrieval over 25 chunks should not take 14 seconds, which
   suggests the time is in generation, not search.

**Needs an owner decision:**

4. `CRON_SECRET` — four scheduled jobs refuse to run without it, which is why zero documents
   have been ingested and why no compliance reminder has ever been sent.
5. The Gateway web-search tool and the initial official-domain list — these block P0 items 7–9
   entirely, and §3.3 forbids inventing either.
6. Gazetted public-holiday data and a first published rule, without which Comply is inert.
7. Branch protection, so this report can run before a deployment rather than after it.
