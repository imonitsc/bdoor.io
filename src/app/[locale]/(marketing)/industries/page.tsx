import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Section, SectionHeading } from '@/components/ui/section';
import { Alert } from '@/components/ui/alert';
import { listIndustries } from '@/content/industries';
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
  const t = await getTranslations({ locale, namespace: 'industriesPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, MARKETING_ROUTES.industries),
      languages: {
        en: localizedUrl('en', MARKETING_ROUTES.industries),
        'bn-BD': localizedUrl('bn', MARKETING_ROUTES.industries),
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('industriesPage');
  const industries = listIndustries();
  const loc = locale as Locale;

  return (
    <Section>
      <div className="container-page py-12 md:py-16">
        <SectionHeading title={t('title')} body={t('description')} />
        <Alert className="mt-8" tone="info" title={t('disclaimer')} />
        <p className="text-muted mt-6 text-sm">{t('comingSoon')}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <li key={industry.slug}>
              <Card className="flex h-full flex-col gap-3 p-5">
                <h2 className="text-ink text-base font-semibold">{pick(industry.name, loc)}</h2>
                <p className="text-muted text-sm leading-relaxed">{pick(industry.summary, loc)}</p>
                <Link
                  href={`/services?category=${industry.relatedCategorySlugs[0] ?? 'company-formation'}`}
                  className="text-primary mt-auto text-sm font-medium"
                >
                  {pick({ en: 'Related services', bn: 'সংশ্লিষ্ট সেবা' }, loc)}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
