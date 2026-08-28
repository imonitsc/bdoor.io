import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import { PackageSelector } from '@/components/marketing/package-selector';
import { FeeBreakdownExample } from '@/components/marketing/fee-breakdown-example';
import { InternationalOfferCards } from '@/components/marketing/international-offer-cards';
import { SpecialistServicesList } from '@/components/marketing/specialist-services-list';
import { WorkspacePreview } from '@/components/marketing/workspace-preview';
import { FaqList } from '@/components/marketing/faq-list';
import { getGlobalFaqs } from '@/features/catalog/queries';
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

function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-surface-inverse text-ink-inverse relative overflow-hidden">
      <div className="container-page grid gap-12 py-16 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-[color:var(--bd-turquoise-500)] uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-ink-inverse mt-4 max-w-2xl text-4xl leading-[1.1] md:text-5xl lg:text-[3.4rem]">
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
              <Link href={MARKETING_ROUTES.international}>{t('secondaryCta')}</Link>
            </Button>
          </div>

          <p className="text-muted-inverse mt-8 text-sm">{t('operatorLine')}</p>
        </div>

        <div className="lg:pt-4">
          <div className="border-border bg-surface flex flex-col gap-4 rounded-[var(--radius-panel)] border p-5 shadow-md md:p-6">
            <h2 className="text-ink text-base font-semibold">{t('advisorTitle')}</h2>
            <p className="text-muted text-sm leading-relaxed">{t('advisorBody')}</p>
            <Button asChild size="lg" className="mt-2 w-full">
              <Link href={MARKETING_ROUTES.start}>
                {t('primaryCta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const t = useTranslations('home.howItWorks');
  const steps = ['one', 'two', 'three', 'four'] as const;

  return (
    <Section tone="surface">
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="flex flex-col gap-3">
              <span
                className="bg-primary-soft text-info flex size-9 items-center justify-center rounded-full text-sm font-semibold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h3 className="text-ink text-base font-semibold">{t(`steps.${step}.title`)}</h3>
              <p className="text-muted text-sm leading-relaxed">{t(`steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

function PackagesSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.packages');
  return (
    <Section>
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <PackageSelector locale={locale} />
      </div>
    </Section>
  );
}

function FeeExampleSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.feeExample');
  return (
    <Section tone="surface">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
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
    <Section tone="surface">
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <InternationalOfferCards locale={locale} />
      </div>
    </Section>
  );
}

function ComplianceSection() {
  const t = useTranslations('home.compliance');
  return (
    <Section>
      <div className="container-page max-w-3xl">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <Button asChild className="mt-7" size="lg" variant="secondary">
          <Link href={MARKETING_ROUTES.start}>
            {t('cta')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

async function Faqs({ locale }: { locale: Locale }) {
  const [{ data: faqs }, t] = await Promise.all([getGlobalFaqs(), getTranslations('home.faq')]);

  return (
    <Section tone="surface">
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
    </Section>
  );
}

function FinalCta() {
  const t = useTranslations('home.finalCta');
  return (
    <Section tone="sunken">
      <div className="container-page flex flex-col items-center gap-6 text-center">
        <h2 className="text-ink max-w-2xl text-3xl leading-tight md:text-4xl">{t('title')}</h2>
        <p className="text-muted max-w-xl text-base leading-relaxed">{t('body')}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.start}>
              {t('primary')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={MARKETING_ROUTES.contact}>{t('secondary')}</Link>
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

  return (
    <>
      <Hero />
      <HowItWorks />
      <PackagesSection locale={typedLocale} />
      <FeeExampleSection locale={typedLocale} />
      <Preview />
      <SpecialistSection locale={typedLocale} />
      <InternationalSection locale={typedLocale} />
      <ComplianceSection />
      <Faqs locale={typedLocale} />
      <FinalCta />
    </>
  );
}
