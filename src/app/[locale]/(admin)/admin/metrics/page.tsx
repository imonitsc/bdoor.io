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
  loadRecurringSummary,
  loadRevenueSummary,
  loadSnapshots,
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

  const [funnel, revenue, recurring, snapshots] = await Promise.all([
    loadFunnelCounts(),
    loadRevenueSummary(),
    loadRecurringSummary(),
    loadSnapshots(),
  ]);

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
