import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { ProviderApplicationForm } from '@/components/forms/provider-application-form';
import { loadProviderApplication } from '@/features/partners/application-actions';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

/** The application renders the visitor's own draft — never prerender it. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partnersApply' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/partners/apply'),
      languages: {
        en: localizedUrl('en', '/partners/apply'),
        'bn-BD': localizedUrl('bn', '/partners/apply'),
      },
    },
    robots: { index: true, follow: true, nocache: true },
  };
}

export default async function PartnersApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, initial] = await Promise.all([
    getTranslations('partnersApply'),
    loadProviderApplication(),
  ]);

  return (
    <Section className="py-10 md:py-14">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-ink text-3xl leading-tight md:text-4xl">{t('title')}</h1>
          <p className="text-muted mt-3 text-base leading-relaxed">{t('description')}</p>

          <Card className="mt-8 p-5 md:p-8">
            {initial.enabled ? (
              <ProviderApplicationForm initial={initial} />
            ) : (
              <div className="flex flex-col gap-5" data-testid="provider-apply-closed">
                <Alert tone="neutral" title={t('closed.title')}>
                  {t('closed.body')}
                </Alert>
                <div>
                  <Button asChild variant="secondary">
                    <Link href={`${MARKETING_ROUTES.contact}?topic=partner`}>
                      {t('closed.contactCta')}
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <p className="text-muted mt-6 text-sm leading-relaxed">{t('reviewNotice')}</p>
        </div>
      </div>
    </Section>
  );
}
