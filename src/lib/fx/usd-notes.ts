import 'server-only';

import { getTranslations } from 'next-intl/server';
import { activePackageVersion, publishedPackages } from '@/content/packages/catalog';
import { computeLayerTotals } from '@/features/packages/pricing';
import { approxUsdMinorFromBdtMinor } from './convert';
import { usdBdtSnapshot } from './index';

/**
 * Localised "About $X · Rate checked …" lines for the Bangladesh package
 * cards, keyed by package slug. `undefined` when no reviewed rate is
 * configured — the cards then show BDT only, which is always truthful.
 * Computed server-side so the client bundle carries neither the rate nor
 * the conversion.
 */
export async function packageUsdNotes(
  locale: 'en' | 'bn',
): Promise<Record<string, string> | undefined> {
  const snapshot = usdBdtSnapshot();
  if (!snapshot) return undefined;

  const t = await getTranslations('packages');
  const numberFormat = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 0,
  });
  const dateFormat = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const date = dateFormat.format(new Date(`${snapshot.reviewedAt}T00:00:00Z`));

  return Object.fromEntries(
    publishedPackages().map((pkg) => {
      const version = activePackageVersion(pkg)!;
      const usdMinor = approxUsdMinorFromBdtMinor(
        computeLayerTotals(version.feeComponents).bdoorMinor,
        snapshot.rate,
      );
      return [pkg.slug, t('approxUsd', { amount: numberFormat.format(usdMinor / 100), date })];
    }),
  );
}
