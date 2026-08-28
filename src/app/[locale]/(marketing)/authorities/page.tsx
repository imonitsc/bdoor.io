import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Section, SectionHeading } from '@/components/ui/section';
import { Alert } from '@/components/ui/alert';
import { listAuthorities } from '@/content/authorities';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';
import { pick } from '@/features/catalog/types';

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
      canonical: localizedUrl(locale as Locale, MARKETING_ROUTES.authorities),
      languages: {
        en: localizedUrl('en', MARKETING_ROUTES.authorities),
        'bn-BD': localizedUrl('bn', MARKETING_ROUTES.authorities),
      },
    },
  };
}

export default async function AuthoritiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('authoritiesPage');
  const authorities = listAuthorities();
  const loc = locale as Locale;

  return (
    <Section>
      <div className="container-page py-12 md:py-16">
        <SectionHeading title={t('title')} body={t('description')} />
        <Alert className="mt-8" tone="warning" title={t('disclaimer')} />
        <p className="text-muted mt-6 text-sm">{t('comingSoon')}</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {authorities.map((authority) => (
            <li key={authority.slug}>
              <Card className="flex h-full flex-col gap-3 p-5 md:p-6">
                <h2 className="text-ink text-base font-semibold">{pick(authority.name, loc)}</h2>
                <p className="text-muted text-sm leading-relaxed">{pick(authority.role, loc)}</p>
                {authority.officialWebsite ? (
                  <a
                    href={authority.officialWebsite}
                    rel="noopener noreferrer"
                    className="text-primary text-sm font-medium"
                  >
                    {authority.officialWebsite}
                  </a>
                ) : (
                  <p className="text-muted text-xs">{t('unverifiedWebsite')}</p>
                )}
                <Link
                  href={`/services?category=${authority.relatedCategorySlugs[0] ?? 'company-formation'}`}
                  className="text-primary mt-auto text-sm font-medium"
                >
                  {pick({ en: 'Related services', bn: 'সংশ্লিষ্ট সেবা' }, loc)}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
        <p className="text-muted mt-10 text-sm">
          <Link href={MARKETING_ROUTES.legalDisclaimer} className="text-primary underline">
            {pick({ en: 'Legal disclaimer', bn: 'আইনি দাবিত্যাগ' }, loc)}
          </Link>
        </p>
      </div>
    </Section>
  );
}
