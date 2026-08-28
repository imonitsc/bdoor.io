# Admin and partner backend — build report

**Date:** 28 August 2026
**Branch:** `claude/deployment-status-check-ucci3m`
**Scope:** Phase 1 of the 28 August 2026 backend, admin panel and partner
portal brief — identity and authorisation.

This report states what was actually run and what was actually verified.
Anything not verified is marked as not verified. Nothing in this branch has been
applied to the production Supabase project.

---

## What the brief asked for versus what already existed

Discovery first, as the brief requires. A great deal was already built:
`organization_invitations` with RLS, an acceptance route, TOTP enrolment,
`platform_roles` and `organization_memberships`, a capability matrix in
`src/lib/permissions/roles.ts`, and 76 tables with RLS on all of them.

So this phase did not rebuild any of that. It closed the gaps, and found three
defects in the existing code on the way.

---

## Defects found in shipped code

These were not part of the plan. They were found while building against the
existing code and are the most important things in this report.

### 1. The MFA gate admitted accounts with no second factor

`getSession()` computed:

```ts
mfaSatisfied: aal?.currentLevel === 'aal2' || aal?.nextLevel !== 'aal2';
```

`currentLevel` is the assurance level of the token in hand. `nextLevel`
describes the account — auth-js raises it to `aal2` as soon as one verified
factor exists and leaves it at `aal1` when none does. Only `currentLevel` is
evidence.

So `nextLevel !== 'aal2'` was true exactly when nothing was enrolled:

| Account state                      | Result           |
| ---------------------------------- | ---------------- |
| Factor enrolled, not yet presented | blocked, correct |
| **No factor at all**               | **admitted**     |

A staff account that had never enrolled reached `/admin` with no second factor.
Confirmed against `GoTrueClient._getAuthenticatorAssuranceLevel` in the
installed auth-js, which filters `session.user.factors` to `status ===
'verified'` before raising `nextLevel`.

### 2. Enrolled staff were locked out

`challengeMfa()` existed and had no caller anywhere. A staff account that _had_
enrolled TOTP sat at `aal1` on a fresh session, was redirected to
`/app/security`, and that page renders "Enabled — required for your role" with
no code input. There was nowhere in the product to type the six digits.

Taken together, 1 and 2 mean the control was inverted in both directions: it
admitted the accounts with no second factor and refused the accounts that had
one.

### 3. Accepting a quote silently did nothing

`acceptQuote()` ended with an unchecked update setting `status = 'accepted'`.
The customer matched no permissive write policy on `quote_versions`, so RLS
filtered the update to zero rows; PostgREST reports that as success. The
`engagement_acceptances` row and audit entry were written, so the record of
acceptance was correct, but the version stayed `sent` with a null `accepted_at`
while the customer was told it had been accepted.

Reproduced directly:

```
update public.quote_versions set status = 'accepted' ... -- UPDATE 0
```

---

## What was built

| Migration                                 | Contents                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `20260101001300_authorization_core.sql`   | `permission_catalog`, `role_templates`, `role_template_permissions`, `role_assignments`, `membership_permission_overrides`; `app.current_aal()`, `app.platform_permissions()`, `app.has_permission()` and companions; RLS on all five; 27 permissions, 18 templates, 114 bundle rows |
| `20260101001400_platform_invitations.sql` | `platform_invitations` with the no-escalation rule `app.may_invite_template()`                                                                                                                                                                                                       |
| `20260101001500_step_up_policies.sql`     | Restrictive policies requiring `aal2` for the sensitive writes                                                                                                                                                                                                                       |
| `20260101001600_quote_acceptance.sql`     | The customer acceptance policy and its narrowing trigger                                                                                                                                                                                                                             |

The existing `platform_roles` and `organization_memberships` tables and their
enums are untouched. Templates are keyed by text, so the roles the brief adds
need no enum surgery, and `app.has_permission()` reads both models — a legacy
enum row and a scoped assignment grant identically.

### The no-escalation rule

`app.may_invite_template()` refuses if the invited role holds any permission the
caller does not hold themselves. Naming which roles may invite which would drift
the moment a bundle changes; comparing the permission sets cannot.

- `super_admin` may invite anything.
- `admin` may invite `admin`, `case_manager`, `operations_manager`, `support`,
  `content_editor`, `legal_policy_publisher`, `auditor`.
- `admin` may **not** invite `compliance_officer` (`kyc.decide`, `risk.write`)
  or `finance` (`refund.approve`).

Those are precisely the permissions plain `admin` is denied, and inviting a
second account that holds them was the way around the denial. The rule applies
on update too, or the insert gate could be reached past afterwards.

It does not, and cannot, stop a `super_admin` creating another `super_admin`.

### Step-up

