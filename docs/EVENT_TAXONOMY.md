# Analytics event taxonomy

First-party, server-side business events are the source of truth for
commercial milestones (master instruction §22). Product analytics may
supplement them later but never replaces them for revenue or completed cases.

The canonical list lives in code as `ANALYTICS_EVENTS` in
`src/lib/analytics/taxonomy.ts`; the database check constraint on
`analytics_events.event_name` carries the same list, and
`tests/unit/analytics-taxonomy.test.ts` fails if the two drift. This document
explains each event; the code decides.

## Rules

1. **Server-side only.** Events are recorded by Server Actions, route handlers
   and webhooks through `recordAnalyticsEvent()` (service role). The browser
   cannot insert events.
2. **Idempotent.** Every event carries an `idempotency_key`; replays are
   dropped by the unique index, so a retried webhook or double-submitted form
   counts once.
3. **Test data is excluded at write time.** `is_test` is set when the actor
   email matches `ANALYTICS_TEST_EMAIL_PATTERNS` (example.com / example.test /
   the seed fixtures) or when `ANALYTICS_TEST_MODE=1` (set in CI and local
   dev). Every metric query filters `is_test = false`. Production metrics must
   never count seeds, staff rehearsals or CI traffic (§13.7).
4. **No personal data in properties.** Events reference rows by UUID
   (application, case, quote version, payment, subscription) and store
   category-level facts (country, locale, package slug, source path, UTM).
   Never an email, name, phone, identity number or free-text answer.
5. **Consent.** Server-side events record what the business itself did
   (received an application, issued a quote, confirmed a payment) — records
   bdoor needs to operate. Client-side behavioural analytics (page views,
   scroll) are **not** implemented; adding them later requires the cookie
   policy + consent banner to change first.

## Events

| Event | Recorded by | When |
| --- | --- | --- |
| `application_started` | intake session persistence | first server-side save of a questionnaire session (one per session) |
| `application_submitted` | `/start` submission action | an `applications` row is created |
| `contact_submitted` | contact form action | a contact/lead row is created |
| `provider_application_submitted` | provider apply action | a provider application reaches `submitted` |
| `provider_application_approved` | admin approval action | staff approve a provider application |
| `provider_assignment_accepted` | partner respond action | a partner accepts an assignment with a clean conflict result |
| `quote_issued` | staff quote action | a quote version is sent to the customer |
| `quote_viewed` | customer billing page | first authenticated view of a sent quote version |
| `quote_accepted` | `acceptQuote` | acceptance recorded against the immutable version |
| `payment_confirmed` | payment webhook | provider event marks a payment `paid` (signature verified) |
| `case_completed` | case transition action | a case reaches its terminal completed state |
| `subscription_started` | subscription activation | a subscription becomes `active` (verified payment / recorded offline payment) |
| `subscription_renewed` | renewal processing | a new paid service period begins |

Events named in the brief but **deliberately not recorded yet**:
`homepage_viewed`, `start_flow_opened`, `market_scope_selected`,
`country_selected` are client-side page/interaction views; they require the
consent layer above. `ai_question_asked` / `ai_application_started` land with
the Ask bdoor AI branch (Phase 2).

## Attribution

`source_path`, `package_slug`, `country`, `locale` and the `utm` JSON object
are captured where the flow already carries them (the `/start` seed params and
contact attribution from the LSC phase). Attribution rules are versioned in
`metric_definitions` alongside the formulas.
