# CLAUDE.md — bdoor.io Master Instructions

> **Purpose of this file**: This is the single source of truth for Claude Code when working on bdoor.io. Read it fully before any task. Every feature, refactor, and decision must serve the mission below and move the company toward venture-fundable milestones.

---

## 1. Mission & Positioning

**bdoor.io is the operating system for starting and running a compliant business in emerging markets — beginning with Bangladesh.**

- One-line pitch: _"Stripe Atlas for South Asia: ask AI, get a roadmap, and have verified professionals execute your company formation, licensing, tax, and compliance — all in one workspace."_
- The wedge: Bangladesh. ~170M people, growing formalization of the economy, painful bureaucracy (RJSC, trade license, TIN/BIN, VAT, BIDA for foreign investment), and no dominant digital player.
- The expansion: replicate the playbook country-by-country (Pakistan, Sri Lanka, Nepal, Vietnam, Indonesia, MENA). The billion-dollar outcome is **"the compliance layer for the next billion businesses"** — formation is the acquisition funnel; recurring compliance, tax filings, and embedded financial services are the revenue engine.
- Comparables for narrative: Stripe Atlas, Firstbase, Clerky (US formation); Sleek (Singapore/HK); Clara (MENA); Osome (SEA). None own South Asia.

**North-star metric**: number of businesses under active compliance management (paying, recurring). Secondary: monthly formation applications submitted.

## 2. Current State (do not assume beyond this — verify in repo)

- Live at bdoor.io. Product: "Ask, then act" — bdoor AI answers formation/licensing/tax/investment questions with official-source citations; guided multi-step application flow (choose country → adaptive questionnaire → submit); specialist reviews every application; workspace for documents and deadlines; verified professional network (conflict-checked lawyers/accountants); private bdoor ID.
- Stack: Next.js on **Vercel**, **Supabase** (Postgres, auth, storage), repo `imonitsc/bdoor.io` on GitHub. `feat/ask-bdoor-ai` branch shipped the AI feature.
- Pricing today: free applications with specialist review. This is pre-revenue.
- Positioning disclaimer everywhere: general information, not professional advice; independent from government and law firms. **Never remove or weaken these disclaimers.**

## 3. Business Model to Build Toward

Build the product so all four revenue lines are possible; instrument everything from day one.

1. **Formation packages (one-time)**: tiered — self-serve guided filing (low price), assisted (specialist does it), foreign-founder concierge (premium; BIDA, work permits, repatriation setup).
2. **Compliance subscription (recurring — the core)**: annual returns, VAT/tax filing calendar, license renewals, document vault, deadline alerts. Monthly/annual SaaS pricing per entity.
3. **Professional marketplace take-rate**: verified lawyers/accountants fulfill cases through the platform; bdoor takes 15–25% of case value and owns the client relationship, QA, and escrow.
4. **Embedded services (later, with partners)**: business bank account referrals, payment gateway onboarding, insurance, accounting software. Referral/rev-share only — do not build a regulated financial product without licenses.

## 4. Product Roadmap — Three Phases

Work strictly in phase order. Do not start Phase 2 features while Phase 1 acceptance criteria are unmet.

### Phase 1 — Fundable Foundation (now → ~3 months)

Goal: a product that converts, retains, and produces metrics a VC can diligence.

- **P1.1 Monetization rails**: Stripe (international cards) + a local gateway (SSLCommerz or bKash merchant) behind a single `payments` abstraction in Supabase. Tiered pricing page. Feature-gate assisted/concierge tiers.
- **P1.2 Case management core**: every application becomes a `case` with states (`draft → submitted → in_review → assigned → in_progress → filed → completed`), assigned professional, SLA timestamps, document checklist, and client-visible timeline. This is the operational heart — build it properly with RLS on every table.
- **P1.3 Compliance calendar (retention engine)**: after formation, auto-generate the entity's recurring obligations (trade license renewal, annual return, VAT filing dates, TIN obligations) as a deadline timeline with email/WhatsApp reminders. This converts one-time users into subscribers.
- **P1.4 bdoor AI hardening**: RAG over an official-sources corpus (laws, gazettes, RJSC/NBR/BIDA guidance) stored in Supabase pgvector; every answer must cite sources; log every question/answer pair (this Q&A corpus is proprietary data — a moat and a diligence asset); add feedback thumbs; hard guardrails — AI never gives definitive legal advice, always offers "have a specialist confirm" CTA that opens a case.
- **P1.5 Analytics & metrics layer**: PostHog (self-serve tier) or equivalent. Track: visitor → question asked → application started → submitted → paid → case completed → subscription. Build an internal `/admin/metrics` dashboard showing funnel, WAU, cases by state, revenue. **VCs fund instrumented companies.**
- **P1.6 Trust surface**: professional profiles with credentials, completed-case counts, and reviews; security page; data-protection statement; English + Bangla i18n throughout.

