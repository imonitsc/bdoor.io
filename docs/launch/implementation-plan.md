# Implementation plan

**Date:** 28 August 2026  
**Branch:** `cursor/bdoor-production-premium-upgrade-f693`

Work proceeds in the brief’s phases. Owner/legal/partner inputs are blockers, not invitations to invent.

## Phase 0 — Audit and safeguards

- [x] Current-state audit (`docs/audit/current-state.md`)
- [x] Launch-gate register (`docs/launch/launch-gates.md`, `src/content/launch/gates.ts`)
- [x] Owner-action register
- [x] Threat model, architecture, RLS matrix, storage, operations, SEO, social, rollback, acceptance

## Phase 1 — Legal / security infrastructure

| Item              | Action                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Policy versioning | Additive `legal_policy_versions` table. Public pages stay drafts.                        |
| Consent records   | Already exist (`consent_records`). No rewrite.                                           |
| Evidence register | `content/evidence-register` + `public.evidence_claims`. Unverified claims do not render. |
| RLS / storage     | Audit documented; no weakening. Negative tests already exist; add directory-table tests. |
| Auth / MFA        | Already enforced. No change to session verification (`getClaims()`).                     |

## Phase 2 — Operational backend

Customer, admin, partner, quotes, documents, payments and compliance already exist and are RLS-backed. This branch does not rebuild them. It adds:

- Directory tables (countries, industries, authorities, social profiles)
- Coming-soon catalogue rows with no fees
- Internal launch-gate screen for staff with `settings.manage`

## Phase 3 — Public premium upgrade

- Homepage sections in the brief’s order, omitting empty case studies and unverified trust items
- Navigation: Start a business, Services, Industries, International, Pricing, Resources (Partners and About remain in the footer; `/foreign-founders` is preserved)
- Service finder + URL-addressable `/services` filters
- Industries, authorities, international country pages
- Itemised pricing example from the published private-limited-company row

## Phase 4 — Content, social, discovery

- Social profile config; footer and `sameAs` render only `active` + verified rows (none today)
- SEO checklist; sitemap includes new public routes
- No regulatory filler articles

## Phase 5 — International framework

- Country records for BD (active), US/GB/AE/SG (`coming_soon`)
- No provider, fee or “available now” claim

## Phase 6 — Verification and preview

- `pnpm run verify`, integration, e2e
- Vercel preview from this branch
- Production unchanged until explicit owner approval
