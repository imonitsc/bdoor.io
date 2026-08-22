import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Section } from '@/components/ui/section';
import { Markdown } from '@/components/marketing/markdown';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getResource, getResources } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateStaticParams() {
  const { data } = await getResources();
  return data.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { data: resource } = await getResource(slug);
  if (!resource) return {};

  const title = pick(resource.title, locale as Locale) ?? slug;
  const description = pick(resource.excerpt, locale as Locale) ?? '';

  return {
    title,
    description,
    alternates: {
      canonical: localizedUrl(locale as Locale, `/resources/${slug}`),
      languages: {
        en: localizedUrl('en', `/resources/${slug}`),
        'bn-BD': localizedUrl('bn', `/resources/${slug}`),
      },
    },
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: resource.publishedAt ?? undefined,
    },
  };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [{ data: resource }, t, format] = await Promise.all([
    getResource(slug),
    getTranslations('resources'),
    getFormatter(),
  ]);

  if (!resource) notFound();

  const reviewOverdue =
    resource.nextReviewDue !== null && new Date(resource.nextReviewDue) < new Date();

  return (
    <Section className="py-12 md:py-16">
      <div className="container-page">
        <Link
          href="/resources"
          className="text-primary hover:text-primary-hover inline-flex items-center gap-1.5 rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('backToResources')}
        </Link>

        <article className="mt-6">
          <h1 className="text-ink max-w-3xl text-3xl leading-tight md:text-4xl">
            {pick(resource.title, loc)}
          </h1>

          <p className="text-muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {resource.readingMinutes ? (
              <span>{t('readingTime', { minutes: resource.readingMinutes })}</span>
            ) : null}
            {resource.lastReviewedAt ? (
              <span>
                {t('lastReviewed', {
                  date: format.dateTime(new Date(resource.lastReviewedAt), 'long'),
                })}
              </span>
            ) : null}
          </p>

          {reviewOverdue ? (
            <Alert tone="neutral" className="mt-5">
              {t('reviewPending')}
            </Alert>
          ) : null}

          <Markdown
            className="prose-bdoor text-ink mt-8"
            content={pick(resource.body, loc) ?? ''}
          />
        </article>

        <div className="mt-12 max-w-3xl">
          <IndependenceDisclosure />
        </div>
      </div>
    </Section>
  );
}
