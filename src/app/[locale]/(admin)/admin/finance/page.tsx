import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Banknote } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { ReconcileForm } from '@/components/dashboard/finance-forms';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { paymentsAreSandbox } from '@/lib/payments';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminFinancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t, tCommon, format] = await Promise.all([
    requireCapability('payment.read'),
    getTranslations('admin.finance'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const [paymentsResult, advancesResult] = await Promise.all([
    supabase
      .from('payments')
      .select(
        'id, provider, status, amount_minor, currency, is_sandbox, reconciled_at, created_at, case_id',
      )
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('government_fee_advances')
      .select('id, case_id, currency, received_minor, disbursed_minor, refunded_minor')
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  const payments = paymentsResult.data ?? [];
  const advances = advancesResult.data ?? [];
  const canReconcile = session.capabilities.has('payment.reconcile');
  const money = (minor: number, currency: string) =>
    format.number(minor / 100, currency === 'USD' ? 'usd' : 'bdt');

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={t('reconcileNote')} />

      {paymentsAreSandbox() ? (
        <Alert tone="warning">
          {(await getTranslations('workspace.billing'))('sandboxBanner')}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle as="h2">{(await getTranslations('workspace.billing'))('payments')}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState icon={<Banknote className="size-5" />} title={tCommon('noResults')} />
          ) : (
            <ul className="divide-border divide-y">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-ink text-sm font-medium">
                      {money(payment.amount_minor, payment.currency)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        tone={
                          payment.status === 'paid'
                            ? 'success'
                            : payment.status === 'failed'
                              ? 'danger'
                              : 'neutral'
                        }
                      >
                        {payment.status}
                      </Badge>
                      <Badge tone="neutral">{payment.provider}</Badge>
                      {payment.is_sandbox ? <Badge tone="warning">sandbox</Badge> : null}
                      {payment.reconciled_at ? (
                        <Badge tone="success">
                          {format.dateTime(new Date(payment.reconciled_at), 'short')}
                        </Badge>
                      ) : null}
                    </p>
                  </div>
                  {canReconcile && payment.status === 'paid' && !payment.reconciled_at ? (
                    <ReconcileForm paymentId={payment.id} />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('advances')}</CardTitle>
        </CardHeader>
        <CardContent>
          {advances.length === 0 ? (
            <p className="text-muted text-sm">{tCommon('noResults')}</p>
          ) : (
            <ul className="divide-border divide-y">
              {advances.map((advance) => {
                const unused =
                  advance.received_minor - advance.disbursed_minor - advance.refunded_minor;
                return (
                  <li
                    key={advance.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                  >
                    <span className="text-muted font-mono text-xs">
                      {advance.case_id.slice(0, 8)}
                    </span>
                    <span className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-muted">
                        {t('advances')}: {money(advance.received_minor, advance.currency)}
                      </span>
                      <span className="text-muted">
                        {t('disbursements')}: {money(advance.disbursed_minor, advance.currency)}
                      </span>
                      <span className="text-ink font-medium">
                        {t('unusedBalance')}: {money(unused, advance.currency)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
