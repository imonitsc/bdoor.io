import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';
import { LEGAL_DOCUMENTS } from '@/content/legal/documents';
import { localizedUrl } from '@/lib/site';
import { legalContentStatus } from '@/lib/launch/gates';
import type { Locale } from '@/features/catalog/types';

const DOCUMENT = LEGAL_DOCUMENTS['complaints'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t('legal.complaints');

  return {
    title,
    description: title,
    robots: legalContentStatus() === 'draft' ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: localizedUrl(locale as Locale, '/complaints'),
      languages: {
        en: localizedUrl('en', '/complaints'),
        'bn-BD': localizedUrl('bn', '/complaints'),
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage document={DOCUMENT} locale={locale as Locale} />;
}
