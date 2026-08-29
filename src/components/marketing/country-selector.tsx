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
 * route's honest public status plus the owner-published starting estimate —
 * always with its qualifier, because the figure is a starting estimate, not
 * a checkout total. No internal status word appears here: "draft" is a
 * workflow state, not a message to a customer.
 */
export function CountrySelector({
  locale,
  operational,
}: {
  locale: Locale;
  /** From `operationalClaimsAllowed()` — false renders enquiry-led copy. */
  operational: boolean;
}) {
  const t = useTranslations('international');
  const tCountries = useTranslations('countries');

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/*
        The flagship card wears the featured treatment: a 2px signature-
        gradient stroke (nested-div technique) with a cobalt-tinted shadow.
        This is the one "featured" the catalogue can prove — Bangladesh is
        the operating market — so the emphasis is factual, not decorative.
      */}
      <li className="sm:col-span-2">
        <div className="gradient-primary shadow-primary h-full rounded-[calc(var(--radius-card)+2px)] p-[2px]">
          <Card
            as="article"
            className="group relative flex h-full flex-col border-transparent p-5 md:p-6"
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
              <Badge tone="success">
                {tCountries(operational ? 'bangladesh.badge' : 'bangladesh.previewBadge')}
              </Badge>
            </div>
            <p className="text-muted mt-2 flex-1 text-sm leading-relaxed">
              {tCountries(operational ? 'bangladesh.body' : 'bangladesh.previewBody')}
            </p>
            <p className="text-ink mt-3 text-base font-semibold">
              {pickText(BANGLADESH_COUNTRY.featured.label, locale)}
              <span className="text-muted ml-2 text-sm font-normal">
                {pickText(BANGLADESH_COUNTRY.featured.alt, locale)}
              </span>
            </p>
            <p className="text-muted mt-0.5 text-xs">
              {pickText(BANGLADESH_COUNTRY.featured.qualifier, locale)}
            </p>
            <p className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
              {t('viewRoute', { country: pickText(BANGLADESH_COUNTRY.name, locale) })}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </p>
          </Card>
        </div>
      </li>
      {internationalCountries().map((country) => {
        const name = pickText(country.name, locale);
        return (
          <li key={country.slug}>
            <Card
              as="article"
              className="group relative flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
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
              {country.offer.publicLabel ? (
                <>
                  <p className="text-ink mt-3 text-sm font-semibold">
                    {pickText(country.offer.publicLabel, locale)}
                    {country.offer.publicLabelAlt ? (
                      <span className="text-muted ml-2 font-normal">
                        {pickText(country.offer.publicLabelAlt, locale)}
                      </span>
                    ) : null}
                  </p>
                  {country.offer.publicQualifier ? (
                    <p className="text-muted mt-0.5 text-xs">
                      {pickText(country.offer.publicQualifier, locale)}
                    </p>
                  ) : null}
                </>
              ) : null}
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
