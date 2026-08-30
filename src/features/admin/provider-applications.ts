'use server';

import { revalidatePath } from 'next/cache';
import { requireCapability } from '@/lib/auth/session';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { recordAudit, type AuditAction } from '@/lib/audit';
import { generateToken } from '@/lib/utils/hash';
import { absoluteUrl } from '@/lib/site';
import { getEmailProvider } from '@/lib/email';
import { logger } from '@/lib/logger';
import {
  canTransitionApplication,
  type ProviderApplicationStatus,
} from '@/features/partners/application';

/**
 * Admin review of provider applications (portals spec §7).
 *
 * Every decision requires the `partner.verify` capability, which is step-up
 * protected (aal2 on this request) and held only by admin/super_admin — a
 * provider can never touch these actions, so no application can approve
 * itself. Writes use the service role AFTER that authorisation, because the
 * approval unit creates rows in four tables (organisation, partner record,
 * verification event, owner invitation) that no single user-level policy
 * spans; the database still enforces the status machine via trigger.
 */

export type ReviewResult = { ok: true } | { ok: false; error: string };

async function transition(
  id: string,
  to: ProviderApplicationStatus,
  extra: Record<string, unknown> = {},
): Promise<
  { ok: false; error: string } | { ok: true; row: { reference: string; status: string } }
> {
  if (!hasServiceRole()) return { ok: false, error: 'unavailable' };
  const admin = createAdminClient();
  const { data: current } = await admin
    .from('provider_applications')
    .select('id, reference, status')
    .eq('id', id)
    .maybeSingle();
  if (!current) return { ok: false, error: 'not_found' };
  if (!canTransitionApplication(current.status as ProviderApplicationStatus, to)) {
    return { ok: false, error: 'invalid_transition' };
  }
  const { error } = await admin
    .from('provider_applications')
    .update({ status: to, ...extra })
    .eq('id', id)
    .eq('status', current.status);
  if (error) {
    logger.error('provider_application.review_failed', { code: error.code });
    return { ok: false, error: 'unavailable' };
  }
  return { ok: true, row: { reference: current.reference, status: current.status } };
}

async function audited(action: AuditAction, id: string, reference: string) {
  await recordAudit({
    action,
    targetType: 'provider_application',
    targetId: id,
    metadata: { reference },
  });
  revalidatePath('/[locale]/(admin)/admin/partners/applications', 'page');
}

export async function startProviderReview(id: string): Promise<ReviewResult> {
  const session = await requireCapability('partner.verify');
  const result = await transition(id, 'under_review', { reviewer_id: session.userId });
  if (!result.ok) return result;
  await audited('provider_application.review_started', id, result.row.reference);
  return { ok: true };
}

export async function requestProviderInformation(
  id: string,
  message: string,
): Promise<ReviewResult> {
  await requireCapability('partner.verify');
  const trimmed = message.trim().slice(0, 2000);
  if (trimmed.length < 5) return { ok: false, error: 'message_required' };
  const result = await transition(id, 'needs_information', { information_request: trimmed });
  if (!result.ok) return result;
  await audited('provider_application.information_requested', id, result.row.reference);
  return { ok: true };
}

export async function beginProviderVerification(id: string): Promise<ReviewResult> {
  await requireCapability('partner.verify');
  const result = await transition(id, 'verification_in_progress', {});
  if (!result.ok) return result;
  await audited('provider_application.verification_started', id, result.row.reference);
  return { ok: true };
}

export async function rejectProviderApplication(id: string, reason: string): Promise<ReviewResult> {
  const session = await requireCapability('partner.verify');
  const trimmed = reason.trim().slice(0, 2000);
  if (trimmed.length < 5) return { ok: false, error: 'message_required' };
  const result = await transition(id, 'rejected', {
    decision_reason: trimmed,
    decided_by: session.userId,
    decided_at: new Date().toISOString(),
  });
  if (!result.ok) return result;
  await audited('provider_application.rejected', id, result.row.reference);
  return { ok: true };
}

/**
 * Approval creates the provider organisation, the partner record scoped to
 * the approved jurisdictions, an append-only verification event, and the
 * single-use owner invitation bound to the applicant's contact email. The
 * status transition runs last so a partial failure leaves the application
 * still in verification and safely retryable — every insert is idempotent
 * against the application id.
 */
