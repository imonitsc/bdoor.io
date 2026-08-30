import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { ANALYTICS_EVENTS, type AnalyticsEvent } from '@/lib/analytics/taxonomy';
import { arrMinor, mrrMinor, netRevenueMinor, type BillingPeriod } from './formulas';

/**
 * Dashboard reads (§13). Everything goes through the caller's own RLS-bound
 * client — the metrics capabilities decide who reaches the page, and the
 * row policies decide again in the database.
 *
 * Every figure excludes test traffic: `is_test` events, sandbox payments.
 * Queries are bounded (head-only counts, or a hard row cap far above today's
 * volume); Phase 5 replaces the capped sums with SQL aggregates when volume
 * justifies it.
 */

const ROW_CAP = 10_000;

export type FunnelCounts = Record<AnalyticsEvent, number>;

export async function loadFunnelCounts(since?: Date): Promise<FunnelCounts> {
  const supabase = await createClient();

  const counts = await Promise.all(
    ANALYTICS_EVENTS.map(async (event) => {
      let query = supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', event)
        .eq('is_test', false);
      if (since) query = query.gte('occurred_at', since.toISOString());
      const { count } = await query;
      return [event, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(counts) as FunnelCounts;
}

export type RevenueSummary = {
  grossTransactionValueMinor: number;
  refundedMinor: number;
  collectedCashMinor: number;
  passThroughMinor: number;
  netRevenueMinor: number;
  paidPaymentCount: number;
  /** True when the row cap was hit and the sums may undercount. */
  truncated: boolean;
};

export async function loadRevenueSummary(): Promise<RevenueSummary> {
  const supabase = await createClient();

  const [paymentsResult, acceptedResult] = await Promise.all([
    supabase
      .from('payments')
      .select('amount_minor, refunded_minor')
      .in('status', ['paid', 'partially_refunded', 'refunded'])
      .eq('is_sandbox', false)
      .limit(ROW_CAP),
    supabase
      .from('quote_versions')
      .select('pass_through_minor, accepted_at')
      .not('accepted_at', 'is', null)
      .limit(ROW_CAP),
  ]);

  const payments = paymentsResult.data ?? [];
  const accepted = acceptedResult.data ?? [];

  const gross = payments.reduce((sum, p) => sum + p.amount_minor, 0);
  const refunded = payments.reduce((sum, p) => sum + p.refunded_minor, 0);
  const passThrough = accepted.reduce((sum, v) => sum + v.pass_through_minor, 0);
  const collected = gross - refunded;

  return {
    grossTransactionValueMinor: gross,
    refundedMinor: refunded,
    collectedCashMinor: collected,
    passThroughMinor: passThrough,
    netRevenueMinor: netRevenueMinor(collected, passThrough),
    paidPaymentCount: payments.length,
    truncated: payments.length >= ROW_CAP || accepted.length >= ROW_CAP,
  };
}

export type RecurringSummary = {
  activeSubscriptions: number;
  mrrMinor: number;
  arrMinor: number;
};

export async function loadRecurringSummary(): Promise<RecurringSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('status, subscription_plans(billing_period, amount_minor)')
    .eq('status', 'active')
    .limit(ROW_CAP);

  type Row = {
    status: string;
    subscription_plans: { billing_period: BillingPeriod; amount_minor: number } | null;
  };
  const rows = (data ?? []) as unknown as Row[];
  const subs = rows
    .filter((row) => row.subscription_plans !== null)
    .map((row) => ({
      status: row.status,
      billingPeriod: row.subscription_plans!.billing_period,
      amountMinor: row.subscription_plans!.amount_minor,
    }));

  const mrr = mrrMinor(subs);
  return { activeSubscriptions: subs.length, mrrMinor: mrr, arrMinor: arrMinor(mrr) };
}

export type SnapshotRow = {
  id: string;
  month: string;
  payload: Record<string, unknown>;
  definitions_version: number;
  computed_at: string;
  note: string | null;
};

export async function loadSnapshots(limit = 12): Promise<SnapshotRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('metric_snapshots')
    .select('id, month, payload, definitions_version, computed_at, note')
    .order('month', { ascending: false })
    .order('computed_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as SnapshotRow[];
}
