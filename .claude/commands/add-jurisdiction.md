---
description: Scaffold a new jurisdiction (country) end to end — schema rows, fiscal calendar, identifiers, currency, locale, country page
argument-hint: <ISO-3166-alpha-2> [country name]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(pnpm run:*), Bash(npx supabase:*)
disable-model-invocation: true
---

# Add jurisdiction: $1

Adding a country is the single highest-leverage repeated task in this codebase, and the
easiest to do badly. Bangladesh is ~27% of revenue by year 7 — every jurisdiction after it
must be a data exercise, not a code fork.

## Before you write anything

Read @CLAUDE.md §5 (Never hardcode Bangladesh) and confirm the existing jurisdiction
abstraction actually holds. Then find every place `BD` or `Bangladesh` appears:

Search the repo for hardcoded jurisdiction assumptions and list what you find before
proceeding. If any of the following are hardcoded rather than jurisdiction-scoped, **stop
and report** — fix that first, in its own PR, before adding a country on top of a broken
abstraction:

- currency, currency symbol, or minor-unit handling
- fiscal year boundaries (Bangladesh runs July–June; most do not)
- entity identifier types (BIN / e-TIN / RJSC no. are BD-specific)
- authority names, filing portals, or deadline arithmetic
- date formatting or timezone defaults

## What to produce

1. **Jurisdiction row** — code `$1`, display name, default currency (ISO 4217 + minor
   unit exponent), default locale, timezone, fiscal year start month, and whether it is
   live or pre-launch.

2. **Entity identifier types** for this jurisdiction — the real ones, named as the local
   authority names them. Model them as rows, never as new columns on `entities`.

3. **Authorities** — the registry, the tax authority, the local licensing body, each with
   its official URL.

4. **Fiscal calendar and public holidays** — deadline arithmetic is where silent bugs
   live. Add the holiday set for the current and next year, with a source.

5. **Rules: none yet.** Do **not** invent obligations, deadlines, fees or licence names to
   make the country look populated. An empty corpus for a new jurisdiction is correct and
   honest. Seed data with fabricated regulatory facts has a way of reaching production.
   Create the jurisdiction with zero rules and leave a tracking note for the compliance
   analysts.

6. **Country page** — must render from the jurisdiction data, not a hand-written
   per-country component. If adding `$1` requires a new component file, the abstraction is
   wrong; fix the abstraction.

7. **Locale strings** — add the new locale to i18n config. Do not machine-translate legal
   or regulatory terms; leave them keyed and untranslated for a human.

## Checks before you finish

- Migration is reversible and has an RLS policy
- Regenerate and commit database types
- Existing Bangladesh tests still pass unchanged — if adding a country broke BD, the
  abstraction leaked
- At least one test asserts correct fiscal-year and deadline arithmetic for `$1`
- Money renders in the new currency without a hardcoded symbol

## Report back

A short summary: what you added, what you found hardcoded, and what a compliance analyst
now needs to do before this jurisdiction can be sold.
