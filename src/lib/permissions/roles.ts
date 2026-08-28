import type { Enums } from '@/types/database';

export type PlatformRole = Enums<'platform_role'>;
export type OrganizationRole = Enums<'organization_role'>;

export const PLATFORM_ROLES: readonly PlatformRole[] = [
  'case_manager',
  'compliance_officer',
  'finance',
  'admin',
  'super_admin',
] as const;

export const ORGANIZATION_ROLES: readonly OrganizationRole[] = [
  'customer_owner',
  'customer_member',
  'partner_owner',
  'partner_staff',
] as const;

/**
 * Every capability the application checks. Adding a screen means adding a
 * capability here, not sprinkling role names through components.
 *
 * This is an array rather than a bare union so the set exists at runtime:
 * `public.permission_catalog` seeds the same 27 keys, and
 * `tests/integration/authorization-core.test.ts` fails if the two drift — the
 * same guard `case_status_transitions` has against the case state machine. The
 * `Capability` type is derived from it, so the list cannot fall behind the type.
 */
export const ALL_CAPABILITIES = [
  'case.read.own',
  'case.create',
  'case.manage',
  'case.transition',
  'case.assign_partner',
  'document.upload',
  'document.review',
  'document.quarantine',
  'kyc.read',
  'kyc.decide',
  'risk.read',
  'risk.write',
  'quote.read',
  'quote.prepare',
  'quote.approve',
  'quote.accept',
  'payment.read',
  'payment.reconcile',
  'refund.approve',
  'partner.read_assigned',
  'partner.respond_assignment',
  'partner.verify',
  'content.publish',
  'service.manage',
  'user.manage',
  'audit.read',
  'settings.manage',
] as const;

export type Capability = (typeof ALL_CAPABILITIES)[number];

const PLATFORM_CAPABILITIES: Record<PlatformRole, readonly Capability[]> = {
  case_manager: [
    'case.read.own',
    'case.create',
    'case.manage',
    'case.transition',
    'case.assign_partner',
    'document.upload',
    'document.review',
    'kyc.read',
    'quote.read',
    'quote.prepare',
    'payment.read',
    'partner.read_assigned',
  ],
  compliance_officer: [
    'case.read.own',
    'case.manage',
    'document.review',
    'document.quarantine',
    'kyc.read',
    'kyc.decide',
    'risk.read',
    'risk.write',
    'quote.read',
    'payment.read',
  ],
  // Finance deliberately has no KYC or risk capability: a finance user must not
  // be able to make a compliance decision.
  finance: [
    'case.read.own',
    'quote.read',
    'quote.prepare',
    'quote.approve',
    'payment.read',
    'payment.reconcile',
    'refund.approve',
  ],
  admin: [
    'case.read.own',
    'case.create',
    'case.manage',
    'case.transition',
    'case.assign_partner',
    'document.upload',
    'document.review',
    'document.quarantine',
    'kyc.read',
    'risk.read',
    'quote.read',
    'quote.prepare',
    'quote.approve',
    'payment.read',
    'payment.reconcile',
    'partner.read_assigned',
    'partner.verify',
    'content.publish',
    'service.manage',
    'user.manage',
    'audit.read',
    'settings.manage',
  ],
  // super_admin adds the two capabilities admin is deliberately denied.
  super_admin: [
    'case.read.own',
    'case.create',
    'case.manage',
    'case.transition',
    'case.assign_partner',
    'document.upload',
    'document.review',
    'document.quarantine',
    'kyc.read',
    'kyc.decide',
    'risk.read',
    'risk.write',
    'quote.read',
    'quote.prepare',
    'quote.approve',
    'payment.read',
    'payment.reconcile',
    'refund.approve',
    'partner.read_assigned',
    'partner.verify',
    'content.publish',
    'service.manage',
    'user.manage',
    'audit.read',
    'settings.manage',
  ],
};

const ORGANIZATION_CAPABILITIES: Record<OrganizationRole, readonly Capability[]> = {
  customer_owner: [
    'case.read.own',
    'case.create',
    'document.upload',
    'kyc.read',
    'quote.read',
    'quote.accept',
    'payment.read',
  ],
  customer_member: ['case.read.own', 'document.upload', 'quote.read'],
  partner_owner: [
    'partner.read_assigned',
    'partner.respond_assignment',
    'document.upload',
    'document.review',
  ],
  partner_staff: ['partner.read_assigned', 'document.upload'],
};

/** Roles that must have MFA before they can use the workspace. */
export const MFA_REQUIRED_PLATFORM_ROLES: readonly PlatformRole[] = PLATFORM_ROLES;
export const MFA_REQUIRED_ORGANIZATION_ROLES: readonly OrganizationRole[] = [
  'partner_owner',
  'partner_staff',
];

export function platformCapabilities(roles: readonly PlatformRole[]): Set<Capability> {
  const set = new Set<Capability>();
  for (const role of roles) {
    for (const cap of PLATFORM_CAPABILITIES[role]) set.add(cap);
  }
  return set;
}

export function organizationCapabilities(roles: readonly OrganizationRole[]): Set<Capability> {
  const set = new Set<Capability>();
  for (const role of roles) {
    for (const cap of ORGANIZATION_CAPABILITIES[role]) set.add(cap);
  }
  return set;
}

export function isStaffRole(role: string): role is PlatformRole {
  return (PLATFORM_ROLES as readonly string[]).includes(role);
}

export function isPartnerRole(role: OrganizationRole): boolean {
  return role === 'partner_owner' || role === 'partner_staff';
}

export function isCustomerRole(role: OrganizationRole): boolean {
  return role === 'customer_owner' || role === 'customer_member';
}

export function requiresMfa(
  platformRoles: readonly PlatformRole[],
  organizationRoles: readonly OrganizationRole[],
): boolean {
  return (
    platformRoles.some((r) => MFA_REQUIRED_PLATFORM_ROLES.includes(r)) ||
    organizationRoles.some((r) => MFA_REQUIRED_ORGANIZATION_ROLES.includes(r))
  );
}

/** The assurance level of a session, as Supabase reports it. */
export type AssuranceLevel = 'aal1' | 'aal2' | null;

/** What the user must still do before an MFA-required workspace will let them in. */
export type MfaStep = 'satisfied' | 'enroll' | 'challenge';

/**
 * Decides whether a second factor still stands between the user and the
 * workspace, and if so which one of the two things they have to do.
 *
 * The distinction that matters is between `currentLevel` and `nextLevel`.
 * `currentLevel` is the assurance level of the token in hand — 'aal2' only once
 * a factor has actually been presented on this session. `nextLevel` is the
 * highest level the account *could* reach, which Supabase raises to 'aal2' as
 * soon as one verified factor exists. So `nextLevel` describes the account and
 * `currentLevel` describes the request; only `currentLevel` is evidence.
 *
 * Reading `nextLevel` as though it were evidence inverts the control: an
 * account that never enrolled has `nextLevel === 'aal1'` and would look like it
 * had nothing outstanding, so the gate would admit precisely the accounts with
 * no second factor and stop only the ones that had set it up.
 */
export function mfaStep(
  required: boolean,
  currentLevel: AssuranceLevel,
  nextLevel: AssuranceLevel,
): MfaStep {
  if (currentLevel === 'aal2') return 'satisfied';
  if (!required) return 'satisfied';
  // A verified factor exists but was not presented on this session.
  return nextLevel === 'aal2' ? 'challenge' : 'enroll';
}
