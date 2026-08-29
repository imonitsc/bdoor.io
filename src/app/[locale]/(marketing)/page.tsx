import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import { PackageSelector } from '@/components/marketing/package-selector';
import { FeeBreakdownExample } from '@/components/marketing/fee-breakdown-example';
import { SpecialistServicesList } from '@/components/marketing/specialist-services-list';
import { WorkspacePreview } from '@/components/marketing/workspace-preview';
import { FaqList } from '@/components/marketing/faq-list';
import { getGlobalFaqs } from '@/features/catalog/queries';
import type { Locale } from '@/features/catalog/types';
import { packageUsdNotes } from '@/lib/fx/usd-notes';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  const brand = await getTranslations({ locale, namespace: 'brand' });

  return {
    title: { absolute: `${brand('name')} — ${brand('tagline')}` },
    description: t('support'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/'),
      languages: { en: localizedUrl('en', '/'), 'bn-BD': localizedUrl('bn', '/') },
    },
  };
}

/**
 * A Bangladesh-first homepage in six focused sections: one clean hero, the
 * Bangladesh packages, the four-step process with the fee example, the
 * workspace preview, existing-business support with the partner model, and
 * the FAQ with a single closing call to action. No country grid and no
 * international pricing — the six international routes live at /countries,
 * reachable from the footer, and the application itself asks where.
 */
function Hero() {
  const t = useTranslations('home.hero');
  const trustItems = ['assessment', 'quote', 'specialists'] as const;

  return (
    <section className="border-border border-b">
      {/*
        Deliberately quiet: one column, generous whitespace, no imagery, no
        texture, no gradient, and exactly one action. The premium register
        comes from restraint, not decoration.
      */}
      <div className="container-page max-w-4xl py-20 md:py-28 lg:py-32">
        <p className="text-muted font-mono text-xs tracking-[0.15em] uppercase">{t('eyebrow')}</p>
        <h1 className="text-ink mt-5 max-w-3xl text-4xl leading-[1.08] md:text-5xl md:leading-[1.05] lg:text-6xl lg:leading-[1.02]">
          {t('headline')}
        </h1>
        <p className="text-muted mt-6 max-w-2xl text-lg leading-relaxed">{t('support')}</p>

        <div className="mt-9">
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.start}>
              {t('primaryCta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="mt-9 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8">
          {trustItems.map((item) => (
            <li key={item} className="text-muted flex items-center gap-2 text-sm">
              <Check className="text-accent size-4 shrink-0" aria-hidden="true" />
              {t(`trust.${item}`)}
            </li>
          ))}
        </ul>
        <p className="text-muted mt-6 text-xs">{t('operatorLine')}</p>
      </div>
    </section>
  );
}

function PackagesSection({
  locale,
  usdNotes,
}: {
  locale: Locale;
  usdNotes?: Record<string, string>;
}) {
  const t = useTranslations('home.packages');
  return (
    <Section tone="surface">
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <PackageSelector locale={locale} usdNotes={usdNotes} />
      </div>
    </Section>
  );
}

/** Process and fees in one section, with standalone services as a disclosure. */
function ProcessAndFees({ locale }: { locale: Locale }) {
  const t = useTranslations('home.process');
  const steps = ['one', 'two', 'three', 'four'] as const;

  return (
    <Section>
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <ol className="flex flex-col gap-7">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  className="bg-primary-soft text-info flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-ink text-base font-semibold">{t(`steps.${step}.title`)}</h3>
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {t(`steps.${step}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div>
            <FeeBreakdownExample locale={locale} />
            <details className="border-border bg-surface group mt-4 rounded-[var(--radius-card)] border">
              <summary className="text-ink flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <span>
                  {t('standaloneTitle')}
                  <span className="text-muted ms-2 font-normal">{t('standaloneSummary')}</span>
                </span>
                <ArrowRight
                  className="text-muted size-4 shrink-0 transition-transform group-open:rotate-90"
                  aria-hidden="true"
                />
              </summary>
              <div className="border-border border-t px-5 pb-5">
                <SpecialistServicesList locale={locale} />
              </div>
            </details>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Preview() {
  const t = useTranslations('home.preview');
  return (
    <Section tone="sunken">
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} align="center" />
        <div className="mt-10">
          <WorkspacePreview />
        </div>
      </div>
    </Section>
  );
}

/**
 * §7.4.7: what bdoor does for a business that already exists, and — in the
 * same breath — how the third-party partner model works. One statement of
 * each, not a disclaimer repeated per section.
 */
function ExistingBusinessSection() {
  const t = useTranslations('home.existing');

  return (
    <Section tone="surface">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <div className="flex flex-col justify-center gap-5">
          <p className="text-muted text-sm leading-relaxed">{t('partnerModel')}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={MARKETING_ROUTES.pricing}>
                {t('cta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="link">
              <Link href={MARKETING_ROUTES.partners}>{t('partnerCta')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

async function FaqAndNextStep({ locale }: { locale: Locale }) {
  const [{ data: faqs }, t, tCta] = await Promise.all([
    getGlobalFaqs(),
    getTranslations('home.faq'),
    getTranslations('home.finalCta'),
  ]);

  return (
    <Section tone="sunken">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <div>
          <FaqList faqs={faqs} locale={locale} limit={4} />
          <Button asChild variant="link" className="mt-5">
            <Link href={MARKETING_ROUTES.howItWorks}>
              {t('cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="container-page mt-16 flex flex-col items-center gap-5 text-center">
        <h2 className="text-ink max-w-2xl text-2xl leading-tight md:text-3xl">{tCta('title')}</h2>
        <p className="text-muted max-w-xl text-base leading-relaxed">{tCta('body')}</p>
        <Button asChild size="lg">
          <Link href={MARKETING_ROUTES.start}>
            {tCta('primary')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const usdNotes = await packageUsdNotes(typedLocale);

  return (
    <>
      <Hero />
      <PackagesSection locale={typedLocale} usdNotes={usdNotes} />
      <ProcessAndFees locale={typedLocale} />
      <Preview />
      <ExistingBusinessSection />
      <FaqAndNextStep locale={typedLocale} />
    </>
  );
}
