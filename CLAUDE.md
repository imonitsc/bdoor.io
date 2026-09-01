# CLAUDE.md — bdoor.io

Instructions for Claude Code working in this repository.

---

## 1. The one reframe that governs every decision

**bdoor is not a company formation product. It is a recurring compliance product that gives formation away free to acquire the subscription.**

In February 2026 the Bangladesh government launched BanglaBiz Phase 2, which registers a company in three working days for free. Formation is now a commodity. Any code, copy, schema or feature that treats formation as the revenue event is working against the business.

Concretely, when you are choosing between two implementations, prefer the one that:

- Makes the **entity** (not the transaction) the durable object
- Creates a reason for the user to return next month
- Captures structured regulatory data we can reuse
- Works unchanged when the jurisdiction is not Bangladesh

If a proposed change makes formation better but retention no better, say so before building it.

---

## 2. Stack

| Layer                     | Choice                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| App                       | Next.js (App Router), TypeScript, React Server Components by default                                                                                 |
| Package manager           | **pnpm**. Never `npm` or `yarn` — a stray `npm install` rewrites the lockfile                                                                        |
| Hosting                   | Vercel                                                                                                                                               |
| Database / auth / storage | Supabase (Postgres, RLS, Auth, Storage)                                                                                                              |
| Styling                   | Tailwind                                                                                                                                             |
| AI                        | Multi-model via Vercel AI Gateway (Anthropic default), server routes only — per the founder’s BI-OS instruction §6.1; no key ever reaches the client |
| Repo                      | `imonitsc/bdoor.io`                                                                                                                                  |
| Production branch         | **`claude/new-session-0n73z6`** — there is no `main`. Diff and PR against this.                                                                      |

**Scripts** — use these exact names; verified against `package.json` 1 Sep 2026:

```
pnpm dev          pnpm lint
pnpm build        pnpm test
pnpm typecheck    pnpm verify   ← the gate: format:check → lint → typecheck → unit → build
```

**MCP server names are case-sensitive and vary by machine.** On this project they are
capitalised: `mcp__Supabase__*`, `mcp__Vercel__*`. Run `/mcp` to confirm before adding any
entry to a permissions file. A mismatched name in an `allow` list merely prompts; a
mismatched name in a `deny` list **silently does nothing** — the gate you think you have is
not there.

House preference across all ventures: **lean and cost-efficient**. Do not add a paid
service, a queue, a vector database or a new framework without asking. Postgres can usually
do it.

> If any row above is stale, correct it in the same PR — do not silently work against a
> wrong description.
>
> _Correction applied 1 Sep 2026 (carried into this §2 revision): the AI row originally
> read “Anthropic API via server routes only”; the repository has run multi-model routing
> through the Vercel AI Gateway since PR #50, as the founder’s Business Intelligence OS
> instruction (§6.1) directed. The server-only rule is unchanged._

---

## 2.1 Permissions: two files, and what they are actually for

`.claude/settings.json` is **committed**. It holds only what is true on every machine:
read-only tools, safe git reads, pnpm scripts, and the deny list. No MCP entries — those
names vary by machine.

`.claude/settings.local.json` is **gitignored and per-machine**. It holds MCP entries and
any allowances a particular machine needs — for example, permitting `git commit` and
`git push` on a box that runs unattended sessions, where an ask-gate would stall the run.

Add to `.gitignore`:

```
.claude/settings.local.json
```

### Two deliberate decisions in the committed file

**Env denies are enumerated, not globbed.** `Read(./.env.*)` also blocks `.env.example` —
the secret-free template that §12 requires updating. The deny list names real env files
individually so the template stays readable.

**Force-push is in `ask`, not `deny`.** `deny` wins over `ask`, and a `git push --force`
deny also catches `--force-with-lease`, which the merged-branch restart convention uses.
Rather than pattern-matching around it, both forms sit behind a human confirm. If you want
a hard block, test the pattern against a throwaway branch first — do not assume it matches.

### The thing to actually rely on

