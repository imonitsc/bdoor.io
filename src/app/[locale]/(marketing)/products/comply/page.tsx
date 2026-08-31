import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * bdoor Comply (replacement instruction §4.8): the continuing-compliance
 * layer, described as it operates today — obligations, deadlines and
 * reminders in the customer workspace, preparation coordinated with
 * specialists on request. No tier names or prices appear here: §13.1A keeps
 * those internal until the founder approves them, and the approved packages
 * on /pricing stay the only published commercial figures.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products.comply' });
  return {
    title: t('title'),
    description: t('tagline'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/products/comply'),
      languages: {
        en: localizedUrl('en', '/products/comply'),
        'bn-BD': localizedUrl('bn', '/products/comply'),
      },
    },
  };
}

function ComplyContent() {
  const t = useTranslations('products.comply');
  const items = ['calendar', 'reminders', 'renewals', 'prepare'] as const;

  return (
    <>
      <Section>
        <div className="container-page max-w-3xl">
          <p className="text-muted font-mono text-xs tracking-[0.14em] uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="text-ink mt-4 text-3xl leading-tight font-semibold md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-muted mt-4 text-lg leading-relaxed">{t('tagline')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={MARKETING_ROUTES.start}>
                {t('cta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={MARKETING_ROUTES.login}>{t('signInCta')}</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow={t('what.eyebrow')} title={t('what.title')} />
          <ul className="border-border mt-8 divide-y border-y">
            {items.map((item) => (
              <li key={item} className="py-4">
                <h2 className="text-ink text-base font-semibold">{t(`what.${item}.title`)}</h2>
                <p className="text-muted mt-1 text-sm leading-relaxed">{t(`what.${item}.body`)}</p>
              </li>
            ))}
          </ul>
          {/* §4.8: never an official good-standing claim, never "autopilot" —
              filings need the customer's information, approval and, where the
              law requires it, a qualified professional. */}
          <p className="text-muted mt-6 text-sm leading-relaxed">{t('honesty')}</p>
        </div>
      </Section>
    </>
  );
}

export default async function ProductComplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ComplyContent />;
}
