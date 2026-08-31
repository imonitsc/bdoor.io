import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import { HeroFounder } from '@/components/marketing/hero-founder';
import {
  HOW_IT_WORKS_IMAGE_READY,
  HowItWorksImage,
} from '@/components/marketing/how-it-works-image';
import type { Locale } from '@/features/catalog/types';
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
 * Homepage — the Business Intelligence OS layout (BI-OS §5.1, 31 Aug 2026):
 * a working Ask composer above the fold with four starters and one Start now
 * secondary, then exactly five sections — what bdoor AI can solve,
 * answer→roadmap→case, bdoor ID & workspace, verified provider review, and
 * the final action. No country grid, no service catalogue, no statistics.
 */

const STARTERS = ['business', 'licences', 'tax', 'investment'] as const;

function Hero({ locale }: { locale: Locale }) {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-canvas border-border relative border-b">
      <div className="mx-auto grid w-full max-w-[80rem] items-center gap-10 px-5 py-14 md:gap-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16 lg:py-[4.5rem] xl:max-w-none xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:pr-8 xl:pl-[max(2rem,calc((100vw-1280px)/2+2rem))]">
        <div className="flex max-w-[38.75rem] flex-col justify-center">
          {/* No eyebrow, no paragraph: the headline and one short line carry
              the page. Confidence is fewer words at a larger size. */}
          <h1 className="text-ink text-[2.5rem] leading-[1.04] font-semibold tracking-tight md:text-[3.25rem] lg:text-[3.5rem]">
            {t('headline')}
          </h1>
          <p className="text-muted mt-5 text-lg leading-relaxed">{t('support')}</p>

          {/* The working composer. A plain GET form on purpose: it navigates
              to /ask?q=… with zero client JavaScript, so the question box
              works before hydration — the /ask panel picks the question up
              and sends it. */}
          <form
            action={`/${locale}/ask`}
            method="get"
            data-testid="home-ask-form"
            className="border-border-strong bg-surface mt-8 flex items-stretch gap-2 rounded-[var(--radius-panel)] border p-2 shadow-sm"
          >
            <label htmlFor="home-ask-input" className="sr-only">
              {t('composer.label')}
            </label>
            <input
              id="home-ask-input"
              name="q"
              type="text"
              maxLength={2000}
              placeholder={t('composer.placeholder')}
              className="text-ink placeholder:text-muted min-h-11 w-full min-w-0 flex-1 bg-transparent px-3 text-base focus:outline-none"
            />
            <Button type="submit" data-testid="home-hero-ask" className="shrink-0">
              <Sparkles className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('composer.cta')}</span>
              <span className="sr-only sm:hidden">{t('composer.cta')}</span>
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <Link
                key={starter}
                href={{ pathname: '/ask', query: { q: t(`starters.${starter}.question`) } }}
                data-testid={`home-starter-${starter}`}
                className="border-border text-ink hover:bg-surface-sunken rounded-full border px-3.5 py-1.5 text-sm"
              >
                {t(`starters.${starter}.label`)}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link
                href={MARKETING_ROUTES.start}
                data-testid="home-hero-start"
                className="inline-flex min-h-11 items-center"
              >
                {t('primaryCta')}
                <ArrowRight className="size-4" aria-hidden="true" />
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

function SolveSection() {
  const t = useTranslations('home.solve');
  const items = ['formation', 'licences', 'tax', 'investment'] as const;

  return (
    <Section tone="surface">
      <div className="container-page">
        <SectionHeading title={t('title')} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item}
              className="border-border bg-canvas rounded-[var(--radius-panel)] border p-5"
            >
              <h3 className="text-ink text-base font-semibold">{t(`items.${item}.title`)}</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{t(`items.${item}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function JourneySection() {
  const t = useTranslations('home.journey');
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
          <SectionHeading title={t('title')} />
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
                  <h3 className="text-ink text-base font-semibold">{t(`steps.${step}.title`)}</h3>
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {t(`steps.${step}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <HowItWorksImage alt={t('title')} />
      </div>
    </Section>
  );
}

function WorkspaceSection() {
  const t = useTranslations('home.workspace');

  return (
    <Section tone="surface">
      <div className="container-page max-w-3xl">
        <SectionHeading title={t('title')} body={t('body')} />
        {/* The §4.2 disclaimers travel with the feature everywhere it is
            described: not a government ID, never public. One line is enough. */}
        <p className="text-muted mt-4 text-sm leading-relaxed">{t('identity')}</p>
      </div>
    </Section>
  );
}

function ProvidersSection() {
  const t = useTranslations('home.providers');

  return (
    <Section>
      <div className="container-page max-w-3xl">
        <SectionHeading title={t('title')} body={t('body')} />
      </div>
    </Section>
  );
}

function FinalCta() {
  const t = useTranslations('home.finalCta');

  return (
    <Section tone="surface">
      <div className="container-page flex flex-col items-center gap-5 text-center">
        <h2 className="text-ink max-w-2xl text-3xl leading-tight font-semibold md:text-4xl">
          {t('title')}
        </h2>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.start}>
              {t('primary')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={MARKETING_ROUTES.ask}>
              <Sparkles className="size-4" aria-hidden="true" />
              {t('secondary')}
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero locale={locale as Locale} />
      <SolveSection />
      <JourneySection />
      <WorkspaceSection />
      <ProvidersSection />
      <FinalCta />
    </>
  );
}
