import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getAuthority } from '@/features/directory/queries';
import { getCategories } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { pickLocalized } from '@/features/directory/types';
import { localizedUrl } from '@/lib/site';

export async function generateStaticParams() {
  const { AUTHORITIES } = await import('@/content/directory/authorities');
  return AUTHORITIES.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const authority = await getAuthority(slug);
  if (!authority) return {};
  return {
    title: pickLocalized(authority.name, locale as Locale),
    description: pickLocalized(authority.role, locale as Locale),
    alternates: {
      canonical: localizedUrl(locale as Locale, `/authorities/${slug}`),
      languages: {
        en: localizedUrl('en', `/authorities/${slug}`),
        'bn-BD': localizedUrl('bn', `/authorities/${slug}`),
      },
    },
  };
}

export default async function AuthorityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const authority = await getAuthority(slug);
  if (!authority) notFound();

  const [t, { data: categories }] = await Promise.all([
    getTranslations('authoritiesPage'),
    getCategories(),
  ]);

  const related = categories.filter((c) => authority.relatedCategorySlugs.includes(c.slug));
  const officialUrl = authority.urlVerified ? authority.officialUrl : null;

  return (
    <>
      <PageHeader
        title={pickLocalized(authority.name, loc)}
        description={pickLocalized(authority.role, loc)}
      />
      <Section className="py-12 md:py-16">
        <div className="container-page flex max-w-3xl flex-col gap-8">
          <Alert tone="warning" title={t('disclaimer')} />
          {officialUrl ? (
            <p className="text-sm">
              <a
                href={officialUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('officialSite')}
              </a>
            </p>
          ) : (
            <p className="text-muted text-sm">{t('urlPending')}</p>
          )}
          <div>
            <h2 className="text-ink text-lg font-semibold">{t('relatedServices')}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {related.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/services?category=${category.slug}`}
                    className="text-primary inline-flex min-h-11 items-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {pick(category.name, loc)}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Button asChild variant="secondary">
            <Link href="/authorities">{t('allAuthorities')}</Link>
          </Button>
          <IndependenceDisclosure />
        </div>
      </Section>
    </>
  );
}
