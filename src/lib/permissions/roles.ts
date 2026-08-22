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
 */
export type Capability =
  | 'case.read.own'
  | 'case.create'
  | 'case.manage'
  | 'case.transition'
  | 'case.assign_partner'
  | 'document.upload'
  | 'document.review'
  | 'document.quarantine'
  | 'kyc.read'
  | 'kyc.decide'
  | 'risk.read'
  | 'risk.write'
  | 'quote.read'
  | 'quote.prepare'
  | 'quote.approve'
  | 'quote.accept'
  | 'payment.read'
  | 'payment.reconcile'
  | 'refund.approve'
  | 'partner.read_assigned'
  | 'partner.respond_assignment'
  | 'partner.verify'
  | 'content.publish'
  | 'service.manage'
  | 'user.manage'
  | 'audit.read'
  | 'settings.manage';

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
