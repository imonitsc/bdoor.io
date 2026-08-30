# Data retention and privacy

What BDoor stores, for how long, and how a person exercises their rights over
it.

> **This document records the design, not settled legal advice.** The retention
> periods below are placeholders chosen to be plausible, and each one is flagged
> in `public.document_retention_rules.legal_basis` as requiring confirmation. A
> qualified Bangladesh adviser (and a chartered accountant, for the financial
> records) must confirm the actual statutory periods before launch. See
> [LAUNCH-CHECKLIST.md](./LAUNCH-CHECKLIST.md).

---

## Principles the schema enforces

**Minimise at the point of capture.** Identity numbers are not stored in full.
`public.identity_records` holds `identifier_last4` for display and
`identifier_token` for matching — never the whole passport or NID number. The
document image itself lives in a private bucket; the number does not live in a
column.

**Separate what a customer may see from what compliance records.** A customer
sees `public.kyc_cases.status`. Screening matches, risk flags, risk assessments,
compliance decisions and restricted case notes live in the private `compliance`
schema, which is not in the PostgREST exposed-schema list and has no grants to
`anon` or `authenticated`.

**Make the trail immutable.** `public.audit_logs` and
`public.case_status_history` are append-only: an `app.reject_mutation()` trigger
rejects update and delete. Document versions are immutable too — a trigger
raises rather than allowing an edit, so a superseded version stays auditable.

**Log the access, not the content.** `public.document_access_logs` records who
opened which version, when, and from which organisation. It does not record the
document body. `src/lib/audit/redact.ts` redacts by key shape and by value shape
before anything reaches a log line, so a password, token, full identity number,
document body or payment credential cannot get there by accident.

**Hash rather than store, where a hash is enough.** Consent records and
questionnaire draft sessions store `ip_hash` and `user_agent_hash`, never the
raw address or header. An anonymous questionnaire draft is keyed by an httpOnly
cookie whose SHA-256 is what the database holds.

---

## Retention categories

Set on `public.documents.retention_category`, with the rule in
`public.document_retention_rules`. `retain_until` on the document is the
computed date; `deletion_eligible_at` is when it may actually be purged.

| Category           | Years | Early deletion  | Applies to                                                                                               |
| ------------------ | :---: | :-------------: | -------------------------------------------------------------------------------------------------------- |
| `standard`         |   6   |     allowed     | Ordinary case documents. Retained while the relationship is active plus a contractual limitation period. |
| `aml_record`       |   5   | **not allowed** | Customer due-diligence records. Statutory retention runs from the end of the relationship.               |
| `financial_record` |   6   | **not allowed** | Invoices, receipts, payment and refund evidence.                                                         |
| `transient`        |   0   |     allowed     | Working copies with no retention requirement; deletable once superseded.                                 |

The two "not allowed" categories are what a deletion request cannot reach; see
below.

---

## Data subject requests

`public.data_subject_requests` records the request and its outcome.

| Type          | What BDoor does                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `export`      | Assembles the requester's own profile, organisations, cases, documents, quotes, payments and messages.              |
| `correction`  | Amends the record and keeps the prior value in the audit trail.                                                     |
| `deletion`    | Deletes what is deletable; refuses or partially completes where a statutory retention or a live legal hold applies. |
| `restriction` | Suspends processing beyond what retention requires.                                                                 |

Statuses: `received` → `in_progress` → one of `completed`,
`partially_completed`, `refused`, `on_legal_hold`. A request that cannot be
completed in full is recorded as `partially_completed` with the reason in
`legal_hold_reason` — never silently closed as done.

**A deletion request does not erase an AML record or a financial record.** Those
categories set `allows_early_deletion = false` because the retention obligation
outlives the customer relationship. The requester is told this, in the response
and on the request record, rather than being led to believe the data is gone.

---

## What is kept, and roughly for how long

