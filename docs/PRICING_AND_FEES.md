# Pricing and fees

How money is represented, which numbers are published, and which are not
approved for publication. Verified against the catalogue on 28 August 2026.

---

## The one rule

**BDoor revenue and money that belongs to someone else are never mixed.**

Every quote line carries a `payee` (`bdoor`, `government_authority`,
`partner_firm`, `third_party`) and a category. A government fee is a
pass-through the customer owes an authority; it is never folded into a BDoor
service fee, and the official receipt is stored against the case.

Amounts are integer minor units. `src/features/quotes/money.ts` owns the
arithmetic — inclusive vs exclusive tax, revenue vs pass-through. Never a float.

---

## Current published prices

These are the live public prices and the source of truth. They are seeded in
`supabase/seed.sql` and served from `public.services.starting_fee_bdt`.

| Service                                         |           BDoor fee | Note                                                         |
| ----------------------------------------------- | ------------------: | ------------------------------------------------------------ |
| e-TIN and initial tax setup                     |              ৳4,000 | BDoor assistance fee. Government registration is free        |
| BIN/VAT registration                            |              ৳6,000 | BDoor assistance fee. NBR states the application is free     |
| Trade licence                                   |              ৳8,000 | Local-authority charges are separate and vary by location    |
| RJSC annual filings and company changes         |             ৳12,000 | Authority and partner charges itemised per case              |
| Commercial Import Registration Certificate      |             ৳15,000 | CCI&E, chamber, bank and VAT charges separate                |
| Private limited company incorporation           |             ৳25,000 | Government, third-party and non-standard legal work separate |
| Foreign ownership and sector eligibility review | Quoted after review | No instant checkout                                          |
| Travel agency registration                      |         Coming soon | Disabled until operations and licensing review complete      |

Do not change a published price without an explicit owner decision and an audit
record. `NULL` means "quoted after review" and renders as such — it does not
mean free.

---

## Not approved for publication

The 28 August 2026 brief carries an expanded catalogue: formation packages
(`LOCAL_LTD_LAUNCH`, `FOREIGN_LTD_START`, `BRANCH_LIAISON`), individual
registrations, foreign-founder services, ongoing compliance retainers, and
three `bdoor One` subscription tiers.

**These are internal commercial planning data.** They are not seeded, not
active, and must not be published or made purchasable until the owner approves
them in writing after validating staff time, partner payout, VAT treatment,
payment-processing cost, refund exposure and margin.

They are deliberately absent from the database rather than seeded as `draft`,
so there is no route by which a flag flip could expose an unapproved price.

---

## Fee layers a customer sees

A quote separates:

1. `platform_service_fee` — BDoor revenue.
2. `partner_professional_fee` — a verified partner's fee, passed through.
3. `government_fee_estimate` — payable to an authority. Always marked estimate.
4. `third_party_cost` — bank, courier, translation, attestation.
5. `tax` — applicable VAT on BDoor and partner fees.
6. `discount` — the only line permitted to be negative.

Enforced by check constraints, not convention:
`quote_items_government_shape` requires a government line to be
`is_estimate = true` and payable to `government_authority`;
`quote_items_partner_shape` requires a partner fee to be payable to
`partner_firm`; `quote_items_amount_sign` requires non-discount lines to be
non-negative.

---

## Official fees

A published government figure needs a verified source. `service_fee_components`
carries `source_ref` and `reviewed_at`, and
`service_fee_components_government_needs_source` refuses a government-fee row
that has an amount but no source and review date.

Where a figure is not verified, the correct output is **"Quoted after review"**
— never a guess. Fees that genuinely vary (trade licence by local authority,
BIDA by investment slab, IRC by import ceiling) must collect the input before
showing a number.

Time estimates carry `time_reviewed_at` and are described as estimates.
`services_estimate_needs_review` refuses a day range without a review date.

### Not built yet

The brief specifies `government_fee_rules` and `fee_source_records` as
first-class tables with formula/slab JSON, `review_due_at`, and a checkout that
says _"Official fee will be reconfirmed before payment"_ once a rule is stale.
The shipped schema has the source and review-date columns on
`service_fee_components` but no rule engine, no slab calculator, and no staleness
gate. Tracked in `docs/BUILD_REPORT.md`.

Also absent: a `price_versions` history. Prices live directly on `services`, so
a published price can change without a versioned record. An accepted
`quote_version` is frozen, so an existing customer is protected — but there is
no audit trail of what the public price was on a given date.

---

## Quotes

- A quote has versions; an accepted version is immutable
  (`app.quote_versions_guard()`). A price change creates a new version.
- Customers only ever see a version that was actually sent
  (`quote_versions_customer_read` requires `sent_at is not null`).
- Totals are stored, not recomputed at read time, so an accepted quote keeps
  the exact numbers the customer saw.
- Validity is `valid_until` on the version; expiry is a state, not a display rule.

---

## Copy rules

Pricing copy is part of the correctness surface:

- **"Starting at"** whenever the final amount depends on capital, location,
  sector, foreign documents, inspections, volume, legal work or authority queries.
- Never "guaranteed", "instant approval", "government authorized", "official partner".
- A government fee is published only with a verified figure and a review date.
- Both `en.json` and `bn.json` change together. A key present in one and missing
  from the other renders the key path to a user.
