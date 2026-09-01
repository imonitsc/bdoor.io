import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { CalendarCheck, ScrollText } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Alert } from '@/components/ui/alert';
import { ComplyPanel } from '@/components/dashboard/comply-panel';
import { TrackCompanyForm } from '@/components/dashboard/track-company-form';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';
import { daysUntil } from '@/features/cases/deadlines';
import { groupObligations } from '@/features/compliance/groups';
import { recordComplyExit, recordReminderOpened, trackedRule } from '@/features/compliance/funnel';
import { getComplySubscriptionState } from '@/features/comply/queries';
import { listComplyPlans } from '@/features/comply/plans';
import { bangladeshCheckoutStatus, paymentsStatus } from '@/lib/launch/gates';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CompliancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    payment?: string | string[];
    track?: string | string[];
    tracked?: string | string[];
    n?: string | string[];
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session, active } = await requireCustomerOrganization();
  const { payment, track, tracked, n } = await searchParams;
  const paymentResult = typeof payment === 'string' ? payment : undefined;
  const trackRuleId = typeof track === 'string' && UUID.test(track) ? track : undefined;
  const justTracked = tracked === '1';
  // Arriving from a reminder: the notification id it carried is the funnel's
  // "opened" stamp (metrics_obligation_engagement).
  const openedNotificationId = typeof n === 'string' && UUID.test(n) ? n : undefined;

  const [t, tComply, tCommon, format, subscriptionState, plans] = await Promise.all([
    getTranslations('workspace.compliance'),
    getTranslations('workspace.comply'),
    getTranslations('common'),
    getFormatter(),
    getComplySubscriptionState(),
    listComplyPlans(),
  ]);

  const paymentsOpen = paymentsStatus() === 'enabled' && bangladeshCheckoutStatus() === 'enabled';

  const supabase = await createClient();
  const [{ data }, companiesResult, rule] = await Promise.all([
    supabase
      .from('compliance_obligations')
      .select(
        'id, label_en, label_bn, authority_name, due_on, status, responsible_kind, required_documents, source, renewal_case_id',
      )
      .order('due_on'),
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    trackRuleId ? trackedRule(trackRuleId) : Promise.resolve(null),
  ]);
  const hasCompany = (companiesResult.count ?? 0) > 0;

  // The Ask → Comply funnel's arrival stamp: one per organisation and rule,
  // so "answered but not converted" is countable (ROADMAP P2.4).
  if (rule) {
    await recordComplyExit(active.organizationId, rule.id, session.email);
  }

  if (openedNotificationId) {
    await recordReminderOpened(openedNotificationId);
  }

  const obligations = data ?? [];
  const now = new Date();
  const label = (en: string, bn: string) => (locale === 'bn' ? bn : en);

  // §4.8 grouping: by status AND date, in the acting order a customer scans —
  // what needs action now first, the archive last.
  const groups = groupObligations(obligations, now).sort((a, b) => {
    const order = ['overdue', 'due_now', 'upcoming', 'under_review', 'completed', 'not_applicable'];
    return order.indexOf(a.group) - order.indexOf(b.group);
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />

      {paymentResult === 'success' ? (
        <Alert tone="success">{tComply('paymentSuccess')}</Alert>
      ) : paymentResult === 'cancelled' ? (
        <Alert tone="warning">{tComply('paymentCancelled')}</Alert>
      ) : null}

      {justTracked ? <Alert tone="success">{tComply('track.added')}</Alert> : null}

      {rule ? (
        // What the customer came to track: the rule, its authority, and the
        // per-rule review date the answer carried.
        <Card data-testid="tracked-rule">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <ScrollText className="text-muted size-4" aria-hidden="true" />
              {tComply('track.ruleTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink text-sm font-medium">{rule.title}</p>
            <p className="text-muted mt-1 text-xs">
              {rule.responsibleAuthority} · {rule.legalAuthority}
              {rule.lastReviewed
                ? ` · ${tComply('track.reviewed', { date: rule.lastReviewed })}`
                : ''}
            </p>
            <p className="text-muted mt-2 text-sm">
              {hasCompany ? tComply('track.calendarNote') : tComply('track.addCompanyNote')}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!hasCompany ? <TrackCompanyForm trackRuleId={trackRuleId} /> : null}

      <ComplyPanel
        state={subscriptionState}
        plans={plans}
        canSubscribe={active.role === 'customer_owner'}
        paymentsOpen={paymentsOpen}
      />

      {obligations.length === 0 ? (
        <EmptyState icon={<CalendarCheck className="size-5" />} title={t('noObligations')} />
      ) : (
        groups.map((group) => (
          <Card key={group.group}>
            <CardHeader>
              <CardTitle as="h2">{t(`groups.${group.group}`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-border divide-y">
                {group.items.map((obligation) => {
                  const days = daysUntil(new Date(obligation.due_on), now);
                  return (
                    <li
                      key={obligation.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-ink text-sm font-medium">
                          {label(obligation.label_en, obligation.label_bn)}
                        </p>
                        {obligation.authority_name ? (
                          <p className="text-muted mt-0.5 text-xs">{obligation.authority_name}</p>
                        ) : null}
                        <p className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="neutral">
                            {t('responsible')}:{' '}
                            {obligation.responsible_kind === 'customer'
                              ? tCommon('yes')
                              : obligation.responsible_kind}
                          </Badge>
                          {obligation.required_documents.length > 0 ? (
                            <Badge tone="neutral">
                              {obligation.required_documents.length}{' '}
                              {tCommon('required').toLowerCase()}
                            </Badge>
                          ) : null}
                        </p>
                        {obligation.renewal_case_id ? (
                          // The offer bdoor opened for this deadline. A draft
                          // case: nothing is priced, assigned or filed until
                          // the customer takes it up.
                          <p className="mt-2 text-sm">
                            <Link
                              href={`/app/applications/${obligation.renewal_case_id}`}
                              className="text-accent font-medium underline underline-offset-4"
                            >
                              {t('renewalOpened')}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                      <div className="text-end">
                        <p className="text-ink text-sm font-medium">
                          {format.dateTime(new Date(obligation.due_on), 'long')}
                        </p>
                        <p
                          className={
                            days < 0
                              ? 'text-danger mt-0.5 text-xs font-medium'
                              : days <= 14
                                ? 'text-warning mt-0.5 text-xs font-medium'
                                : 'text-muted mt-0.5 text-xs'
                          }
                        >
                          {days < 0
                            ? t('overdueBy', { days: Math.abs(days) })
                            : t('dueIn', { days })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
