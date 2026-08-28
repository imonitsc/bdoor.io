# Security

What is enforced, where it is enforced, and what is not built yet. Verified
against the running schema on 28 August 2026.

`CLAUDE.md` states the fourteen security rules as rules. This document explains
the mechanisms behind them and is the place to look when changing one.

---

## Authorization: three layers, every time

A request must fail closed at each layer independently.

1. **Route** — the layout for each protected route group resolves the caller and
   redirects when they may not be there. This is navigation, not authorization.
2. **Server Action / Route Handler** — `requireCapability()` before any mutation.
   Capabilities, not role names: the matrix is `src/lib/permissions/roles.ts`,
   rendered in `docs/ROLES.md`.
3. **Row Level Security** — the database refuses the row regardless of what the
   application believed. Predicates live in the private `app` schema.

UI visibility is never authorization. A hidden button is a usability choice; the
server and the database are what stop the request.

### Why the predicates are `SECURITY DEFINER`

`app.can_read_case()`, `app.is_org_member()`, `app.my_organization_ids()` and
friends read `organization_memberships`. A policy on another table that queried
that table directly would recurse through its own RLS. Each one therefore:

- lives in `app`, which is not in the PostgREST exposed-schema list;
- sets `search_path = ''`, so every reference is schema-qualified and cannot be
  captured by a caller-controlled path;
- takes its subject only from `auth.uid()` — never an argument the caller supplies;
- has `execute` revoked from `public` and `anon`.

`app.canonical_document_path()` and `app.touch_updated_at()` are `SECURITY INVOKER`
because they need no elevation.

---

## Identity

- `auth.getClaims()` server-side, never `auth.getSession()` — the latter trusts
  the cookie without verifying the signature.
- Roles come from `platform_roles` and `organization_memberships`. Never from
  `raw_user_meta_data`: that column belongs to the user and is editable by them.
- MFA is mandatory for every platform role and both partner roles.
- No public sign-up path can create a partner, admin, finance, case-manager or
  compliance role. `organizations_insert_self` only permits `kind = 'customer'`.

### Supabase clients

| Client                       | Use                                                                        | RLS          |
| ---------------------------- | -------------------------------------------------------------------------- | ------------ |
| `src/lib/supabase/server.ts` | Cookie-bound reads in Server Components                                    | on           |
| `src/lib/supabase/proxy.ts`  | Session refresh in `proxy.ts`                                              | on           |
| `src/lib/supabase/public.ts` | Cookie-free catalogue reads, keeps pages static                            | on           |
| `src/lib/supabase/admin.ts`  | `server-only`. Webhooks, anonymous drafts, invitation lookup, `compliance` | **bypassed** |

`admin.ts` is the only bypass and its uses are enumerated. Adding a fifth caller
needs a stated reason.

---

## Tenancy isolation

Enforced by RLS and covered by negative tests in `tests/integration/` — 60 tests
asserting that the _wrong_ actor is refused, not merely that the right one is
allowed:

- Customer A cannot read customer B's organization, case, quote, invoice,
  payment, message or document.
- An unassigned partner cannot see a case. An assigned partner cannot see its
  documents until the customer sets `customer_authorized_at`.
- A forged organization id or storage path grants nothing: storage policies
  re-derive the owning organization from the path with `app.storage_path_org()`
  rather than trusting the uploader.
- `anon` reaches published catalogue and content rows and nothing else.

### The two separations that must not regress

- `finance` has no `kyc.decide`, `kyc.read` or `risk.read`. A finance user must
  not be able to make a compliance decision.
- Plain `admin` has no `kyc.decide` and no `refund.approve`. Only `super_admin` does.

---

## Documents and storage

Six buckets; only `public-marketing` is public and it never holds customer data.

- Paths are server-generated: `org/<org>/case/<case|none>/doc/<doc>/v<n>.<ext>`.
  A client cannot choose one.
- Storage policies validate bucket, membership, case assignment and action —
  the path is evidence, not authorization.
- MIME allow-list is enforced by a database constraint as well as in the
  application: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
- `document_versions` content fields are immutable; deletion raises. A
  replacement is a new version.
- Downloads are short-lived signed URLs issued after an authorization check.
  A signed URL is never persisted in a row.
- Every upload, preview, download, replacement and share is written to
  `document_access_logs`, which is append-only.

**Scanning is not complete.** `MALWARE_SCAN_PROVIDER=mock` leaves uploads in
`pending` and never marks a file clean. Production readiness stays blocked until
a real scanner is configured — see `docs/LEGAL_LAUNCH_CHECKLIST.md`.

---

## Money

- Integer minor units only. `src/features/quotes/money.ts` owns the arithmetic.
- Government and third-party amounts are pass-through, tracked in
  `government_fee_advances` / `government_disbursements`, never mixed into
  BDoor revenue.
- An accepted quote version is frozen by `app.quote_versions_guard()`.
- **A browser return URL never proves payment.** Only a verified server-to-server
  event does. `payment_events` is unique on `(provider, event_id)`, so a replayed
  webhook is a no-op.
- Never trust an amount that did not come from our own calculation.

---

## Logging

`src/lib/audit/` redacts by key shape _and_ value shape before anything is
written. Never logged: passwords, tokens, full identity numbers, document
bodies, payment credentials, signed URLs.

`audit_logs` is append-only — `app.reject_mutation()` raises on UPDATE and
DELETE, and no update policy exists.

---

## Known gaps

Honest list; none of these are implied to be done.

| Gap                                               | Effect                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| No malware scanner                                | Uploads cannot be promoted past `pending` in production                   |
| No Content-Security-Policy or nonce plumbing      | Header hardening incomplete                                               |
| No CAPTCHA/Turnstile                              | Public forms rely on rate limiting alone                                  |
| No field-level encryption                         | `APP_ENCRYPTION_KEY_*` reserved but unused                                |
| Rate limiter is in-process                        | Resets on deploy and is per-instance; needs shared storage                |
| No `idempotency_keys` table                       | Idempotency currently rests on `payment_events` uniqueness alone          |
| Preview and production share one Supabase project | A preview deployment can reach production data — see `docs/DEPLOYMENT.md` |

---

## Reporting

Security issues go to the address in `README.md`, not a public issue. Do not
attach real customer documents to a report.
