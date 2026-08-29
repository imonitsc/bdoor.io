import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import { PackageSelector } from '@/components/marketing/package-selector';
import { FeeBreakdownExample } from '@/components/marketing/fee-breakdown-example';
import { SpecialistServicesList } from '@/components/marketing/specialist-services-list';
import { InternationalOfferCards } from '@/components/marketing/international-offer-cards';
import { HeroFounder } from '@/components/marketing/hero-founder';
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
 * Homepage section order from the 65/35 Cursor master instructions (§8):
 * hero → process → packages → fee example → workspace → specialist list →
 * four international cards → existing business → FAQs → final CTA.
 * Seven-country comparison lives on /countries, not here.
 */
function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-surface-inverse text-ink-inverse texture-dots relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -right-48 size-[30rem] rounded-full bg-[color:var(--bd-cobalt-500)] opacity-[0.16] blur-[150px]"
      />
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
              <Link href={`${MARKETING_ROUTES.start}?country=bangladesh`}>
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
              <a href="#international">{t('secondaryCta')}</a>
            </Button>
          </div>

          <p className="text-muted-inverse mt-8 text-xs">{t('operatorLine')}</p>
        </div>

        <HeroFounder alt={t('founderAlt')} />
      </div>
    </section>
  );
}

function ProcessSection() {
  const t = useTranslations('home.process');
  const steps = ['one', 'two', 'three', 'four'] as const;

  return (
    <Section>
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-muted mt-1 text-sm leading-relaxed">{t(`steps.${step}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
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

function FeeExampleSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.pricing');
  return (
    <Section>
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <FeeBreakdownExample locale={locale} />
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

function SpecialistSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.specialist');
  return (
    <Section>
      <div className="container-page max-w-3xl">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <SpecialistServicesList locale={locale} />
      </div>
    </Section>
  );
}

function InternationalSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.international');
  return (
    <Section id="international" tone="surface">
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <InternationalOfferCards locale={locale} />
        <div className="mt-8">
          <Button asChild variant="secondary">
            <Link href={MARKETING_ROUTES.countries}>
              {t('allCountries')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

function ExistingBusinessSection() {
  const t = useTranslations('home.existing');

  return (
    <Section>
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
          <FaqList faqs={faqs} locale={locale} limit={6} />
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
      <ProcessSection />
      <PackagesSection locale={typedLocale} usdNotes={usdNotes} />
      <FeeExampleSection locale={typedLocale} />
      <Preview />
      <SpecialistSection locale={typedLocale} />
      <InternationalSection locale={typedLocale} />
      <ExistingBusinessSection />
      <FaqAndNextStep locale={typedLocale} />
    </>
  );
}
