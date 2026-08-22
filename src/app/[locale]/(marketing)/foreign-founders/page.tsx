import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Banknote } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { ServiceCard } from '@/components/marketing/service-card';
import { getResource, getServices } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'foreignFoundersPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/foreign-founders'),
      languages: {
        en: localizedUrl('en', '/foreign-founders'),
        'bn-BD': localizedUrl('bn', '/foreign-founders'),
      },
    },
  };
}

const SEQUENCE = [
  'eligibility',
  'name',
  'account',
  'remittance',
  'incorporation',
  'registrations',
  'investment',
] as const;

export default async function ForeignFoundersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [t, tHome, tCommon, { data: services }, { data: guide }] = await Promise.all([
    getTranslations('foreignFoundersPage'),
    getTranslations('home.foreignFounders'),
    getTranslations('common'),
    getServices(),
    getResource('foreign-investment-first-steps'),
  ]);

  const relevant = services.filter(
    (s) => s.categorySlug === 'foreign-founders' || s.slug === 'private-limited-company-incorporation',
  );

  return (
    <>
      <PageHeader title={t('title')} description={t('description')}>
        <Button asChild size="lg">
          <Link href={`${MARKETING_ROUTES.start}?intent=foreign_founder`}>
            {t('cta')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </PageHeader>

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <div>
            <h2 className="text-xl font-semibold text-ink">{t('stepsTitle')}</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{t('stepsBody')}</p>

            <ol className="mt-8 flex flex-col gap-6 border-s border-border ps-6">
              {SEQUENCE.map((step, index) => (
                <li key={step} className="relative">
                  <span
                    className="absolute -start-[1.85rem] top-0.5 flex size-5 items-center justify-center rounded-full border-2 border-canvas bg-primary text-[0.6rem] font-bold text-on-primary"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{t(`sequence.${step}.title`)}</h3>
                  <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                    {t(`sequence.${step}.body`)}
                  </p>
                </li>
              ))}
            </ol>

            <Alert tone="warning" title={t('notTitle')} className="mt-8">
              {tHome('important')}
            </Alert>
          </div>

          <aside className="flex h-fit flex-col gap-6">
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Banknote className="size-4 text-accent" aria-hidden="true" />
                {t('capitalTitle')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t('capitalBody')}</p>
            </Card>

            {guide ? (
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-ink">{pick(guide.title, loc)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pick(guide.excerpt, loc)}</p>
                <Button asChild variant="link" className="mt-3">
                  <Link href={`/resources/${guide.slug}`}>
                    {tCommon('learnMore')}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </Card>
            ) : null}
          </aside>
        </div>
      </Section>

      {relevant.length > 0 ? (
        <Section tone="surface" className="py-12 md:py-16">
          <div className="container-page">
            <h2 className="text-xl font-semibold text-ink">{t('servicesTitle')}</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relevant.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} locale={loc} />
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}
    </>
  );
}
