import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * bdoor Start (replacement instruction §4.7): the acquisition product,
 * described only as it actually operates — a specialist-reviewed managed
 * application, never automated authority submission. Concise on purpose:
 * the page routes to the working /start intake; it is not a second catalogue.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products.start' });
  return {
    title: t('title'),
    description: t('tagline'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/products/start'),
      languages: {
        en: localizedUrl('en', '/products/start'),
        'bn-BD': localizedUrl('bn', '/products/start'),
      },
    },
  };
}

function StartContent() {
  const t = useTranslations('products.start');
  const steps = ['assess', 'quote', 'run', 'handoff'] as const;

  return (
    <>
      <Section>
        <div className="container-page max-w-3xl">
          <p className="text-muted font-mono text-xs tracking-[0.14em] uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-ink mt-4 text-3xl leading-tight font-semibold md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-muted mt-4 text-lg leading-relaxed">{t('tagline')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={MARKETING_ROUTES.start}>
                {t('cta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={MARKETING_ROUTES.pricing}>{t('pricingCta')}</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow={t('how.eyebrow')} title={t('how.title')} />
          <ol className="border-border mt-8 divide-y border-y">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 py-4">
                <span
                  className="text-muted font-mono text-sm font-semibold tabular-nums"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="text-ink text-base font-semibold">{t(`how.${step}.title`)}</h2>
                  <p className="text-muted mt-1 text-sm leading-relaxed">{t(`how.${step}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
          {/* §4.7: no automated authority submission is advertised, because
              none exists — the honest description is the product. */}
          <p className="text-muted mt-6 text-sm leading-relaxed">{t('honesty')}</p>
        </div>
      </Section>
    </>
  );
}

export default async function ProductStartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StartContent />;
}
