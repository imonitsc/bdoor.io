import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check, Clock, Landmark, Minus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { FaqList } from '@/components/marketing/faq-list';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getFaqs, getService, getServices } from '@/features/catalog/queries';
import {
  displayableEstimate,
  displayableFee,
  pick,
  type Locale,
  type Service,
} from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

export async function generateStaticParams() {
  const { data } = await getServices();
  return data.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { data: service } = await getService(slug);
  if (!service) return {};

  const name = pick(service.name, locale as Locale) ?? service.slug;
  const summary = pick(service.summary, locale as Locale) ?? '';

  return {
    title: name,
    description: summary,
    alternates: {
      canonical: localizedUrl(locale as Locale, `/services/${slug}`),
      languages: {
        en: localizedUrl('en', `/services/${slug}`),
        'bn-BD': localizedUrl('bn', `/services/${slug}`),
      },
    },
    openGraph: { title: name, description: summary },
  };
}

function BulletList({ items, tone }: { items: string[]; tone: 'included' | 'excluded' }) {
  if (items.length === 0) return null;
  const Icon = tone === 'included' ? Check : Minus;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink">
          <Icon
            className={tone === 'included' ? 'mt-0.5 size-4 shrink-0 text-success' : 'mt-0.5 size-4 shrink-0 text-muted'}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

async function FeeTable({ service, locale }: { service: Service; locale: Locale }) {
  const [t, tFees, format] = await Promise.all([
    getTranslations('services'),
    getTranslations('services.feeCategories'),
    getFormatter(),
  ]);
  const tPricing = await getTranslations('pricingPage');

  if (service.feeComponents.length === 0) return null;

  return (
    <div className="scroll-x">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <caption className="sr-only">{t('fees')}</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted">
              {t('fees')}
            </th>
            <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted">
              {t('feeCategories.platform_service_fee').split(' ')[0]}
            </th>
            <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold uppercase tracking-wide text-muted">
              BDT
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {service.feeComponents.map((component) => {
            const amount = displayableFee(component);
            return (
              <tr key={`${component.category}-${component.label.en}`}>
                <td className="px-3 py-3 text-ink">{pick(component.label, locale)}</td>
                <td className="px-3 py-3">
                  <Badge tone={component.payee === 'bdoor' ? 'info' : 'neutral'}>
                    {tFees(component.category)}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-end font-medium text-ink">
                  {amount !== null ? format.number(amount, 'bdt') : tPricing('noPublishedFee')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [{ data: service }, { data: allFaqs }, t, tCommon, tPricing, format] = await Promise.all([
    getService(slug),
    getFaqs(),
    getTranslations('services'),
    getTranslations('common'),
    getTranslations('pricingPage'),
    getFormatter(),
  ]);

  if (!service) notFound();

  const loc = locale as Locale;
  const estimate = displayableEstimate(service);
  const comingSoon = service.status === 'coming_soon';
  const faqs = allFaqs.filter((f) => f.serviceSlug === service.slug || f.isGlobal);
  const included = pick(service.included, loc) ?? [];
  const notIncluded = pick(service.notIncluded, loc) ?? [];

  return (
    <>
      <Section tone="surface" className="border-b border-border py-12 md:py-16">
        <div className="container-page">
          <nav aria-label={tCommon('breadcrumb')} className="mb-5">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <li>
                <Link href="/services" className="rounded hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]">
                  {t('indexTitle')}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink" aria-current="page">
                {pick(service.name, loc)}
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {comingSoon ? <Badge tone="neutral">{tCommon('comingSoon')}</Badge> : null}
                {service.requiresPartner ? (
                  <Badge tone="accent">{t('authority')}</Badge>
                ) : null}
                {service.isRegulated ? <Badge tone="warning">{t('eligibility')}</Badge> : null}
              </div>
              <h1 className="text-3xl leading-tight text-ink md:text-4xl">
                {pick(service.name, loc)}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                {pick(service.summary, loc)}
              </p>
            </div>

            <Card className="h-fit p-5 md:p-6">
              <dl className="flex flex-col gap-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t('startingFrom')}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-ink">
                    {service.startingFeeBdt !== null
                      ? format.number(service.startingFeeBdt, 'bdt')
                      : tPricing('noPublishedFee')}
                  </dd>
                </div>
                {estimate ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {t('estimatedTime')}
                    </dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                      <Clock className="size-4 text-muted" aria-hidden="true" />
                      {estimate.min}–{estimate.max} {loc === 'bn' ? 'দিন' : 'days'}
                    </dd>
                    <dd className="mt-1 text-xs text-muted">
                      {t('timeReviewed')}: {format.dateTime(new Date(estimate.reviewedAt), 'short')}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <Button asChild block size="lg" className="mt-5" variant={comingSoon ? 'secondary' : 'primary'}>
                <Link href={comingSoon ? '/contact' : `/start?service=${service.slug}`}>
                  {comingSoon ? t('notifyMe') : t('cta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>

              <p className="mt-3 text-xs leading-relaxed text-muted">
                {tCommon('processingTimeNote')}
              </p>
            </Card>
          </div>
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-10">
            {comingSoon ? <Alert tone="neutral">{t('comingSoonNote')}</Alert> : null}

            {service.whoFor ? (
              <section>
                <h2 className="text-xl font-semibold text-ink">{t('whoFor')}</h2>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
                  {pick(service.whoFor, loc)}
                </p>
              </section>
            ) : null}

            {included.length > 0 || notIncluded.length > 0 ? (
              <section className="grid gap-8 sm:grid-cols-2">
                {included.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold text-ink">{t('included')}</h2>
                    <div className="mt-3">
                      <BulletList items={included} tone="included" />
                    </div>
                  </div>
                ) : null}
                {notIncluded.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold text-ink">{t('notIncluded')}</h2>
                    <div className="mt-3">
                      <BulletList items={notIncluded} tone="excluded" />
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {service.eligibility ? (
              <section>
                <h2 className="text-xl font-semibold text-ink">{t('eligibility')}</h2>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
                  {pick(service.eligibility, loc)}
                </p>
                <Alert tone="warning" className="mt-4">
                  {tCommon('reviewNote')}
                </Alert>
              </section>
            ) : null}

            {service.requirements.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold text-ink">{t('requiredDocuments')}</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {service.requirements.map((requirement) => (
                    <li key={requirement.code} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                      <span className="text-ink">
                        {pick(requirement.label, loc)}
                        {!requirement.isMandatory ? (
                          <span className="ms-2 text-muted">({tCommon('optional')})</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {service.milestones.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold text-ink">{t('milestones')}</h2>
                <ol className="mt-4 flex flex-col gap-4 border-s border-border ps-5">
                  {service.milestones.map((milestone, index) => (
                    <li key={milestone.code} className="relative">
                      <span
                        className="absolute -start-[1.6rem] top-1 flex size-4 items-center justify-center rounded-full border-2 border-surface bg-primary"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-ink">
                        {index + 1}. {pick(milestone.label, loc)}
                      </p>
                      {milestone.typicalDays ? (
                        <p className="mt-0.5 text-xs text-muted">
                          {tCommon('estimated')}: {milestone.typicalDays}{' '}
                          {loc === 'bn' ? 'দিন' : 'days'}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section>
              <h2 className="text-xl font-semibold text-ink">{t('fees')}</h2>
              <div className="mt-4">
                <FeeTable service={service} locale={loc} />
              </div>
            </section>

            {faqs.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold text-ink">{t('faq')}</h2>
                <div className="mt-4">
                  <FaqList faqs={faqs} locale={loc} />
                </div>
              </section>
            ) : null}
          </div>

          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
            {service.authorityName ? (
              <Card className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Landmark className="size-4 text-muted" aria-hidden="true" />
                  {t('authority')}
                </h2>
                <p className="mt-2 text-sm text-ink">{pick(service.authorityName, loc)}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{t('authorityNote')}</p>
              </Card>
            ) : null}
            <IndependenceDisclosure />
          </aside>
        </div>
      </Section>
    </>
  );
}
