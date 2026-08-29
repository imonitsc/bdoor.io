import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section, SectionHeading } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { PackageSelector } from '@/components/marketing/package-selector';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { BANGLADESH_COUNTRY, pickText } from '@/content/international';
import type { Locale } from '@/features/catalog/types';
import { packageUsdNotes } from '@/lib/fx/usd-notes';
import { operationalClaimsAllowed } from '@/lib/launch/gates';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * Bangladesh country hub — richer than international country pages
 * (production-fix §10). Routes to packages, services, foreign-founder entry
 * and the assessment without restating government fee figures.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'countries.bangladeshPage' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/countries/bangladesh'),
      languages: {
        en: localizedUrl('en', '/countries/bangladesh'),
        'bn-BD': localizedUrl('bn', '/countries/bangladesh'),
      },
    },
  };
}

export default async function BangladeshCountryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('countries.bangladeshPage');
  const loc = locale as Locale;
  const openItems = ['formation', 'licences', 'tax', 'compliance'] as const;
  const serviceCategories = ['start', 'licences', 'tax', 'changes', 'foreign'] as const;
  const operational = operationalClaimsAllowed();
  const usdNotes = await packageUsdNotes(loc);

  return (
    <>
      <PageHeader
        title={pickText(BANGLADESH_COUNTRY.name, loc)}
        description={operational ? t('lede') : t('previewLede')}
      />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <h2 className="text-ink text-xl font-semibold">
            {operational ? t('openTitle') : t('previewOpenTitle')}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {openItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="text-accent mt-1 size-4 shrink-0" aria-hidden="true" />
                <span className="text-ink text-sm leading-relaxed">{t(`open.${item}`)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Card as="article" className="flex h-full flex-col gap-3 p-6">
              <h3 className="text-ink text-lg font-semibold">{t('newBusiness.title')}</h3>
              <p className="text-muted flex-1 text-sm leading-relaxed">{t('newBusiness.body')}</p>
              <Button asChild variant="secondary" size="sm" className="w-fit">
                <Link href={`${MARKETING_ROUTES.start}?country=bangladesh&objective=new`}>
                  {t('newBusiness.cta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Card>
            <Card as="article" className="flex h-full flex-col gap-3 p-6">
              <h3 className="text-ink text-lg font-semibold">{t('existingBusiness.title')}</h3>
              <p className="text-muted flex-1 text-sm leading-relaxed">
                {t('existingBusiness.body')}
              </p>
              <Button asChild variant="secondary" size="sm" className="w-fit">
                <Link href={`${MARKETING_ROUTES.start}?country=bangladesh&objective=existing`}>
                  {t('existingBusiness.cta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </Section>

      <Section tone="surface" className="py-12 md:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('packages.eyebrow')}
            title={t('packages.title')}
            body={t('packages.body')}
          />
          <PackageSelector locale={loc} usdNotes={usdNotes} compact />
          <div className="mt-6">
            <Button asChild variant="link">
              <Link href={MARKETING_ROUTES.pricing}>
                {t('packages.pricingCta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow={t('services.eyebrow')}
              title={t('services.title')}
              body={t('services.body')}
            />
            <ul className="border-border mt-6 divide-y border-y">
              {serviceCategories.map((item) => (
                <li key={item} className="py-4">
                  <p className="text-ink text-sm font-semibold">
                    {t(`services.items.${item}.title`)}
                  </p>
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {t(`services.items.${item}.body`)}
                  </p>
                </li>
              ))}
            </ul>
            <Button asChild variant="secondary" className="mt-6">
              <Link href={MARKETING_ROUTES.services}>
                {t('services.cta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-ink text-xl font-semibold">{t('foreign.title')}</h2>
              <p className="text-muted mt-3 text-sm leading-relaxed">{t('foreign.body')}</p>
              <Button asChild variant="link" className="mt-3">
                <Link href={MARKETING_ROUTES.foreignFounders}>
                  {t('foreign.cta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div>
              <h2 className="text-ink text-xl font-semibold">{t('quote.title')}</h2>
              <p className="text-muted mt-3 text-sm leading-relaxed">{t('quote.body')}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {(['bdoor', 'government', 'provider', 'thirdParty'] as const).map((row) => (
                  <li key={row} className="text-ink flex items-start gap-2.5 text-sm">
                    <Check className="text-accent mt-1 size-4 shrink-0" aria-hidden="true" />
                    {t(`quote.layers.${row}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="sunken" className="py-12 md:py-16">
        <div className="container-page flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-ink text-lg font-semibold">{t('assessment.title')}</h2>
            <p className="text-muted mt-1 max-w-xl text-sm leading-relaxed">
              {t('assessment.body')}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={`${MARKETING_ROUTES.start}?country=${BANGLADESH_COUNTRY.slug}`}>
              {t('assessment.cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="container-page mt-10 max-w-prose">
          <IndependenceDisclosure />
        </div>
      </Section>
    </>
  );
}
