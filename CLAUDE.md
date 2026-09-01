# CLAUDE.md — bdoor.io

Instructions for Claude Code in this repository. Written against the live site as of
1 September 2026. Where this file and the code disagree, the code is the fact and this file
is the bug — fix the file in the same PR.

Current priorities live in `docs/ROADMAP.md`. Read it before starting any feature work.

---

## 1. What bdoor is, and the one reframe that governs every decision

bdoor is a Bangladesh business-setup and administrative-support platform with a corridor
into six other countries. The live product surface is:

- **Ask bdoor AI** — cited Q&A over bdoor's own published guidance and price list
- **Start** — a six-stage free assessment ending in an itemised quote and a managed case
- **bdoor Start** — formation packages and standalone services, priced one-off in BDT
- **bdoor Comply** — an obligations calendar with reminders and renewal cases
- **Country routes** — UAE, KSA, Qatar, Singapore, UK, US, fulfilled by local providers
- A **provider network** (apply, standards, disclosure, sign-in) and a **workspace**

**The reframe:** formation is now a commodity. BanglaBiz Phase 2 (BIDA, launched 1 Feb 2026)
registers a company free in three working days, bundling name clearance, bank account,
incorporation, e-TIN and trade licence. Our Complete Launch package charges BDT 39,900 for
nearly that list. The durable business is **bdoor Comply** — recurring compliance — and
today it has a product page and no price.

So, when choosing between implementations, prefer the one that:

- moves a customer onto Comply, or keeps them there
- makes the **entity** the durable object rather than the transaction
- captures structured obligation data we can regenerate from
- works unchanged when the jurisdiction is not Bangladesh

If a change improves formation conversion and does nothing for Comply, say so before
building it.

---

## 2. Stack

| Layer           | Fact                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| App             | Next.js App Router, TypeScript. Locale-prefixed routes: `/[locale]/…`, `en` and `bn` live                              |
| Package manager | **pnpm** — never npm/yarn                                                                                              |
| Hosting         | Vercel                                                                                                                 |
| Data            | Supabase — Postgres, RLS, Auth, Storage                                                                                |
| Styling         | Tailwind. Brand ink `#081633` (`--bd-ink`); logo set under `/brand/`                                                   |
| AI              | Multi-model via Vercel AI Gateway (Anthropic default), server routes only — per the founder’s BI-OS instruction §6.1   |
| Repo            | `imonitsc/bdoor.io`. Production branch: **`claude/new-session-0n73z6`** — there is no `main`. Diff and PR against this |
| MCP             | Server names are capitalised and case-sensitive: `mcp__Supabase__*`. Verify with `/mcp`                                |

Scripts: `pnpm dev · build · lint · test · typecheck · verify` — confirmed against
`package.json` 1 Sep 2026; `pnpm verify` is the gate (format:check → lint → typecheck →
unit → build).

Permissions are split: `.claude/settings.json` (committed, machine-agnostic) and
`.claude/settings.local.json` (gitignored; MCP names and per-machine allowances).
Permissions are a convenience layer. Branch protection on the production branch and a
human-applied migration path are the real controls.

_Corrections applied 1 Sep 2026, per this file's own rule that the code is the fact:
the production branch filled in; `bn` recorded live alongside `en` (both locales ship
together); the brand ink is `#081633` per `src/styles/globals.css`, not `#0A1020`; the AI
row reflects the multi-model Vercel AI Gateway routing the founder's BI-OS instruction
(§6.1) directed and PR #50 shipped — server-only unchanged; scripts verified with
`pnpm verify` as the gate._

Lean stack is a house rule across all ventures. No new paid service, queue, vector store or
framework without asking. Postgres can usually do it.

---

## 3. Vocabulary — use the product's words, not generic ones

The site has a consistent vocabulary. Code, copy and schema should match it.

