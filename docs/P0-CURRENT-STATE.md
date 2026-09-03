# P0 current-state mapping

Produced under `CLAUDE.md` §27, on the instruction file the owner installed on
2 September 2026. It maps the repository and production as they actually are against the
fifteen P0 items in §22, and names the owner blockers from §26.

Every "verified" line below was checked against the code, the database schema, the Vercel
deployment record or the production runtime logs during this pass. Nothing here is carried
over from an earlier document on trust; where a claim in `CLAUDE.md` §2.2 turned out to be
imprecise, that is recorded rather than repeated.

Baseline commit: `5e5b8c4` on `claude/new-session-0n73z6`.

---

## Summary

| P0 item                                                          | State                                     | Weight |
| ---------------------------------------------------------------- | ----------------------------------------- | ------ |
| 1. Production branch, deployment, migration truth                | **Verified**                              | —      |
| 2. Start stage labels and progress                               | **Done** — a `market` stage; Stage 1 of 7 | S      |
| 3. Deep-link precedence and async draft saving                   | **In place**                              | —      |
| 4. Public `Coming soon` / interest-only doors                    | **Done** — no interest-only page remains  | S      |
| 5. Gateway multi-model routing, budgets, failover, telemetry     | **Partially in place, renamed contract**  | M      |
| 6. Versioned official-domain allowlist + safe fetcher            | **Done** — allowlist ships empty          | M      |
| 7. Gateway web-search behind a research adapter                  | **Absent**                                | L      |
| 8. Freshness, live research, evidence labels, review queue       | **Absent**                                | L      |
| 9. Legal-instrument / provision / coverage schema                | **Absent**                                | L      |
| 10. Official-source retrieval, amendments, claim-level citations | **Partial** — claim audit in, amendments  | M      |
| 11. Scheduled source monitoring and change alerts                | **Partial — and currently inert**         | M      |
| 12. AI evaluation, web-content security, performance gates       | **Partial** — web-content security done   | M      |
| 13. Funnel, research-quality and investor analytics              | **Substantially in place**                | S      |
| 14. Policy routes at Version 1.0, indexed                        | **In place**                              | —      |
| 15. Preview and P0 evidence report                               | **Done** — 3 §24 lines fail, see report   | M      |

Six of fifteen are effectively unbuilt (items 6–9 plus the parts of 10–11 that depend on
them), and they are the ones that carry the product claim in §1.1. Everything upstream of
them — retrieval, chunking, admin review, analytics — already exists and should be extended,
not rebuilt.

---

## 1. Production, deployment and migration truth — verified

| Fact               | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Production branch  | `claude/new-session-0n73z6` — there is no `main`                                         |
| Head at this pass  | `5e5b8c4`                                                                                |
| Development branch | `claude/deployment-status-check-ucci3m`                                                  |
| Branch protection  | **None.** Any push to the production branch deploys                                      |
| Hosting            | Vercel `prj_rCwzaAIa8tTxxjHGV16UWzABWCVK`, team `team_phKwNtsLM35oBgO9wD1cEBS3`          |
| Database           | Supabase `wtdogszssofiqcdrthnl`, `ACTIVE_HEALTHY`, Postgres 17.6                         |
| Migrations         | Repository migrations are the source of truth; applied to production by hand after merge |
| Scheduled jobs     | Four, in `vercel.json`                                                                   |

**Conflict to resolve.** §3.1 requires that production promotion follow owner approval after
the §24 release gates pass, and §24 requires an evidence report per release. The pipeline in
force does the opposite: merging a PR into the production branch triggers a production
deployment immediately, frequently before CI finishes. Either the gates or the pipeline has
to change. The cheapest reconciliation is branch protection plus a release branch; that is an
owner decision and is listed as a blocker below.

**All four scheduled jobs are inert.** `CRON_SECRET` is unset in production, so each job
fails closed and logs a refusal rather than running. Verified from production runtime logs
over the last seven hours:

