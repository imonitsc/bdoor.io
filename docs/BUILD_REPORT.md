# Build report

**Date:** 28 August 2026
**Branch:** `claude/deployment-status-check-ucci3m` (from `93c69da`, the default branch head)
**Scope:** Phase 0 (discovery and baseline) and the first slice of the
28 August 2026 production brief — CI and safety rails.

This report states what was actually run. Anything not verified is marked as
not verified.

---

## What the brief asked for vs what already existed

The brief describes building a production platform. Much of it is already
built. Discovery found, in `src/`:

- Five route groups under `src/app/[locale]/`: marketing, auth, customer,
  partner, admin — 59 pages.
- 76 tables in `public` and 5 in `compliance`, RLS enabled on all 81.
- KYC/UBO, documents with quarantine and versioning, quotes with immutable
  accepted versions, payments adapter, audit logging, compliance obligations.
- Unit, integration and Playwright suites including axe accessibility.

So this slice did not rebuild any of that. It closed the gaps that make the
rest verifiable.

### Decisions taken (owner-approved, 28 August 2026)

1. **Case state machine — keep the shipped one.** The brief proposes different
   statuses (`assessment_complete`, `in_preparation`, `compliance_active`, …).
   The live enum has 16 statuses and 39 transitions, enforced by
   `app.enforce_case_transition()` and covered by tests. Adopting the brief's
   machine would be a breaking migration, not an addition. Genuinely missing
   states may be added additively later.
2. **Brand — deferred.** The brief mandates Manrope, a Cobalt/Vermilion/
   Turquoise/Marigold palette, and lowercase `bdoor`. The live site uses Geist,
   teal tokens and `BDoor`. The approved asset package is **not in the
   repository**, and the brief says to pause the brand step and report missing
   files rather than substitute a logo. Missing: `bdoor_branding/01_Logos/SVG/*`,
   `bdoor_branding/02_Icons/favicon.ico`, and the app-icon/OG directories.
3. **Start with CI and safety rails**, before feature phases.

---

## Changes in this slice

| Area     | Change                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| CI       | `.github/workflows/ci.yml` — four jobs covering the brief's 12 required checks                                                          |
| CI       | `.github/workflows/codeql.yml` — security-and-quality, weekly plus per PR                                                               |
| CI       | `.github/dependabot.yml` — grouped npm and github-actions updates                                                                       |
| Coverage | `@vitest/coverage-v8` added; thresholds scoped to critical logic                                                                        |
| Runtime  | `productionEnvProblems()` now checks the two `NEXT_PUBLIC_SUPABASE_*` variables                                                         |
| Tests    | `tests/unit/production-env.test.ts` — 5 tests                                                                                           |
| Node     | `engines.node` raised to `>=22.0.0`                                                                                                     |
| Env      | `.env.example` gained 12 reserved integration variables                                                                                 |
| Docs     | `DATA_MODEL.md`, `SECURITY.md`, `PRICING_AND_FEES.md`, `OPERATIONS_RUNBOOK.md`, `DEPLOYMENT.md`, `LEGAL_LAUNCH_CHECKLIST.md`, this file |

### Why the environment change matters

