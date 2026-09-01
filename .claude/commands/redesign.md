---
description: Upgrade one route's design against docs/DESIGN.md — audit, plan, generic-default test, build, screenshot QA
argument-hint: <route, e.g. /en/pricing> [focus note]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(pnpm dev:*), Bash(pnpm build:*), Bash(pnpm lint:*), Bash(pnpm typecheck:*), Bash(pnpm exec playwright:*)
disable-model-invocation: true
---

# Redesign — $ARGUMENTS

Read @docs/DESIGN.md in full before anything else. Then @docs/design-notes.md if it
exists, so you do not repeat a rejected direction.

Work the route named in `$ARGUMENTS`. The reference class is Stripe, Mercury, Wise, Ramp —
infrastructure trusted with money and identity documents. The upgrade is mostly subtraction
and precision, and the product is the visual.

## Pass one — audit and plan. Do not write UI code yet.

**1. Audit what is there.**
Open the route's components. Catalogue the tokens actually in use: colours, type family
and scale, spacing, radii, shadows, motion. Note which of the DESIGN.md §8 tells are
present on this page today. Note which bdoor-specific components (§6) the page should be
using and whether they exist yet.

**2. Write the design plan.** Compact, in this order:

- Colour: 4–6 named hex values, built from `#081633` (`--bd-ink`) outward, with the four obligation
  states if the page shows obligations
- Type: family per role, with the Bengali pairing named and checked
- Layout: one-sentence concept, then an ASCII wireframe at **390px** and at **1440px**
- The one signature moment on this page, if any — and what gets quieter to let it land
- The single primary action ("one door")

**3. Run the generic-default test.**
Ask: would this plan look the same for any other fintech landing page? Go through §8 line
by line. If any element is a default rather than a decision made for bdoor, change it and
write one line saying what changed and why.

**4. Stop and show the plan.** Wait for approval before building. If asked to proceed
without review, say so in the final report.

## Pass two — build

- Build or extend shared components (§6) **before** touching the page. A component built
  for this route must work unchanged on the others that need it
- Real content only: real prices from the price list, real obligations from the rules
  corpus, real authority names. No lorem ipsum, no invented deadlines, no placeholder fees
- Server Components by default; client only for interaction
- Every string through i18n. Test at least the heading and primary action with a real
  Bengali string
- Tabular figures wherever numbers stack
- Honour `prefers-reduced-motion`
- Both positioning lines remain on the page

## Critique

Run the dev server and capture the route at **390 / 768 / 1440** with Playwright. Look at
the screenshots as images, not as code you already understand. Check against §9:

- Text overflow, wrapping, or truncation anywhere
- Contrast on all text, including state colours
- Focus visible on every interactive element by keyboard
- Bengali rendering at each size and weight used
- Numbers aligned
- Anything that exists only to decorate — remove it

Then remove one more thing.

## Report

- What you found in the audit, including which §8 tells were present
- The final plan and what the generic-default test changed
- Screenshots at the three widths
- What you removed, and what you tried and rejected — append the latter to
  `docs/design-notes.md` in two or three lines
- What this route now shares with other routes (components), and what remains one-off

Do not touch pricing logic, fee layers, rules data or RLS. If the redesign needs a data
change, describe it and stop.
