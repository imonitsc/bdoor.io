# Payment reconciliation

Adapters: `src/lib/payments/`. Default `PAYMENT_PROVIDER=mock`.

Rules:

- Checkout sessions are created on the server.
- Webhooks are HMAC-verified, idempotent by provider event id, and never trusted for amount.
- Browser redirect must not mark a case paid.
- No raw card credentials.
- Quotes snapshot line items; a later public price change does not rewrite an accepted quote.
- Refunds need `refund.approve` (super_admin, not plain admin) and AAL2.

SSLCommerz / Stripe remain unimplemented adapters. Credentials belong in Vercel, never in git. `paymentsAreSandbox()` must stay honest.
