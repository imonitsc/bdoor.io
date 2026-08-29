import type { PackageFeeComponent } from './types';

export type LayerTotals = {
  bdoorMinor: number;
  governmentMinor: number;
  partnerMinor: number;
  thirdPartyMinor: number;
  taxMinor: number;
  depositMinor: number;
  discountMinor: number;
  estimatedTotalMinor: number;
};

function layerAmount(
  components: readonly PackageFeeComponent[],
  layer: PackageFeeComponent['layer'],
): number {
  return components.filter((c) => c.layer === layer).reduce((sum, c) => sum + c.amountMinor, 0);
}

/** Sum fee layers for display and quote snapshots. All amounts in minor units. */
export function computeLayerTotals(components: readonly PackageFeeComponent[]): LayerTotals {
  const bdoorMinor = layerAmount(components, 'platform_service_fee');
  const governmentMinor = layerAmount(components, 'government_fee_estimate');
  const partnerMinor = layerAmount(components, 'partner_professional_fee');
  const thirdPartyMinor = layerAmount(components, 'third_party_cost');
  const taxMinor = layerAmount(components, 'tax');
  const depositMinor = layerAmount(components, 'refundable_deposit');
  const discountMinor = layerAmount(components, 'discount');

  return {
    bdoorMinor,
    governmentMinor,
    partnerMinor,
    thirdPartyMinor,
    taxMinor,
    depositMinor,
    discountMinor,
    estimatedTotalMinor:
      bdoorMinor +
      governmentMinor +
      partnerMinor +
      thirdPartyMinor +
      taxMinor +
      depositMinor -
      discountMinor,
  };
}

/** Representative international totals required by the pricing test matrix. */
export const PRICING_FIXTURES = {
  ukLtd: { bdoor: 249_00, government: 100_00, total: 349_00, currency: 'GBP' as const },
  uaeSharjah: { bdoor: 250_000, government: 687_500, total: 937_500, currency: 'AED' as const },
  uaeDubai: { bdoor: 250_000, government: 1_250_000, total: 1_500_000, currency: 'AED' as const },
  singaporeGov: { filing: 15_00, name: 300_00, total: 315_00, currency: 'SGD' as const },
} as const;
