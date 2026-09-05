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

**Scope correction (3 September, after this report was first written).** `budget.ts`'s own
header records that AI Gateway budgets — configured per team, project and key, and rejecting
with HTTP 402 — are the _first_ line of enforcement, and that this application check is the
second. So the inert guard does not by itself mean spend is unbounded; it means the second
line was blind. Whether gateway budgets are actually configured is an owner question this
report cannot answer from the repository.

**Partly fixed the same day.** `checkBudget` now distinguishes "no spend" from "no spend
data" and logs `ai.budget.cost_data_missing` when a period contains answers and none carries
a cost. It still allows the answer, because failing closed on a telemetry fault would take
Ask down and the gateway budget is the cap that actually rejects. `generationInfo` now warns
on both of its failure paths — separately, so the next occurrence says which one it is. The
root cause of the missing cost is **not** fixed: `generationId` is read from
`providerMetadata.gateway`, whose type in the installed SDK declares only `asyncJob` plus an
index signature, so the field may simply never arrive. The new logs will settle it.

**Settled, 4 September — and the hypothesis above was wrong.** The first answer since the
instrumentation shipped was served at 18:55 UTC, and the log names the failure:

```
ai.generation_info.failed — "Invalid error response format: Gateway request failed"
```

Not `ai.generation_info.no_id`. The generation id **is** obtained; the follow-up
`getGenerationInfo` lookup is what fails, at the gateway. That is why this row also carries
`estimated_cost_usd = 0.000000` and `provider = null` despite recording 4,659 input and 333
output tokens from the SDK's own `usage`. `ai.budget.cost_data_missing` fired on the same
request, correctly reporting ten answers with no cost data against the configured $25 daily
and $400 monthly caps.

This changes the fix direction. Reading `generationId` from a different field would not have
helped; the lookup call itself needs to be understood, and `getSpendReport` on the gateway
client remains the alternative worth evaluating. §3.3 still forbids substituting an invented
model price table for either.

**Latency was recorded as one number, and §7.3 asks for five (3 September).** The row above
could report a complete-answer p75 and nothing else, because `latency_ms` was the only
duration `ai_usage` carried. §7.3 requires that "retrieval, rerank, model, first-token and
completion latency are separately recorded", and it sets two of its five targets on
first-token latency — so **the p75 < 2.5 s and p95 < 5 s targets were not failing, they were
unmeasurable**, and the 14-second p75 could not be attributed to a stage. The pipeline had
been marking all eleven stages per request since the Ask rebuild, but flushed them to a
single log line and discarded them.

`ai_usage` now carries `first_token_ms`, `retrieval_ms`, `rerank_ms` and `model_ms` alongside
`latency_ms`, derived from those same marks so the row and the log line cannot disagree, and
`/admin/ai` renders the five numbers as p75/p95 against the §7.3 targets. Rows written before
this carry nulls, which is honest: those requests were never measured per stage. The report
above is therefore the last one that can only say _that_ an answer was slow — the next can say
_where_.

**Where, measured 4 September.** The first answer carrying per-stage timings:

| Stage                | Measured     | §7.3 target |               |
| -------------------- | ------------ | ----------- | ------------- |
| Retrieval            | 2,878 ms     | —           |               |
| Rerank               | 0 ms         | —           |               |
| **Model generation** | **5,309 ms** | —           |               |
| First token          | 2,905 ms     | < 2,500 ms  | ❌ **misses** |
| Complete answer      | 8,192 ms     | < 12,000 ms | ✅            |

Two things the earlier report could not have said. **Model generation is 65% of the
answer** — the 14.3-second p75 was never a retrieval problem. And within retrieval the
**keyword leg is the slow one**: the pipeline log puts the vector leg at 1,254 ms and keyword
at 2,895 ms, the opposite of the usual assumption that the embedding round trip dominates.

First token misses its target because nothing streams until retrieval finishes: 2,905 ms is
2,878 ms of retrieval plus the model's first byte. Closing that gap means streaming something
truthful before retrieval completes, not making retrieval faster.

**This is one answer, not a distribution.** It is enough to identify the mechanism and wrong
to quote as a p75. The percentile row at the top of this section still rests on the 27
pre-instrumentation answers and will be restated when enough measured rows exist.

Citations: every completed answer is now audited against the sources it was given
(`src/features/ai/citations.ts`), and the counts are persisted per answer with a review queue
at `/admin/ai`. The audit establishes that material claims carry a marker and that no marker
names an unretrieved source; it does **not** establish entailment, which §6.7 assigns to a
verifier model that is configured empty.

Evaluation: an evaluation set and answer-contract tests exist and run in CI. There is **no
enforced latency or cost gate in CI** — §7.3's thresholds fail nothing today, which is how the
p75 above went unnoticed.

### Rate limits (§23.2)

§23.2 asks for one thing under two headings — "rate limits and daily budgets work" — and this
report has so far answered only the second half. Read as it stood, a reader would reasonably
take the endpoint to be bounded without qualification. It is bounded, but the two halves are
enforced by different mechanisms with very different strength, and they should not be read as
one guarantee.