| Job                         | Schedule     | Last observed                              |
| --------------------------- | ------------ | ------------------------------------------ |
| `/api/compliance/reminders` | `30 2 * * *` | `reminders.no_secret` at 02:30:21          |
| `/api/compliance/renewals`  | `45 2 * * *` | `renewals.no_secret` at 02:44:27, 02:45:13 |
| `/api/ai/retention`         | `0 3 * * *`  | `ai.retention.no_secret` at 03:00:34       |
| `/api/ai/ingestion`         | `15 4 * * *` | `ai.ingestion.no_secret` at 04:15:41       |

This is the single highest-leverage unblock in the whole list: one environment variable
turns four built, tested and deployed jobs from refusing to working. It also means the
compliance email leg shipped in R3 has **never executed in production** and is therefore
unproven end to end, however green its unit tests are.

---

## 2. Start stage labels — the baseline's diagnosis is wrong, the observation is right

§2.2 records that the location and international-country questions display
`Stage 1 of 6: About you` and calls the visible stage name incorrect.

The label is **correct against the current model**. `src/features/intake/questions.ts`
declares `market_scope` (Bangladesh / Outside Bangladesh) and `target_country` (the six-country
selector) both with `section: 'about_you'`, and `stageProgress()` renders the section name of
the question on screen. There is no bug: the code does exactly what it says.

What is actually wrong is the **stage model**. "Where do you want to operate" and "which
country" are not facts about the person, so naming that stage _About you_ misdescribes the
first two screens. Fixing it means changing `STAGES` — either splitting a new first stage or
renaming the existing one — which changes the denominator (`of 6`) and touches
`start.sections.*` in both locales.

That is a content and information-architecture decision, not a defect, so it was proposed
rather than assumed.

**Resolved.** The owner approved, and `STAGES` now opens with `market`: the two screens read
`Stage 1 of 7: Market`. `tests/unit/stage-progress.test.ts` is property-based and held the
change honest without edits — the counter still never regresses and every question still
belongs to a known stage. `tests/unit/target-country.test.ts` had pinned the old stage _name_
where it meant to pin "both opening screens sit in stage one", and now asserts that
property instead.

---

## 3. Deep-link precedence and asynchronous draft saving — in place

URL-seed precedence over stored drafts, package seeding and the incompatible-parameter
redirect were implemented and are covered by `tests/unit/intake-preset.test.ts`. Continue and
Back do not wait on persistence; drafts save in the background. No change proposed.

---

## 4. Public `Coming soon` doors — partially open

Three catalogue entries carry `status: 'coming_soon'`.

`src/app/[locale]/(marketing)/services/page.tsx` already excludes them from the services
index, with a comment recording that as a production fix. But
`src/app/[locale]/(marketing)/services/[slug]/page.tsx` still renders the `Coming soon` badge,
the `Notify me` call to action and the coming-soon note, so **a direct or indexed URL is still
a live interest-only door** — which is what §8.3 forbids. The index fix hid the entrance and
left the room.

`src/features/packages/types.ts` separately documents that anything earlier than a given
availability rung "is honest only as register interest", so the ladder is intentional; the
question §8.3 forces is whether such a door should be reachable at all.

**Resolved, and wider than the survey found.** A service that is not published now has no
public page: the detail route returns 404, does not prerender and returns empty metadata.
Auditing for the fix turned up a fourth surface the survey had missed — the
foreign-founders page listed services by _category alone_, with no status check, so an
unpublished service in that category reached the public there regardless of the index.

The root cause was that four surfaces each open-coded `status === 'published'` and one of
them drifted. There is now a single `isPubliclyVisible` predicate in
`src/features/catalog/types.ts` that all four use. The coming-soon badge and the "Notify me"
action are deleted outright rather than left unreachable, so no future list can render the
door by forgetting to filter, and `tests/unit/service-visibility.test.ts` fails if any of
these surfaces reintroduces either one or goes back to open-coding the status check.

The three `coming_soon` entries stay in the catalogue as data for when they open.

---

## 5. AI model configuration — working, but not the contract §4.1 specifies

Multi-model routing, fallback chains, budgets and a verifier role already exist (shipped as
BIOS-1, through the Vercel AI Gateway, server-side only). The gap is that §4.1 specifies a
different and wider environment contract. Of the nineteen names it requires, **two are
present**:

