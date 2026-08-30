import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import { AskBdoorPanel } from '@/components/ai/ask-bdoor-panel';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { PageHeader } from '@/components/marketing/page-header';
import { Section } from '@/components/ui/section';
import { aiEnabled } from '@/features/ai/chat';
import type { Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

/**
 * The permanent Ask bdoor AI page.
 *
 * The homepage drawer is for a passing question; this is the address someone
 * can bookmark, share or reach from a search result. It renders the same panel
 * with more room, and it 404s rather than showing an empty shell when the
 * assistant is switched off — a page that promises answers and gives none is
 * worse than no page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ask' });

  return {
    title: t('pageTitle'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/ask'),
      languages: { en: localizedUrl('en', '/ask'), 'bn-BD': localizedUrl('bn', '/ask') },
    },
  };
}

export default async function AskPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!aiEnabled()) notFound();

  const t = await getTranslations('ask');

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('description')}>
        {/* The language selector is visible on the page itself, not only in the
            footer: a Bangla speaker who lands here from an English search
            result needs to switch before they type, not after. */}
        <div className="flex flex-wrap items-center gap-3">
          <LocaleSwitcher />
          <p className="text-muted flex items-center gap-1.5 text-xs">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t('privacyBadge')}
          </p>
        </div>
      </PageHeader>

      <Section>
        <div className="container-page">
          <div className="border-border bg-surface mx-auto flex min-h-[32rem] max-w-3xl flex-col rounded-[var(--radius-panel)] border p-4 md:p-6">
            <AskBdoorPanel locale={locale as 'en' | 'bn'} autoFocus />
          </div>
        </div>
      </Section>
    </>
  );
}
