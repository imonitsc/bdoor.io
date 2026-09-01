---
description: Run the definition-of-done checklist against the current branch before shipping
argument-hint: [optional note about what this change does]
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(pnpm run:*), mcp__supabase__get_advisors
---

# Pre-ship check

## Context

- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Diff against production: !`git diff origin/claude/new-session-0n73z6...HEAD --stat`

Change note: $ARGUMENTS

## Work through @CLAUDE.md §12, honestly

Go item by item. For each, state **pass**, **fail**, or **n/a with reason**. Do not mark
something pass because it probably is — check it.

1. **Types** — regenerated from the schema and committed?
2. **Migration** — present, reversible, and does every new table have an RLS policy?
3. **Security advisors** — run them; report anything flagged. Do not wave through a finding
   as pre-existing without saying so.
4. **Jurisdiction-agnostic** — does this work for a non-BD jurisdiction? If not, is there an
   explicit issue saying why not yet? Grep the diff for hardcoded `BD`, `BDT`, `Bangladesh`,
   `৳`, July–June fiscal assumptions, and BD-specific identifier names.
5. **i18n** — every new user-facing string keyed, nothing hardcoded English in a component.
6. **States** — loading, empty and error handled for anything new the user can see.
7. **Tests** — does the diff touch rules resolution, deadline arithmetic, RLS, money, or Ask
   grounding? If so, are there tests? These five are the only ones we care about
   (@CLAUDE.md §10).
8. **Secrets and PII** — no keys in the diff, no PII in logs, no Anthropic call moved
   client-side.
9. **Mobile** — most users are on a phone. Has the preview been checked at 390px?

## Then the question the checklist does not ask

Look at what this change actually does and answer plainly:

> Does this make retention better, or only signup better?

Formation is a commodity since BanglaBiz launched. If the change improves acquisition but
gives nobody a reason to come back next month, say so — not to block it, but so the
trade-off is deliberate rather than accidental.

## Output

A short pass/fail list, then the specific blocking items, then a one-line ship
recommendation. If something fails, propose the smallest fix rather than a redesign.
