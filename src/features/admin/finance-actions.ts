'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCapability } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export type FinanceState = { status: 'idle' | 'error' | 'success'; message?: string };

const reconcileSchema = z.object({
  paymentId: z.string().uuid(),
  note: z.string().trim().min(5, 'reasonRequired').max(1000, 'tooLong'),
});

/**
 * Manual reconciliation.
 *
 * Finance-only, and always accompanied by a note. The note plus the actor are
 * written to the audit log, because a manually-reconciled payment is exactly
 * the kind of record an auditor will ask about later.
 */
export async function reconcilePayment(
  _previous: FinanceState,
  formData: FormData,
): Promise<FinanceState> {
  const session = await requireCapability('payment.reconcile');

  const parsed = reconcileSchema.safeParse({
    paymentId: formData.get('paymentId'),
    note: formData.get('note'),
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]!.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .update({
      reconciled_at: new Date().toISOString(),
      reconciled_by: session.userId,
      reconcile_note: parsed.data.note,
    })
    .eq('id', parsed.data.paymentId)
    .select('id, organization_id, case_id, amount_minor')
    .maybeSingle();

  if (error || !data) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'payment.reconciled',
    targetType: 'payment',
    targetId: data.id,
    organizationId: data.organization_id,
    caseId: data.case_id,
    metadata: { note: parsed.data.note, amountMinor: data.amount_minor },
  });

  revalidatePath(`/${await getLocale()}/admin/finance`);
  return { status: 'success', message: 'saved' };
}

const disbursementSchema = z.object({
  advanceId: z.string().uuid(),
  caseId: z.string().uuid(),
  authorityName: z.string().trim().min(2, 'labelRequired').max(200),
  purpose: z.string().trim().min(2, 'labelRequired').max(200),
  amountMinor: z.coerce.number().int().positive(),
  paidOn: z.string().min(4),
  challanNo: z.string().trim().max(120).optional().or(z.literal('')),
});

/** Records money actually paid to an authority out of a customer's advance. */
export async function recordDisbursement(
  _previous: FinanceState,
  formData: FormData,
): Promise<FinanceState> {
  const session = await requireCapability('payment.reconcile');

  const parsed = disbursementSchema.safeParse({
    advanceId: formData.get('advanceId'),
    caseId: formData.get('caseId'),
    authorityName: formData.get('authorityName'),
    purpose: formData.get('purpose'),
    amountMinor: formData.get('amountMinor'),
    paidOn: formData.get('paidOn'),
    challanNo: formData.get('challanNo') ?? '',
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]!.message };

  const supabase = await createClient();

  const { data: advance } = await supabase
    .from('government_fee_advances')
    .select('id, received_minor, disbursed_minor, refunded_minor')
    .eq('id', parsed.data.advanceId)
    .maybeSingle();

  if (!advance) return { status: 'error', message: 'notFound' };

  // The database also enforces this, but failing here gives a usable message.
  const remaining = advance.received_minor - advance.disbursed_minor - advance.refunded_minor;
  if (parsed.data.amountMinor > remaining) {
    return { status: 'error', message: 'exceedsAdvance' };
  }

  const { error } = await supabase.from('government_disbursements').insert({
    advance_id: parsed.data.advanceId,
    case_id: parsed.data.caseId,
    authority_name: parsed.data.authorityName,
    purpose: parsed.data.purpose,
    amount_minor: parsed.data.amountMinor,
    paid_on: parsed.data.paidOn,
    challan_no: parsed.data.challanNo || null,
    recorded_by: session.userId,
  });

  if (error) return { status: 'error', message: 'generic' };

  // Checked for a row: a disbursement recorded against an advance whose
  // running total never moved is a reconciliation that silently does not add up.
  const { data: advanceRows, error: advanceError } = await supabase
    .from('government_fee_advances')
    .update({ disbursed_minor: advance.disbursed_minor + parsed.data.amountMinor })
    .eq('id', parsed.data.advanceId)
    .select('id');

  if (advanceError || (advanceRows ?? []).length === 0) {
    logger.error('finance.advance_not_updated', {
      advanceId: parsed.data.advanceId,
      code: advanceError?.code ?? 'no_rows',
    });
    return { status: 'error', message: 'generic' };
  }

  await recordAudit({
    action: 'disbursement.recorded',
    targetType: 'government_disbursement',
    caseId: parsed.data.caseId,
    metadata: {
      authorityName: parsed.data.authorityName,
      amountMinor: parsed.data.amountMinor,
      hasChallan: Boolean(parsed.data.challanNo),
    },
  });

  revalidatePath(`/${await getLocale()}/admin/finance`);
  return { status: 'success', message: 'saved' };
}
