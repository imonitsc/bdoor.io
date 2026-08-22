'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCapability, requireStaff } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { canTransition, type ActorKind, type CaseStatus } from '@/features/cases/state-machine';

export type CaseActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

const transitionSchema = z.object({
  caseId: z.string().uuid(),
  toStatus: z.string().min(1),
  reason: z.string().trim().min(5, 'reasonRequired').max(1000, 'tooLong'),
  publicNote: z.string().trim().max(2000).optional().or(z.literal('')),
  internalNote: z.string().trim().max(2000).optional().or(z.literal('')),
});

/**
 * Moves a case to a new status.
 *
 * The transition is checked three times over: here against the in-code machine,
 * again by the database trigger against `case_status_transitions`, and the RLS
 * policy decides whether this actor may write to the case at all. The history
 * row is written first so an audit trail exists even if the update then fails.
 */
export async function transitionCase(
  _previous: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const session = await requireCapability('case.transition');

  const parsed = transitionSchema.safeParse({
    caseId: formData.get('caseId'),
    toStatus: formData.get('toStatus'),
    reason: formData.get('reason'),
    publicNote: formData.get('publicNote') ?? '',
    internalNote: formData.get('internalNote') ?? '',
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]!.message };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from('cases')
    .select('id, status, waiting_on, organization_id')
    .eq('id', parsed.data.caseId)
    .maybeSingle();

  if (!current) return { status: 'error', message: 'notFound' };

  const actor: ActorKind = 'staff';
  const check = canTransition(current.status, parsed.data.toStatus as CaseStatus, actor);

  if (!check.ok) {
    return {
      status: 'error',
      message: check.reason === 'actor_not_permitted' ? 'notPermitted' : 'invalidTransition',
    };
  }

  const { error: historyError } = await supabase.from('case_status_history').insert({
    case_id: current.id,
    from_status: current.status,
    to_status: parsed.data.toStatus as CaseStatus,
    from_waiting_on: current.waiting_on,
    to_waiting_on: check.waitingOn,
    reason: parsed.data.reason,
    public_note: parsed.data.publicNote || null,
    internal_note: parsed.data.internalNote || null,
    actor_id: session.userId,
    actor_kind: actor,
  });

  if (historyError) {
    logger.error('case.history_failed', { message: historyError.message });
    return { status: 'error', message: 'generic' };
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: parsed.data.toStatus as CaseStatus, waiting_on: check.waitingOn })
    .eq('id', current.id);

  if (error) {
    logger.error('case.transition_failed', { message: error.message, code: error.code });
    return { status: 'error', message: 'invalidTransition' };
  }

  await recordAudit({
    action: 'case.status_changed',
    targetType: 'case',
    targetId: current.id,
    organizationId: current.organization_id,
    caseId: current.id,
    metadata: { from: current.status, to: parsed.data.toStatus, waitingOn: check.waitingOn },
  });

  revalidatePath(`/${await getLocale()}/admin/cases/${current.id}`);
  return { status: 'success', message: 'saved' };
}

const documentRequestSchema = z.object({
  caseId: z.string().uuid(),
  labelEn: z.string().trim().min(2, 'labelRequired').max(200),
  labelBn: z.string().trim().min(1, 'labelRequired').max(200),
  category: z.enum([
    'identity',
    'address_proof',
    'corporate',
    'financial',
    'photo',
    'signature',
    'authority_form',
    'official_record',
    'other',
  ]),
  dueOn: z.string().optional().or(z.literal('')),
});