Acceptance criteria to exit Phase 1: payments live, ≥1 paid tier purchasable end-to-end, case pipeline operational with real specialists, compliance calendar generating reminders, metrics dashboard accurate.

### Phase 2 — Traction Engine (months 3–9)

Goal: numbers for the seed round. Targets to aim reporting at: 1,000+ formation applications, 100+ paying compliance subscribers, 3-month retention >80%, take-rate revenue from marketplace.

- **P2.1 SEO/content machine**: programmatic pages for every license type, business category, and district ("How to get a trade license in Dhaka North", "VAT registration for e-commerce in Bangladesh") generated from the same corpus that powers bdoor AI. Schema markup, sitemap automation. This is the low-CAC growth channel.
- **P2.2 Foreign-founder funnel**: dedicated landing flow for foreign direct investment (BIDA registration, 100% foreign-owned company, remittance/repatriation basics) — highest willingness-to-pay segment; priced in USD.
- **P2.3 Referral & partner program**: unique links for consultants, incubators, and university entrepreneurship centers; track attributed signups.
- **P2.4 Professional-side app**: case queue, document requests, earnings dashboard for lawyers/accountants. Supply-side liquidity is the marketplace moat.
- **P2.5 WhatsApp/SMS layer**: Bangladesh runs on WhatsApp — deadline reminders, case status, and document requests via WhatsApp Business API.
- **P2.6 Country abstraction**: refactor all Bangladesh-specific logic (obligations, forms, fees) into a `country_config` data model so a second country is config + corpus, not a rewrite. Prove it with a thin second-country beta (e.g., "coming soon" waitlists measuring demand for Pakistan/Sri Lanka/UAE).

### Phase 3 — Scale Story (months 9–18)

- Second country live; API for banks/incubators to embed formation; enterprise/compliance-firm accounts managing many entities; deeper fintech partnerships. These are roadmap-slide items for the deck until Phase 2 metrics are real.

## 5. Engineering Standards (binding for every Claude Code session)

- **Stack discipline**: Next.js (App Router) + TypeScript strict + Tailwind on Vercel; Supabase for Postgres/auth/storage/edge functions; pgvector for RAG. No new infrastructure vendors without explicit approval — the stack stays lean and cheap (founder preference).
- **Security is existential** — this platform holds identity documents and business filings:
  - RLS enabled on every table; write policies tested. Professionals see only assigned cases; admins via role claims, never hardcoded emails.
  - All uploads in private Supabase buckets, signed URLs, short expiry. No document data in logs or analytics events.
  - Server-side validation (zod) on every mutation; secrets only in Vercel/Supabase env, never in the repo.
  - No scraping of or automated submission to government systems. bdoor prepares and tracks; licensed humans file.
- **Quality bar**: every PR — typecheck, lint, build must pass; Playwright smoke tests on the critical funnel (ask → apply → pay); migrations via Supabase migration files, never dashboard-only changes; small PRs with clear descriptions.
- **AI feature rules**: model calls behind one internal API route; every AI answer stores prompt, retrieved sources, response, and feedback; visible "informational, not professional advice" label on all AI output; rate-limit anonymous usage.
- **Performance**: public pages statically rendered where possible; Core Web Vitals green (SEO is a core channel); image optimization; keep bundle lean.
- **i18n**: all user-facing strings through the i18n layer (en/bn) — no hardcoded copy.

## 6. Fundraising Workstream (run in parallel with Phase 1–2)

Reality check to keep in the file: "billion-dollar" is the ambition, not the pitch. The pitch is a credible **pre-seed/seed** ($250k–$1.5M) on wedge + team + early traction, with the venture-scale story as the arc.

### 6.1 Assets Claude Code should help produce (in-repo `/investor` workspace, gitignored or private)

