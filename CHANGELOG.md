# Changelog

Running record of shipped changes (CLAUDE.md Part I, Working Rule 6). Newest
first; each entry names its merged pull requests. Dates are merge dates.

## 2026-09-03

- **The citation audit becomes reviewable, and one column had to be stored
  rather than derived** — #76 computed the audit and threw the verdict away in
  a log line, so "how often do we state a fee with nothing behind it" — an
  investor metric in §19 and a review queue in §16.4 — could not be asked at
  all. Six columns on `ai_messages` make it a query, and `/admin/ai` now lists
  the answers that failed with the specific uncited sentences.

  The interesting column is `citation_count`, and it exists because the obvious
  design was wrong. The audit needs to know how many numbered sources the
  prompt carried, and the plan was to derive that from what was already
  stored — `source_ids.length + rule_ids.length`. Reading retrieval.ts closely
  before writing the DDL showed that number is not the citation count:
  `source_ids` is de-duplicated, so two chunks from one gazette are two
  numbered citations but a single source id, and the catalogue citation `[1]`
  has no source id at all. Deriving it would under-count, and an under-count
  makes legitimate high-numbered markers look fabricated — precisely the false
  accusation the audit was designed never to make. The real count is recorded.

  Counts are stored; per-sentence detail is not. A column can be indexed,
  filtered and averaged, and "show me answers with uncited claims" is not a
  question you can ask by re-running string analysis across a table — so the
  counts are persisted behind a partial index on the failing rows. The
  sentences are recomputed from the answer on read, so a reviewer always sees
  the current detector's reading rather than a verdict frozen at write time,
  and the answer text keeps living in exactly one place. The two can disagree
  in principle, because a recomputation runs over the redacted `content`
  column while the audit ran on the answer as generated; where they differ the
  stored counts are the record and the sentences are the explanation, and both
  are shown rather than one being derived from the other.

  No new RLS policy: row-level security governs rows, not columns, so the
  existing `ai_messages_own_read` and `ai_messages_staff_read` cover these.
  That is a claim, so it is tested — one customer cannot read another's audit,
  a compliance reviewer can read the queue, and a pre-migration answer keeps a
  null verdict rather than defaulting to "clean", which is the one reading of
  this data that would actively mislead.

- **Answers are now audited against the sources they were given (P0 item 10,
  claim-level half)** — the prompt has always told the model to cite every
  factual regulatory claim, and retrieval has always numbered the sources it
  may cite. Nothing checked that the finished answer obeyed. §7.1 step 12 puts
  a "citation-support audit before marking the answer complete" between
  generation and completion, and §23.2 requires that each material claim map to
  a supporting section; `src/features/ai/citations.ts` is that check.

  It is deliberately not a model call. A second model asked "is this cited?"
  would cost money on every answer, spend the completion budget in §7.3, and
  can be wrong in the same direction as the first. This is deterministic string
  work — cheap enough to run always, and its verdict is reproducible in a test
  rather than being an opinion that changes between runs.

  It is also deliberately not an entailment check. Whether the cited passage
  actually supports the sentence is a semantic question this cannot answer;
  §6.7 step 9 assigns that to the verifier model. What it establishes is the
  necessary condition underneath: a claim carrying no marker at all cannot be
  supported by anything, and a marker naming a source that was never retrieved
  is fabricated — §7.4 makes that one release-blocking, and it is the single
  finding here that is certainly a defect rather than a heuristic's opinion.

  Two decisions are pinned by tests so they read as choices rather than gaps.
  Under-reporting is the safe direction: a false accusation against a good
  answer would train everyone to ignore the signal, so the detector fires on
  money, proportions, periods, dates and duties and leaves ordinary prose,
  bdoor's own offer and questions alone. And Bangla obligation phrasing is not
  detected: Bengali numerals are, because a figure is a figure in any script,
  but writing a Bangla modal list from memory would produce a detector whose
  errors nobody on this codebase can audit. A test asserts the Bangla duty
  sentence goes unflagged, so the limit is a recorded decision.

  Sentence splitting had to learn what regulatory prose looks like before any
  of this worked: "Tk 5,000.50" and "s. 184" must not each become their own
  sentence, or every claim arrives pre-shredded and uncited. Findings are
  logged as counts only — a sentence lifted out of an answer is answer content,
  and §17 keeps that out of general logs. Persisting them per answer and
  showing them in the admin trace needs a migration and is the next increment.

