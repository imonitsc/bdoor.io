export type CheckoutRequest = {
  invoiceId: string;
  caseId: string;
  organizationId: string;
  amountMinor: number;
  currency: 'BDT' | 'USD';
  description: string;
  customerEmail: string | null;
  returnUrl: string;
  cancelUrl: string;
  /** Sent to the provider so a retried request cannot double-charge. */
  idempotencyKey: string;
};

export type CheckoutSession = {
  provider: string;
  sessionId: string;
  redirectUrl: string;
  isSandbox: boolean;
  expiresAt: string | null;
};

export type ProviderPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export type WebhookVerification =
  | { valid: true; eventId: string; eventType: string; sessionId: string | null; status: ProviderPaymentStatus; amountMinor: number | null; raw: unknown }
  | { valid: false; reason: 'missing_signature' | 'bad_signature' | 'malformed_payload' | 'not_configured' };

export type RefundRequest = {
  paymentId: string;
  providerRef: string;
  amountMinor: number;
  reason: string;
  idempotencyKey: string;
};

export type RefundResult =
  | { ok: true; providerRef: string; status: 'pending' | 'completed' }
  | { ok: false; reason: string };

/**
 * Every gateway must satisfy this. Nothing above the adapter layer knows which
 * provider is configured, so adding an authorised Bangladeshi gateway is one
 * new file plus one entry in `getPaymentProvider`.
 */
export interface PaymentProvider {
  readonly name: string;
  readonly isSandbox: boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookVerification>;
  refund(request: RefundRequest): Promise<RefundResult>;
}
