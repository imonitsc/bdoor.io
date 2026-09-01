import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { BarChart3 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { MetricSnapshotForm } from '@/components/dashboard/metric-snapshot-form';
import { requireCapability } from '@/lib/auth/session';
import {
  loadFunnelCounts,
  loadObligationEngagement,
  loadRecurringSummary,
  loadRenewalConversion,
  loadRetentionCohorts,
  loadRevenueSummary,
  loadSnapshots,
  type RetentionCohortRow,
} from '@/features/metrics/queries';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** The funnel rows shown, in journey order (docs/EVENT_TAXONOMY.md). */
const FUNNEL_ORDER = [
  'application_started',
  'application_submitted',
  'contact_submitted',
  'quote_viewed',
  'quote_accepted',
  'payment_confirmed',
  'case_completed',
] as const;

export default async function AdminMetricsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t, format] = await Promise.all([
    requireCapability('metrics.read'),
    getTranslations('admin.metrics'),
    getFormatter(),
  ]);

  const [funnel, revenue, recurring, snapshots, retention, engagement, renewals] =
    await Promise.all([
      loadFunnelCounts(),
      loadRevenueSummary(),
      loadRecurringSummary(),
      loadSnapshots(),
      loadRetentionCohorts(),
      loadObligationEngagement(),
      loadRenewalConversion(),
    ]);

  // Cohort rows pivoted for display: one row per cohort month, one column
  // per months-since (capped for width; the view itself carries up to 24).
  const RETENTION_COLUMNS = 12;
  const cohortMonths = [...new Set(retention.map((row) => row.cohortMonth))].sort();
  const retentionByCohort = new Map<string, Map<number, RetentionCohortRow>>();
  for (const row of retention) {
    const perCohort = retentionByCohort.get(row.cohortMonth) ?? new Map();
    perCohort.set(row.monthsSince, row);
    retentionByCohort.set(row.cohortMonth, perCohort);
  }

  const money = (minor: number) => format.number(minor / 100, 'bdt');
  const hasAnyEvent = FUNNEL_ORDER.some((event) => funnel[event] > 0);
  const previousMonth = (() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  })();

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={t('description')} />

      <Alert tone="neutral">{t('integrityNote')}</Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-sm">
              {t('netRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink text-2xl font-semibold">{money(revenue.netRevenueMinor)}</p>
            <p className="text-muted mt-1 text-xs">
              {t('collectedCash')}: {money(revenue.collectedCashMinor)} · {t('passThrough')}:{' '}
              {money(revenue.passThroughMinor)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-sm">
              {t('mrr')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink text-2xl font-semibold">{money(recurring.mrrMinor)}</p>
            <p className="text-muted mt-1 text-xs">
              {t('arr')}: {money(recurring.arrMinor)} · {t('activeSubscriptions')}:{' '}
              {recurring.activeSubscriptions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-sm">
              {t('paidPayments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink text-2xl font-semibold">{revenue.paidPaymentCount}</p>
            <p className="text-muted mt-1 text-xs">{t('sandboxExcluded')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('funnel')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAnyEvent ? (
            <EmptyState icon={<BarChart3 className="size-5" />} title={t('noEvents')} />
          ) : (
            <ul className="divide-border divide-y">
              {FUNNEL_ORDER.map((event) => (
                <li key={event} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-ink text-sm">{t(`events.${event}`)}</span>
                  <span className="text-ink text-sm font-medium tabular-nums">{funnel[event]}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('retention.cohorts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {cohortMonths.length === 0 ? (
            <p className="text-muted text-sm">{t('retention.noCohorts')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted text-start text-xs">
                    <th className="py-2 pe-4 text-start font-medium">{t('retention.cohort')}</th>
                    <th className="py-2 pe-4 text-end font-medium">{t('retention.size')}</th>
                    {Array.from({ length: RETENTION_COLUMNS }, (_, i) => (
                      <th key={i} className="px-2 py-2 text-end font-medium">
                        M{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {cohortMonths.map((month) => {
                    const perCohort = retentionByCohort.get(month);
                    const size = perCohort?.get(0)?.cohort ?? 0;
                    return (
                      <tr key={month}>
                        <td className="text-ink py-2 pe-4">
                          {format.dateTime(new Date(month), { year: 'numeric', month: 'short' })}
                        </td>
                        <td className="text-ink py-2 pe-4 text-end tabular-nums">{size}</td>
                        {Array.from({ length: RETENTION_COLUMNS }, (_, i) => {
                          const cell = perCohort?.get(i);
                          return (
                            <td key={i} className="text-ink px-2 py-2 text-end tabular-nums">
                              {cell ? `${Math.round(cell.rate * 100)}%` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-muted mt-3 text-xs">{t('retention.cohortNote')}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('retention.engagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            {engagement.length === 0 ? (
              <p className="text-muted text-sm">{t('retention.noEngagement')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted text-xs">
                      <th className="py-2 pe-4 text-start font-medium">
                        {t('retention.dueMonth')}
                      </th>
                      <th className="px-2 py-2 text-end font-medium">
                        {t('retention.obligations')}
                      </th>
                      <th className="px-2 py-2 text-end font-medium">{t('retention.reminded')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('retention.opened')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('retention.acted')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('retention.filed')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {engagement.map((row) => (
                      <tr key={row.dueMonth}>
                        <td className="text-ink py-2 pe-4">
                          {format.dateTime(new Date(row.dueMonth), {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">
                          {row.obligations}
                        </td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">{row.reminded}</td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">{row.opened}</td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">{row.acted}</td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">{row.filed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-muted mt-3 text-xs">{t('retention.engagementNote')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('retention.renewals')}</CardTitle>
          </CardHeader>
          <CardContent>
            {renewals.length === 0 ? (
              <p className="text-muted text-sm">{t('retention.noRenewals')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted text-xs">
                      <th className="py-2 pe-4 text-start font-medium">{t('retention.month')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('retention.offered')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('retention.accepted')}</th>
                      <th className="px-2 py-2 text-end font-medium">{t('retention.completed')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {renewals.map((row) => (
                      <tr key={row.offeredMonth}>
                        <td className="text-ink py-2 pe-4">
                          {format.dateTime(new Date(row.offeredMonth), {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">{row.offered}</td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">{row.accepted}</td>
                        <td className="text-ink px-2 py-2 text-end tabular-nums">
                          {row.completed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-muted mt-3 text-xs">{t('retention.renewalNote')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('snapshots')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {session.capabilities.has('metrics.snapshot') ? (
            <MetricSnapshotForm defaultMonth={previousMonth} />
          ) : null}
          {snapshots.length === 0 ? (
            <p className="text-muted text-sm">{t('noSnapshots')}</p>
          ) : (
            <ul className="divide-border divide-y">
              {snapshots.map((snapshot) => (
                <li key={snapshot.id} className="flex flex-wrap justify-between gap-3 py-3">
                  <span className="text-ink text-sm font-medium">
                    {format.dateTime(new Date(snapshot.month), { year: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-muted text-sm">
                    v{snapshot.definitions_version} ·{' '}
                    {format.dateTime(new Date(snapshot.computed_at), 'short')}
                    {snapshot.note ? ` · ${snapshot.note}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
