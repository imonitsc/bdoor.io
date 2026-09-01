'use server';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { getPaymentProvider } from '@/lib/payments';
import { logger } from '@/lib/logger';
import { absoluteUrl } from '@/lib/site';
import { bangladeshCheckoutStatus, paymentsStatus } from '@/lib/launch/gates';

export type ComplyState = { status: 'idle' | 'error'; message?: string };

/**
 * Starts a Comply subscription for the caller's organisation (ROADMAP P0).
 *
 * The amount comes from the `subscription_plans` row, never from the form.
 * The subscription is born `pending_activation` and stays inert until the
 * payment webhook writes a verified `activation_payment_id` — the database
 * constraint makes an unpaid `active` impossible however this code fails.
 *
 * Only a customer owner may commit the organisation to recurring billing;
 * the RLS insert policy enforces the same rule below this action.
 */
export async function startComplySubscription(
  _previous: ComplyState,
  formData: FormData,
): Promise<ComplyState> {
  const session = await requireSession();

  // The same double gate as invoice checkout: while payment collection is
  // not approved for launch, nothing is chargeable, whatever the UI shows.
  if (paymentsStatus() !== 'enabled' || bangladeshCheckoutStatus() !== 'enabled') {
    return { status: 'error', message: 'paymentsNotOpen' };
  }

  const planId = String(formData.get('planId') ?? '');
  if (!planId) return { status: 'error', message: 'generic' };

  const membership = session.memberships.find(
    (entry) => entry.kind === 'customer' && entry.role === 'customer_owner',
  );
  if (!membership) return { status: 'error', message: 'ownerOnly' };

  const supabase = await createClient();

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id, code, billing_period, amount_minor, currency, is_active')
    .eq('id', planId)
    .maybeSingle();
  if (!plan || !plan.is_active) return { status: 'error', message: 'notFound' };
  if (plan.currency !== 'BDT' && plan.currency !== 'USD') {
    return { status: 'error', message: 'generic' };
  }

  // One live subscription per organisation: a pending or active row is
  // reused, not duplicated — replaying the form must not double-commit.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('organization_id', membership.organizationId)
    .in('status', ['pending_activation', 'active', 'past_due', 'paused'])
    .limit(1);
  let subscriptionId = (existing ?? [])[0]?.id as string | undefined;
  const existingStatus = (existing ?? [])[0]?.status as string | undefined;
  if (subscriptionId && existingStatus !== 'pending_activation') {
    return { status: 'error', message: 'alreadySubscribed' };
  }

  if (!subscriptionId) {
    const { data: created, error: createError } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: membership.organizationId,
        plan_id: plan.id,
        status: 'pending_activation',
        created_by: session.userId,
      })
      .select('id')
      .maybeSingle();
    if (createError || !created) {
      logger.error('comply.subscription_create_failed', { message: createError?.message });
      return { status: 'error', message: 'generic' };
    }
    subscriptionId = created.id;
  }

  const provider = getPaymentProvider();
  const locale = await getLocale();
  const idempotencyKey = `sub:${subscriptionId}:${plan.amount_minor}`;

  const checkout = await provider.createCheckout({
    subscriptionId,
    organizationId: membership.organizationId,
    amountMinor: plan.amount_minor,
    currency: plan.currency,
    description: `comply:${plan.code}`,
    customerEmail: session.email,
    returnUrl: absoluteUrl(`/${locale}/app/compliance?payment=success`),
    cancelUrl: absoluteUrl(`/${locale}/app/compliance?payment=cancelled`),
    idempotencyKey,
  });

  const { error: paymentError } = await supabase.from('payments').insert({
    subscription_id: subscriptionId,
    organization_id: membership.organizationId,
    provider: checkout.provider,
    checkout_session_id: checkout.sessionId,
    status: 'pending',
    currency: plan.currency,
    amount_minor: plan.amount_minor,
    is_sandbox: checkout.isSandbox,
  });
  // 23505 = the idempotent replay of the same checkout session; not an error.
  if (paymentError && paymentError.code !== '23505') {
    logger.error('comply.payment_create_failed', { message: paymentError.message });
    return { status: 'error', message: 'generic' };
  }

  await recordAudit({
    action: 'subscription.checkout_started',
    targetType: 'subscription',
    targetId: subscriptionId,
    organizationId: membership.organizationId,
    metadata: { planCode: plan.code, sandbox: checkout.isSandbox, amountMinor: plan.amount_minor },
  });

  redirect(checkout.redirectUrl);
}
