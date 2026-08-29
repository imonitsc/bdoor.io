# Release readiness — immediate operations branch

State of `feat/immediate-operations-premium-redesign` against the
definition of done, at the time of the PR. Update this file in the same
commit as anything that changes an answer.

## Ready now (verified in CI and locally)

- Catalog: all seven countries operate as managed applications with the
  owner's published starting prices; figures pinned by
  `tests/unit/commercial-catalog.test.ts`; checkout off everywhere.
- Country-first application flow with persistence, reference,
  acknowledgement (mock email), confirmation screen, admin operations
  queue, and validated CTA parameters.
- Copy: applications-open statusline, §3 disclosure, review SLA, §11.4
  legal banner, four operational process steps — en and bn together.
- Premium hero with product module; five-item navigation; eight-section
  homepage.
- Gates unchanged: payments, checkout and identity collection remain
  force-closed while `LEGAL_CONTENT_STATUS=draft`.
- `pnpm run verify` green (format, lint, typecheck, unit, build); full
  Playwright suite green locally (see the PR for the run summary).

## Owner actions required for full production behaviour

1. Apply Supabase migrations `20260101001300` … `20260101002100` to
   production (the last one creates `public.applications`). Until then,
   submissions persist through the `contact_requests` fallback and the
   logs say so.
2. Everything in `docs/waiting-on-owner.md` (legal approvals, provider
   agreements, email/payment credentials, founder/trust content).

## Deferred scope (next slices, not this PR)

- P2: partner workspace for international cases, quote builder off
  application data, customer portal view of application → quote → case.
- P3: payments and identity/document collection — blocked on the gates in
  `docs/legal-input-required-for-paid-operations.md`, deliberately.

## Rollback

`docs/rollback-plan.md`. The catalog change is a single revertable commit;
the applications table is additive and safe to leave in place on rollback.
