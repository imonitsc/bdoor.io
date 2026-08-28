# Deployment

Verified against the live Vercel project and Supabase project on 28 August 2026.

|                   |                                                            |
| ----------------- | ---------------------------------------------------------- |
| Vercel project    | `bdoor-io` (team `mik-partners`)                           |
| Production branch | `claude/new-session-0n73z6` (the repository default)       |
| Domains           | `bdoor.io` → 308 → `www.bdoor.io`                          |
| Supabase project  | `bdoor.io` (`wtdogszssofiqcdrthnl`), region ap-southeast-1 |
| Framework preset  | Next.js, Node 22, Turbopack                                |

---

## Environment variables

Set per environment in Vercel. `.env.example` is the authoritative list.

**Build-time vs runtime is not a detail.** `NEXT_PUBLIC_*` values are inlined
into the bundle when the app is built. A plain redeploy that reuses the build
cache will _not_ pick up a changed `NEXT_PUBLIC_*` value — trigger a fresh
build. Server-only variables such as `SUPABASE_SECRET_KEY` are read at runtime
and do take effect on a redeploy.

Minimum for production:

| Variable                               | Scope                                      |
| -------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                 | Build. Absolute origin, no trailing slash  |
| `NEXT_PUBLIC_SUPABASE_URL`             | Build                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build. Browser-safe; RLS protects the data |
| `SUPABASE_SECRET_KEY`                  | Runtime. **Server only.** Bypasses RLS     |

`src/instrumentation.ts` runs `productionEnvProblems()` once at boot and refuses
to start when any of those four is missing or blank, naming all of them at once.
`STRICT_ENV=false` downgrades it to a warning — for a preview that deliberately
runs without production credentials, never for production.

A variable declared with an **empty value** is a defined empty string, not
absent. `siteUrl()` and the boot check both treat blank as missing; do not
reintroduce `??` where `||` is used, or a blank value will sail through.

---

## Deploying

Vercel's Git integration handles this. Do not add a deploy GitHub Action —
it would double-deploy.

- Every pull request gets a preview deployment.
- A push to the default branch deploys production.
- Prefer promoting a verified preview artifact over rebuilding for production.

CI (`.github/workflows/ci.yml`) must be green first: format, lint, types, unit
with coverage threshold, migrations from zero, 60 RLS tests, Playwright with
axe, production build, dependency audit.

---

## Database changes

1. Write the migration in `supabase/migrations/`, timestamp-prefixed.
2. Rebuild from zero locally: `scripts/local-db/apply.sh --seed`. This is what
   CI does, so a migration that only works against an already-migrated database
   fails here rather than in production.
3. Run `pnpm run test:integration`.
4. Regenerate types: `pnpm run db:types`. Commit them.
5. Apply to production **before** promoting code that depends on it.

Migrations must be backward-compatible. A destructive one needs a backup, a data
migration, explicit approval, and a written rollback plan.

### One known portability trap

`20260101001100_storage.sql` contains
`alter table storage.objects enable row level security`. That statement fails on
hosted Supabase — the table is owned by the storage role, not the migration
role — and it takes the whole migration down with it. RLS is already enabled
there by default, so the statement is unnecessary. When applying this migration
to a hosted project, split it and omit that line. The local shim
(`scripts/local-db/supabase-shim.sql`) permits it, which is why CI does not
catch this.

---

## Rollback

**Code.** Promote the previous deployment in Vercel. Instant, no rebuild.

**Database.** Rolling a migration back is rarely safe once rows exist. Prefer a
forward fix: a new migration that restores the previous behaviour. Only restore
from backup when data is actually corrupt, and expect to lose writes since the
snapshot.

Verify a restore works before launch, then periodically. An untested backup is
not a backup.

---

## Preview and production share a database — fix before launch

Both environments currently point at the same Supabase project. A preview
deployment can therefore read and write production data, and a migration tested
on a preview is applied to production.

This must be resolved before real customer data exists. Either a separate
staging Supabase project or Supabase branching, with preview environment
variables pointed at it. Until then, treat every preview as production-touching:
do not seed sample data, do not exercise destructive flows.

Tracked in `docs/LEGAL_LAUNCH_CHECKLIST.md` and `docs/BUILD_REPORT.md`.

---

## Post-deploy verification

- Homepage in both locales; `/` redirects to `/en` or `/bn`.
- Sign-up, verification, login, logout, reset, MFA.
- Anonymous questionnaire continues correctly after account creation.
- Customer A cannot reach customer B's URLs.
- Document upload lands in quarantine; download requires authorization.
- Quote acceptance produces an invoice.
- Payment sandbox: success, failure, cancel, duplicate webhook.
- `robots.txt` and `sitemap.xml` carry the real origin, not localhost or a
  deployment URL.
- No console errors, no secret in the bundle, no PII in logs.
