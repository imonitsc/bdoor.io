import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { DirectoryCard } from '@/components/marketing/directory-card';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getCountries } from '@/features/directory/queries';
import type { Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'internationalPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/international'),
      languages: {
        en: localizedUrl('en', '/international'),
        'bn-BD': localizedUrl('bn', '/international'),
      },
    },
  };
}

export default async function InternationalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const [t, tCommon, tHome, { data: countries }] = await Promise.all([
    getTranslations('internationalPage'),
    getTranslations('common'),
    getTranslations('home.international'),
    getCountries(),
  ]);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="text-muted max-w-2xl text-sm leading-relaxed">{t('unavailableNote')}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => (
              <li key={country.code}>
                <DirectoryCard
                  href={`/international/${country.slug}`}
                  title={country.name}
                  summary={country.summary}
                  locale={loc}
                  status={country.operationalStatus}
                  comingSoonLabel={tCommon('comingSoon')}
                  flagshipLabel={country.isFlagship ? tHome('flagship') : undefined}
                />
              </li>
            ))}
          </ul>
          <div className="mt-10 max-w-prose">
            <IndependenceDisclosure />
          </div>
        </div>
      </Section>
    </>
  );
}
