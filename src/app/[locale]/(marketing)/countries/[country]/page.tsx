import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import {
  internationalCountries,
  internationalCountryBySlug,
  pickText,
} from '@/content/international';
import { countryGuideBySlug } from '@/content/countries/guides';
import type { Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';

/**
 * One page per international country.
 *
 * Every route runs as a managed application: the page shows the owner-
 * published starting estimate with its mandatory qualifier, and the call to
 * action starts an application (an assessment for the screened markets),
 * never a checkout. The figures, status and CTA style all come from the
 * commercial catalog, so what the page claims cannot drift from what the
 * owner approved.
 */

export function generateStaticParams() {
  return internationalCountries().map((country) => ({ country: country.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country: slug } = await params;
  const country = internationalCountryBySlug(slug);
  if (!country) return {};
  const t = await getTranslations({ locale, namespace: 'international.country' });
  const name = pickText(country.name, locale as Locale);

  return {
    title: t('metaTitle', { country: name }),
    description: t('metaDescription', { country: name }),
    alternates: {
      canonical: localizedUrl(locale as Locale, `/countries/${slug}`),
      languages: {
        en: localizedUrl('en', `/countries/${slug}`),
        'bn-BD': localizedUrl('bn', `/countries/${slug}`),
      },
    },
  };
}

export default async function InternationalCountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country: slug } = await params;
  setRequestLocale(locale);
  const country = internationalCountryBySlug(slug);
  if (!country) notFound();

  const t = await getTranslations('international.country');
  const tStatus = await getTranslations('international.status');
  const loc = locale as Locale;
  const name = pickText(country.name, loc);
  const { offer } = country;
  const guide = countryGuideBySlug(country.slug);

  return (
    <>
      <PageHeader
        title={name}
        description={t('lede', { country: name, route: pickText(offer.route, loc) })}
      />

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="max-w-prose">
            <div className="flex items-center gap-3">
              <Badge tone="info">{tStatus(offer.publicStatus)}</Badge>
              <span className="text-muted text-sm">{t('statusLine')}</span>
            </div>

            <h2 className="text-ink mt-8 text-xl font-semibold">{t('scopeTitle')}</h2>
            <p className="text-ink mt-3 text-base leading-relaxed">
              {pickText(offer.summary, loc)}
            </p>

            <ul className="mt-5 flex flex-col gap-3">
              {offer.disclosures.map((disclosure) => (
                <li key={disclosure.en} className="flex items-start gap-2.5">
                  <Check className="text-accent mt-1 size-4 shrink-0" aria-hidden="true" />
                  <span className="text-ink text-sm leading-relaxed">
                    {pickText(disclosure, loc)}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="text-ink mt-10 text-xl font-semibold">{t('providerTitle')}</h2>
            <p className="text-muted mt-3 text-sm leading-relaxed">{t('providerBody')}</p>

            <h2 className="text-ink mt-10 text-xl font-semibold">{t('pricingTitle')}</h2>
            {offer.publicLabel ? (
              <div className="mt-3">
                <p className="text-ink text-2xl font-semibold">
                  {pickText(offer.publicLabel, loc)}
                  {offer.publicLabelAlt ? (
                    <span className="text-muted ml-2 text-base font-normal">
                      {pickText(offer.publicLabelAlt, loc)}
                    </span>
                  ) : null}
                </p>
                {offer.publicQualifier ? (
                  <p className="text-muted mt-1 text-sm">{pickText(offer.publicQualifier, loc)}</p>
                ) : null}
              </div>
            ) : null}
            <p className="text-muted mt-3 text-sm leading-relaxed">{t('pricingBody')}</p>

            {guide ? (
              <>
                <h2 className="text-ink mt-10 text-xl font-semibold">{t('requirementsTitle')}</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {guide.requirements.map((item) => (
                    <li key={item.en} className="text-ink flex items-start gap-2.5 text-sm">
                      <Check className="text-accent mt-1 size-4 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{pickText(item, loc)}</span>
                    </li>
                  ))}
                </ul>

                <h2 className="text-ink mt-10 text-xl font-semibold">{t('documentsTitle')}</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {guide.documents.map((item) => (
                    <li key={item.en} className="text-ink flex items-start gap-2.5 text-sm">
                      <Check className="text-accent mt-1 size-4 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{pickText(item, loc)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted mt-3 text-xs leading-relaxed">{t('documentsNote')}</p>

                <h2 className="text-ink mt-10 text-xl font-semibold">{t('obligationsTitle')}</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {guide.obligations.map((item) => (
                    <li key={item.en} className="text-ink flex items-start gap-2.5 text-sm">
                      <Check className="text-accent mt-1 size-4 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{pickText(item, loc)}</span>
                    </li>
                  ))}
                </ul>

                <h2 className="text-ink mt-10 text-xl font-semibold">{t('faqTitle')}</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {guide.faq.map((entry) => (
                    <details
                      key={entry.q.en}
                      className="border-border bg-surface group rounded-[var(--radius-card)] border"
                    >
                      <summary className="text-ink flex min-h-11 cursor-pointer list-none items-center px-4 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                        {pickText(entry.q, loc)}
                      </summary>
                      <p className="text-muted border-border border-t px-4 py-3 text-sm leading-relaxed">
                        {pickText(entry.a, loc)}
                      </p>
                    </details>
                  ))}
                </div>

                <p className="text-muted mt-8 text-xs">
                  {t('guideReviewed', { date: guide.reviewedAt })}
                </p>
              </>
            ) : null}
          </div>

          <div>
            <div className="border-border bg-surface rounded-[var(--radius-panel)] border p-6 lg:sticky lg:top-24">
              <h2 className="text-ink text-lg font-semibold">{t('applyTitle')}</h2>
              <p className="text-muted mt-2 text-sm leading-relaxed">
                {t('applyBody', { country: name })}
              </p>
              <Button asChild size="lg" className="mt-5 w-full">
                <Link href={`${MARKETING_ROUTES.start}?country=${country.slug}`}>
                  {offer.eligibilityLed
                    ? t('assessCta', { country: name })
                    : t('applyCta', { country: name })}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <p className="text-muted mt-3 text-xs leading-relaxed">{t('sla')}</p>
            </div>

            <p className="text-muted mt-6 text-xs leading-relaxed">{t('disclosure')}</p>
            <p className="text-muted mt-3 text-xs leading-relaxed">
              {t('disclaimer', { country: name })}
            </p>
          </div>
        </div>

        <div className="container-page mt-14 max-w-prose">
          <IndependenceDisclosure />
        </div>
      </Section>
    </>
  );
}
