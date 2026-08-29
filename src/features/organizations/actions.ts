'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { requireSession, requireOrganization } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rate-limit';
import { generateToken, sha256 } from '@/lib/utils/hash';
import { RateLimitError } from '@/lib/permissions/errors';
import { recordAudit } from '@/lib/audit';
import { getEmailProvider } from '@/lib/email';
import { logger } from '@/lib/logger';
import { absoluteUrl } from '@/lib/site';
import { inviteSchema, organizationSchema } from '@/features/auth/schema';

export type OrgState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
};

const INVITE_TTL_DAYS = 14;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'organisation'
  );
}

/**
 * Creates a customer organization and makes the caller its owner.
 *
 * The membership insert is what actually grants access, so it must succeed; if
 * it fails we remove the organization rather than leave an orphan nobody can
 * reach.
 */
export async function createOrganization(
  _previous: OrgState,
  formData: FormData,
): Promise<OrgState> {
  const session = await requireSession();

  const parsed = organizationSchema.safeParse({
    name: formData.get('name'),
    country: formData.get('country') ?? 'BD',
    phone: formData.get('phone') ?? '',
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? 'form')] ??= issue.message;
    }
    return { status: 'error', fieldErrors };
  }

  const supabase = await createClient();
  const locale = (await getLocale()) === 'bn' ? 'bn' : 'en';

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      kind: 'customer',
      name: parsed.data.name,
      slug: `${slugify(parsed.data.name)}-${crypto.randomUUID().slice(0, 6)}`,
      country: parsed.data.country,
      contact_email: session.email,
      contact_phone: parsed.data.phone || null,
      locale,
      created_by: session.userId,
    })
    .select('id')
    .single();

  if (error || !org) {
    logger.error('org.create_failed', { message: error?.message });
    return { status: 'error', message: 'generic' };
  }

  const { error: membershipError } = await supabase.from('organization_memberships').insert({
    organization_id: org.id,
    user_id: session.userId,
    role: 'customer_owner',
  });

  if (membershipError) {
    logger.error('org.membership_failed', { message: membershipError.message });
    await supabase.from('organizations').delete().eq('id', org.id);
    return { status: 'error', message: 'generic' };
  }

  await supabase
    .from('profiles')
    .update({ phone: parsed.data.phone || null, onboarded_at: new Date().toISOString() })
    .eq('id', session.userId);

  await recordAudit({
    action: 'organization.created',
    targetType: 'organization',
    targetId: org.id,
    organizationId: org.id,
    metadata: { kind: 'customer' },
  });

  redirect(`/${await getLocale()}/app`);
}

export async function inviteMember(_previous: OrgState, formData: FormData): Promise<OrgState> {
  const organizationId = String(formData.get('organizationId') ?? '');
  const { session, membership } = await requireOrganization(organizationId, [
    'customer_owner',
    'partner_owner',
  ]);

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? 'form')] ??= issue.message;
    }
    return { status: 'error', fieldErrors };
  }

  // An owner of a customer org cannot mint partner roles, and vice versa. The
  // database trigger enforces this too; this is the friendly-error half.
  const customerRoles = ['customer_owner', 'customer_member'];
  const isCustomerRole = customerRoles.includes(parsed.data.role);
  if ((membership.kind === 'customer') !== isCustomerRole) {
    return { status: 'error', message: 'roleNotAllowed' };
  }

  try {
    await enforceRateLimit('invitation.send', organizationId);
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const supabase = await createClient();
  const { token, hash } = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

  const { error } = await supabase.from('organization_invitations').insert({
    organization_id: organizationId,
    email: parsed.data.email,
    role: parsed.data.role,
    token_hash: hash,
    invited_by: session.userId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    if (error.code === '23505') return { status: 'error', message: 'alreadyInvited' };
    logger.error('org.invite_failed', { message: error.message });
    return { status: 'error', message: 'generic' };
  }

  const locale = await getLocale();
  const acceptUrl = absoluteUrl(`/${locale}/app/invitations/${token}`);

  await getEmailProvider().send({
    to: parsed.data.email,
    subject: `You have been invited to ${membership.organizationName} on bdoor`,
    text: `${session.fullName} invited you to join ${membership.organizationName} on bdoor.\n\nAccept the invitation: ${acceptUrl}\n\nThis link expires in ${INVITE_TTL_DAYS} days. If you were not expecting this, you can ignore it.`,
    template: 'organization-invitation',
    locale: locale === 'bn' ? 'bn' : 'en',
  });

  await recordAudit({
    action: 'organization.invitation_sent',
    targetType: 'organization_invitation',
    organizationId,
    metadata: { role: parsed.data.role },
  });

  revalidatePath(`/${locale}/app/team`);
  return { status: 'success', message: 'inviteSent' };
}

export async function revokeInvitation(_previous: OrgState, formData: FormData): Promise<OrgState> {
  const invitationId = String(formData.get('invitationId') ?? '');
  const organizationId = String(formData.get('organizationId') ?? '');
  await requireOrganization(organizationId, ['customer_owner', 'partner_owner']);

  const supabase = await createClient();
  const { error } = await supabase
    .from('organization_invitations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  if (error) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'organization.invitation_revoked',
    targetType: 'organization_invitation',
    targetId: invitationId,
    organizationId,
  });

  revalidatePath(`/${await getLocale()}/app/team`);
  return { status: 'success', message: 'inviteRevoked' };
}

