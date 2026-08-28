import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getCountry } from '@/features/directory/queries';
import { pickLocalized } from '@/features/directory/types';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

export async function generateStaticParams() {
  const { COUNTRIES } = await import('@/content/directory/countries');
  return COUNTRIES.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const country = await getCountry(slug);
  if (!country) return {};
  return {
    title: pickLocalized(country.name, locale as Locale),
    description: pickLocalized(country.summary, locale as Locale),
    alternates: {
      canonical: localizedUrl(locale as Locale, `/international/${slug}`),
      languages: {
        en: localizedUrl('en', `/international/${slug}`),
        'bn-BD': localizedUrl('bn', `/international/${slug}`),
      },
    },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const country = await getCountry(slug);
  if (!country) notFound();

  const [t, tCommon] = await Promise.all([
    getTranslations('internationalPage'),
    getTranslations('common'),
  ]);

  const available = country.operationalStatus === 'active';

  return (
    <>
      <PageHeader
        title={pickLocalized(country.name, loc)}
        description={pickLocalized(country.summary, loc)}
      />
      <Section className="py-12 md:py-16">
        <div className="container-page flex max-w-3xl flex-col gap-8">
          {available ? null : <Badge tone="neutral">{tCommon('comingSoon')}</Badge>}
          {available ? (
            <Alert tone="info" title={t('availableNote')} />
          ) : (
            <Alert tone="warning" title={t('unavailableNote')} />
          )}
          <p className="text-muted text-sm leading-relaxed">{t('providerNote')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {available ? (
              <Button asChild>
                <Link href={MARKETING_ROUTES.start}>
                  {t('startCta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={MARKETING_ROUTES.contact}>{t('interestCta')}</Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href={MARKETING_ROUTES.international}>{t('allCountries')}</Link>
            </Button>
          </div>
          <IndependenceDisclosure />
        </div>
      </Section>
    </>
  );
}
