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
import { HeroProductModule } from '@/components/marketing/hero-product-module';
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
 * Eight sections before the footer (immediate-operations instructions §7.4):
 * the hero with its product module, the trust strip, the seven-country
 * comparison, the Bangladesh packages, the four-step process with the fee
 * example, the workspace preview, existing-business support with the
 * partner model, and the FAQ with the final call to action.
 */
function Hero({ locale }: { locale: Locale }) {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-surface-inverse text-ink-inverse texture-dots relative overflow-hidden">
      {/*
        Ambient depth: one large cobalt glow bleeding in from the top-right
        corner, felt more than seen. Decorative only — the overflow clip
        exists for this glow, and nothing textual can reach the clip edge.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -right-48 size-[30rem] rounded-full bg-[color:var(--bd-cobalt-500)] opacity-[0.16] blur-[150px]"
      />
      {/*
        §7.2: roughly a 7/5 column split, both columns centred on the same
        visual axis, height following content — no fixed hero height, no
        negative offsets, nothing that could clip the H1 at any zoom level.
        The product module replaces the illustrated person (§7.1).
      */}
      <div className="container-page grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2.5 rounded-[var(--radius-pill)] border border-[color:var(--bd-turquoise-500)]/35 bg-white/5 px-4 py-1.5 font-mono text-xs tracking-[0.15em] text-[color:var(--bd-turquoise-500)] uppercase">
            <span
              aria-hidden="true"
              className="animate-pulse-dot size-1.5 rounded-full bg-[color:var(--bd-turquoise-500)]"
            />
            {t('eyebrow')}
          </p>
          <h1 className="text-ink-inverse mt-5 max-w-2xl text-[2.6rem] leading-[1.05] md:text-[3.4rem] md:leading-[1.02] lg:text-[4.25rem] lg:leading-[1.0]">
            {t.rich('headline', {
              g: (chunks) => <span className="gradient-text-inverse">{chunks}</span>,
            })}
          </h1>
          <p className="text-muted-inverse mt-6 max-w-xl text-lg leading-relaxed">{t('support')}</p>

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

          <p className="text-muted-inverse mt-8 text-sm">{t('trustLine')}</p>
          <p className="text-muted-inverse mt-2 text-xs">{t('operatorLine')}</p>
        </div>

        <HeroProductModule locale={locale} />
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
      <Hero locale={typedLocale} />
      <TrustStrip />
      <CountriesSection locale={typedLocale} operational={operationalClaimsAllowed()} />
      <PackagesSection locale={typedLocale} usdNotes={usdNotes} />
      <ProcessAndFees locale={typedLocale} />
      <Preview />
      <ExistingBusinessSection />
      <FaqAndNextStep locale={typedLocale} />
    </>
  );
}
