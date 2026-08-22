import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/section';
import { EmptyState } from '@/components/ui/empty-state';
import { ServiceCard } from '@/components/marketing/service-card';
import { getCategories, getServices } from '@/features/catalog/queries';
import { pick, type Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';
import { cn } from '@/lib/utils/cn';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  return {
    title: t('indexTitle'),
    description: t('indexDescription'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/services'),
      languages: {
        en: localizedUrl('en', '/services'),
        'bn-BD': localizedUrl('bn', '/services'),
      },
    },
  };
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ locale }, { category }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const [t, { data: categories }, { data: services }] = await Promise.all([
    getTranslations('services'),
    getCategories(),
    getServices(),
  ]);

  const activeCategory = categories.some((c) => c.slug === category) ? category : undefined;
  const visible = activeCategory
    ? services.filter((s) => s.categorySlug === activeCategory)
    : services;

  return (
    <>
      <Section tone="surface" className="border-b border-border py-12 md:py-16">
        <div className="container-page">
          <h1 className="text-3xl leading-tight text-ink md:text-4xl">{t('indexTitle')}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            {t('indexDescription')}
          </p>
        </div>
      </Section>

      <Section className="py-10 md:py-12">
        <div className="container-page">
          <nav aria-label={t('filterLabel')}>
            <ul className="scroll-x flex gap-2 pb-1">
              <li>
                <Link
                  href="/services"
                  aria-current={!activeCategory ? 'true' : undefined}
                  className={cn(
                    'inline-flex h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
                    !activeCategory
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border-strong bg-surface text-ink hover:bg-surface-sunken',
                  )}
                >
                  {t('allCategories')}
                </Link>
              </li>
              {categories.map((c) => {
                const active = activeCategory === c.slug;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/services?category=${c.slug}`}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'inline-flex h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
                        active
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-border-strong bg-surface text-ink hover:bg-surface-sunken',
                      )}
                    >
                      {pick(c.name, locale as Locale)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="mt-6 text-sm text-muted" aria-live="polite">
            {visible.length} {t('indexTitle').toLowerCase()}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={<Search className="size-5" />}
              title={t('emptyState')}
            />
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} locale={locale as Locale} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </>
  );
}