Claude Code permissions are a convenience layer, not a security boundary. They are local,
per-machine, silently fallible on a name mismatch, and dependent on pattern-matching
subtleties.

The controls that protect this repo are **server-side**: branch protection on
`claude/new-session-0n73z6`, and a migration path that requires a human to apply. Get those
right and the local config can afford to be permissive — which is the correct fix for an
autonomous session stalling on a prompt. Loosening a deny rule is not.

---

## 3. Domain model — learn these six objects before writing code

Everything in the product is one of these. Do not invent parallel concepts.

- **Jurisdiction** — a country, and eventually a sub-national unit. Bangladesh is `BD`, it is not special.
- **Entity** — the customer's company. The system of record. Long-lived. Never deleted, only archived.
- **Rule** — a single machine-readable regulatory requirement: _this kind of entity, in this jurisdiction, in this sector, must do this thing, with this authority, by this deadline, at this cost._ This is the company's core asset (see §4).
- **Obligation** — a Rule instantiated against a specific Entity with a concrete due date. This is what generates retention.
- **Filing** — evidence that an Obligation was discharged: documents, reference numbers, dates.
- **Case** — a unit of managed work routed to a **Provider** (lawyer, auditor, VAT consultant). Carries state, SLA, and take rate.

The revenue model maps directly onto this: subscription is paid for Obligations being tracked; marketplace take is earned on Cases; the financial-services layer is underwritten off Filings history.

---

## 4. The rules corpus is the moat — treat it accordingly

The defensible asset is **not** the AI. It is the structured corpus of which licence, which authority, which deadline, per sector, per jurisdiction. A competitor can point a model at the same public sources tomorrow; they cannot clone this corpus.

Non-negotiables:

- **Rules are data, never code.** No regulatory logic in a React component, an API route or a prompt. If you find a hardcoded deadline or licence name anywhere outside the rules tables, that is a bug — fix it or file it.
- **Every rule row carries provenance**: `source_url`, `source_authority`, `source_published_at`, `verified_by`, `verified_at`. A rule with no provenance must not be servable.
- **Rules are versioned, never overwritten.** Regulations change and we need to answer "what was true in March?" Use effective-dated rows (`effective_from`, `effective_to`), not `UPDATE`.
- **Rules are reviewable by a non-engineer.** Compliance analysts, not developers, own the content. Any schema change that makes a rule harder for an analyst to read or edit is the wrong change.

---

## 5. Never hardcode Bangladesh

The seven-year plan requires Gulf (UAE, KSA, Qatar) and the rest of South Asia. Bangladesh is roughly 27% of revenue by year 7. Code written now that assumes Bangladesh will be rewritten expensively later.

Rules to follow:

- Every rules, obligation, pricing and provider query is scoped by `jurisdiction_code`
- Currency is stored as **minor units + ISO code**, never a float, never assumed BDT
- Money is formatted at the presentation layer from the entity's jurisdiction, not a global default
- Dates are stored UTC, displayed in the entity's local timezone; fiscal years differ by country (BD runs July–June — do not assume January)
- Entity identifiers are jurisdiction-typed (`BIN`, `e-TIN`, `RJSC no.`, `TRN`, `CR no.`) — model them as a typed collection, not fixed columns
- Country pages under `/[country]` must render from data, not per-country hand-written components

---

## 6. Ask bdoor AI — grounding rules

This feature answers regulatory questions. A confidently wrong answer about a filing deadline is a real harm to a real business, and a legal exposure for us.

- **Never answer from model knowledge alone.** Retrieve from the rules corpus, then answer. If retrieval is empty, say so and offer the assessment flow. Do not improvise.
- **Cite every regulatory claim** back to the rule's `source_url` and `source_published_at`.
- **Show the vintage.** Every answer states when the underlying rule was last verified.
- Never state a fee, deadline or penalty that did not come from a retrieved rule.
- Never produce anything that reads as legal advice. Ask surfaces information; Cases route to a licensed provider. Keep that boundary in the product, not just in a disclaimer.
- All Anthropic API calls happen **server-side**. No key ever reaches the client.
- Log every question and the rules retrieved. Unanswered questions are the roadmap for the corpus.