1. **Pitch deck** (10–12 slides): Problem (bureaucratic cost of formalization in BD), Solution (ask → roadmap → managed execution), Why now (digitization push, FDI interest post-transition, AI cost curve), Market (SAM: new business registrations + existing SMEs needing compliance in BD; TAM: South Asia/emerging markets), Product demo, Business model (4 revenue lines), Traction (live metrics from the dashboard — never hand-made numbers), Go-to-market (SEO machine + foreign-founder funnel + partners), Competition (Sleek/Osome/Clara map — none in South Asia), Team (founder: Dhaka-based, UK+BD company operator, deep local-institution knowledge), Ask & use of funds.
2. **Financial model** (spreadsheet): bottoms-up from funnel metrics — traffic → applications → paid conversion → subscription retention; 24-month runway plan; unit economics per case and per subscriber.
3. **Data room**: incorporation docs (The Asia Times Company Ltd / new entity as appropriate), cap table, metrics export, product architecture one-pager, security posture note, professional-network agreements template.
4. **One-pager / blurb** for cold outreach and OpenVC profiles.

### 6.2 Investor targets (verified active, Aug 2026)

- **Bangladesh-focused**: Bangladesh Angels Network ($50k–$500k), Anchorless Bangladesh ($200k–$1M), BD Venture ($100k–$5M), BSIC — the new 39-bank $35M vehicle (venture.com.bd / bsic.vc), Startup Bangladesh (govt fund), BYLC Ventures.
- **Regional early-stage**: nVentures ($50k–$250k, B2B fintech South/SEA), Accel Atoms, Peak XV Surge, 500 Global, Antler (Dhaka-adjacent cohorts), Iterative, East Ventures — emerging-market B2B theses.
- **Global program bets**: Y Combinator (Sleek/Osome-pattern companies get in), Techstars, Village Global. Also apply to Stripe Atlas-adjacent ecosystem programs for credibility.
- Sequencing: local angels/BAN for the first cheque + credibility → regional seed once Phase 2 metrics exist → programs (YC/Antler) in parallel every batch.

### 6.3 Milestones VCs will diligence — build the product to produce these numbers

- Funnel conversion at each step (ask → apply → pay)
- MRR and subscriber retention curve (compliance calendar cohort)
- Case completion time and NPS/reviews
- Supply side: active verified professionals, utilization
- Proprietary Q&A corpus size (AI moat evidence)
- CAC by channel (SEO vs. paid vs. referral)

## 7. Working Rules for Claude Code in This Repo

1. Read this file at session start. If a request conflicts with it, flag the conflict before proceeding.
2. Ship in vertical slices: schema → API → UI → test → instrument. Every feature lands with its analytics events.
3. Never fabricate legal/regulatory content. Regulatory facts enter the corpus only from official sources with citation metadata; when unsure, mark `needs_verification` and surface for human review.
4. Never weaken disclaimers, RLS policies, or auth checks to make a demo work.
5. Prefer boring, cheap, proven solutions; no speculative microservices, no new paid vendors without approval.
6. Keep a running `CHANGELOG.md` and update `/admin/metrics` when funnel steps change.
7. When asked for "growth" work, prioritize the SEO machine and foreign-founder funnel before paid ads.
8. Treat the Q&A logs, case data, and country_config as the company's crown jewels — model them carefully, migrate them safely, never expose them.

---

_Ambition: the compliance layer for the next billion businesses. Discipline: earn the next milestone first. This file is the contract between founder and Claude Code._

---

# Part II — Engineering working notes

Part I above is the founder's contract: mission, roadmap, standards and
fundraising frame. This part is the operational how-to for changing this
repository without breaking the things that matter — commands, architecture,
the role model, security requirements, copy rules, testing and the definition
of done. Both parts bind every session; where they touch the same subject,
Part I and the founder's newer instructions win. Read `README.md` first.

## Commands

```bash
pnpm dev                   # dev server on :3000
pnpm run verify            # format:check → lint → typecheck → unit → build
pnpm run lint              # eslint .            (auto-fix: lint:fix)
pnpm run format            # prettier --write .
pnpm run typecheck         # tsc --noEmit
pnpm run test:unit         # vitest, no services needed
pnpm run test:integration  # vitest against a real Postgres, RLS on
pnpm run test:e2e          # playwright, builds and starts the app itself
pnpm run db:reset          # local Supabase: migrations + seed
pnpm run db:types          # regenerate src/types/database.ts
```

Before the integration tests, build the throwaway database:

```bash
scripts/local-db/apply.sh --seed
```

