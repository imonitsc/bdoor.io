# Legal review checklist

What qualified Bangladesh counsel needs to resolve before
`LEGAL_CONTENT_STATUS` may move from `draft` to `approved`, and the release
procedure for flipping it. This file lists open questions; it draws no legal
conclusions, because none of the people or tools that built this platform
are qualified to draw them.

## Where things stand

- The six draft documents live in `src/content/legal/documents.ts`
  (version `draft-2026-01`). They are working drafts written to match the
  platform's actual controls, and none has been professionally reviewed.
- While the gate is `draft`, the public legal pages show a concise
  pre-launch notice instead of the drafts, are `noindex`, and the platform
  takes no payments and collects no identity documents
  (`src/lib/launch/gates.ts`, enforced in `startCheckout` and
  `uploadDocument`).
- The Terms name **bdoor compliance ltd** as the contracting entity and the
  Privacy policy names it as data controller. No office address is
  published anywhere, per the owner's instruction.

## Items requiring professional resolution

Contract and liability

- [ ] Liability cap: amount, carve-outs, and enforceability under
      Bangladesh law.
- [ ] Whether the platform/professional-services split in the Terms
      correctly limits bdoor's exposure for partner work.
- [ ] Governing law and dispute-resolution clause.
- [ ] Consumer-protection requirements applicable to prepaid service fees.

Refunds and money

- [ ] Refund policy: statutory minimums, treatment of work in progress, and
      pass-through government fees that authorities do not return.
- [ ] Whether bdoor's professional fee is VAT-inclusive or exclusive, and
      the registration consequences (the sites says only: "Applicable
      taxes, if any, are confirmed in your itemised quote" until then).
- [ ] Invoicing requirements (Mushak formats) once VAT treatment is known.

Privacy and data

- [ ] Retention periods per data category (the draft states intent, not
      reviewed periods).
- [ ] Processor register: hosting, email, payment gateway — and whether the
      cross-border processing disclosure is sufficient.
- [ ] Lawful-basis mapping for identity data collected under AML
      obligations.
- [ ] Data-subject rights procedure and response windows.

AML/KYC

- [ ] Whether bdoor compliance ltd is itself a reporting entity, and under
      which guidance.
- [ ] Responsibility split between bdoor and partner professionals for CDD
      and reporting.
- [ ] The AML policy's risk-based approach against actual BFIU guidance.

Sign-off evidence

- [ ] Written approval from counsel for each document, filed by the owner,
      with reviewer, date and document version.

## Release procedure (owner-controlled)

Flipping the environment variable is the last step, not the decision:

1. Counsel's written approval exists for every document, referencing
   `draft-2026-01` (or its successor).
2. The approved text is committed to `src/content/legal/documents.ts` with
   a new version identifier and effective date, and
   `awaitingCounselReview` set to false — in a reviewed PR, never a direct
   push.
3. The owner sets `LEGAL_CONTENT_STATUS=approved` in the production
   environment.
4. The other gates (`PAYMENTS_STATUS`, `KYC_UPLOAD_STATUS`,
   `BANGLADESH_CHECKOUT_STATUS`) are separate decisions with their own
   prerequisites (live payment gateway sign-off; AML procedures in
   operation) and stay `disabled` until each is met.
5. Rollback is the reverse single step: `LEGAL_CONTENT_STATUS=draft`
   immediately restores the pre-launch notice and re-closes every
   dependent gate.
