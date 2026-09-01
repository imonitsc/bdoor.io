# DESIGN.md — bdoor.io

The design brief Claude Code works against. Read fully before touching any UI. Pair with
`/redesign <route>` for page work.

---

## 1. What we are aiming for

**Reference class: Stripe, Mercury, Wise, Ramp.** Infrastructure that people trust with
money and identity documents. Not Linear, not a consumer app, not a marketing site.

Those products share a look that is easy to name and hard to fake: restraint, typography
doing the work, generous space, one signature idea per page, and the **product itself as the
primary visual**. Nobody remembers Stripe for a hero image. They remember the payment form.

For bdoor the equivalent is: **show the obligations calendar, the itemised quote, the source
citation.** Real data, real deadlines, real authorities. The brand promise is "explained,
never invented" — the design should look like that promise.

What "billion-dollar" does **not** mean here: gradients, glassmorphism, animated blobs,
stock photography, a dark theme with an acid accent, or more visual noise. The upgrade is
mostly subtraction and precision.

---

## 2. Audit before you design — what exists and what to keep

The site is already well-structured with honest, restrained copy. This is an upgrade, not a
rebuild. Before any change, catalogue the current tokens (colours, type, spacing, radius,
shadow) from the codebase and report them. Then evolve; do not replace wholesale.

**Keep, and build outward from:**

- The deep navy ink `#081633` (`--bd-ink`) as the brand anchor and the SVG logo set
  under `/brand/`
- The vocabulary and the two positioning lines (`CLAUDE.md` §3)
- The fee-layer breakdown on `/pricing` — it is the most bdoor-specific UI on the site
- The Ask → Plan → Run sequence (it _is_ a sequence, so numbering it is correct)
- Review-date lines ("Prices last reviewed…", "Guide content last reviewed…") — surface them
  more, not less
- The footer's information architecture

**Replace:**

- The hero image ("Founder using the bdoor workspace on a laptop"). A person at a laptop is
  the single most generic image on the internet. The hero should be the product.
- Any middle-dot meta strings (`BDT 4,000 · Government fee BDT 0`) — encode that structure
  with layout and type, not punctuation
- Any component whose only job is decoration

