import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/section';
import { Alert } from '@/components/ui/alert';
import { LEGAL_DOCUMENTS } from '@/content/legal/documents';
import { legalContentStatus } from '@/lib/launch/gates';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';
import type { LegalDocumentSlug } from '@/content/legal/types';

const INDEX_LINKS: ReadonlyArray<{
  href: string;
  titleKey:
    | 'terms'
    | 'privacy'
    | 'refund'
    | 'amlKyc'
    | 'cookies'
    | 'disclaimer'
    | 'complaints'
    | 'acceptableUse'
    | 'providerDisclosure'
    | 'electronicConsent';
  slug: LegalDocumentSlug;
}> = [
  { href: MARKETING_ROUTES.terms, titleKey: 'terms', slug: 'terms' },
  { href: MARKETING_ROUTES.privacy, titleKey: 'privacy', slug: 'privacy' },
  { href: MARKETING_ROUTES.refundPolicy, titleKey: 'refund', slug: 'refund-policy' },
  { href: MARKETING_ROUTES.amlKycPolicy, titleKey: 'amlKyc', slug: 'aml-kyc-policy' },
  { href: MARKETING_ROUTES.cookiePolicy, titleKey: 'cookies', slug: 'cookie-policy' },
  { href: MARKETING_ROUTES.legalDisclaimer, titleKey: 'disclaimer', slug: 'legal-disclaimer' },
  { href: MARKETING_ROUTES.complaints, titleKey: 'complaints', slug: 'complaints' },
  { href: MARKETING_ROUTES.acceptableUse, titleKey: 'acceptableUse', slug: 'acceptable-use' },
  {
    href: MARKETING_ROUTES.providerDisclosure,
    titleKey: 'providerDisclosure',
    slug: 'provider-disclosure',
  },
  {
    href: MARKETING_ROUTES.electronicConsent,
    titleKey: 'electronicConsent',
    slug: 'electronic-consent',
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return {
    title: t('indexTitle'),
    description: t('indexBody'),
    robots: legalContentStatus() === 'draft' ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: localizedUrl(locale as Locale, '/legal'),
      languages: { en: localizedUrl('en', '/legal'), 'bn-BD': localizedUrl('bn', '/legal') },
    },
  };
}

export default async function LegalIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <Section className="py-12 md:py-16">
      <div className="container-page max-w-3xl">
        <h1 className="text-ink text-3xl leading-tight md:text-4xl">{t('indexTitle')}</h1>
        <p className="text-muted mt-4 text-base leading-relaxed">{t('indexBody')}</p>

        {legalContentStatus() === 'draft' ? (
          <Alert tone="warning" title={t('draftBanner')} className="mt-6">
            {t('draftBannerBody')}
          </Alert>
        ) : null}

        <ul className="border-border mt-10 divide-y border-y">
          {INDEX_LINKS.map((item) => {
            const doc = LEGAL_DOCUMENTS[item.slug];
            return (
              <li
                key={item.slug}
                className="flex flex-wrap items-baseline justify-between gap-2 py-4"
              >
                <Link
                  href={item.href}
                  className="text-ink hover:text-primary text-base font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {t(item.titleKey)}
                </Link>
                <span className="text-muted text-xs">
                  {t('versionLabel', { version: doc.version })} ·{' '}
                  {t('effectiveShort', { date: doc.effectiveFrom })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