- **The fetch path's limits actually hold now (P0 item 12, web-content security)** —
  CLAUDE.md §23.2 requires tests proving that "MIME/size limits and fetch
  timeouts work" and that "prompt injection or tool instructions inside a
  webpage/PDF are ignored". Writing them found three defects, two of them in
  the item-6 change from the day before.

  **The timeout was per-hop, with no overall budget.** `AbortSignal.timeout`
  was constructed fresh inside the redirect loop, so six hops at 25 seconds
  plus a 10-second robots fetch for each new origin let one hostile chain hold
  a serverless function for minutes without any single request ever timing
  out. Following redirects by hand is what introduced this: `redirect:
'follow'` had given the whole chain one budget. There is now a
  `totalTimeoutMs` deadline for the entire call — robots and every hop
  together — and each request aborts on whichever clock fires first.

  **The size cap was enforced after the body was already in memory.**
  `arrayBuffer()` materialises everything before `byteLength` can be checked,
  so the cap governed what was _stored_, never what was _received_; a server
  that omits `content-length` and streams half a gigabyte exhausts the
  function before the check it is nominally subject to ever runs. The body is
  now read through a reader that stops and cancels the response the moment the
  cap is passed. The test proves it by offering 5,000 chunks and asserting
  fewer than 20 are pulled.

  **A body-read failure escaped the outcome contract.** Only the `fetch()` call
  was inside the try, so a transfer that failed after headers — a dropped
  connection, the new deadline firing mid-stream — threw out of
  `fetchDocument` instead of returning a `FetchOutcome`, and a job worker
  expecting a discriminated union got an exception. Aborts now map to
  `timeout`, everything else to `network`, both retryable.

  The injection tests pin a decision as much as a behaviour. `htmlToText`
  strips scripts, styles, comments and navigation — the places a page hides
  text from a reader — and the system prompt states, before the retrieved
  context rather than after it, that the context is reference material and not
  instructions. What it deliberately does **not** do is strip hostile text a
  human would see on the page: silently editing source text would break the
  content hash and the provenance the ledger depends on, and would hide the
  page's true content from the reviewer who has to approve it. A test asserts
  that visible "ignore all previous instructions" survives extraction, so the
  behaviour cannot be "fixed" by someone who mistakes it for an oversight.

## 2026-09-02

