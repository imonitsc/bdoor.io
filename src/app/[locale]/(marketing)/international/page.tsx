import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section, SectionHeading } from '@/components/ui/section';
import { Alert } from '@/components/ui/alert';
import { publicCountries } from '@/content/countries';
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
  const t = await getTranslations({ locale, namespace: 'internationalPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, MARKETING_ROUTES.international),
      languages: {
        en: localizedUrl('en', MARKETING_ROUTES.international),
        'bn-BD': localizedUrl('bn', MARKETING_ROUTES.international),
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
  const t = await getTranslations('internationalPage');
  const tHome = await getTranslations('home.international');
  const countries = publicCountries();
  const loc = locale as Locale;

  return (
    <Section>
      <div className="container-page py-12 md:py-16">
        <SectionHeading title={t('title')} body={t('description')} />
        <Alert className="mt-8" tone="info" title={t('flagshipNote')} />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <li key={country.code}>
              <Card className="flex h-full flex-col gap-3 p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-ink text-base font-semibold">{pick(country.name, loc)}</h2>
                  {country.status !== 'active' ? (
                    <span className="text-muted text-xs font-medium tracking-wide uppercase">
                      {tHome('comingSoon')}
                    </span>
                  ) : null}
                </div>
                <p className="text-muted text-sm leading-relaxed">{pick(country.summary, loc)}</p>
                {country.status !== 'active' ? (
                  <p className="text-muted text-xs leading-relaxed">{t('comingSoonBody')}</p>
                ) : (
                  <Button asChild variant="secondary" size="sm" className="mt-auto w-fit">
                    <Link href={MARKETING_ROUTES.services}>
                      {pick({ en: 'Browse Bangladesh services', bn: 'বাংলাদেশ সেবা দেখুন' }, loc)}
                    </Link>
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.contact}>{t('cta')}</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
