import { useTranslations } from 'next-intl';
import { STANDALONE_SERVICES } from '@/content/packages/catalog';
import { pick, type Locale } from '@/features/catalog/types';

export function SpecialistServicesList({ locale }: { locale: Locale }) {
  const t = useTranslations('packages.specialist');

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {STANDALONE_SERVICES.map((service) => (
        <li
          key={service.slug}
          className="border-border flex flex-col gap-1 border-b pb-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between"
        >
          <span className="text-ink text-sm font-medium">{pick(service.name, locale)}</span>
          <span className="text-muted text-sm">
            BDT {service.bdoorFeeBdt.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')} ·{' '}
            {pick(service.note, locale)}
          </span>
        </li>
      ))}
      <li className="text-muted text-xs leading-relaxed">{t('moreOnRequest')}</li>
    </ul>
  );
}
