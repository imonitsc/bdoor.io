import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check, ShieldCheck, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/marketing/page-header';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partnersPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/partners'),
      languages: {
        en: localizedUrl('en', '/partners'),
        'bn-BD': localizedUrl('bn', '/partners'),
      },
    },
  };
}

const CAN = ['assigned', 'documents', 'tasks', 'upload', 'message', 'notes'] as const;
const CANNOT = ['browse', 'finance', 'selfVerify', 'aml', 'export', 'audit'] as const;

/**
 * The public directory lists only organizations that have actually completed
 * verification, read through the `verified_partners_public` view. If none have,
 * we say so rather than inventing logos.
 */
async function verifiedPartners(): Promise<Array<{ id: string; name: string }>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('verified_partners_public')
      .select('id, name')
      .order('name');
    if (error) {
      logger.warn('partners.directory_failed', { message: error.message });
      return [];
    }
    return (data ?? []).filter(
      (row): row is { id: string; name: string } => Boolean(row.id) && Boolean(row.name),
    );
  } catch {
    return [];
  }
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tHome, partners] = await Promise.all([
    getTranslations('partnersPage'),
    getTranslations('home.partners'),
    verifiedPartners(),
  ]);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <h2 className="text-ink text-xl font-semibold">{t('howTitle')}</h2>
            <p className="text-muted mt-3 max-w-prose text-sm leading-relaxed">{tHome('body')}</p>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-ink text-sm font-semibold">{t('canTitle')}</h3>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {CAN.map((key) => (
                    <li key={key} className="flex items-start gap-2.5 text-sm">
                      <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span className="text-ink">{t(`can.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-ink text-sm font-semibold">{t('cannotTitle')}</h3>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {CANNOT.map((key) => (
                    <li key={key} className="flex items-start gap-2.5 text-sm">
                      <X className="text-danger mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span className="text-ink">{t(`cannot.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <IndependenceDisclosure className="mt-8" />
          </div>

          <aside className="flex h-fit flex-col gap-6">
            <Card className="p-5 md:p-6">
              <h2 className="text-ink text-base font-semibold">{t('applyTitle')}</h2>
              <p className="text-muted mt-2 text-sm leading-relaxed">{t('applyBody')}</p>
              <Button asChild className="mt-4" block>
                <Link href={`${MARKETING_ROUTES.contact}?topic=partner`}>
                  {t('applyCta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Card>

            {/*
              The directory renders only once at least one organisation has
              actually completed verification. Before that there is no
              "verified partners" section at all: an empty catalogue under
              that heading implies a network that does not yet exist, and a
              placeholder implies it louder.
            */}
            {partners.length > 0 ? (
              <div>
                <h2 className="text-ink flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="text-accent size-4" aria-hidden="true" />
                  {t('directoryTitle')}
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {partners.map((partner) => (
                    <li
                      key={partner.id}
                      className="border-border bg-surface text-ink rounded-[var(--radius-control)] border px-4 py-3 text-sm"
                    >
                      {partner.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </Section>
    </>
  );
}
