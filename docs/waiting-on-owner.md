# Waiting on the owner

Facts the platform needs that cannot responsibly be invented. Each item
gates only its own feature — everything else continues. When an item
arrives, the referenced place consumes it; nothing here blocks a build.

## Legal and compliance

- Counsel-approved legal documents and effective dates → flip
  `LEGAL_CONTENT_STATUS=approved` per `docs/LEGAL_REVIEW_CHECKLIST.md`
  (this also unlocks the operational "open now" copy, payments and KYC
  gates).
- VAT treatment of bdoor's professional fee, and Mushak invoicing rules.
- Company registration identifiers the owner wants displayed publicly.

## Commercial

- Signed partner agreements per international route (scope, wholesale
  price, SLA, refund rule, liability allocation) → availability may climb
  past `partner_pilot`; prices publish only after the owner approves a
  price sheet (`priceApproved`).
- An owner-reviewed USD/BDT display rate → set `FX_USD_BDT_RATE` and
  `FX_USD_BDT_REVIEWED_AT`; until then package cards show BDT only. A
  contracted daily FX provider replaces the manual rate later.
- Validated processing-time ranges per route (with evidence) → country
  pages currently publish no timelines at all.

## Trust content

- Approved founder name, biography, real photograph and links (the hero
  illustration is a commercial illustration and is never labelled as the
  founder).
- Business phone/WhatsApp numbers and contact routing.
- Approved partner names, logos and profile copy (each partner's consent
  required) → the public directory stays hidden until then.
- Genuine case studies and review sources with consent.

## Payments

- Approved merchant accounts (e.g. SSLCOMMERZ/bKash) with contracts and
  webhook credentials → the payment adapters stay on their mock defaults;
  no credential is ever invented.
