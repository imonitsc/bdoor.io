import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { BANGLADESH_COUNTRY, internationalCountries, pickText } from '@/content/international';
import type { Locale } from '@/features/catalog/types';
import { operationalClaimsAllowed } from '@/lib/launch/gates';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * The countries index: Bangladesh first and largest, six international
 * routes after it. Everything reads the commercial catalog, so the honest
 * public status of each route is configuration the owner controls in code
 * review, and the page cannot drift from it.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'countries' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/countries'),
      languages: {
        en: localizedUrl('en', '/countries'),
        'bn-BD': localizedUrl('bn', '/countries'),
      },
    },
  };
}

export default async function CountriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('countries');
  const tIntl = await getTranslations('international');
  const loc = locale as Locale;
  const countries = internationalCountries();
  // While the legal documents are drafts nothing is chargeable, so the page
  // must not say Bangladesh is "open now" — enquiry-led copy renders instead.
  const operational = operationalClaimsAllowed();

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="text-muted max-w-3xl text-base leading-relaxed">{t('intro')}</p>

          <div className="border-border bg-surface mt-10 rounded-[var(--radius-panel)] border p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-ink text-xl font-semibold">
                    {pickText(BANGLADESH_COUNTRY.name, loc)}
                  </h2>
                  <Badge tone="success">
                    {operational ? t('bangladesh.badge') : t('bangladesh.previewBadge')}
                  </Badge>
                </div>
                <p className="text-muted mt-2 max-w-xl text-sm leading-relaxed">
                  {operational ? t('bangladesh.body') : t('bangladesh.previewBody')}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Button asChild size="lg">
                  <Link href={`/countries/${BANGLADESH_COUNTRY.slug}`}>
                    {t('bangladesh.cta')}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="link" size="sm">
                  <Link href={MARKETING_ROUTES.pricing}>{t('bangladesh.pricingCta')}</Link>
                </Button>
              </div>
            </div>
          </div>

          <h2 className="text-ink mt-14 text-xl font-semibold">{t('routesTitle')}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => {
              const name = pickText(country.name, loc);
              return (
                <li key={country.slug}>
                  <Card as="article" className="flex h-full flex-col gap-3 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-ink text-lg font-semibold">{name}</h3>
                      <Badge tone="neutral">{tIntl(`status.${country.offer.publicStatus}`)}</Badge>
                    </div>
                    <p className="text-muted flex-1 text-sm leading-relaxed">
                      {pickText(country.offer.summary, loc)}
                    </p>
                    <Button asChild variant="secondary" size="sm" className="w-fit">
                      <Link href={`/countries/${country.slug}`}>
                        {tIntl('viewRoute', { country: name })}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>

          <p className="text-muted mt-8 max-w-2xl text-sm leading-relaxed">{tIntl('notifyNote')}</p>

          <div className="mt-12 max-w-prose">
            <IndependenceDisclosure />
          </div>
        </div>
      </Section>
    </>
  );
}
