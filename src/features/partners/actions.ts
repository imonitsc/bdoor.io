'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { partnerMemberships, requireSession } from '@/lib/auth/session';
import { AuthorizationError } from '@/lib/permissions/errors';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { recordAnalyticsEvent } from '@/lib/analytics';

export type PartnerState = { status: 'idle' | 'error' | 'success'; message?: string };

const declineSchema = z.string().trim().min(5, 'reasonRequired').max(1000, 'tooLong');

/**
 * Accepts or declines a case assignment.
 *
 * Acceptance requires an explicit conflict-check confirmation — a partner
 * cannot silently take on a matter they have not cleared. The RLS policy on
 * `case_partner_assignments` independently restricts this update to the
 * partner's own offered assignment.
 */
export async function respondToAssignment(
  _previous: PartnerState,
  formData: FormData,
): Promise<PartnerState> {
  const session = await requireSession();
  const assignmentId = String(formData.get('assignmentId') ?? '');
  const decision = String(formData.get('decision') ?? '');

  if (
    !assignmentId ||
    (decision !== 'accept' &&
      decision !== 'decline' &&
      decision !== 'conflict' &&
      decision !== 'flag')
  ) {
    return { status: 'error', message: 'generic' };
  }

  const partnerOrgIds = partnerMemberships(session).map((m) => m.organizationId);
  if (partnerOrgIds.length === 0) throw new AuthorizationError('partner.respond_assignment');

  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from('case_partner_assignments')
    .select('id, case_id, partner_org_id, status')
    .eq('id', assignmentId)
    .maybeSingle();

  if (!assignment || !partnerOrgIds.includes(assignment.partner_org_id)) {
    return { status: 'error', message: 'notFound' };
  }
  if (assignment.status !== 'offered') return { status: 'error', message: 'alreadyAnswered' };

  if (decision === 'accept') {
    // Acceptance is only possible on a clean, explicit conflict outcome
    // (spec §10). The database column guard stamps the recorder's identity.
    if (formData.get('conflictResult') !== 'none_identified') {
      return { status: 'error', message: 'conflictCheckRequired' };
    }

    const { error } = await supabase
      .from('case_partner_assignments')
      .update({
        status: 'accepted',
        conflict_check_confirmed: true,
        conflict_check_result: 'none_identified',
        responded_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (error) {
      logger.warn('partner.accept_failed', { message: error.message });
      return { status: 'error', message: 'generic' };
    }
  } else if (decision === 'conflict') {
    // A conflict decline records the outcome without demanding an
    // explanation that could itself reveal protected information.
    const { error } = await supabase
      .from('case_partner_assignments')
      .update({
        status: 'declined',
        conflict_check_result: 'conflict_declined',
        decline_reason: 'conflict_declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);
    if (error) return { status: 'error', message: 'generic' };
  } else if (decision === 'flag') {
    // Potential conflict or insufficient information: the offer stays open
    // for bdoor review; details travel through the message thread, never a
    // free-text field the customer might see.
    const outcome = String(formData.get('conflictResult') ?? '');
    if (outcome !== 'potential_conflict' && outcome !== 'insufficient_information') {
      return { status: 'error', message: 'generic' };
    }
    const { error } = await supabase
      .from('case_partner_assignments')
      .update({ conflict_check_result: outcome })
      .eq('id', assignmentId);
    if (error) return { status: 'error', message: 'generic' };
  } else {
    const parsed = declineSchema.safeParse(formData.get('reason'));
    if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]!.message };

    const { error } = await supabase
      .from('case_partner_assignments')
      .update({
        status: 'declined',
        decline_reason: parsed.data,
        responded_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (error) return { status: 'error', message: 'generic' };
  }

  await recordAudit({
    action: 'case.partner_response',
    targetType: 'case_partner_assignment',
    targetId: assignmentId,
    caseId: assignment.case_id,
    organizationId: assignment.partner_org_id,
    metadata: { decision },
  });

  if (decision === 'accept') {
    await recordAnalyticsEvent({
      event: 'provider_assignment_accepted',
      idempotencyKey: `provider_assignment_accepted:${assignmentId}`,
      organizationId: assignment.partner_org_id,
      caseId: assignment.case_id,
    });
  }

  revalidatePath(`/${await getLocale()}/partner/cases`);
  const message =
    decision === 'accept'
      ? 'accepted'
      : decision === 'flag'
        ? 'conflictFlagged'
        : decision === 'conflict'
          ? 'conflictDeclined'
          : 'declined';
  return { status: 'success', message };
}

/** Marks a partner-owned milestone complete. */
export async function updateMilestone(
  _previous: PartnerState,
  formData: FormData,
): Promise<PartnerState> {
  await requireSession();
  const milestoneId = String(formData.get('milestoneId') ?? '');
  const status = String(formData.get('status') ?? '');

  if (!milestoneId || !['in_progress', 'complete', 'blocked'].includes(status)) {
    return { status: 'error', message: 'generic' };
  }

  const supabase = await createClient();
  // The RLS policy limits this to milestones whose owner_kind is 'partner' on a
  // case assigned to the caller's organization, so no extra scoping is needed.
  const { data, error } = await supabase
    .from('case_milestones')
    .update({
      status: status as 'in_progress' | 'complete' | 'blocked',
      completed_at: status === 'complete' ? new Date().toISOString() : null,
    })
    .eq('id', milestoneId)
    .select('case_id')
    .maybeSingle();

  if (error || !data) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'case.milestone_changed',
    targetType: 'case_milestone',
    targetId: milestoneId,
    caseId: data.case_id,
    metadata: { status },
  });

  revalidatePath(`/${await getLocale()}/partner/cases/${data.case_id}`);
  return { status: 'success', message: 'saved' };
}