_Corrections applied on adoption, 1 Sep 2026 (CLAUDE.md's code-is-the-fact rule): the
uploaded brief's anchor read `#0A1020`; the code's token is `--bd-ink: #081633` in
`src/styles/globals.css`. And Bengali is already live alongside English — both locales ship
together — so the Bengali pairing is testable now, not a future requirement._

---

## 3. Principles

1. **The product is the visual.** Where a page could show an image or show the workspace,
   show the workspace — with real, anonymised, rule-accurate data. A calendar with "RJSC
   annual return, due 31 December, authority RJSC, reviewed 29 Aug 2026" is more persuasive
   than any illustration.

2. **Precision reads as trust.** Aligned numbers, tabular figures, consistent units,
   currency always with its ISO code where two currencies appear. Every number on a page
   should look like it was placed by someone who is accountable for it — because we are.

3. **One door per page.** One primary action, unmistakable. Secondary actions are quiet.
   The brand name is an instruction.

4. **Structure encodes information.** A border, a rule, a number, a label exists because it
   tells the reader something — this is a sequence, these are separate fee layers, this
   figure is a pass-through. Nothing structural is ornamental.

5. **Two audiences, one register.** A Dhaka founder on a mid-range Android phone and a
   Gulf investor on a MacBook must both feel this is serious. Mobile is the primary
   viewport, not the fallback.

---

## 4. The signature element

Spend boldness in exactly one place: **a live obligations calendar as the homepage hero.**

Not a screenshot. A rendered component, populated from the rules corpus, showing a real
Bangladeshi private limited company's next twelve months: trade licence renewal, VAT return
cadence, RJSC annual return, e-TIN return, each with its authority and its review date.
Quiet motion on load, once — the obligations settle into place as if the calendar is being
generated for the visitor, which is exactly what Comply does.

That single element says: we know your deadlines, we know who issues what, we show our
sources, and this is what you get. It replaces the hero image, the stat callouts, and the
"how it works" preamble in one stroke.

Everything else on the page gets quieter to let it land.

---

## 5. Token direction

These are the constraints and the starting direction. Claude Code proposes the final
values after the audit in §2, and checks them against §8 before committing.

**Colour**

- Anchor: the existing `#081633` (`--bd-ink`). Build a proper scale around it rather than
  adding unrelated hues
- Light surfaces: **true near-white**, not cream or warm beige. Compliance paper is white
- One accent, used for the primary action and the "due" state only. Choose it for the
  subject — an official, considered colour — not a flag colour and not an acid hue.
  Candidate direction: a deep, slightly cool blue-green that reads as institutional
- Semantic states for obligations: upcoming / due / overdue / filed. These four states are
  the most important colours in the product. Design them first, with a colourblind-safe
  check
- Do not use tinted near-blacks (`#0B0B0B`, `#111`) as text colour on light surfaces; use
  the navy scale

**Typography**

- One family, or two clearly distinct. Not a display serif plus a generic sans by default
- **Hard requirement: Bengali script support.** English and Bengali are both live. The Latin
  face must pair with a Bengali face at matching weights and x-height. Test with real
  Bengali strings in headings, body, buttons and tabular numbers before choosing anything
- Tabular figures everywhere a number can sit above another number: pricing, quotes,
  calendars, tables
- A type scale from the classic canon (a modular scale around 1.2–1.25), set once, used
  everywhere. Line lengths under 75 characters
- No all-caps labels. No single italic or coloured word inside a headline. No eyebrow label
  above every heading

**Spacing and shape**

- One spacing scale (4 or 8 base). One radius scale with hierarchy — a button, a card and a
  modal should not share a radius. Currently-identical radii everywhere is the SaaS-kit tell
- Elevation: prefer borders and background shifts over shadows. Where a shadow is used, it
  is one defined token, not `rgba(0,0,0,.1)` sprinkled per card

**Motion**

- One orchestrated moment per page at most (the hero calendar). No fade-and-slide on every
  section, no hover lift on every card
- Motion that answers an action — expanding a fee layer, filing an obligation, opening a
  case — is welcome because it shows what changed
- `prefers-reduced-motion` honoured everywhere

---

## 6. bdoor-specific components — the ones no template has

Design these as first-class components with their own states. They are where the product's
identity lives.

| Component                      | What makes it ours                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Obligation row / calendar**  | Authority, due date, state (upcoming / due / overdue / filed), rule review date, one action                                                             |
| **Itemised quote**             | The four fee layers as a structured object: bdoor fee, government, provider, third-party — visibly separate, totals honest, "the only line bdoor keeps" |
| **Source citation**            | Authority, document, publication date, _and_ the date a human verified it. Appears under every regulatory claim in Ask and on every rule                |
| **Provider card**              | Named, licence type, conflict-check status, what they receive. "Named to you before anything is shared" as a design fact                                |
| **Route card** (country pages) | Local currency with BDT conversion clearly secondary, "from" pricing with what moves it, who performs the work                                          |
| **Review-date stamp**          | Small, consistent, everywhere content has a date. Trust at a glance                                                                                     |
| **State badges**               | Application / specialist review / quote issued / case open / filed. One vocabulary across Start, Comply and provider views                              |

Build each once, use each everywhere. Inconsistency between the Start flow, the workspace
and the provider portal is the fastest way to look like three products.

---

## 7. Page-by-page order

Work in this order. Each page is a `/redesign` run.

1. **Homepage** — the hero calendar (§4). Everything else quieter. The four quick-question
   links become the secondary path into Ask.
2. **`/pricing`** — the itemised quote becomes the centrepiece; Comply gets its own section
   the moment it has a price. The new/existing toggle becomes a real fork.
3. **`/products/comply`** — show the calendar, the reminder, the renewal case. Real product,
   real states. This page is the sales page for the business.
4. **`/ask`** — the answer view: citation chip under every claim, review date visible, exit
   into Comply for anything recurring.
5. **`/start`** — six stages; make progress legible, keep the browser-draft promise visible,
   one action per screen.
6. **Country pages** — UAE is the template; regenerate all six from it.
7. **Workspace and provider portal** — same component set, same states. Check with real
   documents and real cases, not lorem ipsum.

---

## 8. What to avoid — the tells

Do not ship any of these unless the brief above specifically asks for it:

- Cream or warm-beige backgrounds with a serif display and a terracotta accent
- Near-black plus one acid-green or vermilion accent
- Broadsheet layout: hairline rules, zero radius, dense columns
- The SaaS-card kit: everything in identical rounded cards with the same soft shadow
- Tracked-out ALL-CAPS eyebrow above every heading
- Meta strings joined with middle dots
- Labels built as `WORD — fragment`
- A monospace face for small data labels
- `→` appended to every link and button
- Stock photography of people at laptops
- A single highlighted word in a headline
- Numbered markers on content that is not a sequence
- Entrance animation on every section

Before building, run the generic-default test: would this plan look the same for any other
fintech landing page? If yes, it is a default, not a decision. Change it and say what
changed.

---

## 9. Quality floor — non-negotiable, never announced

- Responsive to 360px; designed at 390px first, then 768, then 1440
- Visible keyboard focus on every interactive element
- WCAG AA contrast on all text, including the four obligation states
- `prefers-reduced-motion` respected
- Bengali strings render correctly at every size and weight used
- Tabular numbers align in every table and quote
- Both positioning lines present on every page
- Real content throughout — no lorem ipsum, no placeholder deadlines, no invented fees

---

## 10. Process — two passes, then critique

**Pass one: plan.** Audit (§2). Write a compact design plan: 4–6 named colours, typefaces
per role with Bengali pairing, an ASCII wireframe of the page at 390px and 1440px, and the
one signature moment. Run the §8 test. Revise. State what you changed and why.

**Pass two: build.** Only after the plan survives critique. Build components (§6) before
pages. Use real data from the rules corpus and the price list.

**Then critique again.** Screenshot at 390 / 768 / 1440. Look at the images fresh. Check §9.
Remove one thing before shipping — there is always one accessory too many.

Record what you tried and rejected in `docs/design-notes.md`, briefly. The next pass should
not repeat it.