- **The safe fetcher, which turned out to be a live SSRF fix (P0 item 6)** —
  CLAUDE.md §6.7 requires the research fetcher to "block private IP ranges,
  non-HTTP(S) schemes, user-supplied redirects, oversized files, unsupported
  MIME types, recursive crawling and cross-domain redirects that are not
  explicitly approved". The size and MIME halves already existed. The address
  and redirect halves did not, and their absence was not theoretical: the
  ingestion fetcher called `fetch` with `redirect: 'follow'` and no address
  check whatsoever, so any host it was ever pointed at could answer with a
  redirect to `http://169.254.169.254/` — the cloud instance-metadata address,
  which hands out credentials to anything able to make it an HTTP request —
  or to a service on the loopback interface, and the bytes would have been
  stored and later cited as a government document. The admin-controlled source
  registry made that unreachable in practice, not safe; §6.7's live research
  would have made it reachable.

  Redirects are now followed one hop at a time, and every hop faces the same
  checks as the URL that was asked for: scheme, host approval, and an address
  classification that refuses loopback, RFC1918, link-local, CGNAT,
  benchmarking, documentation, multicast and reserved space — in IPv4 and in
  every IPv6 notation that can carry an IPv4 address, because `::ffff:127.0.0.1`,
  `::10.0.0.1` and `64:ff9b::169.254.169.254` are one notation away from
  bypassing a table that only knows dotted quads. Names are resolved and every
  answer must be public, not merely the first: a name returning one public and
  one loopback address is a rebinding attempt. An https chain cannot be walked
  down onto http. The residual DNS-rebinding window between the check and
  Node's own resolution is documented in the module rather than papered over —
  closing it needs a custom dispatcher, and that is a new runtime dependency
  (§4.2).

  `src/features/ai/research/official-domains.ts` holds the versioned allowlist
  §6.7 requires, **and it ships empty**. Which hosts carry the authority of
  Bangladeshi law is a regulatory fact, and §3.3 forbids creating one from
  model memory; an allowlist assembled from recollection would launder a guess
  into the one place the pipeline trusts absolutely. So it is a data decision
  for the owner and a knowledge reviewer, `allowlisted()` refuses every host
  until they make it, and a unit test fails if the list ever gains an entry, so
  that nobody adds one absent-mindedly. Host matching is on a label boundary,
  never a bare suffix — `nbr.gov.bd` must not admit `evil-nbr.gov.bd` — and an
  IP literal never matches, because an authority is a name and a literal is how
  a name check gets skipped.

  The registry ingestion path is deliberately not put behind that allowlist. It
  is already its own admin-curated list of what may be ingested, and everything
  it produces stops at `review_required` for a human. The allowlist governs the
  other path: pages opened during a live research run, whose evidence reaches a
  customer labelled `official_live` without that human step. The weaker the
  review, the stricter the gate. For the same reason plaintext is refused only
  when a caller demands TLS — several seeded authority sites are registered
  over http — but the outcome now reports `secureTransport`, so a reviewer is
  told the bytes arrived unauthenticated instead of assuming they did not. The
  fetcher also returns the content hash §6.7 asks for and the full redirect
  chain; ingestion now takes its checksum from that hash rather than hashing
  the same bytes a second time.

- **The AI configuration contract, and one variable that needed a guard rather
  than obedience (P0 item 5)** — CLAUDE.md §4.1 names nineteen environment
  variables; two existed. All nineteen exist now — twelve model and limit
  names, plus the seven live-web-research names §6.7 consumes, which ship with
  research off and both search tools empty. The survey called this a mechanical
  rename. It was not, and the interesting part is where the specification and
  the code disagreed on purpose.

  Three of the required variables override deliberate decisions rather than
  fill gaps. `AI_REQUEST_TIMEOUT_MS` and `AI_MAX_RETRIEVAL_CHUNKS` were
  constants in `config.ts`, whose header argues that "a limit that can be
  raised by editing a dashboard field is a limit that gets raised at 2am
  during an incident". §4.1 wants them configurable, so they are — with the
  old constants as defaults, so an unset environment behaves exactly as
  before.

  `AI_EMBEDDING_MODEL` was the one worth slowing down for. `models.ts` had
  already written down why it was not configurable: a different embedding
  model is a different vector space, so switching it does not degrade
  retrieval, it silently corrupts it — queries and stored documents stop
  living in the same space and the system returns confident nonsense instead
  of an error. That reasoning is right, and the contract wants the variable
  anyway. It is now configurable _and_ guarded: every chunk already recorded
  the model that produced it in `ai_knowledge_chunks.embedding_model`, so
  `embeddingCorpusMismatch()` turns an invisible failure into a detectable
  disagreement. An empty corpus is accepted, because reindexing from empty is
  the supported way to change it.

  The open-ended `AI_ANSWER_FALLBACK_MODELS` chain became the single
  `AI_SECONDARY_MODEL`: §4.1 allows "maximum one automatic answer-model
  failover per request" and the old shape allowed more. The chain ships empty
  in production, so no live behaviour changes; the test that had asserted a
  multi-hop chain now asserts the one-hop contract, including that a secondary
  equal to the primary collapses rather than retrying the same model twice.

