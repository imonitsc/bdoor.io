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
import { internationalCountries, pickText } from '@/content/international';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * The international overview reads the commercial catalog, not the countries
 * table: the honest public status of each route is configuration the owner
 * controls in code review, and the page must not be able to drift from it.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'international' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/international'),
      languages: {
        en: localizedUrl('en', '/international'),
        'bn-BD': localizedUrl('bn', '/international'),
      },
    },
  };
}

export default async function InternationalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('international');
  const loc = locale as Locale;
  const countries = internationalCountries();

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="text-muted max-w-3xl text-base leading-relaxed">{t('intro')}</p>

          <div className="border-border bg-surface mt-10 flex flex-col gap-4 rounded-[var(--radius-panel)] border p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <h2 className="text-ink text-lg font-semibold">{t('bangladeshTitle')}</h2>
              <p className="text-muted mt-1 max-w-xl text-sm leading-relaxed">
                {t('bangladeshBody')}
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={MARKETING_ROUTES.services}>
                {t('exploreBangladesh')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <h2 className="text-ink mt-14 text-xl font-semibold">{t('routesTitle')}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {countries.map((country) => {
              const name = pickText(country.name, loc);
              return (
                <li key={country.slug}>
                  <Card as="article" className="flex h-full flex-col gap-3 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-ink text-lg font-semibold">{name}</h3>
                      <Badge tone="neutral">{t(`status.${country.offer.publicStatus}`)}</Badge>
                    </div>
                    <p className="text-muted flex-1 text-sm leading-relaxed">
                      {pickText(country.offer.summary, loc)}
                    </p>
                    <Button asChild variant="secondary" size="sm" className="w-fit">
                      <Link href={`/international/${country.slug}`}>
                        {t('viewRoute', { country: name })}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>

          <p className="text-muted mt-8 max-w-2xl text-sm leading-relaxed">{t('notifyNote')}</p>

          <div className="mt-12 max-w-prose">
            <IndependenceDisclosure />
          </div>
        </div>
      </Section>
    </>
  );
}
