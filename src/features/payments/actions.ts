'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { hashIdentifier } from '@/lib/utils/hash';
import { getPaymentProvider } from '@/lib/payments';
import { logger } from '@/lib/logger';
import { absoluteUrl } from '@/lib/site';
import { POLICY_VERSIONS } from '@/content/legal/documents';
import { quoteIsExpired } from '@/features/quotes/money';

export type BillingState = { status: 'idle' | 'error' | 'success'; message?: string };

/**
 * Accepts a quote version.
 *
 * The acceptance is recorded against the exact version and policy text the
 * customer saw, so a later quote revision or terms change cannot rewrite what
 * was agreed. Expiry is re-checked on the server: a stale page must not be
 * able to accept an expired price.
 */
export async function acceptQuote(
  _previous: BillingState,
  formData: FormData,
): Promise<BillingState> {
  const session = await requireSession();
  const quoteVersionId = String(formData.get('quoteVersionId') ?? '');
  if (!quoteVersionId) return { status: 'error', message: 'generic' };

  const supabase = await createClient();

  const { data: version } = await supabase
    .from('quote_versions')
    .select('id, valid_until, accepted_at, sent_at, quote_id, quotes(case_id, organization_id)')
    .eq('id', quoteVersionId)
    .maybeSingle();

  type Row = {
    id: string;
    valid_until: string;
    accepted_at: string | null;
    sent_at: string | null;
    quotes: { case_id: string; organization_id: string } | null;
  };
  const row = version as unknown as Row | null;

  if (!row?.quotes || !row.sent_at) return { status: 'error', message: 'notFound' };
  if (row.accepted_at) return { status: 'error', message: 'alreadyAccepted' };
  if (quoteIsExpired(row.valid_until, new Date())) return { status: 'error', message: 'expired' };

  const headerList = await headers();
  const locale = (await getLocale()) === 'bn' ? 'bn' : 'en';

  const { error } = await supabase.from('engagement_acceptances').insert({
    case_id: row.quotes.case_id,
    quote_version_id: row.id,
    acceptance_type: 'quote_acceptance',
    accepted_by: session.userId,
    organization_id: row.quotes.organization_id,
    document_version: POLICY_VERSIONS.terms,
    locale,
    ip_hash: hashIdentifier((headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ?? ''),
  });

  if (error) {
    logger.error('quote.accept_failed', { message: error.message });
    return { status: 'error', message: 'generic' };
  }

  await supabase
    .from('quote_versions')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', row.id);

  await recordAudit({
    action: 'quote.accepted',
    targetType: 'quote_version',
    targetId: row.id,
    organizationId: row.quotes.organization_id,
    caseId: row.quotes.case_id,
    metadata: { policyVersion: POLICY_VERSIONS.terms },
  });

  revalidatePath(`/${locale}/app/billing`);
  return { status: 'success', message: 'quoteAccepted' };
}

/**
 * Starts a checkout session for an invoice.
 *
 * The amount comes from the invoice row, never from the form: a client that
 * posts its own amount is ignored.
 */
export async function startCheckout(
  _previous: BillingState,
  formData: FormData,
): Promise<BillingState> {
  const session = await requireSession();
  const invoiceId = String(formData.get('invoiceId') ?? '');
  if (!invoiceId) return { status: 'error', message: 'generic' };

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, case_id, organization_id, total_minor, paid_minor, currency, status, number')
    .eq('id', invoiceId)
    .maybeSingle();

  if (!invoice) return { status: 'error', message: 'notFound' };
  if (invoice.status === 'paid') return { status: 'error', message: 'alreadyPaid' };

  const amountMinor = invoice.total_minor - invoice.paid_minor;
  if (amountMinor <= 0) return { status: 'error', message: 'alreadyPaid' };

  const provider = getPaymentProvider();
  const locale = await getLocale();
  const idempotencyKey = `${invoice.id}:${amountMinor}`;

  const checkout = await provider.createCheckout({
    invoiceId: invoice.id,
    caseId: invoice.case_id,
    organizationId: invoice.organization_id,
    amountMinor,
    currency: invoice.currency,
    description: invoice.number,
    customerEmail: session.email,
    returnUrl: absoluteUrl(`/${locale}/app/billing?payment=success`),
    cancelUrl: absoluteUrl(`/${locale}/app/billing?payment=cancelled`),
    idempotencyKey,
  });

  const { error } = await supabase.from('payments').insert({
    invoice_id: invoice.id,
    case_id: invoice.case_id,
    organization_id: invoice.organization_id,
    provider: checkout.provider,
    checkout_session_id: checkout.sessionId,
    status: 'pending',
    currency: invoice.currency,
    amount_minor: amountMinor,
    is_sandbox: checkout.isSandbox,
  });

  if (error && error.code !== '23505') {
    logger.error('payment.create_failed', { message: error.message });
    return { status: 'error', message: 'generic' };
  }

  await recordAudit({
    action: 'payment.created',
    targetType: 'payment',
    targetId: checkout.sessionId,
    organizationId: invoice.organization_id,
    caseId: invoice.case_id,
    metadata: { provider: checkout.provider, sandbox: checkout.isSandbox, amountMinor },
  });

  redirect(checkout.redirectUrl);
}