- **Two public doors told the truth (P0 items 2 and 4)** — the first work under
  the new CLAUDE.md, and both turned out to be misdiagnosed in its §2.2
  baseline.

  The Start stage label was never a bug. `market_scope` and `target_country`
  were both declared in the `about_you` section, so "Stage 1 of 6: About you"
  was exactly what the code said — and the code was describing two screens
  that ask nothing about the person. The fix was the stage model, not the
  label: `STAGES` now opens with `market` and those screens read
  `Stage 1 of 7: Market`. The property-based progress test needed no edits,
  which is the point of having written it that way; one older test had pinned
  the stage _name_ where it meant to pin "both opening screens are stage one",
  and now says so.

  The coming-soon fix from an earlier release had hidden the entrance and left
  the room. The services index excluded those services; the detail route still
  served them with a badge and a "Notify me" button, and an e2e test blessed it
  — "detail may still exist for deep links" — which is precisely the
  interest-only door §8.3 forbids. Auditing the fix found a fourth surface
  nobody had counted: the foreign-founders page listed by category with no
  status check at all, so an unpublished service in that category reached the
  public there whatever the index did.

  The real defect was four surfaces open-coding `status === 'published'` and
  one of them drifting, so there is now one `isPubliclyVisible` predicate they
  all use. The badge and the Notify me action are deleted rather than left
  unreachable: a door that exists in the code gets rendered again eventually.
  `tests/unit/service-visibility.test.ts` fails if any of these surfaces brings
  either back or returns to open-coding the check, and the enum list it tests
  is derived from the type — a hand-written one had silently guessed
  `archived` for what is actually `retired`, and typecheck caught it.

## 2026-09-01

- **Passwordless as a switch, not a leap (M2)** — the owner asked to keep
  login and signup on magic link only. Both shapes now exist and
  `AUTH_PASSWORDLESS` picks between them at runtime, because the honest
  reading of "only" is that it removes a credential from a live product:
  with it on, every sign-in — customers, partners and platform staff — depends
  on Supabase Auth email, which Supabase sends through its own SMTP settings
  and not through the Resend adapter connected in R3. Until that is
  configured, Supabase's built-in sender is rate limited and its limit
  becomes the sign-in limit. A variable makes turning it back a configuration
  change rather than a deploy, which is the property worth having on the day
  mail stops. It ships off.

  The part that needed design rather than deletion is consent.
  `consent_records` is append-only and keyed on a user id, and a one-time link
  creates no user until it is opened — so a row cannot be written when the box
  is ticked and patched later. The accepted-terms fact travels in the link's
  metadata, which Supabase applies only when it creates the user, and
  `provisionOnFirstConfirm` writes the profile, claims the questionnaire draft
  and records both consents when the link is opened. The policy versions are
  read from `POLICY_VERSIONS` on the server at that moment and never from the
  metadata, so a forged flag can still only consent on its own behalf and
  never to a version that was not the live one. Only one mode may create
  accounts at a time, so there is never a second signup path with a different
  consent story.

  Enforcement is server-side, not visual: a Server Action stays callable after
  its form is gone, so every auth action checks `modeAllows()` before doing
  anything. `/forgot-password` and `/reset-password` redirect to `/login` when
  there are no passwords to reset, and the security page stops showing a
  password-change date for a credential that no longer signs anyone in.
  Existing password credentials stay in `auth.users`, dormant; purging them is
  a separate decision. The confirm callback also learned to accept `signup` —
  Supabase sends the confirm-signup template, not the magic-link one, when
  `signInWithOtp` creates the user, so without it every passwordless signup
  would have bounced as an invalid link.