| Data                                | Where                                       | Retention                                                                           |
| ----------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Profile, organisation membership    | `profiles`, `organization_memberships`      | While the account exists                                                            |
| Case record and status history      | `cases`, `case_status_history`              | Life of the case plus the standard period; history is append-only                   |
| Case documents                      | Storage + `documents`                       | Per retention category above                                                        |
| Identity documents                  | `identity-documents` bucket                 | `aml_record`                                                                        |
| Screening and risk detail           | `compliance` schema                         | `aml_record`; never customer-visible                                                |
| Quotes, payments, receipts, refunds | `quotes`, `payments`, `receipts`, `refunds` | `financial_record`                                                                  |
| Messages and attachments            | `messages`, `message-attachments` bucket    | Standard                                                                            |
| Audit log                           | `audit_logs`                                | Append-only; retained for the longest applicable period                             |
| Document access log                 | `document_access_logs`                      | Same as the audit log                                                               |
| Consent records                     | `consent_records`                           | For as long as the consent may need to be evidenced                                 |
| Anonymous questionnaire drafts      | `questionnaire_sessions`                    | Short-lived; keyed by a cookie hash, discarded when the draft is claimed or expires |
| Contact form submissions            | `contact_requests`                          | Until handled plus a short window                                                   |
| Marketing assets                    | `public-marketing` bucket                   | Indefinite; contains no personal data                                               |

---

## Storage access

No private object is ever served from a permanent URL. A download goes:

1. Server Action checks the capability and the case relationship.
2. `document_access_logs` records the access.
3. A short-lived signed URL is generated server-side and handed to the browser.

Paths are generated by `app.canonical_document_path()`. A client never supplies
a storage path, so it cannot address an object outside its own organisation's
namespace, and the storage policies derive the organisation from path segment 2
rather than trusting the request.

---

## Cross-border processing

BDoor's own storage is wherever the Supabase project is provisioned — a decision
that has to be made deliberately and stated in the privacy policy. Every
adapter that would send data outside that boundary is off by default:

- `SCREENING_PROVIDER=mock` contacts no sanctions or PEP list.
- `EMAIL_PROVIDER=mock` sends nothing.
- `AI_PROVIDER=disabled`, and if enabled, `prepareForModel()` minimises and
  redacts first. Raw passports, NIDs, bank documents, signatures and unrelated
  case documents are never sent to a model.

Turning any of these on is a privacy decision, not just a configuration change,
and the privacy policy has to be updated to name the processor.

---

## Open questions for counsel

1. The exact statutory retention period for customer due-diligence records under
   Bangladesh AML rules, and when the clock starts.
2. The retention period for accounting records, confirmed by a chartered
   accountant.
3. Whether the platform's processing requires any registration or notification.
4. The lawful basis stated for each processing purpose in the privacy policy.
5. Where the Supabase project may be hosted, and what has to be disclosed about
   cross-border transfer.

---

## Ask bdoor AI conversations

Conversations with the public assistant are not case records and are not held to
the categories above. They are retained for **90 days** from creation
(`LIMITS.retentionDays`, stamped onto `ai_conversations.delete_after` at
creation) and swept nightly by `/api/ai/retention`.

| What                                             |      Retention      |              Deletable early               |
| ------------------------------------------------ | :-----------------: | :----------------------------------------: |
| `ai_conversations`, `ai_messages`, `ai_feedback` |       90 days       | yes — by the customer, from the chat panel |
| `ai_usage`                                       |        kept         |                     no                     |
| `ai_unanswered_questions`                        | kept until resolved |                     —                      |

`ai_usage` survives deletion deliberately: it references the conversation with
`on delete set null`, so removing a transcript removes what was said without
erasing the record that money was spent. The monthly budget check sums this
table, and a ledger that shrinks when customers exercise deletion is a ledger
that under-reports spend.

Everything written to `ai_messages` and `ai_unanswered_questions` has passed
through `src/features/ai/redaction.ts` first, so what is retained is questions
rather than identifiers. Nothing logs message text at all.
