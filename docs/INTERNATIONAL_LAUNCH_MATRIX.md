# International launch matrix

What has to be true before an international route may change its public
status. The public site renders whatever
`src/content/packages/catalog.ts` says (`publicStatus`, `providerApproved`,
`priceApproved`, `checkoutEnabled`), and
`tests/unit/commercial-catalog.test.ts` fails the build if a price or
checkout appears without its approvals — so this matrix is enforced, not
aspirational.

No partner negotiations, terms or figures belong in this file. It records
**what kind** of evidence unlocks each step, and where the evidence should be
filed (owner's records, referenced by date), never the content of the
evidence itself.

## Availability ladder (internal)

Each route also carries an operational `availability` state
(`AvailabilityState` in `src/features/packages/types.ts`), climbing one
step at a time. It is never rendered to customers; it constrains what the
public status may say:

| Availability         | What it means                                                                                             | Highest honest public status                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `research_only`      | market researched, no partner conversations                                                               | `register_interest`                                               |
| `partner_sourcing`   | candidate partners being qualified                                                                        | `register_interest`                                               |
| `partner_pilot`      | contracted partner, pilot case in flight                                                                  | `register_interest`                                               |
| `available_by_quote` | owner has committed to fulfil the route (managed application, provider per case, or signed partner scope) | `applications_open`, `request_quote` or `available` (no checkout) |
| `available_online`   | the above **plus** a successful pilot and automated gates                                                 | `available` with checkout                                         |
| `paused`             | a previously open route the owner has suspended                                                           | `register_interest` or `not_available`                            |

Since 29 Aug 2026 each route also carries a `mode` (`RouteMode`). Every
route currently runs `managed_application`: applications are accepted for
every country, a specialist reviews each case, and the responsible provider
is sourced and disclosed per case before any engagement. `online_checkout`
remains reachable only by an explicit owner decision once provider, legal,
payment and document-security readiness are all recorded.

## Public status ladder

| Public status       | May show price?                                            | May take payment?                 | Preconditions                                                                                                             |
| ------------------- | ---------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `register_interest` | no                                                         | no                                | none — the default for any route in preparation                                                                           |
| `request_quote`     | no (quotes only)                                           | no                                | provider agreement signed (`providerApproved: true`), operating workflow documented                                       |
| `applications_open` | starting estimates only, each with its mandatory qualifier | no                                | availability `available_by_quote`+, `mode: managed_application`, `priceApproved: true` — the 29 Aug 2026 owner activation |
| `available`         | yes                                                        | only with `checkoutEnabled: true` | availability `available_by_quote` or beyond; checkout needs `available_online`                                            |
| `not_available`     | no                                                         | no                                | a route the owner has decided not to offer                                                                                |

An `applications_open` figure is a **starting estimate, never a checkout
total**: the itemised quote is issued only after specialist review, and
`checkoutEnabled` stays `false` on every route until the owner flips a row
through the full `available_online` requirements.

Saudi Arabia and Qatar are additionally `eligibilityLed`: whatever their
availability, the public call to action is an eligibility check, never a
buy-style button, and a quotation exists only after a partner-approved
review.

`Draft` is an internal word. It never appears on a customer page in any
status; the unit suite and the Playwright forbidden-string test both fail if
it does.

## Per-route requirements before `available`

The same eight items for each of US / UK / UAE / Saudi Arabia / Qatar /
Singapore. A route may not skip rows.

1. **Provider agreement** — signed agreement with the licensed local
   provider who performs the regulated work; provider named to the customer
   before engagement. Sets `providerApproved: true`.
2. **Price approval** — owner-approved price sheet, itemised into bdoor
   fee / official fees / provider fees, each with currency and price type.
   Sets `priceApproved: true` and restores `publicLabel`.
3. **Operating workflow** — written end-to-end process: who collects what,
   in which order, with which handoffs to the provider.
4. **Document list** — the exact customer documents the route requires, and
   which of them are identity documents (these also require the KYC gate to
   be open).
5. **Support ownership** — who answers customer questions for this route,
   with what response expectation.
6. **Payment method** — how the customer pays and in which currency, and how
   provider/official amounts are passed through; never through a mechanism
   that routes foreign share capital via bdoor.
7. **Compliance plan** — the continuing obligations the customer takes on in
   that country and how the workspace will track them.
8. **Country page content review** — the country page's scope, disclosures
   and disclaimer re-read against the signed agreement before flipping the
   status.

## Current state (2026-08-29, immediate-operations activation)

The owner's immediate-operations instructions of 29 Aug 2026 activated all
six routes as managed applications and published the featured starting
prices (their table §5). `priceApproved` is therefore true everywhere;
`providerApproved` stays false until a signed agreement exists for a route,
which is why no route may leave `managed_application`.

| Route                      | Availability       | Mode                | Public status     | Provider | Price | Notes                                                                    |
| -------------------------- | ------------------ | ------------------- | ----------------- | -------- | ----- | ------------------------------------------------------------------------ |
| US — Wyoming LLC           | available_by_quote | managed_application | applications_open | ✗        | ✓     | From $499, estimated first-year package                                  |
| UK — non-resident Ltd      | available_by_quote | managed_application | applications_open | ✗        | ✓     | From $299, estimated first-year package                                  |
| UAE — zero-visa free zone  | available_by_quote | managed_application | applications_open | ✗        | ✓     | From AED 9,375 (Sharjah no-visa, estimated total); Dubai from AED 15,000 |
| SA — screened market entry | available_by_quote | managed_application | applications_open | ✗        | ✓     | eligibility-led; professional setup from $4,900                          |
| QA — QFC route             | available_by_quote | managed_application | applications_open | ✗        | ✓     | eligibility-led; first-year QFC estimate from $10,900                    |
| SG — foreign-founder Pte   | available_by_quote | managed_application | applications_open | ✗        | ✓     | From $1,899; conditions apply                                            |

Flipping any row is an owner decision recorded in a commit that changes the
catalog — the same commit must update this table and the pinned figures in
`tests/unit/commercial-catalog.test.ts`. Official authority fee sources and
their review dates live in `docs/COUNTRY_SOURCES.md`; the phased delivery
plan for the seven-country specification lives in
`docs/SEVEN_COUNTRY_PLAN.md`.
