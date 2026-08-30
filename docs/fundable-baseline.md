# Fundable-startup baseline — Phase 0 audit

**Date:** 30 August 2026 · **Branch:** `feat/fundable-bdoor-core`
**Brief:** `docs/BDoor_Claude_Code_Fundable_Startup_Master_Instruction_2026-08-30.md`

What exists, what works, what the master instruction still needs, and how the
brief's required state machines map onto the schema that is already live. The
brief's phases are implemented against this map, not against a rewrite.

---

## 1 · What already works (verified on `claude/new-session-0n73z6` @ `4ba2207`)

| Brief section | Existing implementation |
| --- | --- |
| §6.1 Homepage | Bangladesh-first, ≤6 sections, single `Start now` CTA (BD-first redesign, PR #32/#36). |
| §6.2 Start journey | `/start` branching flow: scope → BD new/existing or country-first international; URL params beat stale drafts; non-blocking saves; draft reference + anonymous recovery via hashed-key cookie; submits real `applications` rows (PRs #30/#32/#36). |
| §6.2.9 Real submissions | `public.applications` (service-role-only writes, random references) + staff ops queue under `/admin/applications`. |
| §7.1 Package catalogue | `service_packages` / `package_versions` / `package_fee_components` / `international_offers` — versioned, admin-editable, seeded with the approved baseline prices. Components render pricing from the catalogue, not hardcoded copy. |
| §7.3 Fee separation | `quote_items.payee` (`bdoor` / `government_authority` / `partner_firm` / `third_party`), `bdoor_revenue_minor` vs `pass_through_minor` on quote versions, `government_fee_advances` + disbursement/refund ledger. Share capital never routes through bdoor. |
| §8 Quotes | `quotes` + `quote_versions` (immutable once accepted, DB trigger) + snapshot `quote_items` with tax treatment, estimates flagged, discount sign rules. Acceptance records exact version + policy version + locale + IP hash in append-only `engagement_acceptances`. |
| §8 Payments | `payments` (+ unique provider ref), append-only `payment_events` idempotent on `(provider, event_id)`, HMAC-verified webhook, amounts always computed server-side, refunds ledger, receipts. Mock provider default; launch-gated (`paymentsStatus()`, `bangladeshCheckoutStatus()` fail closed). |
| §9 (partial) | `compliance_obligations` (never auto-created from a guess), `compliance_reminders`, `renewal_cases`. No rules catalogue yet (Phase 3). |
| §11 Providers | Provider applications + verification queue + assignment §10 chain (conflict → disclosure → consent → document access) with DB-enforced state machines and column guards (PR #37). |
| §12 Admin | Role-based admin: applications, leads, cases, KYC, compliance, finance, partners, pricing, services, content, users, audit, settings. Capability matrix (`roles.ts` ↔ `permission_catalog`, drift-tested), step-up (AAL2) on sensitive capabilities, MFA mandatory for staff + partners. |
| §17 Legal gates | 10 policies live as marked drafts (0.9.1); launch gates keep payment/KYC/provider-applications closed independent of page visibility. |
| §19 Security | RLS on every exposed table; `SECURITY DEFINER` confined to `app.*` with empty search_path; append-only audit; redacting logger; private storage + signed URLs. Integration suite exercises wrong-actor rejection per policy. |
| §20 Architecture | Next.js 16 App Router / React 19 / TS strict / next-intl (en+bn) / Tailwind 4, server-first with focused client components. |

CI status at baseline: green (run 143 on the merge of PR #37; CodeQL green).
No production-blocking workflow defects found, so Phase 0's "fix failing CI"
item is a no-op at this baseline.

## 2 · Gaps this branch closes (Phase 0 + Phase 1)

1. **No analytics events.** Nothing records the brief's §22 taxonomy; funnel
   metrics cannot be computed. → `analytics_events` (server-side, idempotent,
   attribution fields, `is_test` exclusion) + `src/lib/analytics/` recorder +
   instrumentation of the commercial milestones that exist today.
2. **No recurring-revenue records.** No plans/subscriptions/service periods, so
   MRR/ARR are uncomputable. → `subscription_plans` / `subscriptions` /
   `subscription_periods` with a DB-enforced rule that a subscription cannot be
   `active` without a verified payment or a recorded authorised offline payment.
   No customer-facing billing UI yet (Phase 3); records + staff visibility only.
3. **No metric definitions or snapshots.** → `metric_definitions` (versioned
   formulas from §13.3), `metric_snapshots` (append-only monthly records),
   `src/features/metrics/` pure calculation functions (unit-tested), admin
   metrics dashboard behind a new `metrics.read` capability.
4. **State-machine deltas** (§8): `payment_status` gains `processing` and
   `disputed`; `quote_status` gains `rejected`; `quote_versions` gains
   `viewed_at` and FX stamp columns (`fx_source`, `fx_rate`, `fx_quoted_at`)
   for when a converted amount is displayed.
5. **No event taxonomy / metric definition docs.** → `docs/EVENT_TAXONOMY.md`,
   `docs/METRIC_DEFINITIONS.md`.

## 3 · Spec-state → schema mapping (documented, not renamed)

The brief names states; the live schema already encodes equivalent machines.
Renaming enum values would churn every policy, test and UI for zero behaviour,
so the mapping is recorded here instead:

| Brief (§8 quotes) | Implementation |
| --- | --- |
| `draft` | `quote_status 'draft'` |
| `internal_review` | `'internal_review'` |
| `issued` | `'sent'` + `quote_versions.sent_at` |
| `viewed` | `quote_versions.viewed_at` (timestamp, not a status — a viewed quote is still an issued quote) |
| `accepted` | `'accepted'` + immutability trigger |
| `expired` | `'expired'` (+ server-side `quoteIsExpired()` re-check on accept) |
| `superseded` | `'superseded'` + `superseded_at` |
| `rejected` | `'rejected'` (new value; `'withdrawn'` remains for issuer withdrawal) |

| Brief (§8 payments) | Implementation |
| --- | --- |
| `not_requested` | absence of a `payments` row for the invoice |
| `pending` | `payment_status 'pending'` |
| `processing` | `'processing'` (new value) |
| `paid` | `'paid'` |
| `partially_refunded` / `refunded` | unchanged |
| `failed` / `cancelled` | unchanged |
| `disputed` | `'disputed'` (new value) |

§12's role list maps onto the existing five platform roles + capability matrix;
new capabilities (`metrics.read`, `metrics.snapshot`) follow the established
pattern rather than adding parallel role systems. §11.3's assignment states are
already partially live (`offered/accepted/declined/withdrawn/completed` + the
conflict/disclosure/consent chain); the remaining states are Phase 4 work.

## 4 · Known defects at baseline

- None open from the hotfix round (PR #36 verified in production).
- Production Supabase is still missing migrations `20260101001300` onward —
  owner action; every merged surface degrades gracefully without them, but
  nothing new in this branch is operable in production until the owner applies
  the migration series.
- The three owner-supplied images are still absent (slots hide; tracked in
  `docs/LAUNCH-CHECKLIST.md` §3).

## 5 · Deferred to later phases (per brief §24)

- **Phase 2** Ask bdoor AI — a complete implementation exists on
  `feat/ask-bdoor-ai` (delivered by the owner as `ask-bdoor-ai.bundle` on the
  production branch); it is reviewed and shipped as its own PR, not merged
  into this branch.
- **Phase 3** compliance rules catalogue, company calendars, reminders,
  renewal quotes, customer-facing subscription lifecycle.
- **Phase 4** provider estimates/payouts, staff-level allocation, capacity,
  performance events, full assignment-state extension.
- **Phase 5** cohort/retention reporting, data-room checklist, exports.
- **Phase 6** per-country activation controls beyond the existing
  `international_offers` availability ladder.
