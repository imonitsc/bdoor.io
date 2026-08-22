import { describe, expect, it } from 'vitest';
import {
  computeQuoteTotals,
  isPassThrough,
  lineTaxMinor,
  quoteIsExpired,
  roundMinor,
  type QuoteItemInput,
} from '@/features/quotes/money';

function item(overrides: Partial<QuoteItemInput> = {}): QuoteItemInput {
  return {
    category: 'platform_service_fee',
    quantity: 1,
    unitAmountMinor: 100_000,
    taxRateBp: 0,
    taxTreatment: 'exclusive',
    isEstimate: false,
    isRefundable: false,
    payee: 'bdoor',
    ...overrides,
  };
}

describe('quote money', () => {
  it('rounds half away from zero in both directions', () => {
    expect(roundMinor(2.5)).toBe(3);
    expect(roundMinor(-2.5)).toBe(-3);
    expect(roundMinor(2.4)).toBe(2);
  });

  it('adds exclusive tax on top of the line', () => {
    expect(lineTaxMinor(item({ unitAmountMinor: 100_000, taxRateBp: 1500 }))).toBe(15_000);
  });

  it('extracts inclusive tax from within the line rather than adding more', () => {
    // 115,000 inclusive of 15% is 15,000 of tax, not 17,250.
    expect(
      lineTaxMinor(item({ unitAmountMinor: 115_000, taxRateBp: 1500, taxTreatment: 'inclusive' })),
    ).toBe(15_000);
  });

  it('never taxes a line marked not applicable', () => {
    expect(lineTaxMinor(item({ taxRateBp: 1500, taxTreatment: 'not_applicable' }))).toBe(0);
  });

  it('keeps BDoor revenue separate from money collected for others', () => {
    const totals = computeQuoteTotals([
      item({ unitAmountMinor: 2_500_000, taxRateBp: 1500 }),
      item({
        category: 'government_fee_estimate',
        unitAmountMinor: 1_800_000,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        isEstimate: true,
        isRefundable: true,
      }),
      item({
        category: 'partner_professional_fee',
        unitAmountMinor: 1_200_000,
        payee: 'partner_firm',
      }),
    ]);

    expect(totals.bdoorRevenueMinor).toBe(2_500_000);
    expect(totals.passThroughMinor).toBe(3_000_000);
    expect(totals.estimatedMinor).toBe(1_800_000);
    expect(totals.refundableMinor).toBe(1_800_000);
    expect(totals.taxMinor).toBe(375_000);
    expect(totals.subtotalMinor).toBe(5_500_000);
    expect(totals.totalMinor).toBe(5_875_000);
  });

  it('subtracts a discount rather than adding it', () => {
    const totals = computeQuoteTotals([
      item({ unitAmountMinor: 1_000_000 }),
      item({ category: 'discount', unitAmountMinor: -200_000 }),
    ]);
    expect(totals.subtotalMinor).toBe(800_000);
    expect(totals.byCategory.discount).toBe(-200_000);
  });

  it('multiplies by quantity before rounding', () => {
    const totals = computeQuoteTotals([item({ unitAmountMinor: 33_333, quantity: 3 })]);
    expect(totals.subtotalMinor).toBe(99_999);
  });

  it('classifies which categories are money that is not ours', () => {
    expect(isPassThrough('government_fee_estimate')).toBe(true);
    expect(isPassThrough('partner_professional_fee')).toBe(true);
    expect(isPassThrough('third_party_cost')).toBe(true);
    expect(isPassThrough('platform_service_fee')).toBe(false);
    expect(isPassThrough('tax')).toBe(false);
  });

  it('treats a quote as valid through the whole of its final day', () => {
    const validUntil = '2026-06-30';
    expect(quoteIsExpired(validUntil, new Date('2026-06-30T09:00:00Z'))).toBe(false);
    expect(quoteIsExpired(validUntil, new Date('2026-06-30T23:59:58Z'))).toBe(false);
    expect(quoteIsExpired(validUntil, new Date('2026-07-01T00:00:01Z'))).toBe(true);
  });
});
