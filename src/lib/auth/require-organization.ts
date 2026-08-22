import 'server-only';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import {
  customerMemberships,
  partnerMemberships,
  requireSession,
  type OrganizationMembership,
  type SessionContext,
} from './session';

/**
 * Guard for customer workspace pages.
 *
 * A signed-in user with no customer organization cannot do anything useful, so
 * they are sent to onboarding. This lives in a helper rather than the layout
 * because the onboarding route shares that layout and must not redirect to
 * itself.
 */
export async function requireCustomerOrganization(): Promise<{
  session: SessionContext;
  organizations: OrganizationMembership[];
  active: OrganizationMembership;
}> {
  const session = await requireSession();
  const organizations = customerMemberships(session);

  if (organizations.length === 0) {
    redirect(`/${await getLocale()}/app/onboarding`);
  }

  return { session, organizations, active: organizations[0]! };
}

export async function requirePartnerOrganization(): Promise<{
  session: SessionContext;
  organizations: OrganizationMembership[];
  active: OrganizationMembership;
}> {
  const session = await requireSession();
  const organizations = partnerMemberships(session);

  if (organizations.length === 0) {
    redirect(`/${await getLocale()}/app`);
  }

  return { session, organizations, active: organizations[0]! };
}
