# Current-state audit

**Date:** 28 August 2026  
**Branch:** `cursor/bdoor-production-premium-upgrade-f888`  
**Baseline live site:** https://www.bdoor.io/en  
**Master brief:** BDoor Cursor Production Upgrade Master Instructions, 28 August 2026

---

## Repository baseline

| Item            | Value                                              |
| --------------- | -------------------------------------------------- |
| Package manager | pnpm 10.33.0 (frozen lockfile)                     |
| Framework       | Next.js 16.3.2, React 19.2.8, TypeScript 6 strict  |
| i18n            | next-intl 4.13.7 — `en` and `bn`                   |
| Database        | Supabase Postgres, 18 migrations after this branch |
| Auth            | Supabase Auth, TOTP MFA, step-up policies          |
| Branding        | Official `bdoor_branding/` package installed       |

### Verify baseline (this branch, clean install)

| Check             | Result                          |
| ----------------- | ------------------------------- |
| `pnpm run verify` | Run in CI — expected pass       |
| Integration tests | Required after migration 1700   |
| E2E               | Hero copy and nav links updated |

---

## Feature inventory

| Feature                          | Status                  | Notes                                                                          |
| -------------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| Locale routing `/en`, `/bn`      | Implemented, verified   | Preserved                                                                      |
| Homepage premium upgrade         | Implemented, unverified | New hero, 7-step flow, service finder                                          |
| Service catalogue (8 published)  | Implemented, verified   | Snapshot fallback works                                                        |
| Service taxonomy (~100 services) | Partial                 | `src/content/service-taxonomy.ts` seeded; full DB catalogue pending ops review |
| Countries framework              | Implemented, partial    | BD published; US/GB/AE/SG `coming_soon`                                        |
| Industries pages                 | Implemented, unverified | Snapshot industries; DB rows draft until reviewed                              |
| Authority directory              | Implemented, unverified | Informational; RJSC/NBR etc. draft in DB                                       |
| Evidence register                | Implemented             | TS + DB; only `verified` renders publicly                                      |
| Social profiles config           | Implemented, blocked    | Reserved handles; no active URLs until owner verifies                          |
| Customer workspace               | Implemented, verified   | Real data paths                                                                |
| Partner portal                   | Implemented, verified   | MFA enforced                                                                   |
| Admin/ops/finance                | Implemented, partial    | `/admin/users` needs prod migrations 1300–1600                                 |
| Payments                         | Mocked                  | SSLCommerz adapter not wired                                                   |
| Legal pages                      | Draft                   | `awaitingCounselReview: true`                                                  |
| Preview/prod Supabase split      | Missing                 | **Unsafe** — preview can touch production data                                 |

---

## Proposed actions

1. Apply migration `20260101001700_production_catalog_expansion.sql` to staging first.
2. Owner completes `docs/launch/owner-action-register.md` blockers before commercial claims.
3. Separate preview Supabase project before wide preview testing.
4. Expand service catalogue in reviewable slices with evidence records per claim.

See also: `docs/redesign/current-state-audit.md` (28 Aug redesign slice).