- **Sign in with a link, without a way to open an account (M1)** — the
  owner asked for magic-link sign-in as an _option_, and that word did the
  design work. Password sign-in stays first on `/login` and keeps the
  page's only `h1`; the link form sits beneath it with its own address
  field, because the two post to different actions and a shared field
  would fire the password form's validation on someone who only wanted a
  link. `shouldCreateUser: false` is not a detail: signup is the only path
  that records the terms and privacy consent versions the legal suite
  depends on, so an account minted by clicking a link would exist with no
  consent record at all — the copy says so in both languages rather than
  letting a caller discover it. The link does not weaken MFA, because
  `requireSession` derives the requirement from the session's real
  assurance level rather than from how the session was created: a staff or
  partner account still clears its second factor. The reply is the same
  whether or not the address has an account, matching what sign-in and
  password reset already do, so the form cannot be used to find out who
  has one; failures are logged by code alone, never with the address. The
  callback that exchanges the token stopped casting `type` and now checks
  it against an allow-list — it arrives in the query string, and an
  unverified string let the caller choose which verification path
  `verifyOtp` runs. Rate limited at the same five an hour as password
  reset. Both sign-in forms are now named from their own heading, which is
  what keeps them apart for anyone moving by landmark.

  Operationally: Supabase Auth sends this mail through **its own SMTP
  settings**, not through the app's Resend adapter. Until Supabase →
  Authentication → SMTP Settings is configured, magic link, signup
  confirmation and password reset all go through the built-in service and
  its rate limits.

- **Email actually leaves the building (R3)** — the owner connected a
  provider, so the deliberate gap R1 left is closed. `src/lib/email/` had
  defined an `EmailProvider` interface and implemented exactly one
  provider — the mock — and `getEmailProvider()` threw for anything else,
  which meant a non-mock `EMAIL_PROVIDER` would have broken every mail
  path in the product. Resend is now implemented behind that interface
  over `fetch`, with no new dependency: failures are returned rather than
  thrown (several callers send mail as a side-effect of a customer action
  and do not wrap the call, so a throw would fail the thing the customer
  actually asked for), a ten-second timeout keeps a hung provider from
  holding a Server Action open, and no log line carries the recipient or
  the body. `EMAIL_API_KEY` was documented in `.env.example` but had never
  been in the env schema; it is now, and required for any non-mock
  provider. Compliance reminders gained their email leg: each channel
  runs its own bounded batch, so a provider outage cannot stop in-app
  reminders reaching the workspace, and each member is written to in the
  locale their profile chose. The honesty rule from R1 is unchanged and
  now enforced in one place — while the provider is the mock, email rows
  are left pending and never stamped, because `sent_at` is what the
  engagement metric counts and it may only ever mean delivered. SMTP
  stays unimplemented: it needs a mail library, which is a dependency
  decision for the owner.

