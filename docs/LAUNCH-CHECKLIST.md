# Launch checklist

Everything that must be true before BDoor takes a real customer. The platform is
built to be reviewed, not switched on unread — several things are deliberately
left as drafts or mocks, and each one appears here.

Nothing on this list can be ticked by an engineer alone. Where a line needs a
lawyer, an accountant or a director, it says so.

---

## 1 · Legal review

**Status (30 Aug 2026): the ten-document suite is PUBLISHED as version 1.0 on
the owner's explicit release instruction** — without the counsel sign-off the
items below describe. The pages claim no professional or regulator approval
(none exists), payments/KYC/checkout remain disabled by their own gates, and
`tests/e2e/legal-policies.spec.ts` now asserts the published posture (no
draft banner, indexable, Version 1.0 + effective date). The counsel-review
items below therefore no longer BLOCK publication, but they remain open work:
when counsel review lands, ship it as a new version (e.g. 1.1) with a new
effective date via `src/content/legal/documents.ts`.

- [ ] **Terms of Service** reviewed and approved by qualified Bangladesh
      counsel.
- [ ] **Privacy Policy** reviewed, including the lawful basis for each
      processing purpose and the cross-border transfer position.
- [ ] **Refund Policy** reviewed against consumer law and against what the
      payment gateway's rules actually permit.
- [ ] **AML/KYC Policy** reviewed against Bangladesh AML obligations, including
      whether the platform is itself a reporting entity.
- [ ] **Legal Disclaimer** reviewed.
- [ ] **Cookie Policy** reviewed and matched against what the deployment
      actually sets.
- [ ] Set `awaitingCounselReview: false` and bump `VERSION` in
      `src/content/legal/documents.ts` only after sign-off, and record the
      approved version in `platform_settings.legal.policy_versions`.
- [ ] Confirm the standing disclosure BDoor uses in the footer and on every
      service page is accurate as approved:
      _"BDoor is an independent business setup and administrative-support
      platform. BDoor is not a government authority or law firm. Legal services,
      where required, are provided under a separate engagement by independent
      advocates or partner law firms. Government approval and processing times
      are not guaranteed."_
- [ ] Confirm the engagement model: BDoor's administrative services vs the
      independent advocate's legal services, and how the customer contracts with
      each.

## 2 · Regulatory accuracy — blocking

- [ ] Every published **government fee** verified against the authority's own
      schedule, with the date it was checked. Where BDoor has no verified
      figure, the page must keep saying **"Quoted after review"** — do not
      guess. `tests/e2e/marketing.spec.ts` asserts this for the incorporation
      service.
- [ ] Every **time estimate** reviewed, with `time_reviewed_at` and
      `time_reviewed_by` set on the service row. Estimates are presented as
      estimates and dated.
- [ ] Every **eligibility rule** in `recommendation_rules` reviewed by someone
      who knows the current position, particularly foreign-ownership
      restrictions by sector.
- [ ] The **manual-review triggers** in `hardManualReviewReasons()` reviewed.
      These are in code, not in the editable rules table, so that an edited rule
      cannot switch them off — confirm the list is right.
- [ ] No page implies affiliation with RJSC, BIDA, NBR, CCI&E, a city
      corporation, a ministry or any other authority.
- [ ] No page uses "guaranteed", "government authorized", "instant approval" or
      "official partner". Asserted by the E2E copy tests, but read the pages too.
- [ ] Confirm the capital-flow statement: **foreign share capital never moves
      through BDoor.** It goes from the investor directly to the company's
      account at a scheduled bank. Check this is stated wherever a founder could
      assume otherwise.

## 3 · Content that does not exist yet — blocking

None of these appear anywhere in the codebase, because BDoor does not have
verified ones. They may be added **only** with evidence.

- [ ] Office address, if BDoor has one.
- [ ] Company registration number and any regulatory registration.
- [ ] Partner logos — only with written permission from each partner.
- [ ] Press logos, awards, certifications — only if genuinely held.
- [ ] Testimonials and ratings — only from real, consenting customers.
- [ ] Statistics ("X companies formed") — only once true and measured.
- [ ] A published **security contact address**, then update
      `docs/INCIDENT-RESPONSE.md`.
- [ ] A named **incident lead** and deputy.
- [ ] Three owner-supplied images the August 2026 hotfix expected but did not
      ship: `public/images/bdoor/compliance-review.webp` (homepage process),
      `formation-documents.webp` (Services intro) and
      `bdoor-founder-imon-cobalt.webp` (About founder portrait). Their page
      slots hide until the files exist and light up on the next build — no
      code change needed. Substitutes and AI-generated people are not
      acceptable.

