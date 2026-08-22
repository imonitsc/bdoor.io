import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  FileText,
  MessageSquare,
  Plus,
  Receipt,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { StatCard } from '@/components/dashboard/stat-card';
import { CaseCard } from '@/components/dashboard/case-card';
import { DocumentStatusBadge } from '@/components/dashboard/status-badge';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { listCases } from '@/features/cases/queries';
import { createClient } from '@/lib/supabase/server';
import { needsCustomerAction } from '@/features/cases/state-machine';
import { daysUntil } from '@/features/cases/deadlines';
import { APP_ROUTES, MARKETING_ROUTES } from '@/lib/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ session, active }, t, tCommon, tCompliance, tDocuments, tCase, format] = await Promise.all([
    requireCustomerOrganization(),
    getTranslations('workspace.dashboard'),
    getTranslations('common'),
    getTranslations('workspace.compliance'),
    getTranslations('workspace.documents'),
    getTranslations('workspace.case'),
    getFormatter(),
  ]);

  const supabase = await createClient();

  const [cases, requestsResult, obligationsResult, receiptsResult, unreadResult] = await Promise.all([
    listCases(),
    supabase
      .from('document_requests')
      .select('id, label_en, label_bn, status, due_on, case_id')
      .in('status', ['requested', 'replacement_requested'])
      .order('due_on', { nullsFirst: false })
      .limit(6),
    supabase
      .from('compliance_obligations')
      .select('id, label_en, label_bn, due_on, status, authority_name')
      .in('status', ['upcoming', 'due', 'overdue'])
      .order('due_on')
      .limit(5),
    supabase
      .from('receipts')
      .select('id, kind, number, issued_on, amount_minor, currency')
      .order('issued_on', { ascending: false })
      .limit(4),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
  ]);

  const requests = requestsResult.data ?? [];
  const obligations = obligationsResult.data ?? [];
  const receipts = receiptsResult.data ?? [];
  const unread = unreadResult.count ?? 0;

  const actionCases = cases.filter((c) => needsCustomerAction(c.status));
  const nextMilestoneCase = cases.find((c) => c.estimate.available && !c.estimate.paused);
  const now = new Date();
  const label = (en: string, bn: string) => (locale === 'bn' ? bn : en);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title={t('greeting', { name: session.fullName || (session.email ?? '') })}
        description={t('orgContext', { organisation: active.organizationName })}
        actions={
          <Button asChild>
            <Link href={APP_ROUTES.start}>
              <Plus className="size-4" aria-hidden="true" />
              {t('startFirst')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('activeApplications')}
          value={cases.length}
          icon={<FileText className="size-4" />}
        />
        <StatCard
          label={t('actionsNeeded')}
          value={actionCases.length + requests.length}
          tone={actionCases.length + requests.length > 0 ? 'warning' : 'neutral'}
          icon={<AlertCircle className="size-4" />}
        />
        <StatCard
          label={t('upcomingCompliance')}
          value={obligations.length}
          icon={<CalendarClock className="size-4" />}
          hint={
            obligations[0]
              ? format.dateTime(new Date(obligations[0].due_on), 'short')
              : undefined
          }
        />
        <StatCard
          label={t('unreadMessages')}
          value={unread}
          icon={<MessageSquare className="size-4" />}
        />
      </div>

      {actionCases.length + requests.length > 0 ? (
        <Alert tone="warning" title={t('actionsNeeded')}>
          <ul className="mt-1 flex flex-col gap-1.5">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`${APP_ROUTES.applications}/${request.case_id}?tab=documents`}
                  className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {label(request.label_en, request.label_bn)}
                </Link>
                {request.due_on ? (
                  <span className="ms-2 text-xs">
                    {format.dateTime(new Date(request.due_on), 'short')}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">{t('activeApplications')}</h2>
          <Button asChild variant="link" size="inline">
            <Link href={APP_ROUTES.applications}>
              {tCommon('viewAll')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {cases.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<FileText className="size-5" />}
            title={t('emptyApplications')}
            action={
              <Button asChild>
                <Link href={MARKETING_ROUTES.start}>{t('startFirst')}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {cases.slice(0, 4).map((item) => (
              <li key={item.id}>
                <CaseCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('upcomingCompliance')}</CardTitle>
          </CardHeader>
          <CardContent>
            {obligations.length === 0 ? (
              <p className="text-sm text-muted">
                {tCompliance('noObligations')}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {obligations.map((obligation) => {
                  const days = daysUntil(new Date(obligation.due_on), now);
                  return (
                    <li key={obligation.id} className="flex items-baseline justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">
                          {label(obligation.label_en, obligation.label_bn)}
                        </p>
                        {obligation.authority_name ? (
                          <p className="truncate text-xs text-muted">{obligation.authority_name}</p>
                        ) : null}
                      </div>
                      <span
                        className={
                          days < 0
                            ? 'shrink-0 text-sm font-medium text-danger'
                            : days <= 14
                              ? 'shrink-0 text-sm font-medium text-warning'
                              : 'shrink-0 text-sm text-muted'
                        }
                      >
                        {format.dateTime(new Date(obligation.due_on), 'short')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('recentDocuments')}</CardTitle>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 && requests.length === 0 ? (
              <p className="text-sm text-muted">
                {tDocuments('noDocuments')}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {receipts.map((receipt) => (
                  <li key={receipt.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                      <Receipt className="size-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="truncate">{receipt.number ?? receipt.kind}</span>
                    </span>
                    <span className="shrink-0 text-sm text-muted">
                      {format.dateTime(new Date(receipt.issued_on), 'short')}
                    </span>
                  </li>
                ))}
                {requests.slice(0, 3).map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="truncate text-sm text-ink">
                      {label(request.label_en, request.label_bn)}
                    </span>
                    <DocumentStatusBadge status={request.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {nextMilestoneCase?.estimate.available ? (
        <p className="text-sm text-muted">
          {tCase('estimateNote')}
        </p>
      ) : null}
    </div>
  );
}
