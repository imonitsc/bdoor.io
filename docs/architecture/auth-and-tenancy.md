# Auth and tenancy

## Identity

Supabase Auth, email/password, TOTP MFA. Server code uses `auth.getClaims()`, never `auth.getSession()`.

MFA is mandatory for every platform role and both partner organisation roles (`src/lib/permissions/roles.ts`). Step-up (AAL2 on this request) is required for quarantine, KYC decide, partner verify, payment reconcile, quote approve, refund approve, risk write, settings and user manage.

## Two axes

- **Platform roles** — BDoor staff: `case_manager`, `compliance_officer`, `finance`, `admin`, `super_admin`.
- **Organisation memberships** — `customer_owner`, `customer_member`, `partner_owner`, `partner_staff`.

A person may hold both. Screens check **capabilities**, not role names.

Deliberate separations:

- `finance` has no `kyc.decide`, `kyc.read` or `risk.read`.
- plain `admin` has no `kyc.decide` and no `refund.approve`.

## Tenancy

Rows carry `organization_id`. RLS predicates in `app` resolve membership or assignment. Partners see assigned cases only, and documents only while a customer authorisation stands.

Entry URLs (`/login`, and any future `/admin/login` alias) share this identity. Hidden navigation is not access control.

See [ROLES.md](../ROLES.md).
