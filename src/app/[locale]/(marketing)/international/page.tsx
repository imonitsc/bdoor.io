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
import { getCountries, pickCountryName } from '@/features/countries/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

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
  const [t, countries] = await Promise.all([getTranslations('international'), getCountries()]);
  const loc = locale as Locale;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="text-muted max-w-3xl text-base leading-relaxed">{t('intro')}</p>

          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {countries.map((country) => {
              const isAvailable = country.status === 'published';
              return (
                <li key={country.code}>
                  <Card as="article" className="flex h-full flex-col gap-4 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-ink text-lg font-semibold">
                        {pickCountryName(country, loc)}
                      </h2>
                      <Badge tone={isAvailable ? 'success' : 'neutral'}>
                        {isAvailable ? t('status.available') : t('status.comingSoon')}
                      </Badge>
                    </div>
                    {country.summary ? (
                      <p className="text-muted text-sm leading-relaxed">
                        {pick(country.summary, loc)}
                      </p>
                    ) : null}
                    {isAvailable ? (
                      <Button asChild variant="secondary" size="sm" className="mt-auto w-fit">
                        <Link href={MARKETING_ROUTES.services}>
                          {t('exploreBangladesh')}
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : (
                      <p className="text-muted mt-auto text-xs">{t('notifyNote')}</p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>

          <div className="mt-12 max-w-prose">
            <IndependenceDisclosure />
          </div>
        </div>
      </Section>
    </>
  );
}
