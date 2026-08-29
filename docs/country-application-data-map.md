# Country application data map

What the `/start` application collects, per branch, and why. The single
source of truth is `QUESTIONS` in `src/features/intake/questions.ts`; this
file explains the shape for reviewers.

**Never collected at application time:** passports, NIDs, any identity
document, any banking credential, any payment detail. Identity collection
begins only after a quote and the applicable terms are accepted, through
the gated document flow — the application stage is deliberately documents-free.

## Common to every application

| Field            | Stage     | Notes                                                     |
| ---------------- | --------- | --------------------------------------------------------- |
| `target_country` | about_you | one of the seven; no "not sure" — country-first by design |
| `objective`      | about_you | new / existing / expand / unsure                          |
| `nationality`    | about_you | ISO-3166 alpha-2                                          |
| `activity`       | business  | free text, 15–1000 chars                                  |
| `entity_owner`   | ownership | corporate/trust owner → hard manual review                |
| `start_window`   | timing    | urgency only; never rendered as a delivery promise        |
| `full_name`      | contact   | who the acknowledgement and review are addressed to       |
| `email`          | contact   | where the reference and acknowledgement go                |
| `phone`          | contact   | optional                                                  |
| `consent`        | contact   | explicit; the application cannot be submitted without it  |

## Bangladesh branch (operating market)

Adds the full operating-market set: `founder_location`, `residence` (only
when the founder is outside Bangladesh), `existing_business` (only when the
objective is "unsure"), `existing_registrations` (existing businesses),
`location`, `structure`, `owner_count`, `director_count` (companies only),
`foreign_owners`, `foreign_ownership_percent` and `remit_capital`
(foreign-linked cases), `founder_will_work` (founders abroad),
`import_export`, `hire_employees`, `regulated_activity`, `need_address`.

Bangladesh submissions also run the deterministic recommendation engine
(`src/features/intake/rules.ts`) and show a preliminary recommendation
beneath the confirmation.

## International branch (§4.5 subset)

Adds only what a specialist needs to review and source a provider:
`residence`, `owner_count`, `need_visa`, `need_banking`, `notes`
(optional). Everything else is confirmed by the appointed provider per
case, so asking it up front would be theatre. Every international
application is flagged `international_formation` for manual review — the
rule lives in code, not configuration, so it cannot be switched off by
editing the rules table.

## Storage

Submissions persist to `public.applications`: reference, country slug,
objective, locale, contact fields, `package_slug`/`source_path`
attribution, the full answers as JSONB, status, consent, and an optional
link to the questionnaire session. RLS: platform staff may read
(`app.is_platform_staff()`); nothing may write except the server with the
service role. See `supabase/migrations/20260101002100_applications.sql`.
