'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { loadFunnelCounts, loadRecurringSummary, loadRevenueSummary } from './queries';

export type SnapshotState = { status: 'idle' | 'error' | 'success'; message?: string };

/**
 * Records the monthly snapshot (§14): the exact numbers, the definition
 * version, and who computed them. Append-only — a recomputation is a second
 * row for the same month, never an edit.
 */
export async function recordMetricSnapshot(
  _previous: SnapshotState,
  formData: FormData,
): Promise<SnapshotState> {
  const session = await requireCapability('metrics.snapshot');

  const monthInput = String(formData.get('month') ?? '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput)) {
    return { status: 'error', message: 'invalidMonth' };
  }
  const month = `${monthInput}-01`;

  const [funnel, revenue, recurring] = await Promise.all([
    loadFunnelCounts(),
    loadRevenueSummary(),
    loadRecurringSummary(),
  ]);

  const supabase = await createClient();
  const { error } = await supabase.from('metric_snapshots').insert({
    month,
    definitions_version: 1,
    computed_by: session.userId,
    note: String(formData.get('note') ?? '').slice(0, 500) || null,
    payload: {
      funnel,
      revenue: {
        grossTransactionValueMinor: revenue.grossTransactionValueMinor,
        refundedMinor: revenue.refundedMinor,
        collectedCashMinor: revenue.collectedCashMinor,
        passThroughMinor: revenue.passThroughMinor,
        netRevenueMinor: revenue.netRevenueMinor,
        truncated: revenue.truncated,
      },
      recurring,
    },
  });

  if (error) {
    logger.error('metrics.snapshot_failed', { code: error.code });
    return { status: 'error', message: 'generic' };
  }

  await recordAudit({
    action: 'metrics.snapshot_recorded',
    targetType: 'metric_snapshot',
    targetId: month,
    metadata: { month },
  });

  revalidatePath(`/${await getLocale()}/admin/metrics`);
  return { status: 'success', message: 'snapshotRecorded' };
}
