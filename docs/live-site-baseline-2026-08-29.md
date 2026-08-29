# Live-site baseline — 29 August 2026

The Phase 0 record for the live-site completion work (master instructions
of 29 Aug 2026). Facts, not plans; no secrets, tokens or customer data.

## Starting point

- Base branch: `claude/new-session-0n73z6` (the production branch Vercel
  deploys), at `6c9270a` — the merge of PR #25 (seven-country IA).
- Working branch: `feat/live-site-production-completion` (this work), which
  also carries the e2e readKey race fix from PR #26.
- Toolchain: pnpm, Next.js 16 App Router (Turbopack), React 19, TypeScript
  strict, Tailwind 4, next-intl 4 (`en`/`bn`), Supabase, Playwright,
  Vitest. `pnpm run verify` green at branch point; unit 228 → 236 with this
  work; e2e suite ~166 tests across two projects.
- Production deployment for `6c9270a`: READY; no runtime error groups.

## What already satisfied the master instructions at branch point

Delivered by the remediation (PR #22) and seven-country phase 1 (PR #25):

- One commercial source of truth (`src/content/packages/catalog.ts`) with
  the six owner-approved Bangladesh packages and figure-pinning unit tests.
- Launch gates (`src/lib/launch/gates.ts`): draft legal status force-closes
  payments, checkout and KYC uploads; legal pages render the pre-launch
  notice and are noindexed.
- Availability ladder (`research_only` → `available_online` → `paused`) on
  every international route; all six routes `research_only` /
  register-interest; no public international prices; Saudi Arabia and Qatar
  eligibility-led.
- `/[locale]/countries` page tree with permanent redirects from
  `/international`; homepage seven-country selector (Bangladesh larger);
  six-group navigation; footer and sitemap.
- Stage-based questionnaire progress; destination-country question with
  hard manual review for international formation.
- Partner directory gated on `public_profile_approved` + verification;
  no verified-network claims.
- Brand naming (lowercase `bdoor`, `bdoor compliance ltd`, no street
  address); founder illustration hero with build-time fallback switch.
- Docs: remediation baseline, legal review checklist, launch matrix,
  content approval matrix, country source ledger, seven-country plan.

## Contradictions found in this audit (fixed in this branch)

- `countries.bangladesh.badge` said **"Open now"** and two strings said
  **"available today"** while the legal pages say nothing is chargeable —
  the exact §5.1 contradiction. Copy is now gate-driven
  (`operationalClaimsAllowed()`): enquiry-led while legal is draft.
- `home.preview.body` said **"This is the real customer workspace"** —
  now permanently "product preview … with sample data".
- `/contact` ignored `?interest=` — country CTAs lost their attribution
  (§5.4). Fixed with catalog-validated resolution, a visible interest
  panel, topic preselection and structured lead columns.
- No second display currency existed (§5.3). An owner-reviewed manual FX
  rate (environment-configured, absent by default) now drives approximate
  USD lines on package cards; nothing converts without a reviewed rate.
- Country pages were register-interest shells (§5.2); they now carry
  requirements, document checklists, ongoing obligations and FAQs from the
  seven-country research — still price-free.

## Known pre-existing conditions (not regressions)

- Production Supabase still carries the legacy 25,000 service-fee row and
  has migrations `…1300`–`…2000` unapplied; owner applies them (never a
  reset — production data is untouchable).
- `src/types/database.ts` is hand-mirrored for the two newest migrations;
  regenerate with `pnpm run db:types` when convenient.
- `src/content/service-taxonomy.ts` is orphaned.
- The e2e environment runs without Supabase by design; catalog pages fall
  back to the bundled snapshot.

## Deferred master-instruction phases

Tracked in `docs/SEVEN_COUNTRY_PLAN.md` and `docs/waiting-on-owner.md`:
questionnaire reorder to objective→country with session migration (§12),
partner application/verification workflow and portal expansion (§15),
trust modules (§16), quote engine with FX locking (§10.4), payments
activation (§24), notifications (§25), expanded Bangladesh service
catalogue (§14), SEO structured data pass (§28), analytics/observability
(§29).
