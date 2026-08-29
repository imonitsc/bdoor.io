# 65/35 packages — handoff report

Branch: `feat/bdoor-65-35-packages`  
PR: https://github.com/imonitsc/bdoor.io/pull/34  
Base: `claude/new-session-0n73z6`  
Commit: `29f1c38`  
Authority: `BDoor_65_35_Packages_Cursor_Master_Instructions_2026-08-28.md`

## 1. Current-state audit

See `docs/product/65-35-packages-current-state.md`. Prior tip already had six BD packages and fee layers; this branch closes drift against the 28 Aug Cursor master (homepage order, native-currency labels, missing routes, `help_scope`, package seed).

## 2. Implementation plan

See `docs/product/65-35-packages-implementation-plan.md`. Checkpoints 1–9 largely complete on the catalog/UI/assessment/seed path. Admin DB publish mutations and live partner gates remain follow-up.

## 3. Routes and components changed

- Homepage `src/app/[locale]/(marketing)/page.tsx` — master §8 section order + founder hero
- `hero-founder.tsx`, `international-offer-cards.tsx`
- Catalog `src/content/packages/catalog.ts` — routes, labels, standalone services
- `src/content/international.ts` — deduped countries + homepage four-card helper
- Country page — multi-route list when a country has several offers
- Assessment — `help_scope` first question; start presets derive scope
- i18n `en.json` / `bn.json`

## 4. Migrations / RLS

- Existing `20260101001800_packages_pricing.sql` (tables + RLS) preserved
- New additive `20260101002200_packages_catalog_seed.sql` — published BD packages + draft featured international offers

## 5. Published vs draft

| Item                              | Status                 | Checkout                              |
| --------------------------------- | ---------------------- | ------------------------------------- |
| Six Bangladesh packages           | Published              | Catalog enabled; runtime launch-gated |
| USA / UK / UAE / Singapore offers | Draft; request quote   | Disabled                              |
| Saudi Arabia / Qatar              | Draft; eligibility-led | Disabled                              |

## 6. Partner / legal / finance decisions still required

- Approved partner agreements + margins before international checkout
- VAT treatment of bdoor professional fee (`pending_review`)
- Human review of Bangla commercial wording
- Counsel review of legal pages before Bangladesh checkout

## 7. Quality gates (this revision)

| Gate              | Result                                          |
| ----------------- | ----------------------------------------------- |
| format:check      | Pass (after prettier)                           |
| lint              | Pass                                            |
| typecheck         | Pass                                            |
| unit tests        | 253 passed                                      |
| production build  | Pass                                            |
| integration / e2e | Run on CI for this PR                           |
| Vercel preview    | Created by Vercel on PR push (URL on PR checks) |

## 8. Known limitations

- Claude Code master / pricing research / production / backend instruction files were not in the upload set — implemented from Cursor master + existing repo
- Admin pricing remains catalog-backed (no approve/publish Server Actions yet)
- No production merge or promotion performed

## 9. Rollback

Revert/merge-close PR #34; drop migration `20260101002200_packages_catalog_seed.sql` only if it was applied (seed is idempotent upserts).

## 10. Approval steps before production

1. Owner review of native-currency public labels vs prior USD marketing figures
2. Partner agreements recorded for each international route to enable checkout
3. Legal counsel sign-off; flip launch gates
4. Apply additive migrations on the shared Supabase project
5. Bangla commercial copy human review
6. Explicit promote of a green Vercel preview — do not auto-promote