| Say                                                                                                                    | Not                         |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **route** (a country formation path, e.g. "Sharjah eligible no-visa route")                                            | plan, flow, tier            |
| **package** (bundled BD offer: Solo Start, Limited Company, Complete Launch)                                           | product, bundle             |
| **standalone service** (catalogue item with a published fee)                                                           | add-on, SKU                 |
| **itemised quote**                                                                                                     | estimate, invoice           |
| **managed case / renewal case**                                                                                        | ticket, order, job          |
| **obligation** and **obligations calendar**                                                                            | task, todo, deadline list   |
| **provider** (licensed professional doing regulated work)                                                              | partner, vendor, freelancer |
| **specialist review**                                                                                                  | approval, moderation        |
| **source ledger** (our provenance record for authority sources)                                                        | citations, refs             |
| **bdoor ID** (private, never a government identifier)                                                                  | account number, customer ID |
| **fee layers**: bdoor professional fee · government and authority fees · partner professional fees · third-party costs | price, cost, total          |

Two positioning lines appear on every page and must survive every edit:

> bdoor is not a government authority or law firm. Legal services, where required, are
> provided under a separate engagement by independent advocates or partner law firms.

> The bdoor professional fee is the only line bdoor keeps.

---

## 4. Domain model — what exists and how it should connect

```
Entity ──< Obligation ──< RenewalCase ──> Provider
   │            ▲
   │            │ generated from
   │       Rule (in source ledger, per jurisdiction)
   │
   ├──< Case (from Start → itemised quote → managed case)
   └──  Documents, bdoor ID, workspace
```

- **Entity** is the system of record. Long-lived. Archived, never deleted. Every Case,
  Obligation and Document hangs off it.
- **Obligation** is a Rule instantiated against an Entity with a concrete due date. Comply
  is a view over Obligations. Reminders and renewal cases are generated from them.
- **Rule** is a machine-readable regulatory requirement in the source ledger. Today,
  "Ongoing obligations after formation" is prose on country pages. The roadmap moves it into
  structured rules so the calendar is generated, not hand-maintained per customer.
- **Case** carries the fee layers, the named provider, and state from quote to filed.
- **Route / Package / Standalone service** are catalogue objects. They produce Cases. They
  are not where regulatory logic lives.

Do not invent parallel concepts. If something looks like a new noun, it is almost always one
of these six.

---

## 5. The source ledger is the moat — extend it, never bypass it

The site already does the right thing: "Prices last reviewed on August 28, 2026", "Guide
content last reviewed 2026-08-29", "Authority sources are kept in our source ledger and
re-verified before any quotation." That discipline is the defensible asset. A competitor can
point a model at public sources tomorrow; they cannot clone a verified, dated ledger.

Non-negotiables:

- **Every regulatory fact traces to a ledger entry** with authority, URL, publication date,
  and the date a human verified it. No entry, no fact — in code, copy, seed data, fixtures
  or prompts.
- **Rules are data.** No deadline, fee, licence name or threshold hardcoded in a component,
  route handler or prompt.
- **Effective-dated, never overwritten.** Close the old entry, insert the new. We must be
  able to answer "what did we tell this customer in March?"
- **Review dates move from per-page to per-rule.** A page-level "last reviewed" cannot tell
  you which of twelve obligations on it went stale.
- **Verification is a human act.** Claude Code never sets a rule to verified.

---

## 6. Never hardcode Bangladesh

Six country routes are live, and all six render from one template —
`src/app/[locale]/(marketing)/countries/[country]/page.tsx` over the commercial catalog
(`src/content/international.ts`, `src/content/packages/catalog.ts`) and the guide data
(`src/content/countries/guides.ts`): routes with published fees and qualifiers,
requirements, documents, ongoing obligations, FAQ, review date. Footer and sitemap country
entries derive from the same catalog, so a seventh country is a data task. The provider
line is currently a generic disclosure — named local providers are not yet implemented.
If adding a country needs a new component file, the abstraction is wrong.

_Correction applied 1 Sep 2026: the previous text called the UAE page "the reference
implementation" that the other five should be generated from — the code already shares one
template across all six, so the paragraph now records that fact._

- Every rule, obligation, fee and provider query is scoped by jurisdiction
- Money is **minor units + ISO 4217**, never a float, never assumed BDT. The "About ৳314,000"
  conversion is presentation, computed at render, never stored as the price
