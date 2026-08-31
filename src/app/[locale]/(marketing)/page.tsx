import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import { PackageSelector } from '@/components/marketing/package-selector';
import { HeroFounder } from '@/components/marketing/hero-founder';
import { AskBdoorEntry } from '@/components/ai/ask-bdoor-entry';
import {
  HOW_IT_WORKS_IMAGE_READY,
  HowItWorksImage,
} from '@/components/marketing/how-it-works-image';
import { WorkspacePreview } from '@/components/marketing/workspace-preview';
import { FaqList } from '@/components/marketing/faq-list';
import { getGlobalFaqs } from '@/features/catalog/queries';
import type { Locale } from '@/features/catalog/types';
import { packageUsdNotes } from '@/lib/fx/usd-notes';
import { aiEnabled } from '@/features/ai/chat';
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
 * Homepage — five sections (production-fix 29 Aug 2026):
 * hero → Bangladesh packages → how it works → workspace proof → FAQ + CTA.
 * International country cards stay off this page; footer links remain.
 */
function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-canvas border-border relative border-b">
      <div className="mx-auto grid w-full max-w-[80rem] items-center gap-10 px-5 py-14 md:gap-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16 lg:py-[4.5rem] xl:max-w-none xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:pr-8 xl:pl-[max(2rem,calc((100vw-1280px)/2+2rem))]">
        <div className="flex max-w-[38.75rem] flex-col justify-center">
          <p className="text-muted font-mono text-xs tracking-[0.14em] uppercase">{t('eyebrow')}</p>
          <h1 className="text-ink mt-4 text-[2.5rem] leading-[1.04] font-semibold md:text-[3.5rem] lg:text-[3.75rem]">
            {t('headline')}
          </h1>
          <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">{t('support')}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link
                href={MARKETING_ROUTES.start}
                data-testid="home-hero-start"
                className="inline-flex min-h-11 items-center"
              >
                {t('primaryCta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link
                href={MARKETING_ROUTES.ask}
                data-testid="home-hero-ask"
                className="inline-flex min-h-11 items-center"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {t('askCta')}
              </Link>
            </Button>
          </div>

          <p className="text-muted mt-6 text-sm">{t('trustLine')}</p>
        </div>

        {/*
          The artwork is a cut-out whose subject runs to the very bottom of the
          artboard (no transparent margin there), so the section's own bottom
          padding read as a gap under the chair. Pulling the column down by
          exactly that padding stands the figure on the section's bottom rule
          instead, and leaves the text column's padding untouched.
        */}
        <HeroFounder alt={t('founderAlt')} className="-mb-14 self-end md:-mb-16 lg:-mb-[4.5rem]" />
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
        <PackageSelector locale={locale} usdNotes={usdNotes} compact />
      </div>
    </Section>
  );
}

function ProcessSection() {
  const t = useTranslations('home.process');
  // Hotfix §5/§6: three concise steps keep the section under the 600px
  // desktop budget; /how-it-works keeps the fuller four-step timeline.
  const steps = ['one', 'two', 'three'] as const;

  return (
    <Section>
      <div
        className={
          HOW_IT_WORKS_IMAGE_READY
            ? 'container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16'
            : 'container-page max-w-3xl'
        }
      >
        <div>
          <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
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
                  <h3 className="text-ink text-base font-semibold">{t(`compact.${step}.title`)}</h3>
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {t(`compact.${step}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <HowItWorksImage alt={t('imageAlt')} />
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
        <p className="text-muted mt-2 text-center text-xs">{t('productPreviewNotice')}</p>
        <div className="mt-10">
          <WorkspacePreview />
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
    <Section>
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <FaqList faqs={faqs} locale={locale} limit={4} />
      </div>

      <div className="container-page border-border mt-16 flex flex-col items-center gap-5 border-t pt-16 text-center">
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

function AskSection({ locale }: { locale: 'en' | 'bn' }) {
  return (
    <Section tone="sunken">
      <div className="container-page">
        <AskBdoorEntry locale={locale} />
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
      {/* Directly under the hero: a visitor who did not find their answer in
          the headline is one scroll from asking for it. Rendered only when the
          assistant is switched on, so a deploy without a reviewed knowledge
          base shows the page it always showed. */}
      {aiEnabled() ? <AskSection locale={locale as 'en' | 'bn'} /> : null}
      <PackagesSection locale={typedLocale} usdNotes={usdNotes} />
      <ProcessSection />
      <Preview />
      <FaqAndNextStep locale={typedLocale} />
    </>
  );
}
