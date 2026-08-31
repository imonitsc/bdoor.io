import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { redactMetadata } from './redact';
import { logger } from '@/lib/logger';

export type AuditAction =
  | 'auth.sign_in'
  | 'auth.sign_out'
  | 'auth.password_changed'
  | 'auth.mfa_enrolled'
  | 'auth.mfa_removed'
  | 'auth.sessions_revoked'
  | 'organization.created'
  | 'organization.member_added'
  | 'organization.member_removed'
  | 'organization.invitation_sent'
  | 'organization.invitation_accepted'
  | 'organization.invitation_revoked'
  | 'platform_role.granted'
  | 'platform_role.revoked'
  | 'platform_invitation.sent'
  | 'platform_invitation.accepted'
  | 'platform_invitation.revoked'
  | 'case.created'
  | 'case.status_changed'
  | 'case.assigned'
  | 'case.partner_assigned'
  | 'case.partner_response'
  | 'case.milestone_changed'
  | 'kyc.decision'
  | 'kyc.check_updated'
  | 'risk.flag_raised'
  | 'risk.assessment_recorded'
  | 'document.uploaded'
  | 'document.previewed'
  | 'document.downloaded'
  | 'document.replaced'
  | 'document.quarantined'
  | 'document.deleted'
  | 'document.shared_with_partner'
  | 'quote.created'
  | 'quote.version_created'
  | 'quote.approved'
  | 'quote.sent'
  | 'quote.accepted'
  | 'payment.created'
  | 'payment.status_changed'
  | 'payment.reconciled'
  | 'refund.requested'
  | 'refund.approved'
  | 'disbursement.recorded'
  | 'partner.verified'
  | 'provider_application.review_started'
  | 'provider_application.information_requested'
  | 'provider_application.verification_started'
  | 'provider_application.approved'
  | 'provider_application.rejected'
  | 'case.disclosure_recorded'
  | 'metrics.snapshot_recorded'
  | 'partner.export'
  | 'content.published'
  | 'content.unpublished'
  | 'service.updated'
  | 'settings.changed'
  | 'integration.configured'
  | 'data_request.received'
  | 'data_request.completed';

export type AuditEntry = {
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  organizationId?: string | null;
  caseId?: string | null;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  actorRole?: string | null;
  origin?: string | null;
};

/**
 * Append-only audit write.
 *
 * Never throws into the caller: an audit failure must not roll back a customer
 * action, but it must be loud in the logs. Metadata is redacted before it
 * leaves this process.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const correlationId = entry.correlationId ?? crypto.randomUUID();

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const actorId = (data?.claims?.sub as string | undefined) ?? null;

    const { error } = await supabase.from('audit_logs').insert({
      actor_id: actorId,
      actor_role: entry.actorRole ?? null,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      organization_id: entry.organizationId ?? null,
      case_id: entry.caseId ?? null,
      correlation_id: correlationId,
      metadata: redactMetadata(entry.metadata ?? {}) as never,
      origin: entry.origin ?? null,
    });

    if (error) {
      logger.error('audit.write_failed', {
        action: entry.action,
        correlationId,
        message: error.message,
      });
    }
  } catch (error) {
    logger.error('audit.write_threw', {
      action: entry.action,
      correlationId,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}

export { redact, redactMetadata, maskString, lastFour } from './redact';