Production returned 500 on every request twice on 28 August 2026: first for a
missing `SUPABASE_SECRET_KEY`, then for missing `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The boot check only knew about the
first, so the second only appeared after a deploy. It now names all four at
once, and treats blank as missing.

---

## Test results

Actually executed in this session:

| Check                       | Result                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| `pnpm run format:check`     | pass                                                               |
| `pnpm run lint`             | pass                                                               |
| `pnpm run typecheck`        | pass                                                               |
| Unit tests                  | **111 passed** (103 existing + 8 new)                              |
| Critical-logic coverage     | **89.3% statements, 92.8% lines, 74.0% branches, 87.7% functions** |
| Migrations from zero + seed | pass — 13 migrations against PostgreSQL 16                         |
| Integration / RLS           | **60 passed**, stable across 5 consecutive rebuilt-database runs   |
| `pnpm run build`            | pass                                                               |

**Playwright: 41 of 41 passed**, including the axe accessibility specs and the
full questionnaire journeys — run against a server started with _no_ Supabase
environment variables, which is exactly the CI configuration.

The sandbox ships `chromium_headless_shell-1194` while this Playwright wants
`1234`, so the run used `PLAYWRIGHT_CHROMIUM_PATH` to point at the available
build. CI installs the matching browser itself and is unaffected.

Coverage is measured on the seven pure-logic modules the unit suite targets, not
on all of `src/`. Measuring Server Actions and React here would produce a number
that looks like coverage and tests nothing. Thresholds sit at 80/65/70/80 —
below the current measurement, so a regression fails. The brief's 90% target is
not met on `rules.ts` (84.5%) or `state-machine.ts` (89.5% statements).

---

## Production state

Verified against the Vercel and Supabase APIs, not assumed:

- `https://www.bdoor.io/en` returns **HTTP 200** on deployment `dpl_xDFU1E9k…`.
- Runtime logs on that deployment: 69 × 200, zero 500s.
- Canonical and `og:url` resolve to `https://www.bdoor.io/en`; `hreflang`
  covers `en`, `bn`, `x-default`.
- Supabase security advisors: **0 findings**.

The database was empty until this session — none of the 13 migrations had ever
been applied to the production Supabase project. They were applied with the
owner's approval. `seed.sql` was **not** loaded: it is sample data.

One migration needed splitting. `20260101001100_storage.sql` contains
`alter table storage.objects enable row level security`, which fails on hosted
Supabase because that table is owned by the storage role. RLS is enabled there
by default; the statement was omitted and `relrowsecurity = true` confirmed
afterwards. The local shim permits the statement, so CI will not catch this —
recorded in `docs/DEPLOYMENT.md`.

---

## Open blockers

**Legal and commercial** — every item in `docs/LEGAL_LAUNCH_CHECKLIST.md` is
open. Policies are drafts; trust fields are unverified; screening is a mock;
the payment merchant agreement is unsigned; cross-border processing has no
legal position.

**Credential-dependent** — no malware scanner, no email provider, no SSLCommerz
credentials, no Sentry DSN. Each has an adapter and a mock default; none may be
claimed as working.

**Engineering, not yet built**

| Gap                                               | Where it bites                                                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preview and production share one Supabase project | A preview can reach production data. Highest-priority fix                                                                                                                    |
| No transactional outbox                           | A failed notification side-effect is lost                                                                                                                                    |
| No `idempotency_keys` table                       | Idempotency rests on `payment_events` uniqueness alone                                                                                                                       |
| No scheduler                                      | `compliance_reminders` rows are created but never sent                                                                                                                       |
| No `price_versions` history                       | A published price can change with no audit trail                                                                                                                             |
| No `government_fee_rules` engine                  | No slab calculator, no staleness gate at checkout                                                                                                                            |
| No CSP, no Turnstile, no field-level encryption   | Header and abuse hardening incomplete                                                                                                                                        |
| Rate limiter is in-process                        | Resets on deploy, per-instance                                                                                                                                               |
| No `/ops` route group                             | Operations shares `/admin`                                                                                                                                                   |
| Missing roles                                     | `content_editor` and `auditor` from the brief do not exist                                                                                                                   |
| Dependency graph disabled on the repository       | `Dependency review` detects this and skips with a warning; the PR dependency diff is not reviewed until it is enabled at Settings → Code security. `pnpm audit` still blocks |

---

## Next

Suggested order, each a reviewable pull request:

1. Staging Supabase separation — stop previews touching production data.
2. Transactional outbox and `idempotency_keys`, then the scheduler.
3. `price_versions` and the government-fee rule engine with the staleness gate.
4. SSLCommerz and manual bank transfer (blocked on merchant credentials).
5. Brand application, once `bdoor_branding/` is supplied.
