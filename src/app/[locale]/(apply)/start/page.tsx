import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { Questionnaire } from '@/components/forms/questionnaire';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { loadIntake } from '@/features/intake/actions';
import { presetFromParams } from '@/features/intake/preset';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

/**
 * The questionnaire renders the visitor's own saved draft, so it is
 * per-request by definition and must never be prerendered or shared-cached.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'start' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/start'),
      languages: { en: localizedUrl('en', '/start'), 'bn-BD': localizedUrl('bn', '/start') },
    },
    // The questionnaire holds a draft of the visitor's answers; it must not be
    // cached anywhere shared.
    robots: { index: true, follow: true, nocache: true },
  };
}

export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const preset = presetFromParams(await searchParams);
  if (preset.redirectTo) redirect(`/${locale}${preset.redirectTo}`);
  const [t, initial] = await Promise.all([getTranslations('start'), loadIntake(preset)]);

  return (
    <Section className="py-10 md:py-14">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-ink text-3xl leading-tight md:text-4xl">{t('title')}</h1>
          <p className="text-muted mt-3 text-base leading-relaxed">{t('description')}</p>

          <Card className="mt-8 p-5 md:p-8">
            <Questionnaire initial={initial} />
          </Card>

          <div className="mt-8">
            <IndependenceDisclosure />
          </div>
        </div>
      </div>
    </Section>
  );
}
