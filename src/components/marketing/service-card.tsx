import { useTranslations, useFormatter } from 'next-intl';
import { ArrowRight, Clock, ShieldQuestion } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { displayableEstimate, pick, type Locale, type Service } from '@/features/catalog/types';

export function ServiceCard({ service, locale }: { service: Service; locale: Locale }) {
  const t = useTranslations();
  const format = useFormatter();
  const estimate = displayableEstimate(service);
  const comingSoon = service.status === 'coming_soon';

  return (
    <Card
      as="article"
      className="group relative flex flex-col transition-shadow duration-200 hover:shadow-md focus-within:shadow-md"
    >
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {comingSoon ? <Badge tone="neutral">{t('common.comingSoon')}</Badge> : null}
          {service.requiresPartner ? (
            <Badge tone="accent">{t('howItWorksPage.responsibilities.partner')}</Badge>
          ) : null}
          {service.isRegulated ? (
            <Badge tone="warning" icon={<ShieldQuestion className="size-3" />}>
              {t('services.eligibility')}
            </Badge>
          ) : null}
        </div>

        <h3 className="text-base font-semibold text-ink">
          <Link
            href={`/services/${service.slug}`}
            className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            {pick(service.name, locale)}
          </Link>
        </h3>

        <p className="flex-1 text-sm leading-relaxed text-muted">{pick(service.summary, locale)}</p>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              {t('services.startingFrom')}
            </dt>
            <dd className="mt-0.5 font-medium text-ink">
              {service.startingFeeBdt !== null
                ? format.number(service.startingFeeBdt, 'bdt')
                : t('pricingPage.noPublishedFee')}
            </dd>
          </div>
          {estimate ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                {t('services.estimatedTime')}
              </dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-ink">
                <Clock className="size-3.5 text-muted" aria-hidden="true" />
                {estimate.min}–{estimate.max} {locale === 'bn' ? 'দিন' : 'days'}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <p className="relative flex items-center gap-1.5 border-t border-border px-5 py-3.5 text-sm font-medium text-primary md:px-6">
        {comingSoon ? t('services.notifyMe') : t('services.viewService')}
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </p>
    </Card>
  );
}
