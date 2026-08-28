import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { Alert } from '@/components/ui/alert';
import { getIndustryBySlug, pickIndustryName } from '@/features/industries/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const industry = await getIndustryBySlug(slug);
  if (!industry) return { title: 'Industry' };

  const name = pickIndustryName(industry, locale as Locale);
  return {
    title: name,
    description: industry.summary ? pick(industry.summary, locale as Locale) : undefined,
    alternates: {
      canonical: localizedUrl(locale as Locale, `/industries/${slug}`),
      languages: {
        en: localizedUrl('en', `/industries/${slug}`),
        'bn-BD': localizedUrl('bn', `/industries/${slug}`),
      },
    },
  };
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const industry = await getIndustryBySlug(slug);
  if (!industry) notFound();

  const t = await getTranslations('industries');
  const loc = locale as Locale;

  return (
    <>
      <PageHeader
        title={pickIndustryName(industry, loc)}
        description={industry.summary ? (pick(industry.summary, loc) ?? undefined) : undefined}
      />

      <Section className="py-12 md:py-16">
        <div className="container-page max-w-3xl">
          <Alert tone="info" title={t('draftNoticeTitle')}>
            {t('draftNoticeBody')}
          </Alert>
          <p className="text-muted mt-8 text-sm leading-relaxed">{t('detailPlaceholder')}</p>
        </div>
      </Section>
    </>
  );
}
