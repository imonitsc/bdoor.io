import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  organizationCapabilities,
  platformCapabilities,
  requiresMfa,
  type Capability,
  type OrganizationRole,
  type PlatformRole,
} from '@/lib/permissions/roles';
import { AuthenticationError, AuthorizationError } from '@/lib/permissions/errors';

export type OrganizationMembership = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  kind: 'customer' | 'partner';
  role: OrganizationRole;
};

export type SessionContext = {
  userId: string;
  email: string | null;
  fullName: string;
  preferredLocale: 'en' | 'bn';
  platformRoles: PlatformRole[];
  memberships: OrganizationMembership[];
  capabilities: Set<Capability>;
  mfaRequired: boolean;
  mfaSatisfied: boolean;
};

/**
 * The authoritative session for the current request.
 *
 * Roles come from `platform_roles` and `organization_memberships` — never from
 * `user_metadata`, which the user can edit. `cache()` dedupes this within a
 * single render pass so a page with six components does not make six round trips.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return null;

  const [profileResult, rolesResult, membershipResult, aalResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, preferred_locale')
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('platform_roles').select('role, expires_at').eq('user_id', userId),
    supabase
      .from('organization_memberships')
      .select('organization_id, role, organizations(name, slug, kind, is_active)')
      .eq('user_id', userId),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  const now = Date.now();
  const platformRoles = (rolesResult.data ?? [])
    .filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now)
    .map((r) => r.role as PlatformRole);

  type MembershipRow = {
    organization_id: string;
    role: OrganizationRole;
    organizations: { name: string; slug: string; kind: 'customer' | 'partner'; is_active: boolean } | null;
  };

  const memberships: OrganizationMembership[] = ((membershipResult.data ?? []) as MembershipRow[])
    .filter((m) => m.organizations?.is_active)
    .map((m) => ({
      organizationId: m.organization_id,
      organizationName: m.organizations!.name,
      organizationSlug: m.organizations!.slug,
      kind: m.organizations!.kind,
      role: m.role,
    }));

  const orgRoles = memberships.map((m) => m.role);
  const capabilities = new Set<Capability>([
    ...platformCapabilities(platformRoles),
    ...organizationCapabilities(orgRoles),
  ]);

  const aal = aalResult.data;

  return {
    userId,
    email: profileResult.data?.email ?? (claimsData?.claims?.email as string | undefined) ?? null,
    fullName: profileResult.data?.full_name ?? '',
    preferredLocale: (profileResult.data?.preferred_locale as 'en' | 'bn') ?? 'en',
    platformRoles,
    memberships,
    capabilities,
    mfaRequired: requiresMfa(platformRoles, orgRoles),
    // aal2 means a second factor was actually presented this session.
    mfaSatisfied: aal?.currentLevel === 'aal2' || aal?.nextLevel !== 'aal2',
  };
});

/** Throws if there is no signed-in user. Use in Server Actions and Route Handlers. */
export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) throw new AuthenticationError();
  return session;
}

/** Throws unless the session holds the capability. */
export async function requireCapability(capability: Capability): Promise<SessionContext> {
  const session = await requireSession();
  if (!session.capabilities.has(capability)) {
    throw new AuthorizationError(capability);
  }
  return session;
}

export async function requireStaff(): Promise<SessionContext> {
  const session = await requireSession();
  if (session.platformRoles.length === 0) throw new AuthorizationError('platform.staff');
  return session;
}

export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireSession();
  if (!session.platformRoles.some((r) => r === 'admin' || r === 'super_admin')) {
    throw new AuthorizationError('platform.admin');
  }
  return session;
}

/** Throws unless the session is a member of the organization (optionally in one of `roles`). */
export async function requireOrganization(
  organizationId: string,
  roles?: readonly OrganizationRole[],
): Promise<{ session: SessionContext; membership: OrganizationMembership }> {
  const session = await requireSession();
  const membership = session.memberships.find((m) => m.organizationId === organizationId);
  if (!membership || (roles && !roles.includes(membership.role))) {
    throw new AuthorizationError('organization.member');
  }
  return { session, membership };
}

export function customerMemberships(session: SessionContext): OrganizationMembership[] {
  return session.memberships.filter((m) => m.kind === 'customer');
}

export function partnerMemberships(session: SessionContext): OrganizationMembership[] {
  return session.memberships.filter((m) => m.kind === 'partner');
}

export function isStaff(session: SessionContext | null): boolean {
  return Boolean(session && session.platformRoles.length > 0);
}
