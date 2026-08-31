import { defineCalculator } from './framework';
import {
  COMMERCIAL_REVIEW_DATE,
  activePackageVersion,
  packageBySlug,
} from '@/content/packages/catalog';
import type { PackageFeeComponent } from '@/features/packages/types';

/**
 * Service package estimate (§4.5 "Service package estimates").
 *
 * The one calculator whose every figure is already verified: bdoor's own
 * published catalog prices. The output keeps the money rule the whole product
 * lives by — bdoor's professional fee is totalled, a reviewed pass-through
 * figure is totalled SEPARATELY, and an estimate or unreviewed component is
 * listed by name with no amount, never folded into a total. A blended
 * "everything included" number cannot come out of this function.
 */

export type PackageEstimateInput = {
  slug: string;
};

export type EstimateLine = {
  label: { en: string; bn: string };
  payee: PackageFeeComponent['payee'];
  amountMinor: number;
};

export type PackageEstimate = {
  currency: 'BDT';
  /** bdoor's professional fee — the only figure bdoor itself charges. */
  bdoorFeeMinor: number;
  /** Pass-through figures with a recorded review, totalled apart, never blended. */
  reviewedPassThroughMinor: number;
  lines: EstimateLine[];
  /** Components carried as estimates or without a recorded review: named, no figure. */
  unpriced: Array<{ label: { en: string; bn: string }; payee: PackageFeeComponent['payee'] }>;
  packageVersion: number;
};

export const packageEstimate = defineCalculator<PackageEstimateInput, PackageEstimate | null>({
  id: 'bd-package-estimate',
  version: '2026-08-31.1',
  effectiveFrom: COMMERCIAL_REVIEW_DATE,
  sources: [
    {
      title: 'bdoor commercial catalog (published packages)',
      url: '/pricing',
      lastReviewed: COMMERCIAL_REVIEW_DATE,
    },
  ],
  compute: (input) => {
    const pkg = packageBySlug(input.slug);
    const version = pkg ? activePackageVersion(pkg) : undefined;
    if (!pkg || !version || version.status !== 'published') return null;

    let bdoorFeeMinor = 0;
    let reviewedPassThroughMinor = 0;
    const lines: EstimateLine[] = [];
    const unpriced: PackageEstimate['unpriced'] = [];

    for (const component of version.feeComponents) {
      // A figure enters a total only when it is exact and reviewed. An
      // estimate stays an estimate — named, never totalled.
      const verified = !component.isEstimate && Boolean(component.reviewedAt);

      if (!verified || component.amountMinor <= 0 || component.currency !== 'BDT') {
        unpriced.push({ label: component.label, payee: component.payee });
        continue;
      }

      lines.push({
        label: component.label,
        payee: component.payee,
        amountMinor: component.amountMinor,
      });
      if (component.payee === 'bdoor') bdoorFeeMinor += component.amountMinor;
      else reviewedPassThroughMinor += component.amountMinor;
    }

    return {
      currency: 'BDT',
      bdoorFeeMinor,
      reviewedPassThroughMinor,
      lines,
      unpriced,
      packageVersion: version.version,
    };
  },
});
