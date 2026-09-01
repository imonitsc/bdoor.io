> **Superseded 1 Sep 2026 (evening).** This was the governing contract for
> most of 1 Sep 2026 — the retention reframe as first adopted (PR #55), with
> the founder's §2/§2.1 revision (PR #57). The site-grounded revision of the
> same date replaced it as Part I of `CLAUDE.md`, and `docs/ROADMAP.md` now
> carries the implementation order. The substance is continuous — the
> reframe, the six objects, the moat, the jurisdiction rules all carry
> forward — so read the live `CLAUDE.md`, not this file.

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
