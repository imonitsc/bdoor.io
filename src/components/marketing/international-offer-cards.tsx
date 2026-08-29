import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { INTERNATIONAL_OFFERS } from '@/content/packages/catalog';
import { pick, type Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';

const COUNTRY_LABELS: Record<string, { en: string; bn: string }> = {
  US: { en: 'United States', bn: 'যুক্তরাষ্ট্র' },
  GB: { en: 'United Kingdom', bn: 'যুক্তরাজ্য' },
  AE: { en: 'United Arab Emirates', bn: 'সংযুক্ত আরব আমিরাত' },
  SG: { en: 'Singapore', bn: 'সিঙ্গাপুর' },
};

export function InternationalOfferCards({ locale }: { locale: Locale }) {
  const t = useTranslations('packages.international');

  const byCountry = ['US', 'GB', 'AE', 'SG'].map((code) => {
    const offer = INTERNATIONAL_OFFERS.find((o) => o.countryCode === code);
    return { code, offer };
  });

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {byCountry.map(({ code, offer }) => (
        <li key={code}>
          <Card as="article" className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-ink text-base font-semibold">
                {pick(COUNTRY_LABELS[code]!, locale)}
              </h3>
              <Badge tone="neutral">{t('draft')}</Badge>
            </div>
            {offer ? (
              <>
                <p className="text-primary mt-2 text-sm font-semibold">
                  {pick(offer.publicLabel, locale)}
                </p>
                <p className="text-muted mt-2 flex-1 text-sm leading-relaxed">
                  {pick(offer.summary, locale)}
                </p>
              </>
            ) : (
              <p className="text-muted mt-2 text-sm">{t('comingSoon')}</p>
            )}
            <Link
              href={MARKETING_ROUTES.international}
              className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium"
            >
              {t('cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
