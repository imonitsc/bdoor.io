import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { getResources } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/resources'),
      languages: {
        en: localizedUrl('en', '/resources'),
        'bn-BD': localizedUrl('bn', '/resources'),
      },
    },
  };
}

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [t, { data: resources }, format] = await Promise.all([
    getTranslations('resources'),
    getResources(),
    getFormatter(),
  ]);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          {resources.length === 0 ? (
            <EmptyState icon={<BookOpen className="size-5" />} title={t('empty')} />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <li key={resource.slug}>
                  <Card
                    as="article"
                    className="group relative h-full p-5 transition-shadow hover:shadow-md md:p-6"
                  >
                    <h2 className="text-ink text-base font-semibold">
                      <Link
                        href={`/resources/${resource.slug}`}
                        className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                      >
                        {pick(resource.title, loc)}
                      </Link>
                    </h2>
                    {resource.excerpt ? (
                      <p className="text-muted mt-2 text-sm leading-relaxed">
                        {pick(resource.excerpt, loc)}
                      </p>
                    ) : null}
                    <p className="text-muted mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {resource.readingMinutes ? (
                        <span>{t('readingTime', { minutes: resource.readingMinutes })}</span>
                      ) : null}
                      {resource.lastReviewedAt ? (
                        <span>
                          {t('lastReviewed', {
                            date: format.dateTime(new Date(resource.lastReviewedAt), 'short'),
                          })}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-primary mt-3 flex items-center gap-1.5 text-sm font-medium">
                      {t('title')}
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </>
  );
}
