# Legal input required before paid operations

What must exist, from qualified counsel and the owner, before the platform
may take money, collect identity documents, or share customer data with
providers. Until every gate below is recorded,
`LEGAL_CONTENT_STATUS=draft` keeps payments, KYC and checkout force-closed
(`src/lib/launch/gates.ts`) — applications stay open, which is exactly what
the §11.4 public banner says.

## Gate 1 — Terms of service (per engagement type)

Counsel-approved terms covering: bdoor's coordinator role vs the provider's
regulated role, the itemised-fee model, pass-through amounts, refund rules
per fee layer, liability allocation, and governing law. Bangladesh terms
and international managed-application terms are distinct documents.

## Gate 2 — Privacy and data sharing

Counsel-approved privacy policy naming the categories shared with
providers, the lawful basis, cross-border transfer treatment for each of
the six international countries, retention periods
(`docs/DATA-RETENTION.md`), and the consent text the application flow shows
(the current consent copy is a draft pending this review).

## Gate 3 — Identity/KYC programme

AML/KYC policy approved by counsel and the compliance officer: which
documents per route, screening obligations (including SA/QA screened
markets), how the private storage and `compliance` schema are used, and who
may decide. Only then may document collection open — and only through the
existing gated flow (signed URLs, canonical paths, no public buckets).

## Gate 4 — Payments

Merchant/payment-provider agreements in bdoor's name, settlement currency
treatment for USD-quoted routes, and counsel sign-off that the flow never
routes foreign share capital through bdoor. Credentials arrive only from
the owner (`docs/waiting-on-owner.md`); the code keeps its mock default.

## Gate 5 — Per-country fulfilment review

For each international route before its first paid engagement: counsel or
the provider confirms bdoor's coordinator model is permissible in that
jurisdiction, and the country page's claims are re-read against the signed
provider scope.

## Recording a gate

Each gate is recorded by the owner (date, document, reviewer) and reflected
in the repo by a single change: flipping the relevant flag/status in code
review. `docs/LEGAL_LAUNCH_CHECKLIST.md` and
`docs/LEGAL_REVIEW_CHECKLIST.md` carry the detailed item lists; this file
is the map from gates to what they unlock.
