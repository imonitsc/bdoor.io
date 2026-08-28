import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { DirectoryCard } from '@/components/marketing/directory-card';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getAuthorities } from '@/features/directory/queries';
import type { Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'authoritiesPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/authorities'),
      languages: {
        en: localizedUrl('en', '/authorities'),
        'bn-BD': localizedUrl('bn', '/authorities'),
      },
    },
  };
}

export default async function AuthoritiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const [t, tCommon, { data: authorities }] = await Promise.all([
    getTranslations('authoritiesPage'),
    getTranslations('common'),
    getAuthorities(),
  ]);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Section className="py-12 md:py-16">
        <div className="container-page">
          <p className="text-muted max-w-2xl text-sm leading-relaxed">{t('disclaimer')}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authorities.map((authority) => (
              <li key={authority.slug}>
                <DirectoryCard
                  href={`/authorities/${authority.slug}`}
                  title={authority.name}
                  summary={authority.role}
                  locale={loc}
                  status={authority.operationalStatus}
                  comingSoonLabel={tCommon('comingSoon')}
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
