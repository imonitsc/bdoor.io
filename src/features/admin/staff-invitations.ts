'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { requireCapability, requireSession } from '@/lib/auth/session';
import { generateToken, sha256 } from '@/lib/utils/hash';
import { enforceRateLimit } from '@/lib/rate-limit';
import { RateLimitError } from '@/lib/permissions/errors';
import { getEmailProvider } from '@/lib/email';
import { absoluteUrl } from '@/lib/site';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { staffInviteSchema } from '@/features/auth/schema';

/**
 * Inviting BDoor staff.
 *
 * Nothing here decides who may invite whom. That rule lives in
 * `app.may_invite_template()` and is enforced by the insert policy on
 * `platform_invitations`: an inviter cannot hand out a permission they do not
 * hold themselves. Re-implementing it in TypeScript would give two answers that
 * could disagree, and the one that matters is the database's. What this does is
 * turn the resulting refusal into a message a person can read.
 */

const INVITE_TTL_DAYS = 7;

export type StaffInviteState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function inviteStaff(
  _previous: StaffInviteState,
  formData: FormData,
): Promise<StaffInviteState> {
  // user.manage is marked as needing step-up, so requireCapability() has
  // already insisted on a second factor presented on this request.
  const session = await requireCapability('user.manage');

  const parsed = staffInviteSchema.safeParse({
    email: formData.get('email'),
    templateCode: formData.get('templateCode'),
    reason: formData.get('reason'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? 'form')] ??= issue.message;
    }
    return { status: 'error', fieldErrors };
  }

  try {
    await enforceRateLimit('invitation.send', session.userId);
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const supabase = await createClient();
  const { token, hash } = generateToken();

  const { error } = await supabase.from('platform_invitations').insert({
    email: parsed.data.email,
    template_code: parsed.data.templateCode,
    token_hash: hash,
    invited_by: session.userId,
    reason: parsed.data.reason,
    expires_at: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString(),
  });

  if (error) {
    // 23505 is the one-live-invitation-per-address index; 42501 is the policy
    // refusing this template to this caller; 23514 is the internal-only trigger.
    if (error.code === '23505') return { status: 'error', message: 'alreadyInvited' };
    if (error.code === '42501') return { status: 'error', message: 'templateNotAllowed' };
    if (error.code === '23514') return { status: 'error', message: 'templateNotInternal' };
    // The message can name a role and an address; keep it out of the log line.
    logger.error('staff.invite_failed', { code: error.code });
    return { status: 'error', message: 'generic' };
  }

  const locale = await getLocale();
  const acceptUrl = absoluteUrl(`/${locale}/accept-staff-invite/${token}`);

  await getEmailProvider().send({
    to: parsed.data.email,
    subject: 'You have been invited to the BDoor staff workspace',
    text:
      `${session.fullName} invited you to the BDoor staff workspace.\n\n` +
      `Accept the invitation: ${acceptUrl}\n\n` +
      `This link expires in ${INVITE_TTL_DAYS} days and can be used once. ` +
      `You will be asked to set up a second factor before you can use the workspace.\n\n` +
      `If you were not expecting this, ignore this message and tell us.`,
    template: 'platform-invitation',
    locale: locale === 'bn' ? 'bn' : 'en',
  });

  await recordAudit({
    action: 'platform_invitation.sent',
    targetType: 'platform_invitation',
    // The template and the reason are the reviewable facts. The address is on
    // the row itself and does not need copying into the audit metadata.
    metadata: { templateCode: parsed.data.templateCode, reason: parsed.data.reason },
  });

  revalidatePath(`/${locale}/admin/users`);
  return { status: 'success', message: 'inviteSent' };
}

export async function revokeStaffInvitation(
  _previous: StaffInviteState,
  formData: FormData,
): Promise<StaffInviteState> {
  const session = await requireCapability('user.manage');
  const id = String(formData.get('invitationId') ?? '');
  if (!id) return { status: 'error', message: 'generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_invitations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: session.userId })
    .eq('id', id)
    .eq('status', 'pending');

  if (error) {
    logger.error('staff.invite_revoke_failed', { code: error.code });
    return { status: 'error', message: 'generic' };
  }

  await recordAudit({
    action: 'platform_invitation.revoked',
    targetType: 'platform_invitation',
    targetId: id,
  });

  revalidatePath(`/${await getLocale()}/admin/users`);
  return { status: 'success', message: 'inviteRevoked' };
}

export type AcceptStaffResult =
  | { ok: true; templateCode: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'wrong_email' | 'unconfirmed' | 'unavailable' };

/**
 * Accepts a staff invitation.
 *
 * Read with the service role because the invitee holds no platform role yet and
 * so matches no select policy on the table — the same reason the organisation
 * flow does it. Everything the token asserts is re-checked here before any role
 * is created: that it exists, that it is still pending, that it has not
 * expired, and that the signed-in address is the invited one.
 */
export async function acceptStaffInvitation(token: string): Promise<AcceptStaffResult> {
  const session = await requireSession();
  if (!hasServiceRole()) return { ok: false, reason: 'unavailable' };

  const admin = createAdminClient();
  const { data: invitation } = await admin
    .from('platform_invitations')
    .select('id, email, template_code, status, expires_at')
    .eq('token_hash', sha256(token))
    .maybeSingle();

  if (!invitation || invitation.status !== 'pending') return { ok: false, reason: 'invalid' };

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await admin.from('platform_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { ok: false, reason: 'expired' };
  }

  if (session.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return { ok: false, reason: 'wrong_email' };
  }

  // An unconfirmed address is not proof anybody controls it, and a platform
  // role is not something to hand to an address nobody has proved they own.
  const { data: user } = await admin.auth.admin.getUserById(session.userId);
  if (!user?.user?.email_confirmed_at) return { ok: false, reason: 'unconfirmed' };

  // Legacy enum roles keep going into platform_roles so every policy already
  // written against that table applies. Templates with no enum counterpart
  // become a platform-scope role_assignment instead. Both are read by
  // app.platform_permissions(), so the two paths grant identically.
  const legacy = ['case_manager', 'compliance_officer', 'finance', 'admin', 'super_admin'];
  const write = legacy.includes(invitation.template_code)
    ? admin
        .from('platform_roles')
        .insert({ user_id: session.userId, role: invitation.template_code as 'case_manager' })
    : admin.from('role_assignments').insert({
        user_id: session.userId,
        template_code: invitation.template_code,
        scope_kind: 'platform',
        reason: `accepted invitation ${invitation.id}`,
      });

  const { error } = await write;
  if (error && error.code !== '23505') {
    logger.error('staff.accept_failed', { code: error.code });
    return { ok: false, reason: 'unavailable' };
  }

  // Every platform role carries MFA. Setting it at acceptance means the gate is
  // already in place the first time the account reaches the workspace.
  await admin
    .from('user_security_settings')
    .upsert({ user_id: session.userId, mfa_required: true }, { onConflict: 'user_id' });

  await admin
    .from('platform_invitations')
    .update({
      status: 'accepted',
      accepted_by: session.userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  await recordAudit({
    action: 'platform_invitation.accepted',
    targetType: 'platform_invitation',
    targetId: invitation.id,
    metadata: { templateCode: invitation.template_code },
  });

  return { ok: true, templateCode: invitation.template_code };
}
