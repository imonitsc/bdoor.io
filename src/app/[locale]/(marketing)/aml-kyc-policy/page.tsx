import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/marketing/legal-page';
import { LEGAL_DOCUMENTS } from '@/content/legal/documents';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

const DOCUMENT = LEGAL_DOCUMENTS['aml-kyc-policy'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t('legal.amlKyc');

  return {
    title,
    description: title,
    alternates: {
      canonical: localizedUrl(locale as Locale, '/aml-kyc-policy'),
      languages: {
        en: localizedUrl('en', '/aml-kyc-policy'),
        'bn-BD': localizedUrl('bn', '/aml-kyc-policy'),
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage document={DOCUMENT} locale={locale as Locale} />;
}
