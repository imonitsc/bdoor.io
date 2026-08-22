import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  FileBadge,
  Globe,
  Receipt,
  Ship,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section, SectionHeading } from '@/components/ui/section';
import { Alert } from '@/components/ui/alert';
import { PortalVisual } from '@/components/marketing/portal-visual';
import { HeroAdvisor } from '@/components/marketing/hero-advisor';
import { WorkspacePreview } from '@/components/marketing/workspace-preview';
import { FaqList } from '@/components/marketing/faq-list';
import { getCategories, getGlobalFaqs } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
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

const CATEGORY_ICONS: Record<string, typeof Building2> = {
  'company-formation': Building2,
  licences: FileBadge,
  'import-export': Ship,
  'tax-vat': Receipt,
  'foreign-founders': Globe,
  compliance: CalendarCheck,
};

function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="relative overflow-hidden bg-surface-inverse text-ink-inverse">
      <div className="container-page grid gap-12 py-16 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--bd-teal-500)]">
            {t('eyebrow')}
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.1] text-ink-inverse md:text-5xl lg:text-[3.4rem]">
            {t('headline')}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-inverse">{t('support')}</p>

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
              className="border border-border-inverse text-ink-inverse hover:bg-surface-inverse-soft"
            >
              <Link href={MARKETING_ROUTES.services}>{t('secondaryCta')}</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-inverse">{t('trustLine')}</p>

          <PortalVisual className="pointer-events-none mt-10 hidden max-w-sm opacity-90 lg:block" />
        </div>

        <div className="lg:pt-4">
          <HeroAdvisor />
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
        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="flex flex-col gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-info"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h3 className="text-base font-semibold text-ink">{t(`steps.${step}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted">{t(`steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

async function Categories({ locale }: { locale: Locale }) {
  const [{ data: categories }, t] = await Promise.all([
    getCategories(),
    getTranslations('home.categories'),
  ]);
  const tCommon = await getTranslations('common');

  return (
    <Section>
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Building2;
            return (
              <li key={category.id}>
                <Card
                  as="article"
                  className="group relative h-full p-5 transition-shadow hover:shadow-md md:p-6"
                >
                  <span
                    className="flex size-10 items-center justify-center rounded-[12px] bg-accent-soft text-accent-strong"
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink">
                    <Link
                      href={`/services?category=${category.slug}`}
                      className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    >
                      {pick(category.name, locale)}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {pick(category.summary, locale)}
                  </p>
                  <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                    {tCommon('viewAll')}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

function ForeignFounders() {
  const t = useTranslations('home.foreignFounders');
  const points = ['one', 'two', 'three'] as const;

  return (
    <Section tone="surface">
      <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
          <Button asChild className="mt-7" size="lg">
            <Link href={MARKETING_ROUTES.foreignFounders}>
              {t('cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-5">
          <ul className="flex flex-col gap-4">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-ink">{t(`points.${point}`)}</p>
              </li>
            ))}
          </ul>
          <Alert tone="warning" title={t('important')} />
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

function Pricing() {
  const t = useTranslations('home.pricing');
  const tFees = useTranslations('services.feeCategories');
  const categories = [
    'platform_service_fee',
    'government_fee_estimate',
    'partner_professional_fee',
    'third_party_cost',
    'tax',
  ] as const;

  return (
    <Section>
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
          <Button asChild className="mt-7" size="lg" variant="secondary">
            <Link href={MARKETING_ROUTES.pricing}>
              {t('cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Card className="p-5 md:p-6">
          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <li key={category} className="flex items-center justify-between gap-4 py-3.5">
                <span className="text-sm font-medium text-ink">{tFees(category)}</span>
                <span className="text-sm text-muted">
                  {category === 'platform_service_fee' ? 'BDoor' : '—'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}

function Partners() {
  const t = useTranslations('home.partners');
  return (
    <Section tone="inverse">
      <div className="container-page">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          body={t('body')}
          inverse
          align="center"
        />
        <div className="mt-8 flex justify-center">
          <Button asChild variant="inverse" size="lg">
            <Link href={MARKETING_ROUTES.partners}>
              {t('cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
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
          <FaqList faqs={faqs} locale={locale} limit={5} />
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
        <h2 className="max-w-2xl text-3xl leading-tight text-ink md:text-4xl">{t('title')}</h2>
        <p className="max-w-xl text-base leading-relaxed text-muted">{t('body')}</p>
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

  return (
    <>
      <Hero />
      <HowItWorks />
      <Categories locale={locale as Locale} />
      <ForeignFounders />
      <Preview />
      <Pricing />
      <Partners />
      <Faqs locale={locale as Locale} />
      <FinalCta />
    </>
  );
}
