import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { AskBdoorPanel } from '@/components/ai/ask-bdoor-panel';
import { aiEnabled } from '@/features/ai/chat';
import type { Locale } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

/**
 * The permanent Ask bdoor AI page — the application, full stop.
 *
 * The shell (compact header, viewport-fit column) lives in the route group's
 * layout; this page is the conversation. It 404s rather than showing an empty
 * shell when the assistant is switched off — a page that promises answers and
 * gives none is worse than no page.
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

  return <AskBdoorPanel locale={locale as 'en' | 'bn'} variant="page" autoFocus />;
}
