import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';
import { LEGAL_DOCUMENTS } from '@/content/legal/documents';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

const DOCUMENT = LEGAL_DOCUMENTS['legal-disclaimer'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t('legal.disclaimer');

  return {
    title,
    description: title,
    alternates: {
      canonical: localizedUrl(locale as Locale, '/legal-disclaimer'),
      languages: {
        en: localizedUrl('en', '/legal-disclaimer'),
        'bn-BD': localizedUrl('bn', '/legal-disclaimer'),
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage document={DOCUMENT} locale={locale as Locale} />;
}