- Present: `AI_DAILY_BUDGET_USD`, `AI_IDENTITY_SALT`.
- Missing: `AI_PRIMARY_MODEL`, `AI_SECONDARY_MODEL`, `AI_FAST_MODEL`, `AI_EMBEDDING_MODEL`,
  `AI_TRANSCRIPTION_MODEL`, `AI_SPEECH_MODEL`, `AI_REQUEST_TIMEOUT_MS`,
  `AI_MAX_COST_USD_PER_ANSWER`, `AI_MAX_RETRIEVAL_CHUNKS`, `AI_MIN_GROUNDING_SCORE`,
  `AI_WEB_RESEARCH_ENABLED`, `AI_WEB_SEARCH_TOOL`, `AI_WEB_SECONDARY_SEARCH_TOOL`,
  `AI_WEB_MAX_SEARCHES_PER_ANSWER`, `AI_WEB_MAX_FETCHES_PER_ANSWER`,
  `AI_WEB_RESEARCH_TIMEOUT_MS`, `AI_OFFICIAL_DOMAIN_POLICY_VERSION`.

The existing scheme (`AI_ANSWER_MODEL`, `AI_EXPERT_MODEL`, `AI_VERIFIER_MODEL`,
`AI_EXTRACTION_MODEL`, `AI_ANSWER_FALLBACK_MODELS`, `AI_MONTHLY_BUDGET_USD`) covers the same
ground under different names for the roles that overlap. This is a rename-and-extend, not a
rebuild, and it should be done in one migration of the env schema so the two vocabularies
never coexist. `AI_MONTHLY_BUDGET_USD` has no counterpart in §4.1 and is worth keeping.

§4.1 also requires that model IDs and tool names be discovered from the installed SDK and the
live Gateway catalogue rather than copied from the specification. That discipline is already
the repo's practice — the fallback chains ship empty precisely so an admin configures them
from the runtime model listing — and should carry over unchanged.

---

**Resolved, and it was not the mechanical rename this survey called it.** All nineteen names
now exist: twelve model and limit names, plus the seven `AI_WEB_*` and
`AI_OFFICIAL_DOMAIN_POLICY_VERSION` names §6.7 consumes. Those seven ship inert —
`AI_WEB_RESEARCH_ENABLED=false`, both search tools empty — so the assistant still answers
only from the reviewed ledger until item 6 lands and the owner supplies a tool and a domain
list. Three of them turned out to override _deliberate_ engineering decisions rather
than fill gaps, which is the part worth recording:

- `AI_REQUEST_TIMEOUT_MS` and `AI_MAX_RETRIEVAL_CHUNKS` were constants in
  `src/features/ai/config.ts`, whose header argues that "a limit that can be raised by
  editing a dashboard field is a limit that gets raised at 2am during an incident". §4.1
  requires them as configuration, so they are configuration — with the old constants kept as
  the defaults, so an unset environment behaves exactly as it did.
- `AI_EMBEDDING_MODEL` is the dangerous one. `models.ts` already recorded why the embedding
  model was _not_ configurable: "a different embedding model is a different vector space;
  failing over would silently corrupt retrieval". That reasoning is correct, and §4.1 wants
  the variable anyway. It is now configurable **and guarded**: every chunk records the model
  that produced it in `ai_knowledge_chunks.embedding_model`, and `embeddingCorpusMismatch()`
  turns a silent corruption into a detectable disagreement. An empty corpus is accepted,
  because reindexing from empty is the supported way to change it.

`AI_ANSWER_FALLBACK_MODELS` — an open-ended comma-separated chain — became the single
`AI_SECONDARY_MODEL`, because §4.1 allows "maximum one automatic answer-model failover per
request" and the old shape allowed more. The chain ships empty in production, so this
changes no live behaviour. `AI_EXPERT_MODEL` and `AI_VERIFIER_MODEL` are kept: §4.1 describes
both roles without naming variables for them. `AI_MONTHLY_BUDGET_USD` is kept because a daily
cap alone lets a slow leak run for a month.

---

## 6–9. Controlled official-web research and the legal corpus — absent

These four items are the substance of §1.1's claim and none of them exists yet. Searched the
whole of `src/` and `supabase/migrations/`:

