'use client';

import { useActionState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { CheckCircle2, CreditCard, Info } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { Link } from '@/i18n/navigation';
import { acceptQuote, startCheckout, type BillingState } from '@/features/payments/actions';
import { isPassThrough, type Currency, type QuoteItemCategory } from '@/features/quotes/money';

const INITIAL: BillingState = { status: 'idle' };

export type QuoteItemView = {
  id: string;
  category: QuoteItemCategory;
  description: string;
  quantity: number;
  unitAmountMinor: number;
  currency: Currency;
  isEstimate: boolean;
  isRefundable: boolean;
  payeeName: string | null;
};

export type QuoteView = {
  quoteVersionId: string;
  versionNo: number;
  currency: Currency;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  validUntil: string;
  acceptedAt: string | null;
  expired: boolean;
  items: QuoteItemView[];
  invoice: {
    id: string;
    number: string;
    totalMinor: number;
    paidMinor: number;
    status: string;
  } | null;
};

export function QuotePanel({ quote, sandbox }: { quote: QuoteView; sandbox: boolean }) {
  const t = useTranslations('workspace.billing');
  const tFees = useTranslations('services.feeCategories');
  const tErrors = useTranslations('billing.errors');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const [acceptState, acceptAction, accepting] = useActionState(acceptQuote, INITIAL);
  const [payState, payAction, paying] = useActionState(startCheckout, INITIAL);

  const money = (minor: number) =>
    format.number(minor / 100, quote.currency === 'USD' ? 'usd' : 'bdt');

  const outstanding = quote.invoice ? quote.invoice.totalMinor - quote.invoice.paidMinor : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle as="h2">{t('quoteVersion', { number: quote.versionNo })}</CardTitle>
          {quote.acceptedAt ? (
            <Badge tone="success" icon={<CheckCircle2 className="size-3" />}>
              {t('acceptedOn', {
                date: format.dateTime(new Date(quote.acceptedAt), 'short'),
              })}
            </Badge>
          ) : quote.expired ? (
            <Badge tone="danger">{t('expired')}</Badge>
          ) : (
            <Badge tone="info">
              {t('validUntil', { date: format.dateTime(new Date(quote.validUntil), 'short') })}
            </Badge>
          )}
        </div>
        <CardDescription>{t('governmentNote')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="scroll-x">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">{t('quotes')}</caption>
            <thead>
              <tr className="border-border border-b">
                <th
                  scope="col"
                  className="text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase"
                >
                  {t('quotes')}
                </th>
                <th
                  scope="col"
                  className="text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase"
                >
                  {t('payableTo')}
                </th>
                <th
                  scope="col"
                  className="text-muted px-3 py-2.5 text-end text-xs font-semibold tracking-wide uppercase"
                >
                  {t('total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {quote.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3">
                    <p className="text-ink">{item.description}</p>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone={isPassThrough(item.category) ? 'neutral' : 'info'}>
                        {tFees(item.category)}
                      </Badge>
                      {item.isEstimate ? (
                        <Badge tone="warning">{tCommon('estimated')}</Badge>
                      ) : null}
                      <Badge tone={item.isRefundable ? 'success' : 'neutral'}>
                        {item.isRefundable ? t('refundable') : t('nonRefundable')}
                      </Badge>
                    </p>
                  </td>
                  <td className="text-muted px-3 py-3">{item.payeeName ?? '—'}</td>
                  <td className="text-ink px-3 py-3 text-end font-medium">
                    {money(item.unitAmountMinor * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-border border-t-2">
              <tr>
                <th
                  scope="row"
                  colSpan={2}
                  className="text-muted px-3 py-2 text-end text-sm font-normal"
                >
                  {t('subtotal')}
                </th>
                <td className="text-ink px-3 py-2 text-end text-sm">
                  {money(quote.subtotalMinor)}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  colSpan={2}
                  className="text-muted px-3 py-2 text-end text-sm font-normal"
                >
                  {tFees('tax')}
                </th>
                <td className="text-ink px-3 py-2 text-end text-sm">{money(quote.taxMinor)}</td>
              </tr>
              <tr>
                <th
                  scope="row"
                  colSpan={2}
                  className="text-ink px-3 py-2 text-end text-base font-semibold"
                >
                  {t('total')}
                </th>
                <td className="text-ink px-3 py-2 text-end text-base font-semibold">
                  {money(quote.totalMinor)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <Alert tone="info" icon={<Info className="size-5" />}>
          {t('capitalNote')}
        </Alert>
        <p className="text-muted text-xs leading-relaxed">{t('separateEngagementNote')}</p>

        {acceptState.status === 'error' && acceptState.message ? (
          <Alert tone="danger" live="assertive">
            {tErrors(acceptState.message)}
          </Alert>
        ) : null}
        {payState.status === 'error' && payState.message ? (
          <Alert tone="danger" live="assertive">
            {tErrors(payState.message)}
          </Alert>
        ) : null}

        {!quote.acceptedAt && !quote.expired ? (
          // The recorded acceptance names a terms version, so the screen the
          // customer accepts FROM has to show which one — and link it.
          <p className="text-muted text-xs leading-relaxed">
            {t.rich('acceptTermsNote', {
              terms: (chunks) => (
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-primary underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
              refund: (chunks) => (
                <Link
                  href="/refund-policy"
                  target="_blank"
                  className="text-primary underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {!quote.acceptedAt && !quote.expired ? (
            <form action={acceptAction}>
              <input type="hidden" name="quoteVersionId" value={quote.quoteVersionId} />
              <Button type="submit" size="lg" disabled={accepting}>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {t('acceptQuote')}
              </Button>
            </form>
          ) : null}

          {quote.acceptedAt && quote.invoice && outstanding > 0 ? (
            <form action={payAction}>
              <input type="hidden" name="invoiceId" value={quote.invoice.id} />
              <Button type="submit" size="lg" disabled={paying}>
                <CreditCard className="size-4" aria-hidden="true" />
                {t('payNow')} — {money(outstanding)}
              </Button>
            </form>
          ) : null}
        </div>

        {sandbox ? <Alert tone="warning">{t('sandboxBanner')}</Alert> : null}

        <IndependenceDisclosure />
      </CardContent>
    </Card>
  );
}
