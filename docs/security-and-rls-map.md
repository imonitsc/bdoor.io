# Security and RLS map

Where each class of data lives, who can reach it, and which mechanism
enforces that. Detail lives in `docs/SECURITY.md` and the migrations; this
is the one-page map, updated for the application flow (29 Aug 2026).

## Clients

| Client                     | Module                       | RLS | Used for                                                                                               |
| -------------------------- | ---------------------------- | --- | ------------------------------------------------------------------------------------------------------ |
| cookie-bound server client | `src/lib/supabase/server.ts` | on  | signed-in reads/writes, admin pages (staff policies)                                                   |
| public client              | `src/lib/supabase/public.ts` | on  | anonymous catalogue reads (static rendering)                                                           |
| service-role admin client  | `src/lib/supabase/admin.ts`  | off | webhooks, anonymous questionnaire drafts, **application submissions**, invitation lookup, `compliance` |

`auth.getClaims()` everywhere server-side; `getSession()` is banned. Roles
live in `platform_roles`/`organization_memberships`, never in user
metadata. Capabilities (`src/lib/permissions/roles.ts`) gate every screen
and Server Action; RLS enforces the same decision in the database.

## Application-flow surfaces (new)

| Surface                           | Enforcement                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/start` submission               | shared Zod validation; rate limits `questionnaire.save` (120/h) and `application.submit` (5/h) keyed by hashed IP              |
| `public.applications`             | RLS on; **no** anon/authenticated write policy at all; staff-only select via `app.is_platform_staff()`; service-role inserts   |
| application reference             | random `BD-<year>-<6 digits>` — not guessable, leaks no volume; unique index + retry on collision                              |
| `?country=/?objective=/?package=` | validated against the question model / commercial catalog server-side; unknown values dropped, never echoed                    |
| acknowledgement email             | adapter in `src/lib/email/` (mock default, no invented credentials); logs redact via `src/lib/audit/redact.ts`                 |
| `/admin/applications`             | `requireCapability('case.manage')` + MFA-gated admin layout + the staff-only RLS policy doing the real authorisation           |
| degraded modes                    | no service role → flow stays walkable, nothing stored, page says so; table missing → `contact_requests` fallback, error logged |

## Standing invariants (unchanged)

- No identity document, banking detail or payment credential is collected
  at application time; storage buckets stay private; documents serve only
  through short-lived signed URLs after an authorisation check, at paths
  from `app.canonical_document_path()`.
- `compliance` schema unexposed, no anon/authenticated grants.
- Audit logs and case history are append-only (`app.reject_mutation()`).
- `SECURITY DEFINER` only in `app` schema with `search_path = ''`.
- No secret carries a `NEXT_PUBLIC_` prefix; webhooks verify HMACs and are
  idempotent by provider event id.
- `finance` holds no `kyc.decide`/`kyc.read`/`risk.read`; plain `admin`
  holds no `kyc.decide`/`refund.approve`.
