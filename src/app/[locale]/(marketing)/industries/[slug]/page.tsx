import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getIndustry } from '@/features/directory/queries';
import { getCategories } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { pickLocalized } from '@/features/directory/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

export async function generateStaticParams() {
  const { INDUSTRIES } = await import('@/content/directory/industries');
  return INDUSTRIES.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const industry = await getIndustry(slug);
  if (!industry) return {};
  return {
    title: pickLocalized(industry.name, locale as Locale),
    description: pickLocalized(industry.summary, locale as Locale),
    alternates: {
      canonical: localizedUrl(locale as Locale, `/industries/${slug}`),
      languages: {
        en: localizedUrl('en', `/industries/${slug}`),
        'bn-BD': localizedUrl('bn', `/industries/${slug}`),
      },
    },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const industry = await getIndustry(slug);
  if (!industry) notFound();

  const [t, tCommon, { data: categories }] = await Promise.all([
    getTranslations('industriesPage'),
    getTranslations('common'),
    getCategories(),
  ]);

  const related = categories.filter((c) => industry.relatedCategorySlugs.includes(c.slug));

  return (
    <>
      <PageHeader
        title={pickLocalized(industry.name, loc)}
        description={pickLocalized(industry.summary, loc)}
      />
      <Section className="py-12 md:py-16">
        <div className="container-page flex max-w-3xl flex-col gap-8">
          {industry.operationalStatus !== 'active' ? (
            <Badge tone="neutral">{tCommon('comingSoon')}</Badge>
          ) : null}
          <Alert tone="info" title={t('adviceNote')} />
          <div>
            <h2 className="text-ink text-lg font-semibold">{t('relatedServices')}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {related.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/services?category=${category.slug}`}
                    className="text-primary inline-flex min-h-11 items-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {pick(category.name, loc)}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Button asChild>
            <Link href={MARKETING_ROUTES.start}>{t('cta')}</Link>
          </Button>
          <IndependenceDisclosure />
        </div>
      </Section>
    </>
  );
}
