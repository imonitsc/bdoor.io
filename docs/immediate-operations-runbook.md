# Immediate-operations runbook

How the team runs the seven-country managed-application service day to day,
from the moment an application arrives to the moment a quote is accepted.
The public promise this runbook exists to keep: **acknowledgement
immediately, initial specialist review within one business day.**

## 1. Where applications arrive

- Customers apply at `/start` (country-first flow). Every submission gets a
  random reference `BD-<year>-<6 digits>` and an acknowledgement email
  (mock provider until the owner supplies credentials — see
  `docs/waiting-on-owner.md`).
- Rows land in `public.applications` (service-role writes only). If that
  table's migration is not yet applied in production, submissions fall back
  to `contact_requests` with the reference in the message body and
  `application.insert_failed` in the logs — treat any such log line as a
  signal to apply the migration.

## 2. The daily queue

1. Open `/admin/applications` (requires `case.manage`; platform roles are
   MFA-gated).
2. Filter `status = new`, oldest first. Everything older than one business
   day is an SLA breach — clear those first.
3. For each application: read the answers, decide the route
   (`new`/`existing`/`expand`/`unsure` × country), and check the hard
   review flags (international target, corporate owner, regulated activity,
   foreign ownership, capital remittance — the same list as
   `hardManualReviewReasons` in `src/features/intake/rules.ts`).
4. Move the row to `in_review`, do the specialist review, then either send
   the itemised quote (`quoted`) or reply asking for what is missing.
5. `engaged` only after the customer has accepted the quote **and** the
   applicable terms; `closed` for withdrawn, out-of-scope or completed
   cases.

## 3. What a specialist may and may not do

- May: assess eligibility, prepare an itemised estimate, source and brief a
  provider (see `docs/provider-sourcing-and-assignment.md`), send the §3
  disclosure.
- May not: take payment, request identity documents, promise approval, a
  visa, a bank account or a government timeline, or share customer data
  with a provider before the gates in
  `docs/legal-input-required-for-paid-operations.md` allow it.

## 4. Communications

- Every price given is a starting estimate until the itemised quote; the
  quote separates bdoor fee, provider fees, government charges, third-party
  costs and taxes.
- Saudi Arabia and Qatar cases are assessments: no cost commitment of any
  kind before the eligibility review is done.
- Never promise a one-business-day **quote**; the promise is a
  one-business-day **initial review**.

## 5. Incidents

- Application submissions failing: check `application.insert_failed` /
  `application.fallback_failed` log lines, then `docs/rollback-plan.md`.
- Wrong price rendering: the only source of truth is
  `src/content/packages/catalog.ts`; a hotfix edits it there (unit tests
  pin the figures, so the change is deliberate by construction).
