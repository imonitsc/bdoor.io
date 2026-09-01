import 'server-only';

import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';

/**
 * A purchasable Comply plan: the contractual `subscription_plans` row joined
 * to its catalogue package. The amount here is the row a subscription bills
 * against — the same approved figure the catalogue's `publicLabel` prints,
 * and `tests/unit/comply-plans.test.ts` fails if the two ever drift.
 *
 * The plan is the bdoor professional fee only. Any filing a subscription
 * triggers still itemises government and provider amounts separately on its
 * own case — the fee-layer rule (§3) applies to recurring revenue too.
 */
export type ComplyPlan = {
  id: string;
  code: string;
  packageSlug: string | null;
  billingPeriod: 'month' | 'year';
  amountMinor: number;
  currency: string;
  name: { en: string; bn: string };
};

export async function listComplyPlans(): Promise<ComplyPlan[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('subscription_plans')
    .select(
      'id, code, version, billing_period, amount_minor, currency, name_en, name_bn, is_active, service_packages(slug)',
    )
    .eq('is_active', true)
    .order('amount_minor', { ascending: false });

  if (error) {
    logger.error('comply.plans_failed', { message: error.message });
    return [];
  }

  type Row = {
    id: string;
    code: string;
    version: number;
    billing_period: string;
    amount_minor: number;
    currency: string;
    name_en: string;
    name_bn: string;
    service_packages: { slug: string } | null;
  };

  // One plan per code: the highest version wins, matching how a price change
  // is recorded (a new version row, never an update).
  const byCode = new Map<string, Row>();
  for (const raw of (data ?? []) as unknown as Row[]) {
    const existing = byCode.get(raw.code);
    if (!existing || raw.version > existing.version) byCode.set(raw.code, raw);
  }

  return [...byCode.values()]
    .filter((row) => row.billing_period === 'month' || row.billing_period === 'year')
    .map((row) => ({
      id: row.id,
      code: row.code,
      packageSlug: row.service_packages?.slug ?? null,
      billingPeriod: row.billing_period as 'month' | 'year',
      amountMinor: row.amount_minor,
      currency: row.currency,
      name: { en: row.name_en, bn: row.name_bn },
    }));
}
