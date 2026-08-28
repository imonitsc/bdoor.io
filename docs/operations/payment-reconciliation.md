# Payment reconciliation

- Server creates payment sessions; browser redirect alone never marks paid
- Webhook: verify HMAC, idempotent by provider event id, validate amount/currency/order
- Store immutable gateway events
- Separate bdoor / government / partner / third-party components on quotes and invoices
- Refunds require capability + audit
- Mock provider is default until O-12 credentials and Gate A allow live payments

Finance role: reconciliation and refunds per capability matrix — not KYC decide.
