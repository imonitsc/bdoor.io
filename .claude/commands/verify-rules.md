---
description: Find stale or unverified rules and re-check them against their primary sources
argument-hint: [jurisdiction code, or blank for all]
allowed-tools: Read, Grep, Glob, WebFetch, mcp__supabase__execute_sql
---

# Rule staleness sweep — $ARGUMENTS

A wrong deadline is worse than a missing one. A missing rule makes us look incomplete; a
stale rule makes a customer miss a filing and take a penalty on our advice. This sweep is
the maintenance cost of owning a corpus, and it is not optional.

Scope to jurisdiction `$ARGUMENTS` if given, otherwise sweep everything.

## 1. Triage

Query the corpus and bucket every rule:

- **Unverified** — no `verified_by` or no `verified_at`. These must not be servable to Ask.
  Report how many are currently reachable by the Ask retrieval path; if any are, that is a
  bug, report it first.
- **Stale** — `verified_at` older than 180 days.
- **Aging** — `verified_at` 90–180 days.
- **Dead source** — `source_url` returns 404, redirects to a homepage, or is unreachable.
- **No provenance** — missing `source_url` or `source_authority`. These should not exist;
  list them all.

Order the work by blast radius: a rule attached to many active entities matters far more
than one attached to none. Rank by the count of live Obligations derived from each rule.

## 2. Re-verify the top of that list

For each rule you check, fetch the primary source and compare:

- Does the source still state this requirement at all?
- Has the **deadline** changed?
- Has the **fee** changed? (Bangladesh revises RJSC and licensing fees periodically.)
- Has the **threshold** changed — turnover, headcount, sector scope?
- Has the requirement been superseded by a newer circular or an amended act?

## 3. What to do with a discrepancy

- **Do not silently update the row.** Close the existing rule with `effective_to` set to
  the date the change took effect, and insert a superseding row. History is the product.
- If the source is ambiguous, mark the rule for human review with a note explaining the
  ambiguity. Do not guess.
- If the source is dead but the requirement plausibly still stands, do **not** delete the
  rule and do **not** invent a replacement URL. Flag it for an analyst to re-source.
- If a rule changed and live Obligations were derived from the old version, list the
  affected entities. Those customers may need to be told.

## 4. Report

```
Jurisdiction:        $ARGUMENTS
Rules checked:       n
Unchanged:           n
Changed:             n   (list each: what changed, effective when, entities affected)
Dead sources:        n   (list)
Unverified & live:   n   ← if non-zero, this is a bug, not a backlog item
Needs human review:  n   (list with the specific question for the analyst)
```

Do not mark anything `verified_by: claude`. Verification is a human act — your output is a
queue for an analyst, not a sign-off.