export async function requestDocument(
  _previous: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const session = await requireCapability('case.manage');

  const parsed = documentRequestSchema.safeParse({
    caseId: formData.get('caseId'),
    labelEn: formData.get('labelEn'),
    labelBn: formData.get('labelBn') || formData.get('labelEn'),
    category: formData.get('category'),
    dueOn: formData.get('dueOn') ?? '',
  });

  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]!.message };

  const supabase = await createClient();
  const { error } = await supabase.from('document_requests').insert({
    case_id: parsed.data.caseId,
    label_en: parsed.data.labelEn,
    label_bn: parsed.data.labelBn,
    category: parsed.data.category,
    status: 'requested',
    due_on: parsed.data.dueOn || null,
    requested_by: session.userId,
  });

  if (error) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'case.milestone_changed',
    targetType: 'document_request',
    caseId: parsed.data.caseId,
    metadata: { category: parsed.data.category },
  });

  revalidatePath(`/${await getLocale()}/admin/cases/${parsed.data.caseId}`);
  return { status: 'success', message: 'saved' };
}

/**
 * Offers a case to a partner organization.
 *
 * The partner sees nothing until they accept, and no document is shared until
 * the customer separately authorises it — this action does not grant document
 * access, only an offer.
 */
export async function assignPartner(
  _previous: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const session = await requireCapability('case.assign_partner');

  const caseId = String(formData.get('caseId') ?? '');
  const partnerOrgId = String(formData.get('partnerOrgId') ?? '');
  const scopeNote = String(formData.get('scopeNote') ?? '').trim();

  if (!caseId || !partnerOrgId || scopeNote.length < 5) {
    return { status: 'error', message: 'scopeRequired' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('case_partner_assignments').insert({
    case_id: caseId,
    partner_org_id: partnerOrgId,
    status: 'offered',
    scope_note: scopeNote,
    offered_by: session.userId,
  });

  if (error) {
    // The partial unique index allows only one live assignment per case.
    if (error.code === '23505') return { status: 'error', message: 'alreadyAssigned' };
    logger.error('case.assign_partner_failed', { message: error.message });
    return { status: 'error', message: 'generic' };
  }

  await recordAudit({
    action: 'case.partner_assigned',
    targetType: 'case_partner_assignment',
    caseId,
    organizationId: partnerOrgId,
    metadata: { scopeLength: scopeNote.length },
  });

  revalidatePath(`/${await getLocale()}/admin/cases/${caseId}`);
  return { status: 'success', message: 'saved' };
}

export async function assignCaseManager(
  _previous: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  await requireCapability('case.manage');
  const caseId = String(formData.get('caseId') ?? '');
  const managerId = String(formData.get('managerId') ?? '');

  if (!caseId || !managerId) return { status: 'error', message: 'generic' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('cases')
    .update({ assigned_manager_id: managerId })
    .eq('id', caseId);

  if (error) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'case.assigned',
    targetType: 'case',
    targetId: caseId,
    caseId,
    metadata: { managerId },
  });

  revalidatePath(`/${await getLocale()}/admin/cases/${caseId}`);
  return { status: 'success', message: 'saved' };
}

/** Records an authority submission and its reference number. */
export async function recordSubmission(
  _previous: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const session = await requireStaff();
  const caseId = String(formData.get('caseId') ?? '');
  const authorityName = String(formData.get('authorityName') ?? '').trim();
  const submissionType = String(formData.get('submissionType') ?? '').trim();
  const referenceNo = String(formData.get('referenceNo') ?? '').trim();
  const submittedOn = String(formData.get('submittedOn') ?? '');

  if (!caseId || authorityName.length < 2 || submissionType.length < 2 || !submittedOn) {
    return { status: 'error', message: 'generic' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('authority_submissions').insert({
    case_id: caseId,
    authority_name: authorityName,
    submission_type: submissionType,
    reference_no: referenceNo || null,
    submitted_on: submittedOn,
    submitted_by_user_id: session.userId,
    outcome: 'pending',
  });

  if (error) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'case.milestone_changed',
    targetType: 'authority_submission',
    caseId,
    metadata: { authorityName, submissionType },
  });

  revalidatePath(`/${await getLocale()}/admin/cases/${caseId}`);
  return { status: 'success', message: 'saved' };
}
