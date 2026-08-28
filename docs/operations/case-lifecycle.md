# Case lifecycle

See also `docs/CASE-STATES.md` and `src/features/cases/state-machine.ts`.

Canonical transitions are enforced in both `public.case_status_transitions` and the TypeScript state machine; integration tests fail on drift.

High-level customer journey:

1. Assessment / intake  
2. Identity and business verification  
3. Quotation (itemised)  
4. Acceptance and payment (webhook-verified)  
5. Document collection  
6. Partner assignment (consented) where required  
7. Authority milestones  
8. Issuance into vault  
9. Compliance reminders / renewals  

Waiting-on flags: customer, partner, authority, payment. Audit history is append-only.
