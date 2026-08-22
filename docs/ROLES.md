# Roles and permissions

The authoritative matrix is `src/lib/permissions/roles.ts`. This page renders it
so it can be reviewed by someone who is not reading TypeScript, and records the
reasoning behind the separations that look like omissions.

Screens and Server Actions check **capabilities**, never role names. Adding a
screen means adding a capability.

---

## Two independent axes

**Platform roles** (`public.platform_roles`) identify BDoor staff. A user has
zero or more.

| Role                 | In one line                                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| `case_manager`       | Runs cases day to day: creates, transitions, assigns partners, requests documents. |
| `compliance_officer` | Owns KYC and risk. Can decide a KYC outcome and quarantine a document.             |
| `finance`            | Owns quotes, payments, reconciliation and refunds.                                 |
| `admin`              | Everything operational, plus users, services, content, settings and the audit log. |
| `super_admin`        | `admin` plus the two capabilities `admin` is deliberately denied.                  |

**Organisation roles** (`public.organization_memberships`) identify customers
and partners. A user has one per organisation and may belong to several.

| Role              | In one line                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| `customer_owner`  | Runs the customer organisation: creates cases, accepts quotes, invites colleagues. |
| `customer_member` | Works inside a case: reads it, uploads documents, reads quotes.                    |
| `partner_owner`   | Runs a partner firm: accepts assignments, reviews documents.                       |
| `partner_staff`   | Works an assigned case: reads it and uploads.                                      |

The two axes are independent. A BDoor staff member who is also a customer holds
a platform role _and_ a customer membership, and each is evaluated separately.

---

## Platform capability matrix

● = granted.

| Capability                   | case_manager | compliance_officer | finance | admin | super_admin |
| ---------------------------- | :----------: | :----------------: | :-----: | :---: | :---------: |
| `case.read.own`              |      ●       |         ●          |    ●    |   ●   |      ●      |
| `case.create`                |      ●       |                    |         |   ●   |      ●      |
| `case.manage`                |      ●       |         ●          |         |   ●   |      ●      |
| `case.transition`            |      ●       |                    |         |   ●   |      ●      |
| `case.assign_partner`        |      ●       |                    |         |   ●   |      ●      |
| `document.upload`            |      ●       |                    |         |   ●   |      ●      |
| `document.review`            |      ●       |         ●          |         |   ●   |      ●      |
| `document.quarantine`        |              |         ●          |         |   ●   |      ●      |
| `kyc.read`                   |      ●       |         ●          |         |   ●   |      ●      |
| `kyc.decide`                 |              |         ●          |         |       |      ●      |
| `risk.read`                  |              |         ●          |         |   ●   |      ●      |
| `risk.write`                 |              |         ●          |         |       |      ●      |
| `quote.read`                 |      ●       |         ●          |    ●    |   ●   |      ●      |
| `quote.prepare`              |      ●       |                    |    ●    |   ●   |      ●      |
| `quote.approve`              |              |                    |    ●    |   ●   |      ●      |
| `quote.accept`               |              |                    |         |       |             |
| `payment.read`               |      ●       |         ●          |    ●    |   ●   |      ●      |
| `payment.reconcile`          |              |                    |    ●    |   ●   |      ●      |
| `refund.approve`             |              |                    |    ●    |       |      ●      |
| `partner.read_assigned`      |      ●       |                    |         |   ●   |      ●      |
| `partner.respond_assignment` |              |                    |         |       |             |
| `partner.verify`             |              |                    |         |   ●   |      ●      |
| `content.publish`            |              |                    |         |   ●   |      ●      |
| `service.manage`             |              |                    |         |   ●   |      ●      |
| `user.manage`                |              |                    |         |   ●   |      ●      |
| `audit.read`                 |              |                    |         |   ●   |      ●      |
| `settings.manage`            |              |                    |         |   ●   |      ●      |

`quote.accept` and `partner.respond_assignment` are intentionally blank: they
belong to the customer and the partner respectively, not to BDoor.

---

## Organisation capability matrix

| Capability                   | customer_owner | customer_member | partner_owner | partner_staff |
| ---------------------------- | :------------: | :-------------: | :-----------: | :-----------: |
| `case.read.own`              |       ●        |        ●        |               |               |
| `case.create`                |       ●        |                 |               |               |
| `document.upload`            |       ●        |        ●        |       ●       |       ●       |
| `document.review`            |                |                 |       ●       |               |
| `kyc.read`                   |       ●        |                 |               |               |
| `quote.read`                 |       ●        |        ●        |               |               |
| `quote.accept`               |       ●        |                 |               |               |
| `payment.read`               |       ●        |                 |               |               |
| `partner.read_assigned`      |                |                 |       ●       |       ●       |
| `partner.respond_assignment` |                |                 |       ●       |               |

---

## Separations that are deliberate

These look like gaps. They are not; a refactor that "tidies them up" is a
regression.

**`finance` cannot touch KYC or risk.** No `kyc.read`, no `kyc.decide`, no
`risk.read`. Someone who can approve a refund must not also be able to clear the
compliance check that would have blocked the payment.

**`admin` cannot decide a KYC outcome or approve a refund.** Both need
`super_admin`. An administrator can do everything needed to run the platform
without being able to unilaterally clear a sanctions concern or move money back
out.

**Nobody can grant themselves a role.** The write policy on
`public.platform_roles` is `app.is_admin() and user_id <> auth.uid()`. An
administrator can promote a colleague and can never promote themselves.

**A partner cannot verify itself.** `app.partners_guard()` raises unless the
caller holds an admin platform role, and only verified partners appear in the
`verified_partners_public` view.

**A partner sees a case's documents only while the customer's authorisation
stands.** `app.partner_may_see_case_documents()` requires an accepted assignment
_and_ a non-null `customer_authorized_at`. Revoking authorisation takes effect
on the next request, not on the next login.

---

## MFA

TOTP is mandatory before reaching the workspace for:

- every platform role (`MFA_REQUIRED_PLATFORM_ROLES` = all five), and
- `partner_owner` and `partner_staff`.

Customers are encouraged but not required — the enrolment screen lives at
`/[locale]/app/security`.

---

## Adding a capability

1. Add it to the `Capability` union in `src/lib/permissions/roles.ts`.
2. Grant it in `PLATFORM_CAPABILITIES` and/or `ORGANIZATION_CAPABILITIES`.
3. Call `requireCapability('your.capability')` at the top of the Server Action.
4. Add the matching RLS policy. The server check is not the enforcement on its
   own — the database has to reject it too.
5. Add an integration test that a role _without_ the capability is rejected.
6. Update this page.