- **The official-domain allowlist and the safe fetcher now exist** (item 6, shipped
  2 September 2026). `src/features/ai/research/official-domains.ts` holds the versioned
  allowlist and `src/features/ai/research/url-safety.ts` the address and scheme predicates;
  `src/features/ai/registry/fetcher.ts` follows redirects one hop at a time and re-checks
  each one. The allowlist itself is **empty**: which hosts carry the authority of
  Bangladeshi law is a regulatory fact and §3.3 forbids inventing one, so `allowlisted()`
  refuses every host until the owner approves a list. See the owner blocker below.
- **No web-search adapter.** No search tool is wired behind a server-side boundary.
- **No evidence states.** Nothing implements `official_live`, fetch-time labelling, or a
  candidate-source review queue. Every fact currently reaching an answer comes from the
  ingested ledger only.
- **No legal-instrument or provision schema, and no coverage domain schema.** The knowledge
  tables that exist — `ai_source_registry`, `ai_registry_documents`, `ai_knowledge_sources`,
  `ai_knowledge_chunks`, `ai_structured_rules`, `ai_source_change_alerts`,
  `ai_knowledge_audit_log`, `content_sources` — are document-and-chunk shaped. They model
  _a page that was ingested_, not _an Act, its sections, their amendments and their coverage_.

The honest reading: retrieval over ingested documents works; the instrument-level legal graph
§6.4 describes does not exist, and no code currently distinguishes a verified ledger fact from
a live-fetched one — because nothing can fetch live.

This is the largest block of genuinely new work in P0 and the one where §3.3 bites hardest:
none of it may be seeded with facts from model memory, and §6.7's controlled workflow has to
exist before any live source can be quoted.

---

## 10–11. Retrieval quality and source monitoring — partial

Official sources already outrank bdoor commercial content in retrieval, and answers about
recurring obligations already carry a rule version and review date (shipped as KR-2 and P2-a).

**Claim-level citation is now audited** (`src/features/ai/citations.ts`, shipped 3 September
2026). Every completed answer is checked against the sources it was given: material claims —
money, proportions, periods, dates, duties — must carry a citation marker, and a marker naming
a source that was never retrieved is recorded as fabricated. The audit is deterministic string
work, not a second model call, so it costs nothing and its verdict is reproducible in a test.
It establishes the necessary condition, not entailment: whether the cited passage actually
supports the sentence stays with the §6.7 verifier.

**Findings are now persisted and reviewable** (migration `20260101003800_citation_audit.sql`,
3 September 2026). Six columns on `ai_messages` record the audit's counts, and `/admin/ai`
lists the answers that failed it with the specific uncited sentences. `citation_count` is
stored rather than derived: `source_ids` is de-duplicated and excludes the catalogue citation,
so deriving the count would under-count and make legitimate markers look fabricated.

Still missing: amendment awareness, which cannot exist before the provision schema in
item 9.

`ai_source_change_alerts` exists and `/api/ai/ingestion` runs on a schedule, so the skeleton of
monitoring is there. It is inert for the `CRON_SECRET` reason above, and there is no separate
high-value source monitor with its own cadence.

---

## 12–14. Evaluation, analytics, policies

