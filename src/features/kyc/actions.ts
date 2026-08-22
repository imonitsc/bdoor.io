'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { requireCapability } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { POLICY_VERSIONS } from '@/content/legal/documents';

export type KycState = { status: 'idle' | 'error' | 'success'; message?: string };

const decisionSchema = z.object({
  kycCaseId: z.string().uuid(),
  caseId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'escalated', 'more_information_required']),
  reason: z.string().trim().min(10, 'reasonRequired').max(2000, 'tooLong'),
  customerNote: z.string().trim().max(1000).optional().or(z.literal('')),
});

/**
 * Records a compliance decision.
 *
 * Only a compliance officer (or a super admin) can reach this — `kyc.decide` is
 * deliberately absent from the finance and case-manager capability sets, so a
 * finance user cannot approve KYC no matter which page they find.
 *
 * The decision itself is append-only, and `customerNote` is the only part that
 * may ever be shown to the customer: the reason is restricted, because it can
 * contain information we may be prohibited from disclosing.
 */
export async function recordComplianceDecision(
  _previous: KycState,
  formData: FormData,
): Promise<KycState> {
  const session = await requireCapability('kyc.decide');

  const parsed = decisionSchema.safeParse({
    kycCaseId: formData.get('kycCaseId'),
    caseId: formData.get('caseId'),
    decision: formData.get('decision'),
    reason: formData.get('reason'),
    customerNote: formData.get('customerNote') ?? '',
  });

  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]!.message };
  if (!hasServiceRole()) return { status: 'error', message: 'unavailable' };

  const admin = createAdminClient();
  const { error } = await admin
    .schema('compliance' as never)
    .from('compliance_decisions')
    .insert({
      kyc_case_id: parsed.data.kycCaseId,
      case_id: parsed.data.caseId,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      customer_facing_note: parsed.data.customerNote || null,
      decided_by: session.userId,
      policy_version: POLICY_VERSIONS.amlKyc,
    } as never);

  if (error) {
    logger.error('kyc.decision_failed', { message: error.message });
    return { status: 'error', message: 'generic' };
  }

  // The customer-visible half is updated through the ordinary client so RLS
  // still applies to it.
  const supabase = await createClient();
  await supabase
    .from('kyc_cases')
    .update({
      overall_status:
        parsed.data.decision === 'approved'
          ? 'passed'
          : parsed.data.decision === 'rejected'
            ? 'failed'
            : 'manual_review',
      decided_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.kycCaseId);

  await recordAudit({
    action: 'kyc.decision',
    targetType: 'kyc_case',
    targetId: parsed.data.kycCaseId,
    caseId: parsed.data.caseId,
    // The reason is NOT copied into the audit metadata: audit logs are readable
    // by every admin, and the reason is compliance-restricted.
    metadata: { decision: parsed.data.decision, policyVersion: POLICY_VERSIONS.amlKyc },
  });

  revalidatePath(`/${await getLocale()}/admin/kyc`);
  return { status: 'success', message: 'saved' };
}

const noteSchema = z.object({
  caseId: z.string().uuid(),
  body: z.string().trim().min(5, 'reasonRequired').max(4000, 'tooLong'),
  classification: z.enum([
    'restricted',
    'suspicious_activity',
    'reporting_decision',
    'legal_privileged',
  ]),
});

export async function addRestrictedNote(
  _previous: KycState,
  formData: FormData,
): Promise<KycState> {
  const session = await requireCapability('risk.write');

  const parsed = noteSchema.safeParse({
    caseId: formData.get('caseId'),
    body: formData.get('body'),
    classification: formData.get('classification'),
  });

  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]!.message };
  if (!hasServiceRole()) return { status: 'error', message: 'unavailable' };

  const { error } = await createAdminClient()
    .schema('compliance' as never)
    .from('restricted_case_notes')
    .insert({
      case_id: parsed.data.caseId,
      author_id: session.userId,
      body: parsed.data.body,
      classification: parsed.data.classification,
      tipping_off_sensitive: parsed.data.classification !== 'restricted',
    } as never);

  if (error) return { status: 'error', message: 'generic' };

  // Only the fact that a note exists is audited, never its content.
  await recordAudit({
    action: 'risk.flag_raised',
    targetType: 'restricted_case_note',
    caseId: parsed.data.caseId,
    metadata: { classification: parsed.data.classification },
  });

  revalidatePath(`/${await getLocale()}/admin/kyc`);
  return { status: 'success', message: 'saved' };
}