- Fiscal year is per jurisdiction. Bangladesh runs **July–June**. Weekend is
  **Friday–Saturday**. The Gulf differs on both
- Due dates are `date` in the jurisdiction's calendar, not `timestamptz`
- Entity identifiers are jurisdiction-typed (BD: RJSC no., e-TIN, BIN/VAT; UAE: licence no.,
  establishment card) — a typed collection, not fixed columns

---

## 7. Ask bdoor AI — grounding rules

Ask is grounded on published guidance and the live price list and shows its source every
time. Keep it that way, and tighten it:

- Never answer from model knowledge alone. Empty retrieval → say so, offer Start
- Every deadline, fee or threshold in an answer traces to a ledger entry, with its review
  date visible
- Nothing that reads as legal advice. Ask informs; a Case engages a provider
- Server-side API calls only
- **Every answer about a recurring obligation ends with a route into Comply.** The "Check
  annual compliance" prompt on `/ask` is a Comply lead and should be treated as one
- Log the question and what was retrieved. Unanswered questions are the ledger backlog

---

## 8. Data protection

We hold passports, national IDs, proof of address, source-of-funds documents and
shareholding structures, and we have a published AML/KYC policy.

- **RLS on every table.** A migration without a policy is incomplete
- Documents in Supabase Storage, private buckets, short-lived signed URLs generated
  server-side. "Nothing is uploaded until identity collection opens" — honour that in code
- Provider access is scoped to one Case, time-boxed, revoked on close
- Never log PII or document contents. Log IDs
- The bdoor ID is private: never a government identifier, never in a URL, never public
- Soft-delete; hard-delete only through an explicit audited path

---

## 9. Supabase and frontend conventions

- **Any UI work is held to `docs/DESIGN.md`.** Read it before touching a component. Use
  `/redesign <route>` for page-level work; it enforces the audit-plan-critique process
- Schema changes are migrations in the repo, reversible, with generated types committed
- Prefer constraints, generated columns and RLS over application-layer validation
- Run the security and performance advisors after any DDL
- Server Components by default; `"use client"` only for interactivity
- Every user-facing string through i18n. English and Bengali are live and change
  together; more follow the jurisdictions. Do not machine-translate regulatory terms
- Start flow drafts are held in the browser until account creation — keep that contract
- Mobile first: most users are on a phone. Check previews at 390px

---

## 10. Test the things that cost money if wrong

1. **Rule → Obligation resolution** per jurisdiction, including that an entity which should
   _not_ match a rule gets no obligation
2. **Deadline arithmetic** — fiscal boundaries, BD Friday–Saturday weekend, public holidays,
   leap years, month-end rollover, missing holiday data failing loudly
3. **Tenant isolation** — an integration test that tenant A cannot read tenant B. Write it
   once, never delete it
4. **Fee layers** — minor units, correct currency per jurisdiction, bdoor fee separated from
   pass-through amounts
5. **Ask grounding** — empty retrieval refuses rather than improvises

---

## 11. Working style

- Read the file before editing it; its conventions override this document
- Small PRs, one concern each, conventional commits
- Ask before: new dependency, paid service, domain-model change, pricing logic, RLS
- Never invent a regulatory fact anywhere, including placeholders
- Disagree out loud when an instruction here produces a worse result in a specific case

---

## 12. Definition of done

- [ ] Types generated and committed
- [ ] Migration reversible, RLS present, advisors clean
- [ ] Works for a non-BD jurisdiction, or an issue says why not yet
- [ ] Strings in i18n
- [ ] Loading, empty and error states handled
- [ ] Tests for anything in §10
- [ ] No secrets, no PII in logs; `.env.example` updated if config changed
- [ ] Both positioning lines (§3) still present on any touched page
- [ ] Preview checked at 390px

---

## 13. Numbers worth carrying

- ~300,000 entities on the RJSC register; ~57,000 with a verified audit report. That gap is
  the Comply market
- ~10,225 new registrations a year, and falling. Growth comes from the existing register
- Retention is load-bearing: at 4% monthly churn instead of 1.5%, Bangladesh stops working.
  Anything that improves Comply retention beats anything that improves Start conversion

---

# Part II — Engineering working notes

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
