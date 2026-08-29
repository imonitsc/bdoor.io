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

## Status ladder

| Public status       | May show price?  | May take payment?                 | Preconditions                                                                       |
| ------------------- | ---------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `register_interest` | no               | no                                | none — the default for any route in preparation                                     |
| `request_quote`     | no (quotes only) | no                                | provider agreement signed (`providerApproved: true`), operating workflow documented |
| `available`         | yes              | only with `checkoutEnabled: true` | everything below complete                                                           |
| `not_available`     | no               | no                                | a route the owner has decided not to offer                                          |

`Draft` is an internal word. It never appears on a customer page in any
status; the unit suite and the Playwright forbidden-string test both fail if
it does.

## Per-route requirements before `available`

The same eight items for each of US / UK / UAE / Singapore. A route may not
skip rows.

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

## Current state (2026-08-29)

| Route                  | Public status     | Provider | Price | Notes                                              |
| ---------------------- | ----------------- | -------- | ----- | -------------------------------------------------- |
| US — Wyoming LLC       | register_interest | ✗        | ✗     | working figures exist internally; not publishable  |
| UK — non-resident Ltd  | register_interest | ✗        | ✗     | identity-verification requirement noted on page    |
| UAE — free-zone routes | register_interest | ✗        | ✗     | activity/zone scoping needed before any price      |
| SG — Pte Ltd via CSP   | register_interest | ✗        | ✗     | CSP scope and nominee-deposit treatment unresolved |

Flipping any row is an owner decision recorded in a commit that changes the
catalog — the same commit must update this table.
