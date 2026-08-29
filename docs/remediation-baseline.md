# Remediation baseline — factual findings before any change

Branch: `feat/premium-site-remediation`
Starting commit: `7bace6213c462339aa32b4418fab4d4200bf7708`
(merge of PR #21, "65/35 packages homepage and pricing model")
Date: 2026-08-29

This file records what is true of the repository **before** the remediation
work, so the final report can be checked against something. Facts only; the
decisions live in the remediation brief and the PR description.

## Pre-change test results

Run on the starting commit, locally, before any edit:

| Check                                   | Result | Notes                                                                                             |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `prettier --check .`                    | FAIL   | one file: `tests/e2e/questionnaire.spec.ts` (landed in #21)                                       |
| `eslint .`                              | pass   |                                                                                                   |
| `tsc --noEmit`                          | pass   |                                                                                                   |
| `vitest run tests/unit`                 | pass   | 20 files, 182 tests                                                                               |
| `next build`                            | pass   |                                                                                                   |
| CI on the same commit (run 33229144985) | FAIL   | only "Format check" failed; Playwright (base spec set), migrations/RLS, dependency scan all green |

The formatting failure is a **genuine pre-existing failure**, not a
regression from this branch: the production branch's own merge commit is red
on it.

## Application structure (as found)

- Next.js 16.3.2 App Router, `src/proxy.ts` for locale + auth cookie refresh.
  Locales `en`/`bn` via next-intl dictionaries at `src/i18n/messages/{en,bn}.json`.
- Public routes under `src/app/[locale]/(marketing)/`: home, start, services,
  services/[slug], industries (+[slug] pages), international (single page),
  authorities, foreign-founders, pricing, how-it-works, partners, resources
  (+[slug]), about, contact, and six legal pages.
- Auth under `(auth)`, customer workspace under `(customer)/app`, partner and
  admin portals under `(partner)`/`(admin)`.
- Supabase clients: `src/lib/supabase/server.ts` (cookie-bound, RLS),
  `public.ts` (cookie-free catalogue reads), `admin.ts` (server-only,
  service-role).
- Navigation/footer/sitemap route tables: `src/lib/navigation.ts`.
- Metadata/canonical/hreflang helper: `src/lib/site.ts`; sitemap and robots in
  `src/app/`.

## Commercial data sources (duplication map)

Three partially-overlapping sources exist:

1. `src/content/packages/catalog.ts` (new in #21) — six Bangladesh packages
   (Solo Start 9,900 / Limited Company 24,900 / Complete Launch 39,900 /
   Compliance Check 14,900 / Annual Compliance 49,900/yr / Managed Finance
   from 11,900/mo), four `INTERNATIONAL_OFFERS` with **`status: 'draft'`,
   public prices and fee components**, and three `STANDALONE_SERVICES`.
   Types in `src/features/packages/types.ts`, helpers in
   `src/features/packages/pricing.ts`. Migration
   `20260101001800_packages_pricing.sql` mirrors it into Postgres.
2. `src/content/catalog-snapshot.ts` — the older per-service catalogue
   (fallback when Supabase is unreachable; production reads the `services`
   tables). **Line 156: `startingFeeBdt: 25000`** for
   `private-limited-company-incorporation`, and a 25,000 fee line at ~276.
3. `supabase/seed.sql` — local/dev seed mirroring the 25,000 service fee.

The homepage renders packages from (1); the pricing page renders services
from (2)/the DB. That is the 24,900-vs-25,000 contradiction.

## Confirmed findings against the brief

Checked in the working tree at the starting commit; file references are the
authoritative locations.

- **Homepage: ten sections before the footer** —
  `(marketing)/page.tsx`: Hero, HowItWorks, Packages, FeeExample, Preview,
  Specialist, International, Compliance, Faqs, FinalCta.
- **Hero** — no content image anywhere on the page; the right column is a
  generic "advisor" card whose button repeats the primary CTA (same label,
  same `/start` target, `home.hero.advisorTitle/advisorBody`).
- **Public `Draft` badges** —
  `src/components/marketing/international-offer-cards.tsx:34` renders
  `t('draft')` ("Draft"/"খসড়া", `packages.international.draft`,
  en.json:318 / bn.json:318) on every homepage country card, next to public
  prices, and **every card links to the same generic `/international`**.
- **"checkout stays disabled until agreements are approved"** — public copy
  at `en.json:206` (`home.international.body`).
- **"pending review by qualified counsel"** — `en.json:305`
  (`packages.taxPendingReview`), rendered under the homepage fee example;
  `packages.feeExample.taxPending: "Pending review"` at `en.json:313`.
- **Pricing contradictions** — pricing page
  (`(marketing)/pricing/page.tsx`) is not connected to the package catalog
  at all: it lists per-service `startingFeeBdt` values (incl. the 25,000
  incorporation fee), shows a "Subscription — Coming soon" card
  (`common.comingSoon`), and a literal `BDoor` badge string in JSX
  (line ~180). Homepage says Annual Compliance 49,900/yr; pricing page says
  subscriptions are coming soon.
- **International contradictions** — homepage cards show estimated USD/GBP/
  AED/SGD totals with Draft badges; `/international` (fed by
  `src/features/countries/queries.ts` SNAPSHOT_COUNTRIES) labels the same
  four routes "Coming soon". No per-country routes exist.
- **Partner page** — `partnersPage.directoryTitle: "Verified partners"` with
  `directoryEmpty: "No partner organisation has completed verification
yet…"` (en.json), while other public copy references verified
  specialists. The `verified_partners_public` view is read but empty.
- **Legal drafts** — all six documents in `src/content/legal/documents.ts`
  carry `awaitingCounselReview: true`, version `draft-2026-01`; the pages
  render the full drafts publicly under a "Draft awaiting professional
  review" banner (`legal.draftBanner`, en.json:542). No contracting-entity
  name beyond "BDoor"; **`bdoor compliance ltd` appears nowhere in the
  repository**.
- **Questionnaire progress** — `src/components/forms/questionnaire.tsx`
  derives `questions = applicableQuestions(state.answers)` and renders
  "Step {index+1} of {questions.length}"; both numerator and denominator
  change as answers arrive, which is exactly the "Step 1 of 16 → Step 3
  of 15" jump. Questions already carry a stable `section` field
  (about_you / the_business / ownership / operations / timing).
- **Brand case** — 27 occurrences of `BDoor` in `en.json` alone; ~20 source
  files use the title-case form in public-facing strings (header aria-label
  via `brand.name`, footer, legal drafts, pricing badge, manifest, etc.).
  The logo asset itself is lowercase.
- **Navigation** — `HEADER_LINKS` has seven top-level items (Start a
  business, Services, Industries, International, Pricing, Resources,
  Partners) plus locale switcher, sign-in and CTA, all shown from the `lg`
  (1024px) breakpoint in `marketing-header.tsx`.
- **Footer** — four link groups (services, industries, company, legal).
- **Hero/founder image** — `public/` contains only the five brand SVG/PNG
  logo assets. The founder/workspace photograph referenced by earlier briefs
  is **not in the repository** (also not in the branding zip); PR #20 already
  documents this. There is no image in the homepage body.
- **No public office address** is currently displayed (nothing to remove).

## What already matches the brief (do not regress)

- Six-package model and their prices match the §5 baseline exactly.
- Standalone services (e-TIN 4,000 / BIN-VAT 6,000 / trade licence 8,000)
  match §5.
- Fee-layer model (`platform_service_fee`, `government_fee_estimate`,
  `partner_professional_fee`, `third_party_cost`, `tax`) exists and is typed.
- Anonymous assessment collects no identity documents; checkout/payments are
  mock-only (`src/lib/payments`, `AI_PROVIDER` disabled by default).
- Skip link, focus treatment, reduced-motion CSS, axe e2e coverage exist.
- `packages_pricing` migration exists; RLS suite green.

## Out of scope / owner-side facts recorded for the report

- Production Supabase `services` data still carries the 25,000 incorporation
  fee; this branch cannot change production data. The snapshot fallback is
  aligned in-branch; the production row needs an owner-approved update.
- Migrations 1300–1600 (authorization core et al.) are still not applied to
  production Supabase (pre-existing; unrelated to this branch).
