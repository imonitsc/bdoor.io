import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { homepageCountries, pickText } from '@/content/international';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';

/**
 * Four international country cards on the homepage (master §8).
 * No "Draft" badge — internal status never reaches customers. Checkout stays
 * off; the CTA opens the country page / assessment.
 */
export function InternationalOfferCards({ locale }: { locale: Locale }) {
  const t = useTranslations('home.international');
  const tStatus = useTranslations('international.status');
  const countries = homepageCountries();

  return (
    <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {countries.map((country) => {
        const { offer } = country;
        return (
          <li key={country.slug}>
            <article className="border-border flex h-full flex-col border-b pb-6">
              <p className="text-muted font-mono text-xs tracking-[0.12em] uppercase">
                {pickText(country.name, locale)}
              </p>
              <h3 className="text-ink mt-2 text-base font-semibold">
                {pickText(offer.route, locale)}
              </h3>
              {offer.publicLabel ? (
                <>
                  <p className="text-ink mt-3 text-lg font-semibold">
                    {pickText(offer.publicLabel, locale)}
                  </p>
                  {offer.publicQualifier ? (
                    <p className="text-muted mt-1 text-xs leading-relaxed">
                      {pickText(offer.publicQualifier, locale)}
                    </p>
                  ) : null}
                </>
              ) : null}
              <p className="text-muted mt-3 flex-1 text-sm leading-relaxed">
                {pickText(offer.summary, locale)}
              </p>
              <p className="text-muted mt-3 text-xs">{tStatus(offer.publicStatus)}</p>
              <Link
                href={`${MARKETING_ROUTES.countries}/${country.slug}`}
                className="text-primary mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium"
              >
                {t('cta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