- **A recurring obligation becomes a managed case (R2)** — the second gap
  P4's instrumentation exposed, and the same shape as the first: the
  `renewal_cases` table, its RLS, the conversion view and the admin card
  all shipped months ago, but nothing had ever created a renewal case —
  or, it turns out, any case at all. This is the first code in the app
  that creates one. A daily job opens a draft renewal case for each
  obligation coming due on a subscribed company's profile, sixty days
  ahead so the offer arrives with the first reminder rather than as a
  second message. It is an offer, not work: created in `draft`, unpriced,
  with no provider assigned, exactly as /products/comply promises ("a
  specialist takes it up; you approve before anything is filed") — and
  because the view counts `accepted` as any case past `draft`, generating
  anything further along would have made every offer instantly accepted
  and the take rate meaningless. Idempotent on the table's own
  `(obligation_id, period_label)` key, checked against both that key and
  the obligation's own shortcut column, with a compensating delete if a
  concurrent run wins the race so no phantom case is left in a customer's
  workspace. The offer surfaces on the obligations calendar. Found and
  documented, not worked around: a customer cannot yet accept, because
  `case_status_transitions` authorises `draft → awaiting_kyc` for a
  customer while the RLS policy forbids any status change (verified,
  SQLSTATE 42501), so acceptance needs staff until that is reconciled.

- **Reminders actually send (R1)** — the gap P4's own instrumentation
  exposed: obligations were generated and engagement was measured, but
  nothing between them ever sent anything, so the funnel read zero by
  construction. A daily job now materialises `compliance_reminders` rows
  from the scheduling logic that had been written, pure and unwired, since
  the lifecycle migration, then delivers the in-app ones as a single
  notification per recipient per run — honouring the published promise
  ("ahead of every due date — never five at once") in code, with a unit
  test pinning each half. Both phases are idempotent: materialisation
  leans on the table's own unique key, and sending is claim-guarded on
  `sent_at`, so an overlapping cron tick cannot remind anyone twice.
  Reminders are retired rather than sent when the obligation was filed or
  waived, when the deadline has passed, or when a backlog would arrive as
  a burst after an outage. Following the reminder into the calendar stamps
  `opened_at`, closing reminded → opened → acted with a click-through
  rather than a bulk mark-all-read. Email stays deliberately unsent: the
  only implemented adapter is the mock, and stamping `sent_at` because a
  mock logged a line would make the engagement metric report reminders
  that reached nobody.

- **Country pages become one template — confirmed, then finished (P5)** — the
  roadmap premise was wrong and the code was right: all six international
  pages already rendered from one `countries/[country]/page.tsx` over the
  catalog and guide data, so the increment corrects the contract docs
  (CLAUDE.md §6, ROADMAP P5) and removes the real drift instead. Footer and
  sitemap country entries now derive from the catalog
  (`countryFooterLinks()`, `countrySitemapEntries()`), with a unit tripwire
  that fails if a country path is ever hardcoded back into navigation — a
  seventh country is now a data task. The ongoing-obligations section
  becomes a progressive view over the published rules corpus, each rule
  carrying its own review date (P1.3 per-rule review dates reach the public
  pages), falling back to the human-reviewed guide prose while a
  jurisdiction's corpus is empty — which today is every jurisdiction, so
  the rendered pages are unchanged until analysts publish rules. A dead
  countries module contradicting the catalog (five countries, all
  "coming soon") is deleted. Flagged, not changed: KSA and Qatar route fees
  are quoted in USD, and restating them in SAR/QAR is a new price figure
  requiring founder approval.

- **Retention is instrumented before anything scales (P4)** — three
  SECURITY INVOKER views make the numbers the reframe depends on
  queryable from customer one: monthly cohort logo retention for Comply,
  computed from paid/waived service periods (never the mutable status
  column) with sandbox activations excluded; the obligation engagement
  funnel (reminded → opened → acted → filed, with instrumentation-ready
  `opened_at`/`notification_id` columns on reminders ahead of the
  dispatcher); and renewal-case offered → accepted → completed — the
  take rate, measured before the generator exists so it is never
  retrofitted. All three render on /admin/metrics, every figure is
  fixture-asserted, and the roadmap's "done when" is one SQL query in
  docs/METRIC_DEFINITIONS.md.

- **Import an existing entity from its identifiers (P3)** — the
  existing-entity Comply entry now takes what the company already has:
  RJSC registration number, e-TIN and BIN (permissive validation — registry
  formats are regulatory facts, and over-strict patterns would lock real
  companies out), plus a sector from a new shared vocabulary enforced by
  the database on both companies and rules. The vocabulary is a
  correctness requirement, not tidiness: the engine excludes silently on
  a sector mismatch, so customer and analyst sectors may only ever meet
  on the same tokens; "unsure" stays NULL and sector-scoped rules then
  surface "may apply — confirm". A duplicate registration number returns
  an honest error, generation now matches on sector, and the companies
  page gains the add-your-company door. Registry lookup pre-fill is
  deliberately absent — no public API exists to build an adapter against.

- **Ask becomes the top of the Comply funnel (P2)** — published rules are
  now citable sources in Ask answers, numbered beside the documents and
  carrying their own reviewer sign-off date; an answer that cites an
  analyst-scheduled recurring rule ends with "Track this for your
  company", a one-form existing-entity entry on /app/compliance that adds
  the company and generates its calendar from published rules; the
  "Check annual compliance" starter on /ask routes to that entry instead
  of the answer pipeline; and the funnel is measured end to end —
  `ai_messages.rule_ids` records which rules grounded each answer, and
  `ask_comply_exit` / `comply_company_tracked` join the analytics
  taxonomy. A retrieval that finds only rules no longer logs a false
  "unanswered question".

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
