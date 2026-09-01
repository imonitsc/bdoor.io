# ROADMAP — what to implement, in order

Grounded in the live site as of 1 September 2026. Each item states what exists, what is
missing, and what done looks like. Work top to bottom; do not start P2 while P0 is open.

Read `CLAUDE.md` first. The reframe in §1 is why this order is what it is.

---

## The gap, in one paragraph

Everything on the site is priced one-off. Solo Start BDT 9,900, Limited Company BDT 24,900,
Complete Launch BDT 39,900, nine standalone services, UAE routes from AED 9,375. bdoor
Comply — the recurring product that the whole business depends on — has a product page that
says "what it does today", lists an obligations calendar, reminders, renewal cases and
preparation on request, and has **no price, no subscription, and no presence on the pricing
page**. Its only call to action routes into the formation assessment. Meanwhile the
government gives away, free and in three days, most of what Complete Launch charges
BDT 39,900 for. The revenue line under pressure is the one we sell; the durable one is the
one we describe but cannot take money for.

---

## P0 — Make bdoor Comply purchasable

**Exists:** Comply product page. An obligations calendar in the workspace (per the page's
"what it does today"). "Compliance calendar setup" as a line item inside Complete Launch.
"RJSC annual filings and company changes" as a one-off standalone service from BDT 12,000.
A "New business / Existing business" toggle on the pricing page.

**Missing:** any way to pay for Comply on a recurring basis.

**Build:**

1. **A Comply subscription** — monthly and annual, priced in BDT, with the fee layers kept
   intact (the subscription is bdoor professional fee; any filing it triggers still itemises
   government and provider amounts separately). Put it on `/pricing` as its own section, not
   buried under a package.

2. **Attach at formation completion.** When a Start case reaches "filed", the entity is
   offered Comply as the next step, pre-populated with the obligations that formation just
   created (trade licence renewal, first annual return, VAT return cadence if BIN issued).
   This is the Contabilizei motion: formation feeds the subscription.

3. **A "Comply-included" path.** Offer a reduced or waived bdoor professional fee on
   formation in exchange for a 12-month Comply commitment. This is the honest response to
   BanglaBiz: stop competing on the commodity, price the thing that recurs. Make it a
   catalogue option, not a rewrite of the existing packages.

4. **Existing-business entry.** The "Existing business" tab should lead to Comply directly.
   An entity that already exists does not need Start; it needs its obligations loaded.

**Done when:** a customer with an existing Bangladeshi company can pay monthly for Comply
without touching the formation flow, and a customer completing Limited Company is offered
Comply before they leave the workspace.

---

## P1 — Structure the obligations so the calendar is generated, not typed

**Exists:** "Ongoing obligations after formation" as prose on country pages. A source
ledger with review dates at page level. An obligations calendar that, from the outside,
appears to be populated per case.

**Missing:** rules as data. Without them, every Comply subscriber's calendar is hand-built,
every regulatory change is a manual sweep, and the product cannot scale past the team's
attention.

**Build:**

1. **Rules table in the source ledger**, effective-dated, per jurisdiction, each row carrying
   authority, source URL, publication date, verified-by and verified-at. Fields for entity
   type, sector, trigger, deadline-as-offset, frequency, official fee, penalty.

2. **Rule → Obligation instantiation** (see `/newobligation`). Idempotent. Due dates as
   `date` in the jurisdiction calendar. Weekend and holiday roll-forward per jurisdiction.
   Every obligation records the rule version that produced it.

3. **Migrate the prose.** Move each "ongoing obligation" sentence on the six country pages
   into a rule row, then render the page section _from_ the rules. The page stops being the
   source and becomes a view of it.

4. **Per-rule review dates** replace page-level ones. The page shows the oldest rule's date
   so the reader still sees a single honest number.

**Done when:** a new Comply subscriber's calendar populates from rules with zero manual
entry, and a changed rule regenerates future obligations without touching past ones.

