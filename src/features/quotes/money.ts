import type { Enums } from '@/types/database';

export type Currency = Enums<'currency_code'>;
export type QuoteItemCategory = Enums<'quote_item_category'>;
export type PayeeType = Enums<'payee_type'>;

/**
 * All money is handled in minor units (paisa / cents) as integers. Nothing in
 * this file ever produces a float, so a quote total is exactly what was shown.
 */
export const MINOR_UNITS: Record<Currency, number> = { BDT: 100, USD: 100 };

export type QuoteItemInput = {
  category: QuoteItemCategory;
  quantity: number;
  unitAmountMinor: number;
  /** Basis points: 1500 = 15%. */
  taxRateBp: number;
  taxTreatment: 'inclusive' | 'exclusive' | 'not_applicable';
  isEstimate: boolean;
  isRefundable: boolean;
  payee: PayeeType;
};

export type QuoteTotals = {
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  /** What BDoor actually earns. */
  bdoorRevenueMinor: number;
  /** Money collected on someone else's behalf: authorities, partners, third parties. */
  passThroughMinor: number;
  /** How much of the total is a not-yet-verified estimate. */
  estimatedMinor: number;
  refundableMinor: number;
  byCategory: Record<QuoteItemCategory, number>;
};

/** Round half away from zero, which is what an invoice reader expects. */
export function roundMinor(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

export function lineSubtotalMinor(item: QuoteItemInput): number {
  return roundMinor(item.unitAmountMinor * item.quantity);
}

export function lineTaxMinor(item: QuoteItemInput): number {
  if (item.taxTreatment === 'not_applicable' || item.taxRateBp <= 0) return 0;

  const subtotal = lineSubtotalMinor(item);
  if (item.taxTreatment === 'inclusive') {
    // Tax already inside the amount: extract it rather than adding more.
    return roundMinor((subtotal * item.taxRateBp) / (10_000 + item.taxRateBp));
  }
  return roundMinor((subtotal * item.taxRateBp) / 10_000);
}

const EMPTY_BY_CATEGORY: Record<QuoteItemCategory, number> = {
  platform_service_fee: 0,
  government_fee_estimate: 0,
  partner_professional_fee: 0,
  third_party_cost: 0,
  tax: 0,
  payment_processing_fee: 0,
  discount: 0,
};

export function computeQuoteTotals(items: readonly QuoteItemInput[]): QuoteTotals {
  const byCategory = { ...EMPTY_BY_CATEGORY };
  let subtotalMinor = 0;
  let taxMinor = 0;
  let bdoorRevenueMinor = 0;
  let passThroughMinor = 0;
  let estimatedMinor = 0;
  let refundableMinor = 0;

  for (const item of items) {
    const line = lineSubtotalMinor(item);
    const tax = lineTaxMinor(item);

    byCategory[item.category] += line;

    // An inclusive-tax line already contains its tax, so it is not added again.
    subtotalMinor += item.taxTreatment === 'inclusive' ? line - tax : line;
    taxMinor += tax;

    if (item.payee === 'bdoor' && item.category !== 'tax') {
      bdoorRevenueMinor += line;
    } else if (item.payee !== 'bdoor') {
      passThroughMinor += line;
    }

    if (item.isEstimate) estimatedMinor += line;
    if (item.isRefundable) refundableMinor += line;
  }

  return {
    subtotalMinor,
    taxMinor,
    totalMinor: subtotalMinor + taxMinor,
    bdoorRevenueMinor,
    passThroughMinor,
    estimatedMinor,
    refundableMinor,
    byCategory,
  };
}

/** Categories whose money is never BDoor's. Rendered separately in the UI. */
export const PASS_THROUGH_CATEGORIES: readonly QuoteItemCategory[] = [
  'government_fee_estimate',
  'partner_professional_fee',
  'third_party_cost',
] as const;

export function isPassThrough(category: QuoteItemCategory): boolean {
  return PASS_THROUGH_CATEGORIES.includes(category);
}

export function formatMinor(amountMinor: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'BDT' ? 0 : 2,
  }).format(amountMinor / MINOR_UNITS[currency]);
}

export function quoteIsExpired(validUntil: string | Date, now: Date): boolean {
  const until = typeof validUntil === 'string' ? new Date(`${validUntil}T23:59:59Z`) : validUntil;
  return until.getTime() < now.getTime();
}