`requires_aal2` is enforced in two places, as the repository requires:
`requireCapability()` refuses at the action, and restrictive RLS policies refuse
at the database. Restrictive is the only policy kind that can add a condition to
rules already written, so nothing existing was rewritten.

`quote.approve` was added to the step-up set during this work. A shape-based
test — every capability ending in decide/approve/reconcile/quarantine/verify
must be marked — flagged it, and the argument held: approving a quote sets the
amount a customer is asked to pay.

---

## Test results

Executed in this session, not assumed:

| Check                                          | Result                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm run format:check` / `lint` / `typecheck` | pass                                                                             |
| Unit                                           | **137 passed**                                                                   |
| Integration / RLS                              | **151 passed**, stable across repeated runs against a database rebuilt from zero |
| `pnpm run build`                               | pass                                                                             |
| Playwright including axe                       | **82 passed**                                                                    |
| CI                                             | green on every pushed head through `90a46e2`                                     |

Every guard added in this phase was checked for vacuous passing by breaking the
thing it guards:

| Guard                           | How it was falsified                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Catalogue drift                 | Deleted a bundle row, cleared a `requires_mfa` flag, added an ungranted key — 7 failures |
| No-escalation rule              | Weakened `may_invite_template()` to a bare `is_admin()` — 4 failures                     |
| MFA step                        | Restored the shipped expression — 4 of 8 failures                                        |
| Step-up code/database agreement | Cleared `requires_aal2` for `kyc.decide` — 2 failures                                    |
| Generated types                 | Added a column and a table to the database — 2 failures                                  |
| Quote acceptance                | Dropped the new policy — 4 failures                                                      |

---

## Deliberate deviations from the brief

Each of these is a decision, not an omission.

1. **`scripts/invite-initial-super-admin.mjs`, not `.ts`.** The repository has
   no TypeScript runner, and adding one to satisfy a file extension is a worse
   trade than matching the existing `scripts/seed-auth-users.mjs`.
2. **No separate `/admin/login` and `/partner/login`.** The shared `/login`
   already takes a validated `next` parameter and both workspace layouts
   redirect through it. Separate routes would duplicate the form and the rate
   limiting for a cosmetic difference. Not built; recorded rather than hidden.
3. **No separate `/partner/accept-invite`.** `organization_invitations` covers
   partner firms and `/app/invitations/[token]` accepts for both.
4. **No `/auth/mfa/enroll`.** `/app/security` is the enrolment surface and is
   reachable by a staff-only account, which is what the redirect depends on.
5. **`/auth/session-management` not built as a route.** `signOutOtherSessions()`
   exists and is wired into the security pages for both customer and partner.
   Per-session listing and selective revocation are not built.

## Not built

- **`/auth/select-workspace`.** Only matters for a person holding both a
  platform role and a partner membership. The layouts route correctly today.
- **`/auth/access-denied`.** `AuthorizationError` and the new
  `StepUpRequiredError` are thrown but there is no dedicated page rendering
  them, so a refusal surfaces as the generic error boundary.
- **Phases 2 to 6** of the brief: partner verification workflow, assignments and
  `data_sharing_grants`, admin operations screens, firm-specific work, and the
  hardening pass.

## Known gaps, stated plainly

- **RLS step-up does not cover `quote_versions` or `documents`.**
  `quote.approve` and `document.quarantine` are enforced in the Server Action
  only. Both tables mix a step-up operation with a non-step-up one on the same
  command — a customer accepting a quote, a partner reviewing a document — so a
  command-level policy would refuse legitimate work. Closing this needs a
  column-aware or status-aware predicate. Written into
  `20260101001500_step_up_policies.sql` so the omission is visible where the
  policies are.
- **`src/types/database.ts` was extended without the generator.**
  `pnpm run db:types` needs Docker, which was not available. The blocks were
  generated from `information_schema` against the live schema, and
  `tests/integration/database-types.test.ts` now compares the committed types to
  the real schema column by column. Re-run the generator when an environment
  allows, to confirm no formatting drift.
- **The bootstrap script's Supabase Admin API calls are unexercised.** There is
  no local PostgREST or GoTrue here. The argument and environment guards were
  run, and all three writes it performs were executed as `service_role` against
  the local database. The API calls between them were not.
- **Preview and production still share one Supabase project.** Unchanged from
  the previous report and still the highest-priority infrastructure fix: a
  preview deployment can reach production data.

## Before this is deployed

Once the MFA fix ships, **any internal or partner account without TOTP enrolled
is routed to enrolment before it can reach its workspace**, and any account that
has enrolled is asked for a code. That is the intended control and it now has
both exits, but it is a live behavioural change. If the production
administrator account has no factor enrolled, its next visit lands on the
enrolment page.

There is no `super_admin` on the production database. The first one has to be
created with `scripts/invite-initial-super-admin.mjs`, against an account that
has already signed up and confirmed its address.
