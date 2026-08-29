# Seven-country delivery plan

The seven-country formation, pricing and intake specification (29 Aug 2026,
owner's records) expands bdoor from Bangladesh-plus-four-register-interest
routes to a seven-country platform: Bangladesh as the operating market
(65% of the positioning), with the USA, UK, UAE, Saudi Arabia, Qatar and
Singapore fulfilled through appointed local partners.

The specification's own launch sequence (§12) starts with "publish the
seven-country information architecture and assessment" — everything
commercial comes later, route by route, and only behind the availability
ladder in `docs/INTERNATIONAL_LAUNCH_MATRIX.md`.

## Phase 1 — shipped in this change

- Availability ladder (`research_only` → `available_online` → `paused`) in
  the commercial types; every international route starts `research_only`.
- Saudi Arabia and Qatar added to the catalog as eligibility-led,
  register-interest routes with no public figures; SAR/QAR supported as
  original currencies.
- `/[locale]/countries` page tree: an index (Bangladesh first and largest),
  a Bangladesh hub page, and one page per international country
  (`usa`, `uk`, `uae`, `saudi-arabia`, `qatar`, `singapore`), with
  permanent redirects from the old `/international` URLs.
- Navigation per the spec (Start a business / Manage a business / Countries
  / Pricing / Resources / Partners), the homepage seven-country selector
  with the Bangladesh card larger, and footer/sitemap updates.
- The assessment asks the destination country (six countries or "not
  sure") when the founder wants to form abroad; every international
  destination continues to route to manual review.
- The official source ledger (`docs/COUNTRY_SOURCES.md`).

## Deliberately not in phase 1

Each of these is a phase of its own, gated on evidence that does not exist
yet (signed partners, approved price sheets, counsel review):

1. **BDT/USD display currency system** — daily FX refresh, "Rate checked"
   stamps, 48-hour quote locks, BDT rounding to the nearest 100, original
   currencies retained in the ledger. Requires the FX snapshot data model
   and a rate provider; nothing on the public site shows a convertible
   price today, so the toggle has nothing truthful to convert yet.
2. **Per-country package catalogues and featured homepage prices** — the
   spec's retail prices are proposals; they stay out of the codebase's
   public surfaces until a contracted partner validates scope and wholesale
   cost and the owner approves a price sheet (then `priceApproved` flips
   per route, never per country).
3. **Five-line public price breakdown** (bdoor fee / partner fee /
   government fee / third-party / taxes) — the quote engine already
   separates layers internally; the public rendering lands with the first
   `available_by_quote` route.
4. **Staged intake with universal + country-specific KYC/KYB fields**
   (spec §5) — depends on partner document requirements that are fixed
   only when a partner is contracted.
5. **Partner marketplace operating model** (spec §8) — qualification
   checklist, wholesale offers, per-route coverage and re-verification
   alerts in the database.
6. **Country-page commercial template** (route selector, three package
   cards, itemised example quote, timelines) — replaces the
   register-interest template route by route as availability climbs.

## Non-negotiables carried from the spec

- Never mark up a statutory fee silently; government costs at actuals.
- No checkout until partner scope, wholesale price, turnaround, renewal,
  refund rule and liability allocation are signed (`available_online`).
- Never guarantee a bank account, visa, licence, tax status or government
  approval.
- Saudi Arabia and Qatar use "Check eligibility", never "Buy now".
- No street address published; legal name, support email and partner
  disclosures instead.
