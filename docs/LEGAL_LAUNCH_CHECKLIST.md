# Legal launch checklist

Nothing here may be signed off by an engineer or by Claude. Each item needs a
named human with the authority to accept the risk.

`docs/LAUNCH-CHECKLIST.md` tracks engineering readiness. This file is the legal,
compliance and trust gate that sits in front of it.

**Status on 28 August 2026: not launch-ready.** Every blocker below is open.

---

## 1. Legal content — blocking

The Terms, Privacy Policy, Refund Policy, AML/KYC Policy, Legal Disclaimer and
Cookie Policy are published with visible draft labels and unresolved
placeholders. That is the honest state and must not be quietly removed.

A policy page may only lose its draft label when all of these exist:

- [ ] Counsel-approved text for each page, from a qualified Bangladesh adviser.
- [ ] Policy version identifier and effective date recorded per page.
- [ ] Operating legal entity name and registration details.
- [ ] Registered address and contact for legal notice.
- [ ] Retention periods per document and case type, matching
      `document_retention_rules`.
- [ ] Processor and vendor register with purpose and location.
- [ ] Named compliance owner.
- [ ] Bangla translations reviewed by a competent translator, not machine output.

Until then the launch gate keeps **sensitive uploads and live payments
disabled**. Do not implement a flag that bypasses this without approval
recorded against a named person.

---

## 2. Verified trust fields — blocking

The site must not display a trust signal that has not been verified.

- [ ] Operating legal entity and registration number.
- [ ] Office address.
- [ ] Named leadership.
- [ ] Verified professional partners.

Never invent these. The partners page currently states truthfully that no
partner organization has completed verification — that statement stays until a
`partner_verifications` record exists. No partner logo, press logo, award,
testimonial, rating, customer count, approval rate or turnaround statistic may
appear until backed by an approved record.

---

## 3. AML/KYC — blocking

BFIU instructions reach trust and company service providers, lawyers, notaries
and accountants. A platform coordinating company formation must assume it is in
scope until advised otherwise.

- [ ] Written AML/CFT policy approved by a qualified adviser.
- [ ] Risk-based customer due diligence documented and matching what the product does.
- [ ] Real sanctions/PEP/adverse-media screening. `SCREENING_PROVIDER=mock`
      never contacts a list and every result it returns is labelled a
      non-screening. **A mock result is not a screening.**
- [ ] Named officer responsible for compliance decisions.
- [ ] Suspicious-transaction reporting route and tipping-off training.
- [ ] Record-retention period aligned to the AML rules, not only to product needs.

The `finance` role deliberately has no KYC capability. Preserve that.

---

## 4. Privacy — Personal Data Protection Act, 2026 — blocking

Act No. 63 of 2026, published 10 April 2026. Engineering has built controls;
their legal adequacy is not for engineering to certify.

- [ ] Privacy notice reviewed against the Act.
- [ ] Lawful basis recorded per processing purpose.
- [ ] Cross-border hosting reviewed. Vercel serves from `iad1` (US) and the
      Supabase project is in ap-southeast-1 (Singapore). **Personal data of
      Bangladeshi data subjects is processed outside Bangladesh.** This needs an
      explicit legal position before launch.
- [ ] Retention schedule approved.
- [ ] Data subject request workflow tested end to end.
- [ ] Breach notification deadline configured to the statutory period.
- [ ] Vendor register complete with a data-processing agreement each.
- [ ] No third-party analytics, advertising pixel, session replay or external AI
      processing enabled before this review. `AI_PROVIDER=disabled` is the
      default and must stay that way until approved.

---

## 5. Payments — blocking

- [ ] SSLCOMMERZ merchant agreement signed; VAT, settlement, refund and
      chargeback terms understood.
- [ ] Written legal and accounting approval for the money flow, specifically
      whether government fees and partner fees may pass through a BDoor account.
- [ ] Confirmation that BDoor does **not** route foreign share capital.
- [ ] Refund policy consistent between the published page and what the product does.
- [ ] Gateway surcharge either absent or explicitly permitted by the merchant
      agreement and Bangladesh tax review.

---

## 6. Partner model — blocking

- [ ] Partner engagement terms approved.
- [ ] Confirmation that BDoor is not holding itself out as a law firm.
- [ ] Conflict-of-interest process approved.
- [ ] Data-sharing agreement covering documents shared with a partner.
- [ ] Professional indemnity expectations recorded.

---

## 7. Operational readiness — blocking

- [ ] Malware scanning configured. `MALWARE_SCAN_PROVIDER=mock` leaves uploads
      `pending` and never marks a file clean. Do not launch uploads without it.
- [ ] Custom SMTP configured for production auth mail.
- [ ] Backups verified by an actual restore.
- [ ] **Preview and production no longer share a Supabase project.** They do
      today; a preview deployment can reach production data.
- [ ] Monitoring and alerting beyond Vercel defaults.
- [ ] Search Console and Bing submission verified — indexing must be observed,
      not assumed from metadata.

---

## 8. Accessibility — blocking for launch quality

- [ ] WCAG 2.2 AA audit of the core journeys by a human, not only axe.
- [ ] The homepage advisor's custom radio cards reviewed for duplicated radio
      semantics reported in the 28 August 2026 review.
- [ ] Keyboard-only completion of start, login, upload and quote acceptance.
- [ ] Bangla line height and glyph rendering checked at each breakpoint.

---

## Sign-off

No item may be ticked by the person who implemented it alone. Record name, role,
date and the document version reviewed. A tick without a name is not a sign-off.
