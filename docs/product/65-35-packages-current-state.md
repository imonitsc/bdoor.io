# 65/35 packages — current-state audit

Audit date: 29 August 2026. Branch: `feat/bdoor-65-35-packages`.
Authority: `BDoor_65_35_Packages_Cursor_Master_Instructions_2026-08-28.md`.

## What works and must be preserved

- Next.js 16 App Router, React 19, pnpm, `en`/`bn` via next-intl.
- Six Bangladesh packages in `src/content/packages/catalog.ts` with owner-pinned fees (9,900 / 24,900 / 39,900 / 14,900 / 49,900 / 11,900).
- Fee-layer model (`computeLayerTotals`), integer minor units, payee separation.
- Migration `20260101001800_packages_pricing.sql` (tables + RLS; empty until seed).
- Package selector (New / Existing tabs, three cards), fee breakdown example, specialist list.
- Quote → accept → checkout gated by launch flags; client amounts never trusted.
- Seven-country routes under `/countries` (BD + US/UK/UAE/SA/QA/SG) — keep routes; homepage emphasis must return to 65/35.
- Admin `/admin/pricing` read-only catalog view; `/admin/services` for live service fees.
- RLS integration tests; commercial-catalog and packages-pricing unit pins.
- Legal operator `bdoor compliance ltd`; no public address.
- Founder hero PNG present at `public/images/bdoor-home-hero-founder.png` (alpha-channel unit test).

## Drift from the Cursor master instructions (28 Aug 2026)

| Area                              | Current tip                                                     | Master requirement                                                                     |
| --------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Homepage section order            | 8 sections; seven-country selector early; product-module hero   | 10 sections; BD-first hero; four international cards; founder image                    |
| Hero copy                         | “Start in Bangladesh. Build anywhere.” / Start your application | Exact master eyebrow, headline, CTAs                                                   |
| International public labels       | USD marketing (“From $499”, “From $299”, …)                     | Native totals matching fee layers (USD 449, GBP 349, AED 9,375, …)                     |
| USA / UAE / SG routes             | One offer each                                                  | Wyoming + Delaware + Florida; Sharjah + Dubai; resident + foreign-founder SG           |
| Standalone services               | e-TIN, BIN/VAT, trade licence only                              | Full proposed list including IRC/ERC/RJSC/BIDA/foreign-owned/branch                    |
| Assessment first question         | `target_country` (seven countries)                              | `help_scope` (“Where do you want help?”)                                               |
| Package DB seed                   | Empty                                                           | Seed published BD packages + draft international offers                                |
| Admin publish workflow            | Catalog-only list                                               | Version / evidence / approve-publish (incremental; mutations still follow-up)          |
| Claude/research instruction files | Only Cursor master present in uploads                           | Other referenced specs were not supplied; implement from Cursor master + existing code |

## Incomplete or mocked (unchanged)

- Payments, email, screening, malware adapters default to mock.
- Legal / checkout / KYC launch gates force Bangladesh checkout off until counsel review.
- International `checkoutEnabled: false`; partner agreements unverified.
- bdoor fee VAT treatment `pending_review`.
- Admin cannot mutate package versions in Postgres yet.

## Production risks

- Preview and production may share one Supabase project — additive migrations only; no reset/reseed of production.
- Changing public international labels updates e2e and commercial-catalog pins; coordinate in one commit.
- Multiple offers per country require deduped `internationalCountries()` or country pages duplicate.

## Required additive work on this branch

1. Refresh implementation plan and place Cursor master instructions in repo root.
2. Align catalog labels and add missing international routes + standalone services.
3. Homepage 65/35 layout + founder hero + four international cards.
4. `help_scope` first assessment question (preserving seven-country follow-ups).
5. Seed migration for `service_packages` / versions / fees / draft international offers.
6. Tests, verify, screenshots, Vercel preview handoff — no production merge.
