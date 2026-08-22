import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { ContactForm } from '@/components/marketing/contact-form';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { CONTACT_TOPICS } from '@/features/contact/schema';
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
  searchParams: Promise<{ topic?: string }>;
}) {
  const [{ locale }, { topic }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  const defaultTopic = CONTACT_TOPICS.includes(topic as (typeof CONTACT_TOPICS)[number])
    ? topic
    : undefined;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="max-w-xl">
            <ContactForm defaultTopic={defaultTopic} />
          </div>

          <aside className="flex h-fit flex-col gap-6">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink">{t('otherWays')}</h2>
              <a
                href={`mailto:${SITE.contactEmail}`}
                className="mt-3 inline-flex items-center gap-2 rounded text-sm text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              >
                <Mail className="size-4" aria-hidden="true" />
                {SITE.contactEmail}
              </a>
              <p className="mt-4 flex items-start gap-2 text-sm text-muted">
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
