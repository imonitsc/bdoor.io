import { NextResponse, type NextRequest } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { recordAnalyticsEvent } from '@/lib/analytics';

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
    .select(
      'id, invoice_id, subscription_id, amount_minor, currency, organization_id, case_id, status, is_sandbox',
    )
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

  if (verification.status === 'paid') {
    // Funnel milestone (§22): keyed by the provider event id, so a replayed
    // webhook counts once. Sandbox payments are flagged out of the metrics.
    await recordAnalyticsEvent({
      event: 'payment_confirmed',
      idempotencyKey: `payment_confirmed:${provider.name}:${verification.eventId}`,
      isTest: payment.is_sandbox,
      organizationId: payment.organization_id,
      caseId: payment.case_id,
      paymentId: payment.id,
      properties: { amountMinor: payment.amount_minor },
    });
  }

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

  if (verification.status === 'paid' && payment.subscription_id) {
    // Subscription activation (ROADMAP P0). Only a verified payment reaches
    // this branch, which is exactly what subscriptions_active_needs_verified_
    // payment demands; a replayed webhook finds the row already active and
    // leaves it alone, because the status trigger forbids active → active
    // being re-entered with different fields via this narrow update filter.
    const { data: subscriptionRaw } = await admin
      .from('subscriptions')
      .select('id, status, plan_id, organization_id, subscription_plans(billing_period)')
      .eq('id', payment.subscription_id)
      .maybeSingle();

    // The generated types carry no relationship metadata, so the embedded
    // plan join needs the same explicit cast the billing page uses.
    type SubscriptionRow = {
      id: string;
      status: string;
      plan_id: string;
      organization_id: string;
      subscription_plans: { billing_period: string } | null;
    };
    const subscription = subscriptionRaw as unknown as SubscriptionRow | null;

    if (subscription && subscription.status === 'pending_activation') {
      const periodStart = new Date().toISOString().slice(0, 10);
      const end = new Date();
      const billingPeriod = subscription.subscription_plans?.billing_period ?? 'year';
      if (billingPeriod === 'month') end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);
      const periodEnd = end.toISOString().slice(0, 10);

      const { error: activateError } = await admin
        .from('subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          activation_payment_id: payment.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        })
        .eq('id', subscription.id)
        .eq('status', 'pending_activation');

      if (activateError) {
        logger.error('subscription.activation_failed', {
          subscriptionId: subscription.id,
          message: activateError.message,
        });
      } else {
        // The billed period; unique (subscription_id, period_start) makes a
        // replay a no-op via 23505.
        const { error: periodError } = await admin.from('subscription_periods').insert({
          subscription_id: subscription.id,
          period_start: periodStart,
          period_end: periodEnd,
          amount_minor: payment.amount_minor,
          currency: payment.currency,
          status: 'paid',
          payment_id: payment.id,
        });
        if (periodError && periodError.code !== '23505') {
          logger.error('subscription.period_insert_failed', {
            subscriptionId: subscription.id,
            message: periodError.message,
          });
        }

        await recordAnalyticsEvent({
          event: 'subscription_started',
          idempotencyKey: `subscription_started:${subscription.id}`,
          isTest: payment.is_sandbox,
          organizationId: subscription.organization_id,
          subscriptionId: subscription.id,
          paymentId: payment.id,
          properties: { amountMinor: payment.amount_minor, billingPeriod },
        });

        await admin.from('audit_logs').insert({
          actor_id: null,
          actor_role: 'system',
          action: 'subscription.activated',
          target_type: 'subscription',
          target_id: subscription.id,
          organization_id: subscription.organization_id,
          correlation_id: verification.eventId,
          metadata: { provider: provider.name, paymentId: payment.id },
          origin: 'webhook',
        });
      }
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