**Spend** is capped twice and neither cap is the limiter described below: AI Gateway budgets
reject with HTTP 402 at the provider boundary, and `checkBudget()` sums `estimated_cost_usd`
as the second line. That second line has been summing zero since the first answer, for the
reason set out above; the root cause is still open. Whether the first line is configured is
an owner question this report cannot answer from the repository.

A **third** control §7.3 requires does not exist at all: "daily and per-answer budget limits
are enforced server-side", and only the daily and monthly checks are implemented.
`AI_MAX_COST_USD_PER_ANSWER` is declared and validated in the env schema and consumed by
nothing. Building it is deliberately deferred rather than forgotten: with
`estimated_cost_usd` zero on every row, a per-answer cap would compare against a value that
is always zero — a gate that measures nothing, which must not ship looking like a gate. It
waits on the cost-telemetry fix above, and that ordering is the point.

**Request rate** is capped by three windows in `src/app/api/ai/chat/route.ts`, with the values
in `src/features/ai/config.ts`: 8 per IP per minute, 120 per IP per day, and 40 per
conversation per hour, the last falling back to the IP key when a request carries no
conversation id. Keys are a salted SHA-256 of the forwarded address, so the limiter's memory
is not a list of visitor IPs.

Those counters live in a per-instance `Map`. That is not a discovery — it is already recorded
in `docs/SECURITY.md`, `docs/BUILD_REPORT.md` and `docs/OPERATIONS_RUNBOOK.md`. What has not
been stated is what it does to this particular acceptance criterion, and the three windows do
not degrade equally:

- The **60-second** window is the one that mostly holds. A script's burst arrives inside the
  lifetime of a small number of instances, so the constant means roughly what it reads as.
- The **24-hour** window is the weakest by a wide margin. A serverless instance does not live
  for a day, and every deployment resets every counter, so "120 per IP per day" is in practice
  a ceiling per instance per instance-lifetime. The number in the config file is an upper
  bound on one instance's view, not on a day's traffic from one source.
- The **hourly** conversation window sits between the two and shares the same ceiling.

So the honest answer to §23.2 splits: daily _budgets_ have a real cap, though not the one this
application implements; daily _request_ limits do not have one that survives horizontal scale.

Closing it means moving the counters to storage shared across instances. §4.2 points at
Postgres before a new dependency: one row per hashed key and window start, incremented by an
upsert that returns the running count, checked before any retrieval or model work happens.
The cost is a database round trip on every Ask request — including every request that is
about to be refused, which is precisely the traffic a limiter exists to make cheap. Redis or
Vercel KV would carry that check far better, and both are a new paid service, which §3.2
makes an owner decision rather than an implementation one.

No test exercises the windows. `tests/unit/ai-safety.test.ts` asserts only that a
`rate_limited` failure maps to HTTP 429; the counting itself, and the reset behaviour, are
uncovered. A test is possible without shared storage, since the counters are process-local:
either export `overLimit` (it is module-private today) or drive the route handler past each
threshold. It would at least pin the constants against accidental change. It would not tell
us anything about the multi-instance behaviour above, and should not be presented as if it
did.

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

1. ~~Raise `generationInfo`'s swallowed `debug` to `warn`~~ and ~~read the next failure to
   tell the two causes apart~~ — both done, and the answer is in §5: the lookup fails
   (`ai.generation_info.failed`, "Invalid error response format: Gateway request failed"),
   the id is not missing. **Still open:** fixing it. Understand why `getGenerationInfo`
   fails against this gateway, and evaluate `getSpendReport` as the alternative. Do not
   invent a price table if the gateway cannot supply cost — model pricing is a fact (§3.3).
2. Add the §7.3 latency gate to CI so a 14-second p75 fails a build instead of a report.
   Note the ordering trap: with almost no measured rows, a gate reading the ledger would
   measure nothing and pass. It must not ship looking like a gate until there is data behind
   it.
3. ~~Investigate the p75 itself~~ — measured 4 September, and the guess in this line was
   right for the wrong reason. Generation is 65% of the answer, so the time is indeed not in
   search; but within retrieval it is the **keyword** leg that is slow (2,895 ms against the
   vector leg's 1,254 ms), not the embedding round trip. **Still open:** first token misses
   §7.3's 2.5 s target because nothing streams until retrieval completes. Closing it means
   streaming something truthful earlier, not making retrieval faster. One measured answer
   identifies the mechanism; a p75 needs more rows.

**Needs an owner decision:**

4. `CRON_SECRET` — four scheduled jobs refuse to run without it, which is why zero documents
   have been ingested and why no compliance reminder has ever been sent.
5. The Gateway web-search tool and the initial official-domain list — these block P0 items 7–9
   entirely, and §3.3 forbids inventing either.
6. Gazetted public-holiday data and a first published rule, without which Comply is inert.
7. Branch protection, so this report can run before a deployment rather than after it.
8. Shared storage for the Ask rate limiter, or an explicit decision to keep it per-instance.
   Postgres needs no new dependency but adds a round trip to every request, including the ones
   it is about to refuse; Redis or Vercel KV suits the job far better and is a new paid
   service, which §3.2 makes the owner's call.
