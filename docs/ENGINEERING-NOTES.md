# Engineering working notes

Extracted from the CLAUDE.md that was in force until 2 September 2026, when the owner
replaced it with the production implementation authority now at the repository root.
The new CLAUDE.md supersedes the earlier _briefs_; this file is the operational how-to
those briefs sat on top of — commands, architecture, the role model, security
requirements, copy rules and testing conventions. Where it and CLAUDE.md disagree,
CLAUDE.md wins.

The full superseded contract is archived at `docs/BDoor_Claude_Instruction_2026-09-01.md`.

---

Part I above is the founder's site-grounded contract of 1 Sep 2026; current
priorities live in `docs/ROADMAP.md` — read it before starting feature work.
It supersedes the earlier same-day retention contract (archived at
`docs/BDoor_Retention_Contract_2026-09-01.md`) and the 31 Aug master
instructions (`docs/BDoor_Master_Instructions_2026-08-31.md`). This part is
the operational how-to for changing this repository without breaking the
things that matter — commands, architecture, the role model, security
requirements, copy rules, testing and the definition of done. Both parts
bind every session; where they touch the same subject, Part I and the
founder's newer instructions win. Read `README.md` first.

## Commands

```bash
pnpm dev                   # dev server on :3000
pnpm run verify            # format:check → lint → typecheck → unit → build
pnpm run lint              # eslint .            (auto-fix: lint:fix)
pnpm run format            # prettier --write .
pnpm run typecheck         # tsc --noEmit
pnpm run test:unit         # vitest, no services needed
pnpm run test:integration  # vitest against a real Postgres, RLS on
pnpm run test:e2e          # playwright, builds and starts the app itself
pnpm run db:reset          # local Supabase: migrations + seed
pnpm run db:types          # regenerate src/types/database.ts
```

Before the integration tests, build the throwaway database:

```bash
scripts/local-db/apply.sh --seed
```

`pnpm run verify` is the gate. Run it before you claim anything is finished. It
does not run the integration or E2E suites, so run those too when you touch SQL,
authorisation or a user-facing flow.

---

## Architecture

Next.js 16 App Router, React 19, TypeScript strict with
`noUncheckedIndexedAccess`, Tailwind 4 (CSS-first `@theme inline`), next-intl 4
for `en`/`bn`, Supabase for Postgres + Auth + Storage.

- Routing lives under `src/app/[locale]/` in five route groups:
  `(marketing)`, `(auth)`, `(customer)`, `(partner)`, `(admin)`.
