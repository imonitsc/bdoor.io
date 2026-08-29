# Waiting on the owner

Facts the platform needs that cannot responsibly be invented. Each item
gates only its own feature — everything else continues. When an item
arrives, the referenced place consumes it; nothing here blocks a build,
and nothing here blocks the core application system (missing trust content
is hidden, not faked).

## Production database (blocking two live behaviours)

- Apply Supabase migrations `20260101001300` … `20260101002100` to the
  production project. Until then: contact attribution falls back to the
  base columns (logged `contact.attribution_columns_missing`), and
  application submissions persist through the `contact_requests` fallback
  (logged `application.insert_failed`) instead of `public.applications` —
  which also keeps `/admin/applications` empty.

## Legal and compliance

- Counsel-approved legal documents and effective dates → flip
  `LEGAL_CONTENT_STATUS=approved` per `docs/LEGAL_REVIEW_CHECKLIST.md`
  (this also unlocks the operational "open now" copy, payments and KYC
  gates). The gate map is `docs/legal-input-required-for-paid-operations.md`.
- Counsel review of the application consent wording and the acknowledgement
  email copy (drafts shipped in `src/i18n/messages/*`).
- VAT treatment of bdoor's professional fee, and Mushak invoicing rules.
- Company registration identifiers the owner wants displayed publicly.

## Commercial

- Signed provider agreements per international route (scope, wholesale
  price, SLA, refund rule, liability allocation) → sets
  `providerApproved: true`; until then every route stays
  `managed_application` with per-case sourcing per
  `docs/provider-sourcing-and-assignment.md`.
- Confirmation (or correction) of the published featured starting prices —
  the 29 Aug 2026 immediate-operations table is live and pinned in
  `tests/unit/commercial-catalog.test.ts`; any change is an owner decision
  in that file and the catalog together.
- An owner-reviewed USD/BDT display rate → set `FX_USD_BDT_RATE` and
  `FX_USD_BDT_REVIEWED_AT`; until then package cards show BDT only. A
  contracted daily FX provider replaces the manual rate later.
- Validated processing-time ranges per route (with evidence) → country
  pages currently publish no timelines at all.

## Communications

- Real transactional-email provider and sender domain (`EMAIL_PROVIDER`,
  `EMAIL_FROM`, `EMAIL_API_KEY`) → until then the acknowledgement email
  uses the mock adapter and only logs a redacted summary.
- Business phone/WhatsApp numbers and contact routing.

## Trust content

- Approved founder name, biography, real photograph and links → a founder
  or About-page trust section may exist only after this approval; the hero
  no longer carries any person, generated or otherwise.
- Approved partner names, logos and profile copy (each partner's consent
  required) → the public directory stays hidden until then.
- Genuine case studies and review sources with consent.

## Payments

- Approved merchant accounts (e.g. SSLCOMMERZ/bKash) with contracts and
  webhook credentials → the payment adapters stay on their mock defaults;
  no credential is ever invented.
