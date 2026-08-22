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
        <li key={item} className="text-ink flex gap-2.5 text-sm leading-relaxed">
          <Icon
            className={
              tone === 'included'
                ? 'text-success mt-0.5 size-4 shrink-0'
                : 'text-muted mt-0.5 size-4 shrink-0'
            }
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
          <tr className="border-border border-b">
            <th
              scope="col"
              className="text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase"
            >
              {t('fees')}
            </th>
            <th
              scope="col"
              className="text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase"
            >
              {t('feeCategories.platform_service_fee').split(' ')[0]}
            </th>
            <th
              scope="col"
              className="text-muted px-3 py-2.5 text-end text-xs font-semibold tracking-wide uppercase"
            >
              BDT
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {service.feeComponents.map((component) => {
            const amount = displayableFee(component);
            return (
              <tr key={`${component.category}-${component.label.en}`}>
                <td className="text-ink px-3 py-3">{pick(component.label, locale)}</td>
                <td className="px-3 py-3">
                  <Badge tone={component.payee === 'bdoor' ? 'info' : 'neutral'}>
                    {tFees(component.category)}
                  </Badge>
                </td>
                <td className="text-ink px-3 py-3 text-end font-medium">
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
      <Section tone="surface" className="border-border border-b py-12 md:py-16">
        <div className="container-page">
          <nav aria-label={tCommon('breadcrumb')} className="mb-5">
            <ol className="text-muted flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link
                  href="/services"
                  className="hover:text-ink rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
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
                {service.requiresPartner ? <Badge tone="accent">{t('authority')}</Badge> : null}
                {service.isRegulated ? <Badge tone="warning">{t('eligibility')}</Badge> : null}
              </div>
              <h1 className="text-ink text-3xl leading-tight md:text-4xl">
                {pick(service.name, loc)}
              </h1>
              <p className="text-muted mt-4 max-w-2xl text-lg leading-relaxed">
                {pick(service.summary, loc)}
              </p>
            </div>

            <Card className="h-fit p-5 md:p-6">
              <dl className="flex flex-col gap-4">
                <div>
                  <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                    {t('startingFrom')}
                  </dt>
                  <dd className="text-ink mt-1 text-2xl font-semibold">
                    {service.startingFeeBdt !== null
                      ? format.number(service.startingFeeBdt, 'bdt')
                      : tPricing('noPublishedFee')}
                  </dd>
                </div>
                {estimate ? (
                  <div>
                    <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                      {t('estimatedTime')}
                    </dt>
                    <dd className="text-ink mt-1 flex items-center gap-2 text-sm font-medium">
                      <Clock className="text-muted size-4" aria-hidden="true" />
                      {estimate.min}–{estimate.max} {loc === 'bn' ? 'দিন' : 'days'}
                    </dd>
                    <dd className="text-muted mt-1 text-xs">
                      {t('timeReviewed')}: {format.dateTime(new Date(estimate.reviewedAt), 'short')}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <Button
                asChild
                block
                size="lg"
                className="mt-5"
                variant={comingSoon ? 'secondary' : 'primary'}
              >
                <Link href={comingSoon ? '/contact' : `/start?service=${service.slug}`}>
                  {comingSoon ? t('notifyMe') : t('cta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>

              <p className="text-muted mt-3 text-xs leading-relaxed">
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
                <h2 className="text-ink text-xl font-semibold">{t('whoFor')}</h2>
                <p className="text-muted mt-3 max-w-prose text-sm leading-relaxed">
                  {pick(service.whoFor, loc)}
                </p>
              </section>
            ) : null}

            {included.length > 0 || notIncluded.length > 0 ? (
              <section className="grid gap-8 sm:grid-cols-2">
                {included.length > 0 ? (
                  <div>
                    <h2 className="text-ink text-xl font-semibold">{t('included')}</h2>
                    <div className="mt-3">
                      <BulletList items={included} tone="included" />
                    </div>
                  </div>
                ) : null}
                {notIncluded.length > 0 ? (
                  <div>
                    <h2 className="text-ink text-xl font-semibold">{t('notIncluded')}</h2>
                    <div className="mt-3">
                      <BulletList items={notIncluded} tone="excluded" />
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {service.eligibility ? (
              <section>
                <h2 className="text-ink text-xl font-semibold">{t('eligibility')}</h2>
                <p className="text-muted mt-3 max-w-prose text-sm leading-relaxed">
                  {pick(service.eligibility, loc)}
                </p>
                <Alert tone="warning" className="mt-4">
                  {tCommon('reviewNote')}
                </Alert>
              </section>
            ) : null}

            {service.requirements.length > 0 ? (
              <section>
                <h2 className="text-ink text-xl font-semibold">{t('requiredDocuments')}</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {service.requirements.map((requirement) => (
                    <li key={requirement.code} className="flex items-start gap-2.5 text-sm">
                      <Check className="text-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span className="text-ink">
                        {pick(requirement.label, loc)}
                        {!requirement.isMandatory ? (
                          <span className="text-muted ms-2">({tCommon('optional')})</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {service.milestones.length > 0 ? (
              <section>
                <h2 className="text-ink text-xl font-semibold">{t('milestones')}</h2>
                <ol className="border-border mt-4 flex flex-col gap-4 border-s ps-5">
                  {service.milestones.map((milestone, index) => (
                    <li key={milestone.code} className="relative">
                      <span
                        className="border-surface bg-primary absolute -start-[1.6rem] top-1 flex size-4 items-center justify-center rounded-full border-2"
                        aria-hidden="true"
                      />
                      <p className="text-ink text-sm font-medium">
                        {index + 1}. {pick(milestone.label, loc)}
                      </p>
                      {milestone.typicalDays ? (
                        <p className="text-muted mt-0.5 text-xs">
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
              <h2 className="text-ink text-xl font-semibold">{t('fees')}</h2>
              <div className="mt-4">
                <FeeTable service={service} locale={loc} />
              </div>
            </section>

            {faqs.length > 0 ? (
              <section>
                <h2 className="text-ink text-xl font-semibold">{t('faq')}</h2>
                <div className="mt-4">
                  <FaqList faqs={faqs} locale={loc} />
                </div>
              </section>
            ) : null}
          </div>

          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
            {service.authorityName ? (
              <Card className="p-5">
                <h2 className="text-ink flex items-center gap-2 text-sm font-semibold">
                  <Landmark className="text-muted size-4" aria-hidden="true" />
                  {t('authority')}
                </h2>
                <p className="text-ink mt-2 text-sm">{pick(service.authorityName, loc)}</p>
                <p className="text-muted mt-2 text-xs leading-relaxed">{t('authorityNote')}</p>
              </Card>
            ) : null}
            <IndependenceDisclosure />
          </aside>
        </div>
      </Section>
    </>
  );
}