export async function approveProviderApplication(id: string): Promise<ReviewResult> {
  const session = await requireCapability('partner.verify');
  if (!hasServiceRole()) return { ok: false, error: 'unavailable' };
  const admin = createAdminClient();

  const { data: appRow } = await admin
    .from('provider_applications')
    .select(
      'id, reference, status, legal_name, trading_name, registration_no, firm_category, ' +
        'jurisdictions, website, contact_name, contact_email, contact_phone, locale, organization_id',
    )
    .eq('id', id)
    .maybeSingle();
  const app = appRow as unknown as {
    id: string;
    reference: string;
    status: string;
    legal_name: string;
    registration_no: string | null;
    firm_category: string;
    jurisdictions: string[];
    website: string | null;
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
    locale: string;
    organization_id: string | null;
  } | null;
  if (!app) return { ok: false, error: 'not_found' };
  if (app.status !== 'verification_in_progress') return { ok: false, error: 'invalid_transition' };
  if (!app.legal_name || !app.contact_email) return { ok: false, error: 'incomplete' };

  // 1. Organisation (reuse one from a previous partial approval if present).
  let organizationId = app.organization_id;
  if (!organizationId) {
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: app.legal_name,
        kind: 'partner',
        slug:
          app.legal_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40) + `-${crypto.randomUUID().slice(0, 8)}`,
      })
      .select('id')
      .single();
    if (orgError || !org) {
      logger.error('provider_application.org_failed', { code: orgError?.code });
      return { ok: false, error: 'unavailable' };
    }
    organizationId = org.id;
    await admin
      .from('provider_applications')
      .update({ organization_id: organizationId })
      .eq('id', id);
  }

  // 2. Partner record (idempotent on the unique organization_id).
  const { data: partner, error: partnerError } = await admin
    .from('partners')
    .upsert(
      {
        organization_id: organizationId,
        legal_name: app.legal_name,
        practice_type: app.firm_category,
        registration_no: app.registration_no,
        geographic_coverage: app.jurisdictions,
        website: app.website,
        contact_name: app.contact_name,
        contact_email: app.contact_email,
        contact_phone: app.contact_phone,
        verification_status: 'verified',
      },
      { onConflict: 'organization_id' },
    )
    .select('id')
    .single();
  if (partnerError || !partner) {
    logger.error('provider_application.partner_failed', { code: partnerError?.code });
    return { ok: false, error: 'unavailable' };
  }

  // 3. Append-only verification event naming the approver.
  const { error: verificationError } = await admin.from('partner_verifications').insert({
    partner_id: partner.id,
    status: 'verified',
    note: `Approved from provider application ${app.reference}`,
    decided_by: session.userId,
  });
  if (verificationError) {
    logger.error('provider_application.verification_failed', { code: verificationError.code });
    return { ok: false, error: 'unavailable' };
  }

  // 4. Single-use, expiring owner invitation bound to email + org + role.
  const email = app.contact_email.toLowerCase();
  const { token, hash } = generateToken();
  const { error: inviteError } = await admin.from('organization_invitations').insert({
    organization_id: organizationId,
    email,
    role: 'partner_owner',
    token_hash: hash,
    invited_by: session.userId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (inviteError && inviteError.code !== '23505') {
    // 23505 = a pending invitation already exists from a previous attempt.
    logger.error('provider_application.invite_failed', { code: inviteError.code });
    return { ok: false, error: 'unavailable' };
  }

  // 5. Status transition last (database trigger re-validates it).
  const result = await transition(id, 'approved', {
    decided_by: session.userId,
    decided_at: new Date().toISOString(),
  });
  if (!result.ok) return result;

  if (!inviteError) {
    const locale = app.locale === 'bn' ? 'bn' : 'en';
    const acceptUrl = absoluteUrl(`/${locale}/app/invitations/${token}`);
    try {
      await getEmailProvider().send({
        to: email,
        subject: 'Your bdoor provider workspace is ready to set up',
        template: 'provider-owner-invitation',
        locale,
        text:
          `Your firm's application (${app.reference}) has been approved for the ` +
          `bdoor provider network.\n\nAccept your owner invitation within 7 days:\n` +
          `${acceptUrl}\n\nYou will be asked to verify your email and enrol ` +
          `two-factor authentication before the workspace opens.\n\n` +
          `bdoor compliance ltd.`,
      });
    } catch (error) {
      logger.warn('provider_application.invite_email_failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  await audited('provider_application.approved', id, app.reference);
  return { ok: true };
}