---

## 7. Data protection

We hold company registration documents, national IDs, passports and shareholding structures.

- **RLS is mandatory on every table.** No exceptions, no "we'll add it later". A migration adding a table without a policy is incomplete.
- Documents go in Supabase Storage with signed URLs and short expiry. Never a public bucket.
- Never log PII or document contents. Log IDs.
- Never send customer documents to a third-party API without an explicit, recorded decision.
- Provider access to a Case is scoped to that Case, time-boxed, and revoked on close.
- Soft-delete customer data; hard-delete only via an explicit, audited path.

---

## 8. Supabase conventions

- All schema changes are **migrations in the repo**. Never change schema in the dashboard.
- Migration names describe intent: `20260901_add_obligation_due_dates.sql`
- Every migration is reversible or documents why it is not
- Types are generated from the schema and committed — do not hand-write database types
- Prefer Postgres constraints, generated columns and RLS over application-layer validation
- Run `get_advisors` (security + performance) after any DDL and fix what it flags

---

## 9. Frontend conventions

- Server Components by default; add `"use client"` only when you need interactivity
- No client-side data fetching where a Server Component can read directly
- Every user-facing string goes through i18n. English and Bengali both matter; more languages follow the jurisdictions.
- Forms: server actions, progressive enhancement, no full-page client state machines
- Do not add a component library. Tailwind plus a handful of local primitives.
- Loading and empty states are part of the feature, not follow-up work

---

## 10. Testing

Do not aim for coverage numbers. Test the things that cost money if wrong:

1. **Rules resolution** — given entity + jurisdiction + sector, do we return the correct obligations? Table-driven, with fixtures per jurisdiction.
2. **Deadline arithmetic** — fiscal years, leap years, weekends, public holidays per country. This is where silent bugs live.
3. **RLS policies** — an integration test proving tenant A cannot read tenant B. Write this once and never delete it.
4. **Money** — no floats, correct minor units, correct currency per jurisdiction.
5. **Ask grounding** — an answer with no retrieved rules must refuse, not improvise.

---

## 11. Working style

- **Read before writing.** Match existing patterns in the file you are editing; they override this document.
- **Small PRs.** One concern each.
- **Ask before**: adding a dependency, adding a paid service, changing the domain model, changing pricing logic, or touching RLS.
- **Say when you disagree.** If an instruction here produces a worse result in a specific case, argue the case rather than silently following it.
- **Never invent regulatory facts** in code, comments, seed data or fixtures. Placeholder deadlines have a way of reaching production.
- Conventional commits. Reference the issue.

---

## 12. Definition of done

- [ ] Types generated and committed
- [ ] Migration included, reversible, RLS policy present
- [ ] `get_advisors` clean for security
- [ ] Works for a non-BD jurisdiction (or has an explicit issue saying why not yet)
- [ ] Strings in i18n
- [ ] Loading, empty and error states handled
- [ ] Tests for anything in §10
- [ ] No secrets, no PII in logs
- [ ] Preview deploy checked on mobile — most of our users are on a phone

---

## 13. Context worth carrying

- Bangladesh has ~300,000 entities registered with RJSC but only ~57,000 with a verified audit report. That gap is the product.
- New registrations are ~10,225/year and falling. Growth comes from converting the existing register, not from new formations.
- Retention is the load-bearing metric. At 4% monthly churn instead of 1.5%, the Bangladesh business stops working. Anything that improves retention beats anything that improves signup.

---

# Part II — Engineering working notes

Part I above is the founder's contract of 1 Sep 2026: the retention reframe,
the six-object domain model, the rules-corpus moat and the jurisdiction
rules. It supersedes the 31 Aug master instructions, now archived at
`docs/BDoor_Master_Instructions_2026-08-31.md` (still useful for the
roadmap phases and fundraising frame where not in conflict). This part is
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
