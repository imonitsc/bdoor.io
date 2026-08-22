import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Receipt } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { QuotePanel, type QuoteView } from '@/components/dashboard/quote-panel';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';
import { paymentsAreSandbox } from '@/lib/payments';
import { quoteIsExpired, type Currency, type QuoteItemCategory } from '@/features/quotes/money';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  await requireCustomerOrganization();

  const [t, format] = await Promise.all([
    getTranslations('workspace.billing'),
    getFormatter(),
  ]);

  const supabase = await createClient();

  const [versionsResult, invoicesResult, receiptsResult] = await Promise.all([
    supabase
      .from('quote_versions')
      .select(
        'id, version_no, currency, subtotal_minor, tax_minor, total_minor, valid_until, accepted_at, sent_at, quote_id, quote_items(id, category, description_en, description_bn, quantity, unit_amount_minor, currency, is_estimate, is_refundable, payee_name, sort_order), quotes(case_id)',
      )
      .not('sent_at', 'is', null)
      .order('version_no', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, number, total_minor, paid_minor, status, quote_version_id, currency, issued_at')
      .neq('status', 'draft')
      .order('created_at', { ascending: false }),
    supabase
      .from('receipts')
      .select('id, kind, number, issued_on, amount_minor, currency')
      .order('issued_on', { ascending: false })
      .limit(20),
  ]);

  type ItemRow = {
    id: string;
    category: QuoteItemCategory;
    description_en: string;
    description_bn: string;
    quantity: number;
    unit_amount_minor: number;
    currency: Currency;
    is_estimate: boolean;
    is_refundable: boolean;
    payee_name: string | null;
    sort_order: number;
  };
  type VersionRow = {
    id: string;
    version_no: number;
    currency: Currency;
    subtotal_minor: number;
    tax_minor: number;
    total_minor: number;
    valid_until: string;
    accepted_at: string | null;
    quote_items: ItemRow[];
  };

  const invoices = invoicesResult.data ?? [];
  const now = new Date();

  const quotes: QuoteView[] = ((versionsResult.data ?? []) as unknown as VersionRow[]).map((row) => {
    const invoice = invoices.find((i) => i.quote_version_id === row.id) ?? null;
    return {
      quoteVersionId: row.id,
      versionNo: row.version_no,
      currency: row.currency,
      subtotalMinor: row.subtotal_minor,
      taxMinor: row.tax_minor,
      totalMinor: row.total_minor,
      validUntil: row.valid_until,
      acceptedAt: row.accepted_at,
      expired: !row.accepted_at && quoteIsExpired(row.valid_until, now),
      items: [...(row.quote_items ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          category: item.category,
          description: locale === 'bn' ? item.description_bn : item.description_en,
          quantity: item.quantity,
          unitAmountMinor: item.unit_amount_minor,
          currency: item.currency,
          isEstimate: item.is_estimate,
          isRefundable: item.is_refundable,
          payeeName: item.payee_name,
        })),
      invoice: invoice
        ? {
            id: invoice.id,
            number: invoice.number,
            totalMinor: invoice.total_minor,
            paidMinor: invoice.paid_minor,
            status: invoice.status,
          }
        : null,
    };
  });

  const receipts = receiptsResult.data ?? [];
  const sandbox = paymentsAreSandbox();

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />

      {query.payment === 'success' ? (
        <Alert tone="success" live="polite">
          {t('paymentSuccess')}
        </Alert>
      ) : null}
      {query.payment === 'failed' ? (
        <Alert tone="danger" live="polite">
          {t('paymentFailed')}
        </Alert>
      ) : null}
      {query.payment === 'cancelled' ? (
        <Alert tone="neutral" live="polite">
          {t('paymentPending')}
        </Alert>
      ) : null}

      {quotes.length === 0 ? (
        <EmptyState icon={<Receipt className="size-5" />} title={t('noQuotes')} />
      ) : (
        <div className="flex flex-col gap-6">
          {quotes.map((quote) => (
            <QuotePanel key={quote.quoteVersionId} quote={quote} sandbox={sandbox} />
          ))}
        </div>
      )}

      {receipts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('receipts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {receipts.map((receipt) => (
                <li key={receipt.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                    <Receipt className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="truncate">{receipt.number ?? receipt.kind}</span>
                  </span>
                  <span className="flex items-center gap-4 text-sm text-muted">
                    {receipt.amount_minor !== null ? (
                      <span className="font-medium text-ink">
                        {format.number(
                          receipt.amount_minor / 100,
                          receipt.currency === 'USD' ? 'usd' : 'bdt',
                        )}
                      </span>
                    ) : null}
                    <span>{format.dateTime(new Date(receipt.issued_on), 'short')}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
