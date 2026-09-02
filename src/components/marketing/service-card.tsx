import { useTranslations, useFormatter } from 'next-intl';
import { ArrowRight, Clock, ShieldQuestion } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { displayableEstimate, pick, type Locale, type Service } from '@/features/catalog/types';

/**
 * Callers pass only services that `isPubliclyVisible` accepted, so this card
 * has no coming-soon state. It used to carry a "Notify me" variant, which made
 * every list that forgot to filter into an interest-only door (CLAUDE.md §8.3).
 */
export function ServiceCard({ service, locale }: { service: Service; locale: Locale }) {
  const t = useTranslations();
  const format = useFormatter();
  const estimate = displayableEstimate(service);

  return (
    <Card
      as="article"
      className="group relative flex flex-col transition-shadow duration-200 focus-within:shadow-md hover:shadow-md"
    >
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {service.requiresPartner ? (
            <Badge tone="accent">{t('howItWorksPage.responsibilities.partner')}</Badge>
          ) : null}
          {service.isRegulated ? (
            <Badge tone="warning" icon={<ShieldQuestion className="size-3" />}>
              {t('services.eligibility')}
            </Badge>
          ) : null}
        </div>

        <h3 className="text-ink text-base font-semibold">
          <Link
            href={`/services/${service.slug}`}
            className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            {pick(service.name, locale)}
          </Link>
        </h3>

        <p className="text-muted flex-1 text-sm leading-relaxed">{pick(service.summary, locale)}</p>

        <dl className="border-border flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted text-xs font-medium tracking-wide uppercase">
              {t('services.startingFrom')}
            </dt>
            <dd className="text-ink mt-0.5 font-medium">
              {service.startingFeeBdt !== null
                ? format.number(service.startingFeeBdt, 'bdt')
                : t('pricingPage.noPublishedFee')}
            </dd>
          </div>
          {estimate ? (
            <div>
              <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                {t('services.estimatedTime')}
              </dt>
              <dd className="text-ink mt-0.5 flex items-center gap-1.5 font-medium">
                <Clock className="text-muted size-3.5" aria-hidden="true" />
                {estimate.min}–{estimate.max} {locale === 'bn' ? 'দিন' : 'days'}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <p className="border-border text-primary relative flex items-center gap-1.5 border-t px-5 py-3.5 text-sm font-medium md:px-6">
        {t('services.viewService')}
        <ArrowRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </p>
    </Card>
  );
}
