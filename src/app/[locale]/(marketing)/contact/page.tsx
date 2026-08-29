import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { ContactForm } from '@/components/marketing/contact-form';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { CONTACT_TOPICS } from '@/features/contact/schema';
import { resolveContactInterest } from '@/features/contact/interest';
import { pickText } from '@/content/international';
import { SITE, localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/contact'),
      languages: {
        en: localizedUrl('en', '/contact'),
        'bn-BD': localizedUrl('bn', '/contact'),
      },
    },
  };
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ topic?: string; interest?: string; package?: string }>;
}) {
  const [{ locale }, { topic, interest: interestParam, package: packageParam }] = await Promise.all(
    [params, searchParams],
  );
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const loc = locale as Locale;

  // Country CTAs arrive as /contact?interest=<slug>. The slug is resolved
  // against the commercial catalog — an unknown value is simply a general
  // enquiry — and the visitor sees which country they are asking about.
  const interest = resolveContactInterest(interestParam, packageParam);

  const defaultTopic = CONTACT_TOPICS.includes(topic as (typeof CONTACT_TOPICS)[number])
    ? topic
    : (interest?.topic ?? undefined);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="max-w-xl">
            {interest ? (
              <div className="border-border bg-surface mb-6 rounded-[var(--radius-card)] border p-4">
                <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                  {t('interest.title')}
                </p>
                <p className="text-ink mt-1 text-base font-semibold">
                  {pickText(interest.countryName, loc)}
                  {interest.routeName ? (
                    <span className="text-muted font-normal">
                      {' — '}
                      {pickText(interest.routeName, loc)}
                    </span>
                  ) : null}
                </p>
              </div>
            ) : null}
            <ContactForm
              defaultTopic={defaultTopic}
              interestCountry={interest?.countrySlug}
              interestRoute={interest?.routeSlug}
              defaultMessage={
                interest && interest.topic === 'foreign'
                  ? t('interest.defaultMessage', {
                      country: pickText(interest.countryName, loc),
                    })
                  : undefined
              }
            />
          </div>

          <aside className="flex h-fit flex-col gap-6">
            <Card className="p-5">
              <h2 className="text-ink text-sm font-semibold">{t('otherWays')}</h2>
              <a
                href={`mailto:${SITE.contactEmail}`}
                className="text-primary hover:text-primary-hover mt-3 inline-flex items-center gap-2 rounded text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                <Mail className="size-4" aria-hidden="true" />
                {SITE.contactEmail}
              </a>
              <p className="text-muted mt-4 flex items-start gap-2 text-sm">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t('responseTime')}
              </p>
            </Card>
            <IndependenceDisclosure />
          </aside>
        </div>
      </Section>
    </>
  );
}