- `proxy.ts` (Next 16's replacement for `middleware.ts`) does locale
  negotiation and refreshes the auth cookie. It does **not** authorise.
- Domain logic lives in `src/features/<area>/`, never in a component.
- Shared plumbing lives in `src/lib/`.
- Every integration is an adapter in `src/lib/<name>/` with a mock default.

### Data flow

Server Component reads → `src/lib/supabase/server.ts` (cookie-bound, RLS on).
Mutations → a Server Action in `src/features/<area>/actions.ts` that calls
`requireCapability()` first. Public catalogue reads → `src/lib/supabase/public.ts`
(cookie-free, so the page can still be statically rendered). Service-role work
→ `src/lib/supabase/admin.ts`, which is `server-only` and used for webhooks,
anonymous questionnaire drafts, invitation-token lookup and the private
`compliance` schema — nothing else.

---

## Coding rules

**Server Components by default.** Add `'use client'` only for interactivity.
A client component under `[locale]` cannot call `getTranslations()`; use
`useTranslations()`, and remember that reading request headers in a shared
layout forces every route beneath it to render dynamically.

**Types come from the database.** `src/types/database.ts` is generated. Import
`Enums<'case_status'>` rather than re-declaring a union. Regenerate after a
migration.

**Money is integer minor units.** `src/features/quotes/money.ts` owns the
arithmetic — inclusive vs exclusive tax, BDoor revenue vs pass-through
government fees. Never use a float for an amount.

**Validation is shared.** One Zod schema per input, imported by both the client
component and the Server Action. Error _keys_ go to the UI, never Zod's default
prose — the UI passes them to the translator, so a raw message renders as a
missing key in the page. `validateAnswer()` in `src/features/intake/questions.ts`
shows the pattern: an allow-list of known keys with a typed fallback.

**Comment density matches the surrounding file.** Comments explain why, not
what. Several comments in this repository record a trap that cost real time
(the `backdrop-filter` containing block in `marketing-header.tsx`, the streaming
Suspense boundary that turns a 404 into a soft 404 in the workspace `loading.tsx`
files). Do not delete those.

**British-ish product English, and no superlatives.** No "guaranteed",
"government authorized", "instant approval", "official partner". See
[Copy rules](#copy-rules).

---

## The role model

Two independent axes. A person can hold both.

**Platform roles** (`public.platform_roles`) — BDoor staff:
`case_manager`, `compliance_officer`, `finance`, `admin`, `super_admin`.

**Organisation roles** (`public.organization_memberships`) — customers and
partners: `customer_owner`, `customer_member`, `partner_owner`, `partner_staff`.

Screens and actions check **capabilities**, not roles. The matrix is
`src/lib/permissions/roles.ts`; `docs/ROLES.md` renders it. Adding a screen
means adding a capability, not scattering role names through components.

Two separations are deliberate and must survive refactors:

- `finance` has **no** `kyc.decide`, `kyc.read` or `risk.read`. A finance user
  must not be able to make a compliance decision.
- plain `admin` has **no** `kyc.decide` and no `refund.approve`. Only
  `super_admin` does.

MFA is mandatory for every platform role and for both partner roles.

---

## Security requirements

These are not style preferences. A change that breaks one of them is wrong even
if the tests pass.

1. **Never authorise from UI visibility.** Enforce on the server
   (`requireCapability`) _and_ in RLS. Both, every time.
2. **Never use editable user metadata for an authorisation decision.**
   `raw_user_meta_data` belongs to the user. Roles live in their own tables.
3. **Never call `auth.getSession()` server-side.** Use `auth.getClaims()`;
   `getSession()` trusts the cookie without verifying the signature.
4. **Keep secrets server-only.** Nothing secret gets a `NEXT_PUBLIC_` prefix —
   that prefix inlines the value into the browser bundle.
5. **Storage stays private.** Passports, NIDs, signatures, addresses, banking
   and corporate documents never touch a public bucket or a permanent URL.
   Serve them through short-lived signed URLs after an authorisation check.
6. **Never let a client choose a storage path.** Generate it server-side with
   `app.canonical_document_path()`.
7. **Avoid `SECURITY DEFINER`.** Where an RLS predicate genuinely needs it, keep
   it in the private `app` schema, set `search_path = ''`, and do explicit
   authorisation checks inside.
8. **Keep `compliance` unexposed.** The schema is not in the PostgREST
   exposed-schema list and has no grants to `anon` or `authenticated`. Customer-
   visible KYC status lives in `public.kyc_cases`; screening detail does not.
9. **Audit logs and case history are append-only.** `app.reject_mutation()`
   triggers enforce it. Do not add an update path.
10. **Never log a raw password, token, full identity number, document body or
    payment credential.** Log through `src/lib/audit/` — it redacts by key shape
    and by value shape.
11. **Treat every webhook as hostile.** Verify the HMAC, be idempotent by
    provider event id, and never trust an amount you did not compute.
12. **Never invent a credential.** If an integration needs one, write the
    adapter, add the environment variable, document the setup, and leave the
    mock as the default.
13. **Never send raw identity or banking documents to a model.** `AI_PROVIDER`
    defaults to `disabled`, and `prepareForModel()` is the only path that may
    build a request. The recommendation engine works with no LLM at all.
14. **Never route foreign share capital through BDoor.** Service fees and
    pass-through government fees only.

---

## Copy rules

The product makes claims about a regulated process, so the copy is part of the
correctness surface.

- Never "guaranteed", "government authorized", "instant approval", "official
  partner of", or a promise of approval, a visa, residency, banking or a fixed
  government completion date.
- Never imply affiliation with RJSC, BIDA, NBR, CCI&E, a city corporation, a
  ministry or any other authority. Where a service touches one, the page says
  BDoor is not affiliated with it.
- A government fee is published only with a verified figure and a review date.
  Otherwise: "Quoted after review".
- Time estimates carry the date they were last reviewed and are described as
  estimates.
- The recommendation is always labelled preliminary and subject to review.
- Do not add an office address, registration number, partner logo, press logo,
  award, testimonial, rating or statistic. BDoor does not have verified ones.
- The legal suite is published as version 1.0 (owner release, 30 Aug 2026). It
  makes no claim of counsel or regulator approval — none exists — and a policy
  change ships as a new version with a new effective date, never an edit under
  the same number. A revision in progress must honestly mark itself as a draft
  (`awaitingCounselReview`).

Both locales change together. A key added to `en.json` and missing from
`bn.json` renders the key path to a Bangla-speaking user.

---

## Testing

| Suite               | What it is for                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| `tests/unit`        | pure logic: state machine, money, deadlines, rules, redaction, validation |
| `tests/integration` | the RLS policies themselves, against real Postgres                        |
| `tests/e2e`         | the journeys, plus axe-core accessibility and the copy assertions         |

Rules of thumb:

- A change to a policy needs an integration test that a _wrong_ actor is
  rejected, not only that the right one is allowed.
- A change to the case state machine must update `public.case_status_transitions`
  **and** `src/features/cases/state-machine.ts`;
  `tests/integration/case-transitions.test.ts` fails if they drift.
- E2E waits on state, never on time. The questionnaire helper waits for the
  progress indicator to move before touching the next control; a bare
  `waitForTimeout` will pass locally and flake in CI.
- Never seed a real name, NID, passport, bank detail, address or partner
  credential. Everything in `seed.sql` is fictional and suffixed "(sample)".

---

## Definition of done

A change is finished when all of these hold:

- [ ] `pnpm run verify` passes.
- [ ] Integration tests pass if SQL, roles or policies changed.
- [ ] E2E tests pass if a user-facing flow changed.
- [ ] New authorisation is enforced in **both** the Server Action and RLS.
- [ ] New copy exists in `en.json` **and** `bn.json` and obeys the copy rules.
- [ ] New user input has one Zod schema, used on the client and the server.
- [ ] New integration ships an adapter, a mock default, environment variable
      names in `.env.example`, and setup notes in the README.
- [ ] Nothing secret gained a `NEXT_PUBLIC_` prefix.
- [ ] No personal data reached a log line.
- [ ] Anything that needs professional review is marked as a draft in the code
      and listed in `docs/LAUNCH-CHECKLIST.md`.
