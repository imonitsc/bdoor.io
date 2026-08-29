import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { BANGLADESH_COUNTRY, pickText } from '@/content/international';
import type { Locale } from '@/features/catalog/types';
import { operationalClaimsAllowed } from '@/lib/launch/gates';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * Bangladesh's country page is a hub, not a copy of the catalogue: the
 * operating market already has the services, pricing and assessment pages,
 * so this page routes a visitor to the right one and states plainly what is
 * open today. It must never restate a figure the pricing page owns.
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
  // Enquiry-led copy while the legal documents are drafts; the operational
  // wording ("available today") returns when the owner flips the legal gate.
  const operational = operationalClaimsAllowed();

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
                <Link href={MARKETING_ROUTES.services}>
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
                <Link href={MARKETING_ROUTES.pricing}>
                  {t('existingBusiness.cta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Card>
          </div>

          <div className="border-border bg-surface mt-12 flex flex-col gap-4 rounded-[var(--radius-panel)] border p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
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

          <div className="mt-12 max-w-prose">
            <IndependenceDisclosure />
          </div>
        </div>
      </Section>
    </>
  );
}
