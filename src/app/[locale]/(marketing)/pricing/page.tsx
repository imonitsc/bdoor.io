import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { PackageSelector } from '@/components/marketing/package-selector';
import { FeeBreakdownExample } from '@/components/marketing/fee-breakdown-example';
import { SpecialistServicesList } from '@/components/marketing/specialist-services-list';
import { COMMERCIAL_REVIEW_DATE } from '@/content/packages/catalog';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * The pricing page renders the same six packages, the same fee example and
 * the same standalone services as the homepage, from the same catalog module.
 * There is deliberately no second list of per-service prices here: the one
 * commercial source of truth is the packages, and the full catalogue link
 * covers everything else. That is what ended the 24,900-vs-25,000 and
 * "priced here, coming soon there" contradictions.
 */

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

  const [t, format] = await Promise.all([getTranslations('pricingPage'), getFormatter()]);

  const layers = [
    'platform_service_fee',
    'government_fee_estimate',
    'partner_professional_fee',
    'third_party_cost',
  ] as const;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="text-muted max-w-2xl text-base leading-relaxed">{t('intro')}</p>
          <PackageSelector locale={loc} />
          <p className="text-muted mt-6 text-xs">
            {t('reviewedOn', {
              date: format.dateTime(new Date(COMMERCIAL_REVIEW_DATE), 'long'),
            })}
          </p>
        </div>
      </Section>

      <Section tone="surface" className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-ink text-xl font-semibold">{t('feesTitle')}</h2>
            <p className="text-muted mt-2 max-w-prose text-sm leading-relaxed">{t('feesBody')}</p>
            <div className="mt-6">
              <FeeBreakdownExample locale={loc} />
            </div>
          </div>

          <div>
            <h2 className="text-ink text-xl font-semibold">{t('layersTitle')}</h2>
            <ul className="divide-border border-border mt-5 divide-y border-y">
              {layers.map((layer) => (
                <li key={layer} className="py-3.5">
                  <p className="text-ink text-sm leading-relaxed">{t(`layers.${layer}`)}</p>
                </li>
              ))}
            </ul>
            <h3 className="text-ink mt-8 text-base font-semibold">{t('variableTitle')}</h3>
            <p className="text-muted mt-2 max-w-prose text-sm leading-relaxed">
              {t('variableBody')}
            </p>
            <p className="text-muted mt-3 text-xs">{t('taxNote')}</p>
          </div>
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="text-ink text-xl font-semibold">{t('standaloneTitle')}</h2>
            <p className="text-muted mt-2 max-w-prose text-sm leading-relaxed">
              {t('standaloneBody')}
            </p>
            <Button asChild variant="link" className="mt-4">
              <Link href={MARKETING_ROUTES.services}>
                {t('browseServices')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div>
            <SpecialistServicesList locale={loc} />
            <div className="mt-8">
              <IndependenceDisclosure />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="sunken" className="py-12 md:py-16">
        <div className="container-page flex flex-col items-center gap-4 text-center">
          <h2 className="text-ink text-2xl font-semibold">{t('cta')}</h2>
          <p className="text-muted max-w-xl text-base leading-relaxed">{t('ctaBody')}</p>
          <Button asChild size="lg" className="mt-2">
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