---

## P2 — Turn Ask into the top of the Comply funnel

**Exists:** Ask, grounded on published guidance and price list, source shown every time.
Four starter prompts on `/ask`, one of which is "Check annual compliance". Quick-question
links on the homepage.

**Missing:** any path from an answer into Comply. Today the only exit is Start.

**Build:**

1. Any answer that cites a recurring obligation ends with "Track this for your company" →
   Comply. Not a banner; a one-click entity creation with that obligation pre-loaded.
2. "Check annual compliance" routes to an existing-entity Comply entry, not to Start.
3. Ask retrieves from the rules table (P1) alongside guidance, so deadline answers carry a
   rule version and review date.
4. Log question → retrieval → exit. Unanswered questions become the ledger backlog;
   answered-but-not-converted questions tell you where Comply's pitch is weak.

**Done when:** a first-time visitor can go from a question about VAT return deadlines to a
paid Comply subscription without ever seeing a formation package.

---

## P3 — Import an existing entity from its identifiers

**Exists:** a workspace, a private bdoor ID, the "Outside Bangladesh / Bangladesh" fork at
the top of Start.

**Missing:** a way for one of the ~57,000 existing compliant entities — or the ~240,000
that are not — to onboard by typing what they already have.

**Build:**

1. An entry that accepts RJSC number, e-TIN and BIN (jurisdiction-typed identifiers, per
   `CLAUDE.md` §6), creates the Entity, and generates its obligation calendar from rules.
2. Where a public registry lookup exists, pre-fill from it; where it does not, the customer
   confirms entity type, sector and incorporation date and the rules do the rest.
3. Same shape for UAE: licence number and establishment card.

**Done when:** an existing company reaches a populated Comply calendar in under five
minutes with no specialist involved.

---

## P4 — Instrument retention before anything else scales

**Exists:** nothing visible.

**Build:**

1. Monthly cohort retention on Comply subscriptions, by jurisdiction, from customer one.
2. Obligation-level engagement: reminder sent → opened → acted → filed. The drop-off point
   is the product roadmap.
3. Conversion from renewal-case-offered to renewal-case-accepted — this is the marketplace
   take rate, and it is currently unmeasured.

**Done when:** a single query answers "what is month-3 logo retention for BD Comply
subscribers who onboarded in July?"

---

## P5 — Country pages become one template

**Exists:** all six international pages already render from one template
(`countries/[country]/page.tsx`) over the catalog and guide data — the premise "UAE is
fully built, the other five vary" was wrong; the variance was data completeness plus
country lists hardcoded in navigation and the sitemap. _(Corrected 1 Sep 2026 per the
code-is-the-fact rule.)_

**Build:** derive footer and sitemap country entries from the catalog so a new country
becomes a data task (see `/add-jurisdiction`). Ongoing-obligations sections render from P1
rules, each with its own review date, falling back to the human-reviewed guide prose while
a jurisdiction's corpus is empty.

**Done when:** adding a seventh country requires no new component.

---

## Keep — do not break these while doing the above

- **Fee layering.** "The bdoor professional fee is the only line bdoor keeps" is the take-rate
  architecture. Every new price, including the Comply subscription, respects it.
- **Source ledger and review dates.** Extend to per-rule; never remove.
- **Provider model.** Named before engagement, conflict-checked, scoped to the case.
- **Positioning lines** on every page (`CLAUDE.md` §3).
- **Browser-held Start drafts** until account creation.
- **The bdoor ID stays private.**

---

## Not now

- Financial services (payments, insurance, working capital). Year 3 in the plan. Needs
  Filings history to underwrite against; that history does not exist until P0–P3 have run
  for a year.
- Enterprise KYB API. Needs a rules corpus worth selling. After P1.
- New countries beyond the six. After P5 makes it a data task.
- Anything that improves formation conversion without a Comply attach.
