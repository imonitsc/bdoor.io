> **Superseded 1 Sep 2026.** This was the governing founder contract from
> 31 Aug 2026 (adopted in PR #54) until the retention-reframe contract of
> 1 Sep 2026 replaced it as Part I of `CLAUDE.md`. Where the two disagree —
> most sharply on whether formation is a priced revenue line or a free
> acquisition wedge — the newer contract governs. The roadmap phases,
> engineering standards and fundraising workstream below remain useful
> reference where they do not conflict; `docs/RETENTION-REFRAME-STATUS.md`
> records the delta.

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
