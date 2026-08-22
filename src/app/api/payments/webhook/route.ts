import { NextResponse, type NextRequest } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Payment webhook.
 *
 * Rules this endpoint follows, in order:
 *   1. Verify the signature before parsing anything as meaningful.
 *   2. Record the raw event keyed by (provider, event_id). The unique index on
 *      that pair is what makes replay a no-op — we do not rely on the provider
 *      never resending.
 *   3. Only then update the payment and invoice.
 *
 * It runs on the Node runtime because signature verification needs node:crypto,
 * and it uses the service role because there is no user session on this request.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const provider = getPaymentProvider();

  const verification = await provider.verifyWebhook(rawBody, request.headers);

  if (!verification.valid) {
    logger.warn('payment.webhook_rejected', { reason: verification.reason });
    // 400 for a bad signature: the sender should not retry a forged request.
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  if (!hasServiceRole()) {
    logger.error('payment.webhook_no_service_role');
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const admin = createAdminClient();

  // Idempotency gate. A duplicate insert means we have seen this event already.
  const { error: eventError } = await admin.from('payment_events').insert({
    provider: provider.name,
    event_id: verification.eventId,
    event_type: verification.eventType,
    signature_verified: true,
    payload: verification.raw as never,
  });

  if (eventError) {
    if (eventError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    logger.error('payment.webhook_event_insert_failed', { message: eventError.message });
    return NextResponse.json({ error: 'storage' }, { status: 500 });
  }

  if (!verification.sessionId) {
    await admin
      .from('payment_events')
      .update({ processed_at: new Date().toISOString(), error: 'no_session_id' })
      .eq('provider', provider.name)
      .eq('event_id', verification.eventId);
    return NextResponse.json({ received: true });
  }

  const { data: payment } = await admin
    .from('payments')
    .select('id, invoice_id, amount_minor, organization_id, case_id, status')
    .eq('checkout_session_id', verification.sessionId)
    .maybeSingle();

  if (!payment) {
    await admin
      .from('payment_events')
      .update({ processed_at: new Date().toISOString(), error: 'unknown_session' })
      .eq('provider', provider.name)
      .eq('event_id', verification.eventId);
    return NextResponse.json({ received: true });
  }

  await admin
    .from('payments')
    .update({ status: verification.status, provider_ref: verification.sessionId })
    .eq('id', payment.id);

  await admin
    .from('payment_events')
    .update({ payment_id: payment.id, processed_at: new Date().toISOString() })
    .eq('provider', provider.name)
    .eq('event_id', verification.eventId);

  if (verification.status === 'paid' && payment.invoice_id) {
    const { data: invoice } = await admin
      .from('invoices')
      .select('id, total_minor, paid_minor')
      .eq('id', payment.invoice_id)
      .maybeSingle();

    if (invoice) {
      const paid = Math.min(invoice.paid_minor + payment.amount_minor, invoice.total_minor);
      await admin
        .from('invoices')
        .update({ paid_minor: paid, status: paid >= invoice.total_minor ? 'paid' : 'part_paid' })
        .eq('id', invoice.id);
    }
  }

  // Audit here uses the admin client directly: there is no user session on a
  // webhook, so the ordinary audit helper (which reads auth.uid()) cannot apply.
  await admin.from('audit_logs').insert({
    actor_id: null,
    actor_role: 'system',
    action: 'payment.status_changed',
    target_type: 'payment',
    target_id: payment.id,
    organization_id: payment.organization_id,
    case_id: payment.case_id,
    correlation_id: verification.eventId,
    metadata: { provider: provider.name, status: verification.status },
    origin: 'webhook',
  });

  return NextResponse.json({ received: true });
}
