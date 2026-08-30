# Admin & Professional Partner Portals — implementation inventory

Maps the 30 Aug 2026 portals specification onto what the repository already
contains, and records what this phase adds. Read alongside `docs/ROLES.md`
and `docs/LAUNCH-CHECKLIST.md`.

## What already exists (reuse, do not duplicate)

| Spec area                    | Existing implementation                                                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organisations & tenancy (§4) | `organizations` (`organization_kind`: customer/partner), `organization_memberships`, `organization_invitations` (hashed single-use tokens), `platform_roles`                                                     |
| Roles & permissions (§5)     | Capability matrix in `src/lib/permissions/roles.ts` mirrored by `permission_catalog` (drift-tested); `requireCapability()`; deliberate separations (finance ∌ kyc.decide, admin ∌ refund.approve)                |
| Auth & MFA (§6)              | Supabase SSR auth; TOTP enforced for all platform roles and both partner roles; step-up (`aal2` on request) for the high-risk capabilities via `permission_catalog.requires_aal2`                                |
| Case model (§9)              | `cases` + `case_status` machine (`case_status_transitions` table drift-tested against `src/features/cases/state-machine.ts`), `case_services`, `case_milestones`, `tasks` (visibility enum), `case_participants` |
| Assignments (§10)            | `case_partner_assignments` (offered/accepted/declined/withdrawn/completed, `conflict_check_confirmed` boolean, `customer_authorized_at/by`)                                                                      |
| Documents (§16)              | `documents` + versions, scan results (quarantine), access logs, retention rules, requests; private storage buckets with RLS (`20260101001100_storage.sql`)                                                       |
| Messaging (§11.9)            | `message_threads`, `messages`, `message_reads` with visibility rules                                                                                                                                             |
| Compliance (§11.10)          | Private `compliance` schema (unexposed, no anon/authenticated grants): screening, risk, decisions, restricted notes; `kyc_cases` for customer-visible status                                                     |
| Finance (§11.11)             | `quotes`/`quote_versions`/`quote_items` (payee split incl. `partner_firm`), `invoices`, `payments`, `refunds`, `receipts`; money as integer minor units in `src/features/quotes/money.ts`                        |
| Audit (§19)                  | `audit_logs` append-only (`app.reject_mutation()`), redacting logger in `src/lib/audit/`                                                                                                                         |
| Portals (§11/§12)            | 18 `/admin/*` pages and 9 `/partner/*` pages behind role-gated layouts, noindex, absent from sitemap                                                                                                             |
| RLS tests (§15/§23)          | Real-Postgres integration suite (`tests/integration/*`) with per-JWT identities incl. partner owner/staff, suspended member, cross-tenant denial                                                                 |
| Feature gating (§20)         | Server-only env gates in `src/lib/launch/gates.ts`; payments/KYC/identity uploads force-closed while legal content is draft                                                                                      |

## Gaps this phase implements

1. **Provider application journey (§7)** — the public partner page's
   "Register interest" routed to the generic contact form. Added:
   `provider_applications` table (service-role writes only, staff reads,
   validated status machine), a multi-step save-and-resume `/partners/apply`
   flow in en+bn, and an admin review queue at `/admin/partners/applications`
   with request-information, approve (creates the partner organisation,
   partner record, capability rows and the single-use owner invitation) and
   reject actions behind `partner.verify` (step-up).
2. **Firm categories & jurisdictions (§4/§8)** — `partners.practice_type`
   widened to the specification's category list; `partner_capabilities`
   gains `country_code` so approval is per jurisdiction+service, never
   inferred.
3. **Structured conflict check + disclosure + consent (§10)** —
   `case_partner_assignments` gains `conflict_check_result`
   (none_identified / potential_conflict / conflict_declined /
   insufficient_information, recorded by the partner), and
   `disclosed_at/by` (recorded by staff before consent). Partner document
   access now additionally requires a clean recorded conflict result; the
   pre-consent view stays limited to the assignment's scope note.
4. **Gates (§20)** — `PROVIDER_APPLICATIONS_STATUS` server gate, default
   `disabled` in production until owner approval; the apply flow renders an
   enquiry fallback and rejects server actions while disabled.

## Deliberately deferred (later phases, per spec §24)

- Provider estimates, provider invoices, payout accounts and payout change
  workflow (Phase 5) — schema hooks exist (`payee_type='partner_firm'`),
  gates default off.
- Assignment staff-level allocation, availability/capacity calendars,
  provider performance snapshots (Phase 3+/§12.8).
- Credential document uploads in the application itself — blocked behind
  the sensitive-uploads gate; the application records credential facts and
  evidence is collected through the existing document-request workflow after
  approval.
- Customer-workspace consent UI beyond the existing authorisation action.

Nothing in this phase weakens an existing policy; the one tightened policy
(partner document access requires a clean conflict result) is covered by
updated integration tests.