`pnpm run verify` is the gate. Run it before you claim anything is finished. It
does not run the integration or E2E suites, so run those too when you touch SQL,
authorisation or a user-facing flow.

---

## Architecture

Next.js 16 App Router, React 19, TypeScript strict with
`noUncheckedIndexedAccess`, Tailwind 4 (CSS-first `@theme inline`), next-intl 4
for `en`/`bn`, Supabase for Postgres + Auth + Storage.

- Routing lives under `src/app/[locale]/` in five route groups:
  `(marketing)`, `(auth)`, `(customer)`, `(partner)`, `(admin)`.
- `proxy.ts` (Next 16's replacement for `middleware.ts`) does locale
  negotiation and refreshes the auth cookie. It does **not** authorise.
- Domain logic lives in `src/features/<area>/`, never in a component.
- Shared plumbing lives in `src/lib/`.
- Every integration is an adapter in `src/lib/<name>/` with a mock default.

### Data flow

Server Component reads → `src/lib/supabase/server.ts` (cookie-bound, RLS on).
Mutations → a Server Action in `src/features/<area>/actions.ts` that calls
`requireCapability()` first. Public catalogue reads → `src/lib/supabase/public.ts`
(cookie-free, so the page can still be statically rendered). Service-role work
→ `src/lib/supabase/admin.ts`, which is `server-only` and used for webhooks,
anonymous questionnaire drafts, invitation-token lookup and the private
`compliance` schema — nothing else.

---

## Coding rules

**Server Components by default.** Add `'use client'` only for interactivity.
A client component under `[locale]` cannot call `getTranslations()`; use
`useTranslations()`, and remember that reading request headers in a shared
layout forces every route beneath it to render dynamically.

**Types come from the database.** `src/types/database.ts` is generated. Import
`Enums<'case_status'>` rather than re-declaring a union. Regenerate after a
migration.

**Money is integer minor units.** `src/features/quotes/money.ts` owns the
arithmetic — inclusive vs exclusive tax, BDoor revenue vs pass-through
government fees. Never use a float for an amount.

**Validation is shared.** One Zod schema per input, imported by both the client
component and the Server Action. Error _keys_ go to the UI, never Zod's default
prose — the UI passes them to the translator, so a raw message renders as a
missing key in the page. `validateAnswer()` in `src/features/intake/questions.ts`
shows the pattern: an allow-list of known keys with a typed fallback.

**Comment density matches the surrounding file.** Comments explain why, not
what. Several comments in this repository record a trap that cost real time
(the `backdrop-filter` containing block in `marketing-header.tsx`, the streaming
Suspense boundary that turns a 404 into a soft 404 in the workspace `loading.tsx`
files). Do not delete those.

**British-ish product English, and no superlatives.** No "guaranteed",
"government authorized", "instant approval", "official partner". See
[Copy rules](#copy-rules).

---

## The role model

Two independent axes. A person can hold both.

**Platform roles** (`public.platform_roles`) — BDoor staff:
`case_manager`, `compliance_officer`, `finance`, `admin`, `super_admin`.

**Organisation roles** (`public.organization_memberships`) — customers and
partners: `customer_owner`, `customer_member`, `partner_owner`, `partner_staff`.

Screens and actions check **capabilities**, not roles. The matrix is
`src/lib/permissions/roles.ts`; `docs/ROLES.md` renders it. Adding a screen
means adding a capability, not scattering role names through components.

Two separations are deliberate and must survive refactors:

- `finance` has **no** `kyc.decide`, `kyc.read` or `risk.read`. A finance user
  must not be able to make a compliance decision.
- plain `admin` has **no** `kyc.decide` and no `refund.approve`. Only
  `super_admin` does.

MFA is mandatory for every platform role and for both partner roles.

---

## Security requirements

These are not style preferences. A change that breaks one of them is wrong even
if the tests pass.

1. **Never authorise from UI visibility.** Enforce on the server
   (`requireCapability`) _and_ in RLS. Both, every time.
2. **Never use editable user metadata for an authorisation decision.**
   `raw_user_meta_data` belongs to the user. Roles live in their own tables.
3. **Never call `auth.getSession()` server-side.** Use `auth.getClaims()`;
   `getSession()` trusts the cookie without verifying the signature.
4. **Keep secrets server-only.** Nothing secret gets a `NEXT_PUBLIC_` prefix —
   that prefix inlines the value into the browser bundle.
5. **Storage stays private.** Passports, NIDs, signatures, addresses, banking
   and corporate documents never touch a public bucket or a permanent URL.
   Serve them through short-lived signed URLs after an authorisation check.
6. **Never let a client choose a storage path.** Generate it server-side with
   `app.canonical_document_path()`.
7. **Avoid `SECURITY DEFINER`.** Where an RLS predicate genuinely needs it, keep
   it in the private `app` schema, set `search_path = ''`, and do explicit
   authorisation checks inside.
8. **Keep `compliance` unexposed.** The schema is not in the PostgREST
   exposed-schema list and has no grants to `anon` or `authenticated`. Customer-
   visible KYC status lives in `public.kyc_cases`; screening detail does not.
9. **Audit logs and case history are append-only.** `app.reject_mutation()`
   triggers enforce it. Do not add an update path.
10. **Never log a raw password, token, full identity number, document body or
    payment credential.** Log through `src/lib/audit/` — it redacts by key shape
    and by value shape.
11. **Treat every webhook as hostile.** Verify the HMAC, be idempotent by
    provider event id, and never trust an amount you did not compute.
12. **Never invent a credential.** If an integration needs one, write the
    adapter, add the environment variable, document the setup, and leave the
    mock as the default.
13. **Never send raw identity or banking documents to a model.** `AI_PROVIDER`
    defaults to `disabled`, and `prepareForModel()` is the only path that may
    build a request. The recommendation engine works with no LLM at all.
14. **Never route foreign share capital through BDoor.** Service fees and
    pass-through government fees only.

---

## Copy rules

The product makes claims about a regulated process, so the copy is part of the
correctness surface.

- Never "guaranteed", "government authorized", "instant approval", "official
  partner of", or a promise of approval, a visa, residency, banking or a fixed
  government completion date.
- Never imply affiliation with RJSC, BIDA, NBR, CCI&E, a city corporation, a
  ministry or any other authority. Where a service touches one, the page says
  BDoor is not affiliated with it.
- A government fee is published only with a verified figure and a review date.
  Otherwise: "Quoted after review".
- Time estimates carry the date they were last reviewed and are described as
  estimates.
- The recommendation is always labelled preliminary and subject to review.
- Do not add an office address, registration number, partner logo, press logo,
  award, testimonial, rating or statistic. BDoor does not have verified ones.
- The legal suite is published as version 1.0 (owner release, 30 Aug 2026). It
  makes no claim of counsel or regulator approval — none exists — and a policy
  change ships as a new version with a new effective date, never an edit under
  the same number. A revision in progress must honestly mark itself as a draft
  (`awaitingCounselReview`).

Both locales change together. A key added to `en.json` and missing from
`bn.json` renders the key path to a Bangla-speaking user.

---

## Testing

| Suite               | What it is for                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| `tests/unit`        | pure logic: state machine, money, deadlines, rules, redaction, validation |
| `tests/integration` | the RLS policies themselves, against real Postgres                        |
| `tests/e2e`         | the journeys, plus axe-core accessibility and the copy assertions         |

Rules of thumb:

- A change to a policy needs an integration test that a _wrong_ actor is
  rejected, not only that the right one is allowed.
- A change to the case state machine must update `public.case_status_transitions`
  **and** `src/features/cases/state-machine.ts`;
  `tests/integration/case-transitions.test.ts` fails if they drift.
- E2E waits on state, never on time. The questionnaire helper waits for the
  progress indicator to move before touching the next control; a bare
  `waitForTimeout` will pass locally and flake in CI.
- Never seed a real name, NID, passport, bank detail, address or partner
  credential. Everything in `seed.sql` is fictional and suffixed "(sample)".

---

## Definition of done

A change is finished when all of these hold:

- [ ] `pnpm run verify` passes.
- [ ] Integration tests pass if SQL, roles or policies changed.
- [ ] E2E tests pass if a user-facing flow changed.
- [ ] New authorisation is enforced in **both** the Server Action and RLS.
- [ ] New copy exists in `en.json` **and** `bn.json` and obeys the copy rules.
- [ ] New user input has one Zod schema, used on the client and the server.
- [ ] New integration ships an adapter, a mock default, environment variable
      names in `.env.example`, and setup notes in the README.
- [ ] Nothing secret gained a `NEXT_PUBLIC_` prefix.
- [ ] No personal data reached a log line.
- [ ] Anything that needs professional review is marked as a draft in the code
      and listed in `docs/LAUNCH-CHECKLIST.md`.
