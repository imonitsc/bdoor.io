/**
 * Unit-economics formulas (master instruction §13.3), version 1.
 *
 * Pure functions over integer minor units so every number on the metrics
 * dashboard and in a snapshot is reproducible in a test. The same definitions
 * are seeded in `public.metric_definitions`; a formula change is a new
 * version there, and a change here must bump that version — never a silent
 * edit (docs/METRIC_DEFINITIONS.md).
 *
 * A metric with an empty denominator is `null`, deliberately: "no data" must
 * render as "no data", never as a flattering zero.
 */

export type BillingPeriod = 'month' | 'year';

export type ActiveSubscriptionLike = {
  status: string;
  billingPeriod: BillingPeriod;
  amountMinor: number;
};

/** MRR: active subscriptions normalised to a month; annual plans ÷ 12. */
export function mrrMinor(subscriptions: readonly ActiveSubscriptionLike[]): number {
  let total = 0;
  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;
    total += sub.billingPeriod === 'year' ? Math.round(sub.amountMinor / 12) : sub.amountMinor;
  }
  return total;
}

export function arrMinor(mrr: number): number {
  return mrr * 12;
}

/** Net revenue: collected cash minus pass-through government/statutory money. */
export function netRevenueMinor(collectedCashMinor: number, passThroughMinor: number): number {
  return collectedCashMinor - passThroughMinor;
}

/** CAC. Null until finance records spend — never a fake zero-cost customer. */
export function cacMinor(
  acquisitionSpendMinor: number | null,
  newPayingCustomers: number,
): number | null {
  if (acquisitionSpendMinor === null || newPayingCustomers <= 0) return null;
  return Math.round(acquisitionSpendMinor / newPayingCustomers);
}

/** Gross margin as a ratio in [0, 1] (or negative when delivery costs exceed revenue). */
export function grossMarginRatio(
  netRevenue: number,
  directDeliveryCostsMinor: number,
): number | null {
  if (netRevenue === 0) return null;
  return (netRevenue - directDeliveryCostsMinor) / netRevenue;
}

export function contributionMarginMinor(
  netRevenue: number,
  providerCostsMinor: number,
  paymentFeesMinor: number,
  caseVariableCostsMinor: number,
): number {
  return netRevenue - providerCostsMinor - paymentFeesMinor - caseVariableCostsMinor;
}

export function cacPaybackMonths(
  cac: number | null,
  averageMonthlyGrossProfitPerNewCustomerMinor: number,
): number | null {
  if (cac === null || averageMonthlyGrossProfitPerNewCustomerMinor <= 0) return null;
  return cac / averageMonthlyGrossProfitPerNewCustomerMinor;
}

export function renewalRate(renewed: number, dueForRenewal: number): number | null {
  if (dueForRenewal <= 0) return null;
  return renewed / dueForRenewal;
}

/** Conversion between two funnel stages, null while the upstream stage is empty. */
export function conversionRate(downstream: number, upstream: number): number | null {
  if (upstream <= 0) return null;
  return downstream / upstream;
}
