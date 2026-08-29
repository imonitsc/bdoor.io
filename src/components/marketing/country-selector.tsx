import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BANGLADESH_COUNTRY, internationalCountries, pickText } from '@/content/international';
import type { Locale } from '@/features/catalog/types';

/**
 * The homepage seven-country selector: Bangladesh first and visually larger
 * (it is the operating market and 65% of the positioning), six international
 * cards compact after it. Each card links to its country page and shows the
 * route's honest public status. No price and no internal status word appears
 * here: while a route has no approved provider and price sheet there is no
 * figure that would be true, and "draft" is a workflow state, not a message
 * to a customer.
 */
export function CountrySelector({ locale }: { locale: Locale }) {
  const t = useTranslations('international');
  const tCountries = useTranslations('countries');

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <li className="sm:col-span-2">
        <Card
          as="article"
          className="group border-accent/40 relative flex h-full flex-col p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-ink text-lg font-semibold">
              <Link
                href={`/countries/${BANGLADESH_COUNTRY.slug}`}
                className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                {pickText(BANGLADESH_COUNTRY.name, locale)}
              </Link>
            </h3>
            <Badge tone="success">{tCountries('bangladesh.badge')}</Badge>
          </div>
          <p className="text-muted mt-2 flex-1 text-sm leading-relaxed">
            {tCountries('bangladesh.body')}
          </p>
          <p className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
            {t('viewRoute', { country: pickText(BANGLADESH_COUNTRY.name, locale) })}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </p>
        </Card>
      </li>
      {internationalCountries().map((country) => {
        const name = pickText(country.name, locale);
        return (
          <li key={country.slug}>
            <Card as="article" className="group relative flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-ink text-base font-semibold">
                  <Link
                    href={`/countries/${country.slug}`}
                    className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {name}
                  </Link>
                </h3>
                <Badge tone="neutral">{t(`status.${country.offer.publicStatus}`)}</Badge>
              </div>
              <p className="text-muted mt-2 flex-1 text-sm leading-relaxed">
                {pickText(country.offer.summary, locale)}
              </p>
              <p className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
                {t('viewRoute', { country: name })}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
