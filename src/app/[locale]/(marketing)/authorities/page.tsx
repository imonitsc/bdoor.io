import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ExternalLink } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { Alert } from '@/components/ui/alert';
import { getAuthorities, pickAuthority } from '@/features/authorities/queries';
import type { Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'authorities' });
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
  const [t, authorities] = await Promise.all([getTranslations('authorities'), getAuthorities()]);
  const loc = locale as Locale;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page max-w-3xl">
          <Alert tone="info" title={t('disclaimerTitle')}>
            {t('disclaimerBody')}
          </Alert>

          <ul className="mt-10 flex flex-col gap-8">
            {authorities.map((authority) => (
              <li key={authority.id} className="border-border border-b pb-8 last:border-0">
                <h2 className="text-ink text-lg font-semibold">
                  {pickAuthority(authority.name, loc)}
                </h2>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  {pickAuthority(authority.role, loc)}
                </p>
                {authority.websiteUrl ? (
                  <a
                    href={authority.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
                  >
                    {t('officialSite')}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : null}
                {authority.disclaimer ? (
                  <p className="text-muted mt-3 text-xs leading-relaxed">
                    {pickAuthority(authority.disclaimer, loc)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="text-muted mt-10 text-sm leading-relaxed">{t('reviewNote')}</p>
        </div>
      </Section>
    </>
  );
}
