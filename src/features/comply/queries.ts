import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * The organisation's Comply position, for the workspace surfaces. RLS scopes
 * the query to the caller's organisations, so no organisation id is taken
 * from the caller.
 */
export type ComplySubscriptionState =
  | { kind: 'none' }
  | {
      kind: 'pending' | 'active' | 'past_due' | 'paused';
      subscriptionId: string;
      planName: { en: string; bn: string };
      billingPeriod: 'month' | 'year';
      amountMinor: number;
      currency: string;
      currentPeriodEnd: string | null;
    };

export async function getComplySubscriptionState(): Promise<ComplySubscriptionState> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select(
      'id, status, current_period_end, subscription_plans(name_en, name_bn, billing_period, amount_minor, currency)',
    )
    .in('status', ['pending_activation', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1);

  type Row = {
    id: string;
    status: string;
    current_period_end: string | null;
    subscription_plans: {
      name_en: string;
      name_bn: string;
      billing_period: string;
      amount_minor: number;
      currency: string;
    } | null;
  };

  const row = (data ?? [])[0] as unknown as Row | undefined;
  if (!row?.subscription_plans) return { kind: 'none' };

  return {
    kind:
      row.status === 'pending_activation'
        ? 'pending'
        : (row.status as 'active' | 'past_due' | 'paused'),
    subscriptionId: row.id,
    planName: { en: row.subscription_plans.name_en, bn: row.subscription_plans.name_bn },
    billingPeriod: row.subscription_plans.billing_period === 'month' ? 'month' : 'year',
    amountMinor: row.subscription_plans.amount_minor,
    currency: row.subscription_plans.currency,
    currentPeriodEnd: row.current_period_end,
  };
}
