# Provider sourcing and assignment

How the responsible third-party provider is found, vetted and disclosed for
a managed application. bdoor accepts and coordinates applications; the
regulated work — formation filings, registered-agent service, corporate
services, tax, legal and regulatory advice — is performed by an appointed
provider, and the customer is told who that is before any engagement.

## Sourcing, per case

1. **Shortlist.** For the application's country and route, identify
   licensed candidates (law/accountancy firms, registered agents, corporate
   service providers, free-zone/QFC-recognised firms as applicable).
2. **Vet.** Confirm licence/registration with the relevant authority,
   professional-liability coverage, sanctions screening of the firm and its
   principals, and a written scope + fee for this case.
3. **Select.** Record the selection, the evidence checked and the agreed
   wholesale fee in the owner's records (never in this repository — see the
   no-invented-facts rule in `docs/waiting-on-owner.md`).

## Disclosure to the customer

Before engagement or payment the customer receives, in writing: the
provider's name and jurisdiction, the exact scope the provider performs,
the provider's fee as its own line in the itemised quote, and what customer
information the provider will receive. This is the §3 disclosure the
country pages summarise; the quote is where it becomes specific.

## What may be shared with a provider, and when

- **Before the customer accepts terms:** nothing identifying. An anonymised
  case outline (country, route, activity summary, ownership shape) is the
  most that may be used to obtain a scope and fee.
- **After acceptance of terms and the data-sharing consent:** the case
  details the scope requires — still no identity documents until the KYC
  gate (`docs/legal-input-required-for-paid-operations.md`) is open.

## Assignment mechanics

Until the partner workspace carries international cases, assignment is
recorded by the reviewing specialist in the application's status trail
(`in_review` → `quoted`) and the owner's provider records. When the partner
portal work lands (deferred P2 scope), assignments move onto
`case_partner_assignments` with the same disclosure rules enforced by RLS.

## Standing rules

- No provider is ever named on the public site without a signed agreement
  and the owner's approval (`docs/CONTENT_APPROVAL_MATRIX.md`).
- `providerApproved` in the catalog flips only on a signed agreement; it is
  what separates a managed application from a `request_quote`/`available`
  route in `docs/INTERNATIONAL_LAUNCH_MATRIX.md`.
- Foreign share capital never routes through bdoor; provider and authority
  amounts are pass-through and say so on the quote.
