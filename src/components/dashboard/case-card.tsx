'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { AlertCircle, ArrowRight, PauseCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CaseStatusBadge } from './status-badge';
import type { CaseSummary } from '@/features/cases/queries';

export function CaseCard({
  item,
  basePath = '/app/applications',
}: {
  item: CaseSummary;
  basePath?: string;
}) {
  const t = useTranslations('workspace');
  const format = useFormatter();

  return (
    <Card as="article" className="group relative p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted font-mono text-xs">{item.reference}</p>
          <h3 className="text-ink mt-1 text-base font-semibold">
            <Link
              href={`${basePath}/${item.id}`}
              className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              {item.title}
            </Link>
          </h3>
        </div>
        <CaseStatusBadge status={item.status} />
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted">
            {t('dashboard.milestonesComplete', {
              done: item.progress.completed,
              total: item.progress.total,
            })}
          </span>
          <span className="text-ink font-medium">{item.progress.percent}%</span>
        </div>
        <Progress className="mt-2" value={item.progress.percent} label={t('case.timeline')} />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-muted text-xs">{t('case.openedOn')}</dt>
          <dd className="text-ink">{format.dateTime(new Date(item.openedAt), 'short')}</dd>
        </div>
        {item.estimate.available ? (
          <div>
            <dt className="text-muted text-xs">{t('case.estimatedCompletion')}</dt>
            <dd className="text-ink flex items-center gap-1.5">
              {item.estimate.paused ? (
                <>
                  <PauseCircle className="text-warning size-3.5" aria-hidden="true" />
                  <span>
                    {t('case.estimatePaused', {
                      reason: t(`case.waitingReasons.${item.estimate.pausedReason}`),
                    })}
                  </span>
                </>
              ) : (
                format.dateTime(item.estimate.latestCompletion, 'short')
              )}
            </dd>
          </div>
        ) : null}
        {item.openActions > 0 ? (
          <div>
            <dt className="text-muted text-xs">{t('dashboard.actionsNeeded')}</dt>
            <dd className="text-warning flex items-center gap-1.5 font-medium">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              {item.openActions}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="text-primary mt-4 flex items-center gap-1.5 text-sm font-medium">
        {t('case.overview')}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </p>
    </Card>
  );
}
