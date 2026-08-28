import { useTranslations } from 'next-intl';
import { computeLayerTotals } from '@/features/packages/pricing';
import { activePackageVersion, packageBySlug } from '@/content/packages/catalog';
import { pick, type Locale } from '@/features/catalog/types';

export function FeeBreakdownExample({ locale }: { locale: Locale }) {
  const t = useTranslations('packages.feeExample');
  const pkg = packageBySlug('limited-company');
  const version = pkg ? activePackageVersion(pkg) : null;
  if (!version) return null;

  const totals = computeLayerTotals(version.feeComponents);

  const rows = [
    { key: 'bdoor', amount: totals.bdoorMinor, label: t('bdoor') },
    { key: 'government', amount: totals.governmentMinor, label: t('government') },
    { key: 'partner', amount: totals.partnerMinor, label: t('partner') },
    { key: 'thirdParty', amount: totals.thirdPartyMinor, label: t('thirdParty') },
    { key: 'tax', amount: totals.taxMinor, label: t('tax'), note: t('taxPending') },
  ] as const;

  return (
    <div className="border-border bg-surface rounded-[var(--radius-panel)] border p-5 md:p-6">
      <h3 className="text-ink text-base font-semibold">{t('title')}</h3>
      <p className="text-muted mt-1 text-sm">{pick(version.publicLabel, locale)}</p>
      <dl className="divide-border mt-5 divide-y">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-ink text-sm font-medium">{row.label}</dt>
            <dd className="text-muted text-sm">
              {row.amount > 0
                ? `BDT ${(row.amount / 100).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}`
                : t('quotedAfterReview')}
              {'note' in row && row.note ? (
                <span className="text-muted block text-xs">{row.note}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-muted mt-4 text-xs leading-relaxed">{t('footnote')}</p>
    </div>
  );
}
