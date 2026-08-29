# 65/35 packages — current-state audit

Audit date: 28 August 2026. Branch: `cursor/bdoor-65-35-packages-f888`.

## What works and must be preserved

- Next.js 16 App Router with `en`/`bn` locales, marketing route group and customer workspace.
- Supabase-backed services catalogue, questionnaire, deterministic recommendation engine, quote money layer (`src/features/quotes/money.ts`).
- Production premium upgrade on the parent branch: international/industries routes, service finder, evidence register, expanded nav/footer, CI on `cursor/**`.
- Existing admin services screen (`/admin/services`) for catalogue fee review.
- RLS on all exposed tables; integration tests for tenancy and staff boundaries.

## What was incomplete before this branch

- Homepage still used seven-step flow and 80/20-style copy, not the approved 65/35 section order.
- No six-package Bangladesh model with New/Existing tabs showing three cards at a time.
- No versioned `service_packages` / `package_versions` / `international_offers` tables.
- Admin `/admin/pricing` redirected to services with no package workflow.
- Assessment had no first question “Where do you want help?”
- International checkout gating existed only at catalogue level, not package rows.

## Additive work on this branch

| Area                                                           | Status                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| TypeScript package catalog (`src/content/packages/catalog.ts`) | Six BD packages + four international draft offers                   |
| Pricing layer totals (`src/features/packages/pricing.ts`)      | Implemented                                                         |
| Migration `20260101001800_packages_pricing.sql`                | Tables + RLS (no seed yet)                                          |
| Marketing components                                           | Package selector, fee example, international cards, specialist list |
| Homepage 65/35 layout                                          | In progress                                                         |
| `help_scope` intake question                                   | In progress                                                         |
| Admin packages page                                            | In progress                                                         |
| Unit/integration tests for pricing and RLS                     | In progress                                                         |

## Legal and commercial placeholders (unchanged)

- Operator: **bdoor compliance ltd** — no public address until counsel approves.
- International offers remain `draft`; checkout disabled until partner agreements verified.
- bdoor professional-fee VAT treatment: `pending_review`.
- Social profile URLs inactive until owner verifies (`docs/launch/owner-action-register.md`).

## Production risks

- Preview and production may share one Supabase project (documented on parent branch).
- Package DB tables are empty until seed migration or admin publish workflow runs; public UI reads TypeScript catalog snapshot (same pattern as services without credentials).
- Founder hero image from spec not present in repo; hero uses existing advisor panel.

## Required migrations

- `20260101001800_packages_pricing.sql` — additive; extends `currency_code` with GBP, AED, SGD.
