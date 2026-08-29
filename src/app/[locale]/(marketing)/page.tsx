import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import { PackageSelector } from '@/components/marketing/package-selector';
import { FeeBreakdownExample } from '@/components/marketing/fee-breakdown-example';
import { InternationalOfferCards } from '@/components/marketing/international-offer-cards';
import { SpecialistServicesList } from '@/components/marketing/specialist-services-list';
import { HeroFounder } from '@/components/marketing/hero-founder';
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

/**
 * Seven sections before the footer, in the order a first-time visitor needs
 * them: what bdoor does (hero, with the founder photograph as its visual),
 * why to trust the process, which package fits, what the workspace looks
 * like, how fees and delivery work, which international routes are being
 * prepared, and what to do next.
 *
 * This branch swaps the hero's visual from the workspace preview to the
 * founder photograph and moves the preview into its own section; the unit
 * guard on the image file keeps the branch red until the photograph is
 * actually committed, so this cannot merge with an empty hero.
 */

function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-surface-inverse text-ink-inverse relative overflow-hidden">
      <div className="container-page grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-24">
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
              <Link href={MARKETING_ROUTES.international}>{t('secondaryCta')}</Link>
            </Button>
          </div>

          <p className="text-muted-inverse mt-8 text-sm">{t('operatorLine')}</p>
        </div>

        <HeroFounder alt={t('imageAlt')} className="lg:self-end" />
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

function InternationalSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.internationalSection');
  return (
    <Section>
      <div className="container-page">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <InternationalOfferCards locale={locale} />
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

  return (
    <>
      <Hero />
      <TrustStrip />
      <PackagesSection locale={typedLocale} />
      <Preview />
      <ProcessAndFees locale={typedLocale} />
      <InternationalSection locale={typedLocale} />
      <FaqAndNextStep locale={typedLocale} />
    </>
  );
}
