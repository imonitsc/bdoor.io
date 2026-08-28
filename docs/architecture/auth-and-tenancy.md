# Auth and tenancy

## Identity

- Supabase Auth email/password with confirmation via `/api/auth/confirm`
- Server-side session: `auth.getClaims()` — never trust `getSession()` for authorisation
- TOTP MFA enrol + challenge; AAL2 mandatory for all platform roles and partner roles
- Step-up authentication for sensitive capabilities (exports, refunds, role changes)

## Two role axes

1. **Platform roles** (`platform_roles`): case_manager, compliance_officer, finance, admin, super_admin
2. **Organisation roles** (`organization_memberships`): customer_owner/member, partner_owner/staff

Screens and actions check **capabilities** (`src/lib/permissions/roles.ts`), not role names alone.

Deliberate separations:

- `finance` has no `kyc.decide` / `kyc.read` / `risk.read`
- plain `admin` has no `kyc.decide` and no `refund.approve`

## Tenancy

- Customers see only their organisation’s companies, cases, documents
- Partners see only assigned cases and consented documents
- Staff access is capability-scoped; UI visibility is never sufficient
- Roles never come from editable `user_metadata`

## Entry routes

Same identity foundation; different experiences: `/[locale]/login`, staff invite acceptance, partner org membership. Hidden nav is not access control.