- **Evaluation:** a Bangladesh knowledge eval set exists (`tests/unit/bd-knowledge-eval.test.ts`)
  along with retrieval and citation tests. The web-content security half of §23.2 is now
  covered — `tests/unit/ai-url-safety.test.ts` for addresses, schemes, redirects and the
  allowlist, `tests/unit/ai-fetch-limits.test.ts` for MIME, size and time limits and the
  prompt-injection boundary. (The earlier note here said there was "no web content path to
  secure yet"; item 6 built one, which is what made these tests possible and necessary.)
  Still missing: an enforced latency or cost gate in CI. §7.3 and §7.4 specify thresholds
  that nothing currently fails a build on.
- **Analytics:** the funnel, quote lifecycle, subscription, cohort retention, obligation
  engagement and renewal conversion instrumentation all exist and are surfaced in the admin
  area. This item is substantially satisfied. Research-quality metrics specifically (§19)
  arrive with items 6–9.
- **Policies:** ten policies are public at Version 1.0, effective 30 August 2026, indexed and
  reachable, with consent recorded at signup. Verified in place.

---

## 15. Evidence report

**Written: `docs/P0-EVIDENCE-REPORT.md`** (3 September 2026). This document is its input, not
the report itself.

The report confirms what §24 can confirm and states plainly what it cannot. Three of the
sixteen lines **fail**, and writing the report is what found them:

1. **The AI budget guard is inert.** `ai_usage.estimated_cost_usd` is `0` on all 27 rows ever
   written; `checkBudget()` sums that column, so the daily and monthly limits cannot trip. The
   cause is `generationInfo()` swallowing its failure at `logger.debug`, below production's
   `info` floor — invisible since the first answer on 30 August.
2. **Answer latency fails §7.3**: measured p75 14,288 ms against a required < 12,000 ms.
3. **The compliance engine cannot produce anything**: zero published structured rules and zero
   rows in `public_holidays`.

And the finding that reframes the rest: **production has never had a customer** — zero
profiles, applications, leads, companies, cases and consent records, against 54 `ai_messages`.

---

## Owner blockers — §26

Work stops at these boundaries. Everything before each boundary can be built as safe,
disabled infrastructure.

1. **`CRON_SECRET` is unset in production.** Four built jobs refuse to run. Highest leverage
   item on this page; needs one Vercel environment variable.
2. **Release governance conflicts with §3.1 and §24.** No branch protection on
   `claude/new-session-0n73z6`, and merging deploys production immediately. A gated release
   process is an owner decision.
3. **Supabase Auth SMTP is not configured.** Signup confirmation, password reset and
   magic-link sign-in all go through Supabase's rate-limited built-in sender. This also gates
   turning `AUTH_PASSWORDLESS` on.
4. **`EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY` not set in Vercel**, so the Resend adapter
   is deployed but unexercised.
5. **Stage-model change for Start** (item 2) — a naming and information-architecture decision.
6. **Coming-soon service doors** (item 4) — confirm they should 404 rather than offer interest.
7. **Search tool and official-domain policy** (items 6–7) — which Gateway web-search tool, and
   the initial authoritative domain list, are owner-approved facts, not model output. The
   list now has a concrete home: `OFFICIAL_DOMAINS` in
   `src/features/ai/research/official-domains.ts`, empty, with a unit test that fails if it
   gains an entry so nobody adds one absent-mindedly. Each entry needs a host, whether its
   subdomains are covered, and the authority it belongs to; bumping
   `AI_OFFICIAL_DOMAIN_POLICY_VERSION` records which list an answer was researched under.
8. **Analyst capacity for the legal corpus** (item 9). §3.3 forbids creating legal facts from
   memory and §6.2 makes verification a human act. Without an analyst entering instruments,
   provisions and gazetted holidays, the rules and obligation chain produces zero rows however
   complete the code is.
9. **Comply, personal-return and Address prices**, payment provider and production credentials
   — unchanged, all still owner facts.
10. **The RLS / `case_status_transitions` contradiction.** `public.case_status_transitions`
    authorises `draft → awaiting_kyc` for a customer and `state-machine.ts` agrees, but the
    `cases_customer_update_draft` policy's `with check (status = 'draft')` rejects any status
    change. Verified by executing the transition as a customer in psql: rejected,
    `sqlstate=42501`. A customer therefore cannot accept a renewal offer. The fix is small but
    §3.2 requires owner approval to change RLS.

---

## Recommended first increment

Items 6–9 are one architecture and should not be started piecemeal. The right first move is
the smallest thing that unblocks the most and invents nothing:

1. ~~Migrate the AI environment contract to §4.1's names (item 5).~~ Done.
2. ~~Land the versioned official-domain allowlist and the safe exact-page fetcher (item 6)
   with the allowlist **empty**, so the security boundary exists before anything can fetch
   through it.~~ Done — and it turned out to be a live SSRF fix, not only a gate for future
   research: the ingestion fetcher followed redirects blindly with no address check, so any
   host it was pointed at could redirect it onto the cloud instance-metadata address.
3. ~~Close the coming-soon doors (item 4) and settle the stage model (item 2).~~ Done.

Items 7–9 follow once the owner supplies the search tool and the initial domain list.
