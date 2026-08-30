import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { FOUNDER_PORTRAIT_READY, FounderPortrait } from '@/components/marketing/founder-portrait';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/about'),
      languages: { en: localizedUrl('en', '/about'), 'bn-BD': localizedUrl('bn', '/about') },
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const sections = [
    { key: 'mission', titleKey: 'missionTitle', paragraphs: ['mission1', 'mission2'] },
    { key: 'how', titleKey: 'howTitle', paragraphs: ['how1', 'how2'] },
    { key: 'limits', titleKey: 'limitsTitle', paragraphs: ['limits1', 'limits2'] },
  ] as const;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <div className="prose-bdoor text-ink">
            {sections.map((section) => (
              <section key={section.key}>
                <h2>{t(section.titleKey)}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{t(paragraph)}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-10 max-w-prose">
            <IndependenceDisclosure />
          </div>
        </div>
      </Section>

      {/*
        Founder section (production hotfix P1). Only the owner-approved
        strings: name, role, one-sentence bio. No qualifications, licences,
        customer counts, awards or partnerships may be added here.
      */}
      <Section tone="surface" className="border-border border-y py-12 md:py-16">
        <div
          className={
            FOUNDER_PORTRAIT_READY
              ? 'container-page grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-16'
              : 'container-page max-w-3xl'
          }
        >
          <FounderPortrait alt={t('founder.portraitAlt')} />
          <div>
            <p className="text-muted font-mono text-xs tracking-[0.14em] uppercase">
              {t('founder.role')}
            </p>
            <h2 className="text-ink mt-3 text-2xl leading-tight md:text-3xl">
              {t('founder.name')}
            </h2>
            <p className="text-muted mt-4 max-w-prose text-base leading-relaxed">
              {t('founder.bio')}
            </p>
          </div>
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.start}>
              {t('cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
