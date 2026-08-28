import { describe, expect, it } from 'vitest';
import { computeLayerTotals, PRICING_FIXTURES } from '@/features/packages/pricing';
import { INTERNATIONAL_OFFERS } from '@/content/packages/catalog';

describe('package pricing layers', () => {
  it('sums UK LTD bdoor and Companies House fee to GBP 349', () => {
    const offer = INTERNATIONAL_OFFERS.find((o) => o.slug === 'uk-non-resident-ltd');
    expect(offer).toBeDefined();
    const totals = computeLayerTotals(offer!.feeComponents);
    expect(totals.bdoorMinor).toBe(PRICING_FIXTURES.ukLtd.bdoor);
    expect(totals.governmentMinor).toBe(PRICING_FIXTURES.ukLtd.government);
    expect(totals.estimatedTotalMinor).toBe(PRICING_FIXTURES.ukLtd.total);
  });

  it('sums UAE Sharjah route to AED 9,375', () => {
    const offer = INTERNATIONAL_OFFERS.find((o) => o.slug === 'uae-sharjah-no-visa');
    expect(offer).toBeDefined();
    const totals = computeLayerTotals(offer!.feeComponents);
    expect(totals.bdoorMinor).toBe(PRICING_FIXTURES.uaeSharjah.bdoor);
    expect(totals.governmentMinor).toBe(PRICING_FIXTURES.uaeSharjah.government);
    expect(totals.estimatedTotalMinor).toBe(PRICING_FIXTURES.uaeSharjah.total);
  });

  it('sums Singapore government fees to SGD 315', () => {
    const offer = INTERNATIONAL_OFFERS.find((o) => o.slug === 'singapore-pte-ltd');
    expect(offer).toBeDefined();
    const totals = computeLayerTotals(offer!.feeComponents);
    const gov = totals.governmentMinor;
    expect(gov).toBe(PRICING_FIXTURES.singaporeGov.total);
  });

  it('computes USA Wyoming LLC estimated total USD 449', () => {
    const offer = INTERNATIONAL_OFFERS.find((o) => o.slug === 'usa-wyoming-llc');
    expect(offer).toBeDefined();
    const totals = computeLayerTotals(offer!.feeComponents);
    expect(totals.estimatedTotalMinor).toBe(449_00);
  });

  it('keeps tax at zero when treatment is pending_review', () => {
    const offer = INTERNATIONAL_OFFERS.find((o) => o.slug === 'uk-non-resident-ltd');
    const totals = computeLayerTotals(offer!.feeComponents);
    expect(totals.taxMinor).toBe(0);
  });
});

describe('PRICING_FIXTURES UAE Dubai route', () => {
  it('matches AED 2,500 + AED 12,500 = AED 15,000', () => {
    const { bdoor, government, total } = PRICING_FIXTURES.uaeDubai;
    expect(bdoor + government).toBe(total);
  });
});
