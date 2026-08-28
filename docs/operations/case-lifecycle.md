# Case lifecycle

The live state machine is `public.case_status` plus `public.case_status_transitions`, mirrored in `src/features/cases/state-machine.ts`. `tests/integration/case-transitions.test.ts` fails if they drift.

This upgrade does **not** replace that machine with the brief’s alternative names. Adding genuinely new states later must be additive.

Customer-visible path in product copy (not a new enum):

1. Complete the assessment
2. Verify identity and business facts
3. Receive an itemised quotation
4. Approve and pay
5. Upload required documents
6. Track preparation and authority milestones
7. Receive records and compliance reminders

Capital never moves through bdoor. Government outcomes stay with the authority.

See [CASE-STATES.md](../CASE-STATES.md).
