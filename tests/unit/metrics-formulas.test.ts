import { describe, expect, it } from 'vitest';
import {
  arrMinor,
  cacMinor,
  cacPaybackMonths,
  contributionMarginMinor,
  conversionRate,
  grossMarginRatio,
  mrrMinor,
  netRevenueMinor,
  renewalRate,
} from '@/features/metrics/formulas';

/**
 * §13.3 formulas, version 1. The rule under test throughout: an empty
 * denominator is null ("no data"), never a flattering zero.
 */

describe('mrr / arr', () => {
  it('normalises annual plans to a month and ignores non-active subscriptions', () => {
    const mrr = mrrMinor([
      { status: 'active', billingPeriod: 'month', amountMinor: 1_190_000 },
      { status: 'active', billingPeriod: 'year', amountMinor: 4_990_000 },
      { status: 'past_due', billingPeriod: 'month', amountMinor: 1_190_000 },
      { status: 'cancelled', billingPeriod: 'year', amountMinor: 4_990_000 },
    ]);
    expect(mrr).toBe(1_190_000 + Math.round(4_990_000 / 12));
    expect(arrMinor(mrr)).toBe(mrr * 12);
  });

  it('is zero with no active subscriptions', () => {
    expect(mrrMinor([])).toBe(0);
  });
});

describe('net revenue and margins', () => {
  it('subtracts pass-through money from collected cash', () => {
    expect(netRevenueMinor(1_000_000, 350_000)).toBe(650_000);
  });

  it('computes gross margin as a ratio and refuses a zero denominator', () => {
    expect(grossMarginRatio(1_000_000, 400_000)).toBeCloseTo(0.6);
    expect(grossMarginRatio(0, 400_000)).toBeNull();
  });

  it('contribution margin subtracts every variable cost', () => {
    expect(contributionMarginMinor(1_000_000, 300_000, 25_000, 75_000)).toBe(600_000);
  });
});

describe('cac and payback', () => {
  it('is null until spend is recorded — no fake zero-cost customers', () => {
    expect(cacMinor(null, 10)).toBeNull();
    expect(cacMinor(500_000, 0)).toBeNull();
    expect(cacMinor(500_000, 10)).toBe(50_000);
  });

  it('payback needs both a CAC and positive monthly gross profit', () => {
    expect(cacPaybackMonths(null, 10_000)).toBeNull();
    expect(cacPaybackMonths(30_000, 0)).toBeNull();
    expect(cacPaybackMonths(30_000, 10_000)).toBe(3);
  });
});

describe('rates', () => {
  it('renewal rate over the eligible denominator only', () => {
    expect(renewalRate(3, 4)).toBe(0.75);
    expect(renewalRate(0, 0)).toBeNull();
  });

  it('funnel conversion refuses an empty upstream stage', () => {
    expect(conversionRate(5, 20)).toBe(0.25);
    expect(conversionRate(0, 0)).toBeNull();
  });
});