- [ ] Provider terms and data-processing terms reviewed by counsel.
      `/partners/apply` is OPEN by default since the go-live release
      (30 Aug 2026, owner instruction) with `provider-terms-1.0-2026-08-30`
      recorded on every acceptance; a counsel-reviewed revision ships as a new
      terms version. `PROVIDER_APPLICATIONS_STATUS=disabled` is the kill
      switch that restores the contact-form fallback.

## 4 · Integrations

Each of these is an adapter with a mock default. The mock is honest — it says so
in the UI — so the platform is usable without them, but not launchable.

- [ ] **Payment gateway** implemented (`PAYMENT_PROVIDER`), sandbox-tested end
      to end, webhook pointed at `/api/payments/webhook`, and
      `PAYMENT_WEBHOOK_SECRET` set on both sides. Confirm
      `paymentsAreSandbox()` returns false in production so the sandbox badge
      disappears.
- [ ] **Email** implemented (`EMAIL_PROVIDER`, `EMAIL_FROM`), with SPF, DKIM and
      DMARC on the sending domain. Until then `emailIsMock()` is true and the
      admin area says email is not configured.
- [ ] **Sanctions/PEP screening** implemented (`SCREENING_PROVIDER=live`). The
      mock contacts no list and labels every result as a non-screening; a
      customer must never be onboarded on the strength of a mock result.
- [ ] **Malware scanning** implemented (`MALWARE_SCAN_PROVIDER=live`). The mock
      leaves uploads `pending` and never marks an unscanned file clean.
- [ ] **AI** left `disabled` unless there is a reason to enable it. If enabled,
      confirm `prepareForModel()` is the only path that builds a request and
      that the privacy policy names the processor.
- [ ] **Error monitoring** (`SENTRY_DSN`) with alerting someone reads.

## 5 · Infrastructure

- [ ] Supabase project provisioned in a region that matches what the privacy
      policy says.
- [ ] All 13 migrations applied in order; `pnpm run db:types` regenerated and
      committed.
- [ ] **`seed.sql` not applied to production.** It is development data.
- [ ] Every production environment variable set. `STRICT_ENV` left at its
      default so an incomplete environment fails to boot rather than 500-ing at
      request time.
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production origin, no trailing slash.
- [ ] Supabase Auth: redirect URLs, email templates pointing at
      `/api/auth/confirm`, TOTP enabled, refresh-token rotation on.
- [ ] Storage buckets confirmed private except `public-marketing`.
- [ ] `RATE_LIMIT_DISABLED` **unset** in production. If the deployment runs more
      than one instance, implement `RateLimitStore` against Redis/Upstash first.
- [ ] Backups: point-in-time recovery on, and a restore actually rehearsed.
- [ ] Custom domain, TLS, and HSTS confirmed live (`next.config.ts` sets it in
      production).

## 6 · People and access

- [ ] The first `super_admin` created deliberately, with MFA enrolled.
- [ ] Every staff account has TOTP enrolled — it is required before the
      workspace loads, but confirm nobody is sitting in a half-set-up state.
- [ ] Role assignments reviewed against `docs/ROLES.md`. Remember `finance`
      cannot decide KYC and plain `admin` cannot approve a refund; if someone
      "needs" those, the answer is a second person, not a wider role.
- [ ] At least one partner organisation verified through the real flow:
      invited, TOTP enrolled, credentials uploaded, verified by an admin.
- [ ] Someone other than the engineer knows how to revoke a session, quarantine
      a document and rotate the service key.

## 7 · Quality gates

- [ ] `pnpm run verify` green.
- [ ] `pnpm run test:integration` green against a database built from the real
      migrations.
- [ ] `pnpm run test:e2e` green on both viewports.
- [ ] Accessibility: axe-core clean on the public pages, and a manual keyboard
      pass through sign-up, the questionnaire and one document upload.
- [ ] Bangla reviewed by a native speaker — not just present, but idiomatic and
      correct for the legal and financial terms.
- [ ] A real end-to-end rehearsal on staging: questionnaire → account →
      organisation → KYC → quote → payment → documents → partner → submission →
      approval → closure.

## 8 · Privacy operations

- [ ] Retention periods confirmed by counsel and an accountant, then written
      into `document_retention_rules.retain_years`. The current values are
      placeholders and say so in `legal_basis`.
- [ ] A documented process for handling a `data_subject_requests` row within the
      required window, including who can refuse one and on what basis.
- [ ] Confirm a deletion request cannot silently delete an `aml_record` or a
      `financial_record`, and that the requester is told so.
- [ ] Cookie banner behaviour matched to the approved cookie policy.

---

## How to use this file

Work top-down: sections 1–3 are blocking and cannot be resolved by writing code.
Sections 4–8 are largely engineering and operations and can proceed in parallel.

When a line is done, tick it in a PR that also links the evidence — the counsel
sign-off, the fee schedule screenshot, the rehearsal notes. A ticked box with no
evidence is worse than an empty one.