/**
 * Accepts an invitation.
 *
 * The token hash is looked up with the service role because the invitee is not
 * yet a member and therefore cannot select the row under RLS. Everything about
 * the token — expiry, status, and that the email matches — is checked here
 * before any membership is created.
 */
export async function acceptInvitation(
  token: string,
): Promise<
  | { ok: true; organizationId: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'wrong_email' | 'unavailable' }
> {
  const session = await requireSession();
  if (!hasServiceRole()) return { ok: false, reason: 'unavailable' };

  const admin = createAdminClient();
  const { data: invitation } = await admin
    .from('organization_invitations')
    .select('id, organization_id, email, role, status, expires_at')
    .eq('token_hash', sha256(token))
    .maybeSingle();

  if (!invitation || invitation.status !== 'pending') return { ok: false, reason: 'invalid' };

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await admin
      .from('organization_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    return { ok: false, reason: 'expired' };
  }

  if (session.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return { ok: false, reason: 'wrong_email' };
  }

  const { error } = await admin.from('organization_memberships').insert({
    organization_id: invitation.organization_id,
    user_id: session.userId,
    role: invitation.role,
  });

  if (error && error.code !== '23505') {
    logger.error('org.accept_failed', { message: error.message });
    return { ok: false, reason: 'unavailable' };
  }

  await admin
    .from('organization_invitations')
    .update({
      status: 'accepted',
      accepted_by: session.userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  await recordAudit({
    action: 'organization.invitation_accepted',
    targetType: 'organization_invitation',
    targetId: invitation.id,
    organizationId: invitation.organization_id,
    metadata: { role: invitation.role },
  });

  return { ok: true, organizationId: invitation.organization_id };
}

export async function removeMember(_previous: OrgState, formData: FormData): Promise<OrgState> {
  const organizationId = String(formData.get('organizationId') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const { session } = await requireOrganization(organizationId, [
    'customer_owner',
    'partner_owner',
  ]);

  if (userId === session.userId) return { status: 'error', message: 'cannotRemoveSelf' };

  const supabase = await createClient();

  // Never leave an organization without an owner.
  const { count } = await supabase
    .from('organization_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('role', ['customer_owner', 'partner_owner']);

  const { data: target } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  const targetIsOwner = target?.role === 'customer_owner' || target?.role === 'partner_owner';
  if (targetIsOwner && (count ?? 0) <= 1) {
    return { status: 'error', message: 'lastOwner' };
  }

  const { error } = await supabase
    .from('organization_memberships')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'organization.member_removed',
    targetType: 'organization_membership',
    organizationId,
    metadata: { removedUser: userId },
  });

  revalidatePath(`/${await getLocale()}/app/team`);
  return { status: 'success', message: 'memberRemoved' };
}
