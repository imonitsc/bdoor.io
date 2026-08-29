import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';
import { LEGAL_DOCUMENTS } from '@/content/legal/documents';
import { localizedUrl } from '@/lib/site';
import { legalContentStatus } from '@/lib/launch/gates';
import type { Locale } from '@/features/catalog/types';

const DOCUMENT = LEGAL_DOCUMENTS['privacy'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t('legal.privacy');

  return {
    title,
    description: title,
    // Working drafts are not indexable legal text.
    robots: legalContentStatus() === 'draft' ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: localizedUrl(locale as Locale, '/privacy'),
      languages: {
        en: localizedUrl('en', '/privacy'),
        'bn-BD': localizedUrl('bn', '/privacy'),
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage document={DOCUMENT} locale={locale as Locale} />;
}
