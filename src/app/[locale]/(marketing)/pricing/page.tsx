import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getServices } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricingPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/pricing'),
      languages: {
        en: localizedUrl('en', '/pricing'),
        'bn-BD': localizedUrl('bn', '/pricing'),
      },
    },
  };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [t, tFees, tCommon, tServices, tHow, { data: services }, format] = await Promise.all([
    getTranslations('pricingPage'),
    getTranslations('services.feeCategories'),
    getTranslations('common'),
    getTranslations('services'),
    getTranslations('howItWorksPage'),
    getServices(),
    getFormatter(),
  ]);

  const withPublishedFee = services
    .filter((s) => s.startingFeeBdt !== null && s.status === 'published')
    .sort((a, b) => (a.startingFeeBdt ?? 0) - (b.startingFeeBdt ?? 0));

  const quotedOnly = services.filter((s) => s.startingFeeBdt === null && s.status === 'published');

  const inclusions = [
    { key: 'vatExcluded', included: false },
    { key: 'govExcluded', included: false },
    { key: 'partnerExcluded', included: false },
    { key: 'thirdPartyExcluded', included: false },
  ] as const;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="max-w-2xl text-base leading-relaxed text-muted">{t('intro')}</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle as="h2">{t('standardTitle')}</CardTitle>
                <CardDescription>{t('standardBody')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {withPublishedFee.map((service) => (
                    <li key={service.id} className="flex items-baseline justify-between gap-4 py-3">
                      <Link
                        href={`/services/${service.slug}`}
                        className="rounded text-sm text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                      >
                        {pick(service.name, loc)}
                      </Link>
                      <span className="whitespace-nowrap text-sm font-medium text-ink">
                        {format.number(service.startingFeeBdt!, 'bdt')}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle as="h2">{t('quoteTitle')}</CardTitle>
                <CardDescription>{t('quoteBody')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {quotedOnly.map((service) => (
                    <li key={service.id} className="flex items-baseline justify-between gap-4 py-3">
                      <Link
                        href={`/services/${service.slug}`}
                        className="rounded text-sm text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                      >
                        {pick(service.name, loc)}
                      </Link>
                      <span className="whitespace-nowrap text-sm text-muted">
                        {t('noPublishedFee')}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle as="h2">{t('subscriptionTitle')}</CardTitle>
                  <Badge tone="neutral">{tCommon('comingSoon')}</Badge>
                </div>
                <CardDescription>{t('subscriptionBody')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" block disabled>
                  {tCommon('comingSoon')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      <Section tone="surface" className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-xl font-semibold text-ink">{t('inclusionsTitle')}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {inclusions.map((row) => (
                <li key={row.key} className="flex items-start gap-2.5 text-sm">
                  {row.included ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                  )}
                  <span className="text-ink">{t(row.key)}</span>
                </li>
              ))}
            </ul>
            <Alert tone="info" className="mt-6">
              {tCommon('processingTimeNote')}
            </Alert>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink">{tServices('fees')}</h2>
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {(
                [
                  'platform_service_fee',
                  'government_fee_estimate',
                  'partner_professional_fee',
                  'third_party_cost',
                  'tax',
                  'payment_processing_fee',
                ] as const
              ).map((category) => (
                <li key={category} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="text-sm font-medium text-ink">{tFees(category)}</span>
                  <Badge tone={category === 'platform_service_fee' ? 'info' : 'neutral'}>
                    {category === 'platform_service_fee'
                      ? 'BDoor'
                      : category === 'government_fee_estimate'
                        ? tServices('authority')
                        : category === 'partner_professional_fee'
                          ? tHow('responsibilities.partner')
                          : '—'}
                  </Badge>
                </li>
              ))}
            </ul>
            <IndependenceDisclosure className="mt-6" />
          </div>
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <div className="container-page flex flex-col items-center gap-5 text-center">
          <h2 className="text-2xl font-semibold text-ink">{t('cta')}</h2>
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.start}>
              {t('cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
