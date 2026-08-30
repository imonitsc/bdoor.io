# BDoor

**Your door to business in Bangladesh.** BDoor is a digital platform that helps
Bangladeshi and foreign founders start and run a business in Bangladesh: a
guided questionnaire that produces a preliminary recommendation, a secure
customer workspace for documents and cases, a partner workspace for the
advocates and agents who do the filing work, and an internal operations area
for the BDoor team.

> BDoor is an independent business setup and administrative-support platform.
> BDoor is not a government authority or law firm. Legal services, where
> required, are provided under a separate engagement by independent advocates or
> partner law firms. Government approval and processing times are not
> guaranteed.
>
> That disclosure is not marketing copy to be edited freely — it is rendered on
> every page from `src/i18n/messages/*.json` and asserted by
> `tests/e2e/marketing.spec.ts`.

---

## Contents

- [What is in here](#what-is-in-here)
- [Architecture](#architecture)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Running the tests](#running-the-tests)
- [Deploying to Vercel](#deploying-to-vercel)
- [Activating an integration](#activating-an-integration)
- [Common tasks](#common-tasks)
- [Ask bdoor AI](docs/ASK_BDOOR_AI.md)
- [Security notes](#security-notes)
- [What still needs a human](#what-still-needs-a-human)

---

## What is in here

| Area                 | Route base                 | Who                                   |
| -------------------- | -------------------------- | ------------------------------------- |
| Marketing site       | `/[locale]`                | anyone, indexed                       |
| Guided questionnaire | `/[locale]/start`          | anyone, no account needed             |
| Authentication       | `/[locale]/login` …        | anyone                                |
| Customer workspace   | `/[locale]/app`            | organisation members                  |
| Provider application | `/[locale]/partners/apply` | firms applying to the network (gated) |
| Partner workspace    | `/[locale]/partner`        | verified partner organisations        |
| Operations / admin   | `/[locale]/admin`          | BDoor staff, per capability           |

Two locales ship: English (`en`) and Bangla (`bn`). Every public page exists in
both, with `hreflang` alternates and a locale switcher in the header and footer.

The three private areas are served `Cache-Control: private, no-store` and
`X-Robots-Tag: noindex` by `next.config.ts`, excluded from `sitemap.xml`, and
disallowed in `robots.txt`.

---

## Architecture

```
Browser
  │
  ├── Next.js 16 App Router (React 19, Server Components by default)
  │     ├── proxy.ts ............ locale negotiation + auth cookie refresh
  │     ├── Server Actions ...... every mutation; re-checks authorisation
  │     └── Route handlers ...... /api/auth/confirm, /api/payments/*
  │
  ├── Adapters (src/lib/*) ...... payments, email, screening, malware, AI
  │     └── every one defaults to a mock; none needs a credential to boot
  │
  └── Supabase
        ├── Postgres + Row Level Security ... 81 tables, 211 policies
        ├── private schema `app` ............ RLS predicate functions
        ├── private schema `compliance` ..... screening and risk, never exposed
        ├── Auth ............................ email/password + TOTP MFA
        └── Storage ......................... 5 private buckets, 1 public
```

### Directory map

```
src/
  app/[locale]/          route groups: (marketing) (auth) (customer) (partner) (admin)
  components/            ui/ primitives, plus layout, forms, marketing, dashboard
  features/              domain logic, one folder per bounded area
    cases/               state machine, deadline maths
    intake/              questionnaire, rule engine, anonymous drafts
    quotes/              money in integer minor units
    documents/           magic-byte sniffing, canonical paths
    kyc/ compliance/     screening decisions, reminders
  lib/
    supabase/            client / server / admin / public / proxy factories
    permissions/         capability matrix and errors
    audit/               append-only logging with redaction
    rate-limit/          fixed-window limiter behind a swappable store
    payments/ email/ screening/ malware/ ai/     adapters
  i18n/                  routing, request config, messages/{en,bn}.json
supabase/
  migrations/            13 ordered SQL files
  seed.sql               entirely fictional development data
scripts/
  local-db/              apply the schema to a plain Postgres, generate snapshots
  seed-auth-users.mjs    give the seeded accounts a password
  invite-initial-super-admin.mjs   grant the first super_admin on a fresh project
tests/
  unit/ integration/ e2e/
docs/                    role matrix, case states, data retention, incident response, launch checklist
```

### Three decisions worth knowing

**Authorisation is enforced twice, in the database and on the server.** The UI
hides what you cannot do, but hiding is not enforcement. Every Server Action
calls `requireCapability()` before it touches data, and every table has RLS
policies that would reject the write even if the action forgot. Roles live in
`public.platform_roles` and `public.organization_memberships` — never in
`auth.users.raw_user_meta_data`, which the user can edit.

**The recommendation engine is deterministic.** `src/features/intake/rules.ts`
evaluates a small condition DSL against the answers. Rules are editable from the
admin area, but the reasons that force a case into manual review are hard-coded
in `hardManualReviewReasons()` so an edited rule cannot switch them off. No LLM
is involved, and the AI adapter defaults to `disabled`.

**The marketing site works with no database.** `catalog-snapshot.ts` and
`rules-snapshot.ts` are generated from `seed.sql` and bundled. If Supabase is
unreachable the public pages fall back to the snapshot and log
`catalog.*_fallback` rather than rendering an empty page.

---

## Local setup

Requires Node 22+, pnpm 10+, and (for the integration tests) a local Postgres 15+.

```bash
pnpm install
cp .env.example .env.local     # fill in as much as you have
pnpm dev                       # http://localhost:3000
```

The app boots with an empty `.env.local`. Without Supabase credentials the
marketing site and the questionnaire work from the bundled snapshot; anything
that needs an account will tell you it is unavailable rather than crashing.

---

## Environment variables

Every variable is declared and validated in `src/lib/env.ts`. `.env.example`
carries names and comments only — never a value.

| Variable                               | Required          | Notes                                                                                                             |
| -------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | production        | Absolute origin, no trailing slash. Canonical URLs, OG images, auth redirects. Blank counts as unset — see below. |
| `NEXT_PUBLIC_SUPABASE_URL`             | production        | Project URL.                                                                                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | production        | The anon key. Safe in the browser — RLS is what protects the data.                                                |
| `SUPABASE_SECRET_KEY`                  | production        | **Server only.** Bypasses RLS. Never prefix with `NEXT_PUBLIC_`.                                                  |
| `PAYMENT_PROVIDER`                     | no                | `mock` (default), `sslcommerz`, `stripe`.                                                                         |
| `PAYMENT_WEBHOOK_SECRET`               | when not mock     | HMAC secret for inbound webhooks, ≥16 chars.                                                                      |
| `PAYMENT_RETURN_URL`                   | no                | Overrides where the gateway returns the customer.                                                                 |
| `EMAIL_PROVIDER`                       | no                | `mock` (default), `resend`, `smtp`.                                                                               |
| `EMAIL_FROM`                           | when not mock     | Sending address.                                                                                                  |
| `SCREENING_PROVIDER`                   | no                | `mock` (default) or `live`.                                                                                       |
| `MALWARE_SCAN_PROVIDER`                | no                | `mock` (default) or `live`.                                                                                       |
| `AI_PROVIDER`                          | no                | `disabled` (default) or `anthropic`. The recommendation engine, not the assistant.                                |
| `AI_API_KEY`                           | when AI enabled   |                                                                                                                   |
| `ASK_BDOOR_AI_ENABLED`                 | no                | `false` (default). Switches on the customer assistant — see [docs/ASK_BDOOR_AI.md](docs/ASK_BDOOR_AI.md).         |
| `AI_GATEWAY_API_KEY`                   | local only        | **Refused in production**: deployed environments authenticate to AI Gateway with Vercel OIDC.                     |
| `AI_DAILY_BUDGET_USD`                  | no                | Application-side cap, default 25. The enforced cap is the AI Gateway budget.                                      |
| `AI_MONTHLY_BUDGET_USD`                | no                | Application-side cap, default 400.                                                                                |
| `AI_IDENTITY_SALT`                     | when assistant on | Salts the hashed safety identifier sent to the gateway.                                                           |
| `CRON_SECRET`                          | when assistant on | Bearer token for the nightly conversation-retention sweep.                                                        |
| `SENTRY_DSN`                           | no                |                                                                                                                   |
| `RATE_LIMIT_DISABLED`                  | no                | `true` turns the limiter off. Never in production.                                                                |
| `STRICT_ENV`                           | no                | Defaults to on. Set `false` only on a preview that deliberately runs without production secrets.                  |
| `NEXT_PUBLIC_ANALYTICS_ENABLED`        | no                |                                                                                                                   |

`src/instrumentation.ts` runs the production completeness check once at boot. An
incomplete production environment fails to start rather than returning 500s at
request time — which is the behaviour you want, because the alternative is a
site that looks up and silently cannot serve a signed-in user.

**Secrets never carry the `NEXT_PUBLIC_` prefix.** Anything with that prefix is
inlined into the browser bundle at build time. `src/lib/supabase/admin.ts` is
the only module that reads `SUPABASE_SECRET_KEY`, and it is `server-only`.

---

## Supabase setup

### 1. Create the project

Create a Supabase project, then put the URL, the publishable key and the secret
key into `.env.local`.

### 2. Apply the migrations

```bash
supabase link --project-ref <ref>
pnpm run db:push          # supabase db push
```

Or, for a local Supabase stack:

```bash
supabase start
pnpm run db:reset         # applies migrations + seed.sql
pnpm run db:types         # regenerate src/types/database.ts
```

The 13 migrations are ordered and idempotent-ish (they use `create ... if not
exists` where it is safe to). They must be applied in filename order.

### 3. Seed development data

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

Everything in `seed.sql` is fictional and suffixed "(sample)". There are no real
names, national ID or passport numbers, bank details, addresses or partner
credentials in it, and none may ever be added.

The seeded `auth.users` rows have an id and email only, so they satisfy foreign
keys and exercise RLS but cannot sign in. To make them signable:

```bash
SEED_PASSWORD='choose-something-long' node scripts/seed-auth-users.mjs
```

The script refuses to run against a non-local URL unless `ALLOW_NON_LOCAL=1`,
and there is no default password — a checked-in default is a credential.

### 4. Authentication settings

In the Supabase dashboard, under Authentication:

- **URL configuration** — set the site URL and add
  `<origin>/api/auth/confirm` as a redirect URL.
- **Email templates** — point confirmation and recovery at
  `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type={{ .EmailActionType }}`.
- **MFA** — enable TOTP. Staff roles and partner roles are required to enrol
  before they can reach their workspace
  (`MFA_REQUIRED_PLATFORM_ROLES` / `MFA_REQUIRED_ORGANIZATION_ROLES`).
- **Sessions** — leave refresh-token rotation on.

### 5. Storage buckets

`20260101001100_storage.sql` creates them, so there is nothing to click:

| Bucket                | Public  | Limit | Holds                            |
| --------------------- | ------- | ----- | -------------------------------- |
| `identity-documents`  | no      | 10 MB | passports, NIDs, photos          |
| `case-documents`      | no      | 25 MB | filings, drafts, correspondence  |
| `official-records`    | no      | 25 MB | issued certificates and licences |
| `message-attachments` | no      | 10 MB | attachments on case messages     |
| `partner-credentials` | no      | 10 MB | partner bar/licence evidence     |
| `public-marketing`    | **yes** | 5 MB  | marketing images only            |

Every private bucket is reached through a short-lived signed URL generated
server-side after an authorisation check. Storage policies derive the owning
organisation from path segment 2 rather than trusting anything the uploader
sent, and paths are generated by `app.canonical_document_path()` — a customer
cannot choose a path that lands in someone else's namespace.

---

## Running the tests

```bash
pnpm run verify            # format:check → lint → typecheck → unit → build
pnpm run test:unit         # 96 tests, no services needed
pnpm run test:integration  # 60 tests against a real Postgres, RLS on
pnpm run test:e2e          # 41 Playwright specs × desktop and mobile = 82 runs
```

### Integration tests

These exercise the RLS policies themselves, which is the only way to know they
work. They run against a plain Postgres — no Supabase stack required — using a
shim that recreates the parts of the Supabase environment the policies depend on
(`auth.uid()`, the `auth`/`storage` schemas, the automatic grants).

```bash
# a throwaway cluster on a unix socket in /tmp, port 55432
scripts/local-db/apply.sh --seed
pnpm run test:integration
```

`apply.sh` drops and recreates `bdoor_test`, applies the shim and then every
migration in order. Without `--seed` you get an empty schema, which is what you
want for a pure DDL check.

### End-to-end tests

```bash
pnpm run test:e2e
```

Playwright builds and starts the app itself, with `RATE_LIMIT_DISABLED=true`
(the suite walks the questionnaire several times from one address, which is
exactly the shape the limiter exists to stop) and `STRICT_ENV=false` (E2E runs
without Supabase credentials on purpose — the degraded path is part of what is
under test).

To run against a server you started yourself, set `PLAYWRIGHT_BASE_URL`. On an
image that already ships Chromium, set `PLAYWRIGHT_CHROMIUM_PATH` instead of
downloading a second copy.

`tests/e2e/accessibility.spec.ts` runs axe-core against ten pages with the
`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` tags and asserts an
empty violation list. Automated testing cannot prove conformance, but a clean
run rules out the class of defects it can see.

---

## Deploying to Vercel

1. Import the repository. Framework preset: Next.js. Build command `pnpm build`,
   install command `pnpm install`.
2. Set every production variable from the table above. `SUPABASE_SECRET_KEY`
   goes in as a plain (server) environment variable — Vercel does not expose it
   to the browser unless you name it `NEXT_PUBLIC_*`.
3. Set `NEXT_PUBLIC_SITE_URL` to the production origin, no trailing slash.
   Leave it out entirely rather than adding it with an empty value: a declared
   blank is still a declared variable. `siteUrl()` treats blank as unset and
   falls back to the origin Vercel injects — the production domain on a
   production deploy, the deployment's own URL on a preview — so the build
   survives either way, but only an explicit value gives you canonical URLs on
   your own domain.
4. Add the production origin to the Supabase Auth redirect list.
5. Point the payment gateway's webhook at `<origin>/api/payments/webhook` and
   set `PAYMENT_WEBHOOK_SECRET` on both sides.
6. Deploy. If a variable is missing the build starts but the runtime refuses to
   boot, with the missing names in the log.

**Preview deployments** run without production secrets. Set `STRICT_ENV=false`
on the preview environment so they boot into the degraded, snapshot-backed mode
instead of failing.

**Rate limiting** uses an in-process fixed-window store, which is correct for a
single instance and better than nothing on several. On a multi-instance
deployment, implement `RateLimitStore` against Redis/Upstash and swap the
`store` constant in `src/lib/rate-limit/index.ts`; every call site already goes
through `enforceRateLimit`, so nothing else changes.

---

## Activating an integration

Every integration is a small interface with a mock implementation selected by an
environment variable. Nothing in this repository contains a credential, and no
adapter invents one. To activate a real provider you write the adapter, add its
secret to the environment, and flip the variable.

### Payment gateway

`src/lib/payments/` defines `PaymentProvider` (`createCheckout`,
`parseWebhook`, `getStatus`) and ships `mock-provider.ts`. The mock issues a
checkout URL under `/api/payments/mock/checkout`, and the whole quote → payment
→ receipt flow works end to end against it.

To add SSLCOMMERZ or Stripe:

1. Implement `PaymentProvider` in `src/lib/payments/<name>-provider.ts`.
2. Return it from `getPaymentProvider()` for that value of `PAYMENT_PROVIDER`.
3. Verify the signature in `parseWebhook` using `PAYMENT_WEBHOOK_SECRET`. The
   route handler already treats webhooks as untrusted, idempotent by provider
   event id, and never trusts an amount it did not compute itself.
4. Set `PAYMENT_PROVIDER` and `PAYMENT_WEBHOOK_SECRET`.

`paymentsAreSandbox()` drives the "sandbox" badge in the UI. Leave it honest.

**Foreign share capital never moves through BDoor.** The platform charges
service fees and pass-through government fees only. Capital goes from the
investor directly to the company's own account through a scheduled bank, and the
questionnaire and the case UI both say so.

### Email

`src/lib/email/` defines `EmailProvider.send()`. The mock logs a redacted
summary and sends nothing. Implement Resend or SMTP, set `EMAIL_PROVIDER` and
`EMAIL_FROM`. `emailIsMock()` is what the admin area reads to say "email is not
configured" instead of pretending a notification went out.

### Sanctions / PEP screening

`src/lib/screening/` defines `ScreeningProvider.screen()`. The mock **never
contacts a sanctions or PEP list**, and every result it returns is labelled in
the UI as a non-screening so nobody mistakes it for a cleared check. Screening
output is written to the private `compliance` schema, which is not in the
PostgREST exposed-schema list and has no grants to `anon` or `authenticated`.

### Malware scanning

`src/lib/malware/` defines `MalwareScanner.scan()`. The mock leaves uploads in a
`pending` scan state — it never marks an unscanned file clean. Until a real
scanner is configured, the UI shows uploads as awaiting scan and staff download
links carry the warning.

### AI

`src/lib/ai/` is `disabled` by default and the product does not need it. If you
enable it, `prepareForModel()` is the only way a request may be built: it
minimises and redacts before anything leaves the process. Raw passports, NIDs,
bank documents, signatures and unrelated case documents are never sent to a
model. `shouldEscalate()` routes anything that looks like legal advice to a
human instead.

---

## Common tasks

### Add a service to the catalogue

Services live in `public.services` with per-locale copy in
`public.service_translations`. Add the row (admin area → Services, or SQL), then
regenerate the offline snapshot so the marketing site still shows it when the
database is unreachable:

```bash
node scripts/local-db/gen-catalog-snapshot.mjs
```

A service without a verified government fee must publish "Quoted after review"
rather than a number. `tests/e2e/marketing.spec.ts` asserts this.

### Create a partner organisation

1. Admin → Partners → create the organisation. It starts `unverified`.
2. Invite the partner owner. They accept, enrol TOTP (required for partner
   roles), and upload their credential evidence to `partner-credentials`.
3. A BDoor admin reviews and sets `verification_status = 'verified'`. A partner
   cannot verify itself: `app.partners_guard()` raises unless the caller holds
   an admin platform role, and only verified partners appear in
   `verified_partners_public`.
4. Assign a case. The partner sees the case, and sees its documents only while
   the customer's document authorisation stands — revoke it and the documents
   disappear on the next request, not on the next login.

### Grant a staff role

Staff roles arrive through `public.platform_invitations`. An administrator
invites an address, the invitee accepts a single-use token, and the row records
who invited whom and why. Nothing about a platform role happens by public
signup.

Who may invite whom is not a list — `app.may_invite_template()` refuses if the
invited role holds any permission the inviter does not hold themselves. So a
plain `admin` may invite `admin`, `case_manager`, `operations_manager`,
`support`, `content_editor`, `legal_policy_publisher` and `auditor`, but **not**
`compliance_officer` (`kyc.decide`, `risk.write`) or `finance`
(`refund.approve`). Those are precisely the permissions `admin` is deliberately
denied, and inviting a second account that holds them would be the obvious way
around the denial. Only a `super_admin` can invite those.

The older path still exists underneath: roles are rows in
`public.platform_roles`, whose write policy is
`app.is_admin() and user_id <> auth.uid()` — an administrator can grant a role
to someone else and can never grant one to themselves.

#### The first super_admin

On a fresh database nobody holds anything, so nobody can invite the first
`super_admin`. Something outside the permission system has to start it:

```bash
# The person signs up through the application first and confirms their address.
node scripts/invite-initial-super-admin.mjs someone@example.com
```

It raises an account that already exists — it does not create one and does not
set a password, because seeding a password would be inventing a credential. It
refuses against anything that is not obviously a local project unless
`ALLOW_NON_LOCAL=1`, refuses an unconfirmed address, and refuses outright once a
`super_admin` exists. Bootstrap happens once; every later grant goes through the
invitation flow, where it is attributable.

### Change the case state machine

Edit `public.case_status_transitions` (the database is the source of truth; a
trigger enforces it) **and** the mirrored table in
`src/features/cases/state-machine.ts` (the UI uses it to disable impossible
actions). `tests/integration/case-transitions.test.ts` fails if the two drift.

---

## Security notes

- **Authorisation is never based on UI visibility.** Server Actions call
  `requireCapability()`; RLS re-checks independently.
- **Never `auth.getSession()` on the server.** `src/lib/auth/session.ts` uses
  `auth.getClaims()`, which verifies the JWT signature. `getSession()` returns
  whatever the cookie says.
- **User metadata is not an authorisation source.** `raw_user_meta_data` is
  editable by the user. Roles live in their own tables.
- **`SECURITY DEFINER` is avoided.** The RLS predicate functions that need it
  live in the private `app` schema, are not exposed through PostgREST, set
  `search_path = ''`, and do their own explicit checks.
- **Audit logs are append-only.** An `app.reject_mutation()` trigger rejects
  update and delete on `public.audit_logs` and `public.case_status_history`.
- **Logs are redacted.** `src/lib/audit/redact.ts` redacts by key shape and by
  value shape. Raw passwords, tokens, full identity numbers, document contents
  and payment credentials never reach a log line.
- **Uploads are sniffed, not trusted.** `src/features/documents/validation.ts`
  reads magic bytes; a `.pdf` that is really an executable is rejected before it
  reaches storage. File names are sanitised and the stored path is generated
  server-side.
- **Storage is private.** No passport, NID, signature, address, banking or
  corporate document is ever served from a public bucket or a permanent URL.
- **Webhooks are untrusted input.** HMAC-verified, idempotent by provider event
  id, and the amount is always the one BDoor computed.
- **Rate limits** cover sign-in, sign-up, password reset, MFA verification,
  contact, questionnaire saves, uploads, downloads, invitations and messages.

Report a suspected vulnerability privately to the security contact recorded in
`docs/INCIDENT-RESPONSE.md` — which also sets out what happens next. BDoor has
not published a dedicated security address yet, so that document currently
points at the general contact address; publishing a real one is on the launch
checklist.

---

## What still needs a human

This is an MVP built to be reviewed, not to be switched on unread.

- **Every legal page is a draft.** Terms, Privacy, Refund, AML/KYC, Legal
  Disclaimer and Cookie Policy are marked as templates in
  `src/content/legal/documents.ts` and render a "Draft awaiting professional
  review" banner. They must be reviewed by qualified Bangladesh counsel before
  launch.
- **Government fees and processing times are placeholders** unless a service
  row carries a verified figure and a review date. Where BDoor does not have
  one, the page says "Quoted after review" — keep it that way rather than
  guessing.
- **Screening is mocked.** No sanctions or PEP list is contacted until a real
  provider is implemented and configured.
- **Malware scanning is mocked.** Uploads sit in `pending` until a scanner is
  configured.
- **No office address, registration number, partner logo, press logo, award,
  testimonial, rating or statistic appears anywhere in this codebase**, because
  BDoor does not have verified ones yet. Add them only with evidence.

See `docs/LAUNCH-CHECKLIST.md` for the full list.
