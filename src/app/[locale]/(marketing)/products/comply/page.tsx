import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/ui/section';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { publishedPackages, activePackageVersion } from '@/content/packages/catalog';
import { pick } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

/**
 * bdoor Comply (replacement instruction §4.8, ROADMAP P0): the
 * continuing-compliance layer, described as it operates today — obligations,
 * deadlines and reminders in the customer workspace, preparation coordinated
 * with specialists on request. The recurring figures shown here are the
 * founder-approved catalogue entries the pricing page already publishes
 * (Annual Compliance, Managed Finance & Compliance) — no other tier name or
 * price appears, and the labels render from the catalogue so this page can
 * never drift from /pricing.
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

function ComplyContent({ locale }: { locale: Locale }) {
  const t = useTranslations('products.comply');
  const items = ['calendar', 'reminders', 'renewals', 'prepare'] as const;
  // The recurring catalogue entries are the product's published prices; a
  // one-off package on the existing-business tab is not a subscription and
  // does not belong here.
  const recurring = publishedPackages('existing_business').filter(
    (pkg) => activePackageVersion(pkg)?.billingPeriod,
  );

  return (
    <>
      <Section>
        <div className="container-page max-w-3xl">
          <p className="text-muted font-mono text-xs tracking-[0.14em] uppercase">{t('eyebrow')}</p>
          <h1 className="text-ink mt-4 text-3xl leading-tight font-semibold md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-muted mt-4 text-lg leading-relaxed">{t('tagline')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/app/compliance">
                {t('subscribeCta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={`${MARKETING_ROUTES.pricing}?segment=existing_business`}>
                {t('plans.seePricing')}
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section>
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow={t('plans.eyebrow')} title={t('plans.title')} />
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {recurring.map((pkg) => {
              const version = activePackageVersion(pkg);
              if (!version) return null;
              return (
                <li key={pkg.slug} className="border-border rounded-lg border p-5">
                  <h2 className="text-ink text-base font-semibold">{pick(pkg.name, locale)}</h2>
                  <p className="text-primary mt-2 text-base font-semibold">
                    {pick(version.publicLabel, locale)}
                  </p>
                  <p className="text-muted mt-2 text-sm leading-relaxed">
                    {pick(version.summary, locale)}
                  </p>
                </li>
              );
            })}
          </ul>
          {/* The fee-layer rule applies to recurring revenue too: the
              subscription is the bdoor professional fee, and any filing it
              triggers still itemises government and provider amounts on its
              own case. */}
          <p className="text-muted mt-6 text-sm leading-relaxed">{t('plans.note')}</p>
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
  return <ComplyContent locale={locale as Locale} />;
}
