import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  ProviderPaymentStatus,
  RefundRequest,
  RefundResult,
  WebhookVerification,
} from './types';
import { serverEnv } from '@/lib/env';

/**
 * Sandbox provider used for local development and end-to-end tests.
 *
 * It behaves like a real gateway in the ways that matter for correctness: it
 * issues a session id, redirects to a hosted-checkout stand-in, and signs its
 * webhooks with HMAC-SHA256 so the verification path is genuinely exercised.
 * It never moves money and says so on every surface.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  readonly isSandbox = true;

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const sessionId = `mock_${request.idempotencyKey}`;
    const params = new URLSearchParams({
      session: sessionId,
      amount: String(request.amountMinor),
      currency: request.currency,
      invoice: request.invoiceId ?? request.subscriptionId ?? '',
      return: request.returnUrl,
      cancel: request.cancelUrl,
    });

    return {
      provider: this.name,
      sessionId,
      redirectUrl: `/api/payments/mock/checkout?${params.toString()}`,
      isSandbox: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookVerification> {
    const secret = serverEnv().PAYMENT_WEBHOOK_SECRET;
    if (!secret) return { valid: false, reason: 'not_configured' };

    const signature = headers.get('x-bdoor-signature');
    if (!signature) return { valid: false, reason: 'missing_signature' };

    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: 'bad_signature' };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return { valid: false, reason: 'malformed_payload' };
    }

    const eventId = typeof parsed.event_id === 'string' ? parsed.event_id : null;
    const eventType = typeof parsed.event_type === 'string' ? parsed.event_type : null;
    if (!eventId || !eventType) return { valid: false, reason: 'malformed_payload' };

    const statusMap: Record<string, ProviderPaymentStatus> = {
      'payment.succeeded': 'paid',
      'payment.failed': 'failed',
      'payment.cancelled': 'cancelled',
      'payment.refunded': 'refunded',
      'payment.partially_refunded': 'partially_refunded',
    };

    return {
      valid: true,
      eventId,
      eventType,
      sessionId: typeof parsed.session_id === 'string' ? parsed.session_id : null,
      status: statusMap[eventType] ?? 'pending',
      amountMinor: typeof parsed.amount_minor === 'number' ? parsed.amount_minor : null,
      raw: parsed,
    };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    return { ok: true, providerRef: `mock_refund_${request.idempotencyKey}`, status: 'completed' };
  }
}
