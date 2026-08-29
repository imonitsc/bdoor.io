import { useTranslations } from 'next-intl';
import { computeLayerTotals } from '@/features/packages/pricing';
import { activePackageVersion, packageBySlug } from '@/content/packages/catalog';
import type { Locale } from '@/features/catalog/types';

/**
 * One worked example of how a quote separates costs. The bdoor fee is a real
 * figure from the catalog; the variable lines are one honest statement rather
 * than a table of "quoted after review" rows, because a column of identical
 * placeholders communicates nothing and looks broken.
 */
export function FeeBreakdownExample({ locale }: { locale: Locale }) {
  const t = useTranslations('packages.feeExample');
  const pkg = packageBySlug('limited-company');
  const version = pkg ? activePackageVersion(pkg) : null;
  if (!version) return null;

  const totals = computeLayerTotals(version.feeComponents);
  const bdoorFee = `BDT ${(totals.bdoorMinor / 100).toLocaleString(
    locale === 'bn' ? 'bn-BD' : 'en-US',
  )}`;

  return (
    <div className="border-border bg-surface rounded-[var(--radius-panel)] border p-5 md:p-6">
      <h3 className="text-ink text-base font-semibold">{t('title')}</h3>
      <dl className="divide-border mt-5 divide-y">
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-ink text-sm font-medium">{t('bdoor')}</dt>
          <dd className="text-ink text-sm font-semibold">{bdoorFee}</dd>
        </div>
        <div className="py-3">
          <dt className="text-ink text-sm font-medium">{t('variable')}</dt>
          <dd className="text-muted mt-1 text-sm leading-relaxed">{t('variableNote')}</dd>
        </div>
      </dl>
      <p className="text-muted mt-4 text-xs leading-relaxed">{t('taxNote')}</p>
    </div>
  );
}
