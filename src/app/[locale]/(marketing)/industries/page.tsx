import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { getIndustries, pickIndustryName } from '@/features/industries/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'industries' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/industries'),
      languages: {
        en: localizedUrl('en', '/industries'),
        'bn-BD': localizedUrl('bn', '/industries'),
      },
    },
  };
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, industries] = await Promise.all([getTranslations('industries'), getIndustries()]);
  const loc = locale as Locale;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="text-muted max-w-3xl text-base leading-relaxed">{t('intro')}</p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <li key={industry.id}>
                <Card
                  as="article"
                  className="group relative h-full p-5 transition-shadow hover:shadow-md md:p-6"
                >
                  <h2 className="text-ink text-base font-semibold">
                    <Link
                      href={`/industries/${industry.slug}`}
                      className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    >
                      {pickIndustryName(industry, loc)}
                    </Link>
                  </h2>
                  {industry.summary ? (
                    <p className="text-muted mt-2 text-sm leading-relaxed">
                      {pick(industry.summary, loc)}
                    </p>
                  ) : null}
                  <p className="text-primary mt-4 flex items-center gap-1.5 text-sm font-medium">
                    {t('learnMore')}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </p>
                </Card>
              </li>
            ))}
          </ul>

          <p className="text-muted mt-10 max-w-3xl text-sm leading-relaxed">{t('reviewNote')}</p>
        </div>
      </Section>
    </>
  );
}
