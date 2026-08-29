import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import { PackageSelector } from '@/components/marketing/package-selector';
import { FeeBreakdownExample } from '@/components/marketing/fee-breakdown-example';
import { CountrySelector } from '@/components/marketing/country-selector';
import { SpecialistServicesList } from '@/components/marketing/specialist-services-list';
import { HeroFounder } from '@/components/marketing/hero-founder';
import { WorkspacePreview } from '@/components/marketing/workspace-preview';
import { FaqList } from '@/components/marketing/faq-list';
import { getGlobalFaqs } from '@/features/catalog/queries';
import type { Locale } from '@/features/catalog/types';
import { operationalClaimsAllowed } from '@/lib/launch/gates';
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
 * Seven sections before the footer, in the order a first-time visitor needs
 * them: what bdoor does (hero, with the founder photograph as its visual),
 * why to trust the process, which package fits, what the workspace looks
 * like, how fees and delivery work, which international routes are being
 * prepared, and what to do next.
 *
 * The founder photograph is the intended hero visual, but the file has not
 * been supplied to the repository yet, and the branch carrying the hero was
 * merged anyway — which shipped a hero whose image 404s. So the visual is
 * now a build-time switch on the file's existence: while
 * public/images/bdoor-home-hero-founder.png is absent the hero renders the
 * workspace preview (the pre-photograph layout, six sections); the moment
 * the file is committed the founder hero and the standalone preview section
 * both appear, with no code change. Every push rebuilds, so the switch can
 * never be stale in a deployment.
 */
const FOUNDER_IMAGE_EXISTS = existsSync(
  join(process.cwd(), 'public/images/bdoor-home-hero-founder.png'),
);

function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-surface-inverse text-ink-inverse relative overflow-hidden">
      {/*
        The image column is deliberately wider than the copy column (1.2 vs
        1.05 before): the illustration read visually small inside its
        available area, and the master instructions ask for ~10–15% more
        presence on desktop without cropping — the ratio change delivers it
        while `contain` keeps the full composition.
      */}
      <div className="container-page grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-[color:var(--bd-turquoise-500)] uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-ink-inverse mt-4 max-w-2xl text-4xl leading-[1.08] md:text-5xl">
            {t('headline')}
          </h1>
          <p className="text-muted-inverse mt-5 max-w-xl text-lg leading-relaxed">{t('support')}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="inverse">
              <Link href={MARKETING_ROUTES.start}>
                {t('primaryCta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="border-border-inverse text-ink-inverse hover:bg-surface-inverse-soft border"
            >
              <Link href={MARKETING_ROUTES.countries}>{t('secondaryCta')}</Link>
            </Button>
          </div>

          <p className="text-muted-inverse mt-8 text-sm">{t('operatorLine')}</p>
        </div>

        {FOUNDER_IMAGE_EXISTS ? (
          <HeroFounder alt={t('imageAlt')} className="lg:self-end" />
        ) : (
          <WorkspacePreview />
        )}
      </div>
    </section>
  );
}

/**
 * Four statements, each checkable against the product itself. No counts, no
 * logos, no ratings, no affiliations — bdoor has none it could prove.
 */
function TrustStrip() {
  const t = useTranslations('home.trust');
  const items = ['quotes', 'workspace', 'caseManagement', 'specialists'] as const;

  return (
    <section className="bg-surface-inverse text-ink-inverse border-border-inverse border-t">
      <div className="container-page">
        <ul className="grid gap-x-8 gap-y-3 py-6 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <Check
                className="size-4 shrink-0 text-[color:var(--bd-turquoise-500)]"
                aria-hidden="true"
              />
              <span className="text-ink-inverse text-sm">{t(item)}</span>
            </li>
          ))}
        </ul>
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
    <Section>
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
    <Section tone="surface">
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
 * The seven-country selector (spec §6.1): the Bangladesh card larger, six
 * international cards compact, each linking to its country page.
 */
function CountriesSection({ locale, operational }: { locale: Locale; operational: boolean }) {
  const t = useTranslations('home.countriesSection');
  return (
    <Section>
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <CountrySelector locale={locale} operational={operational} />
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.start}>
              {tCta('primary')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={MARKETING_ROUTES.contact}>{tCta('secondary')}</Link>
          </Button>
        </div>
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
      <TrustStrip />
      <PackagesSection locale={typedLocale} usdNotes={usdNotes} />
      {FOUNDER_IMAGE_EXISTS ? <Preview /> : null}
      <ProcessAndFees locale={typedLocale} />
      <CountriesSection locale={typedLocale} operational={operationalClaimsAllowed()} />
      <FaqAndNextStep locale={typedLocale} />
    </>
  );
}
