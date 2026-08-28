# Launch gates

Machine-readable gate register for the production upgrade. **No gate may be marked closed without recorded evidence.**

| Gate                       | Owner                      | Status  | Blocks                                         |
| -------------------------- | -------------------------- | ------- | ---------------------------------------------- |
| **A — Legal**              | Owner + Bangladesh counsel | Open    | Commercial launch, removing draft banners      |
| **B — Identity and trust** | Owner                      | Open    | Entity name, address, phone, team bios on site |
| **C — Partners**           | Owner + compliance         | Open    | Partner logos, “verified partner” claims       |
| **D — Security**           | Engineering + owner        | Partial | Preview/prod DB split still open               |
| **E — Operations**         | Operations lead            | Partial | Live payment and email providers               |
| **F — Production release** | Owner                      | Open    | Merge and Vercel production promotion          |

## Gate A — Legal

- Final Privacy, Terms, Refund, AML/KYC, Disclaimer, Cookie text
- Processor/subprocessor register and retention schedule
- Policy versioning published only after `awaitingCounselReview: false`

**Infrastructure delivered:** draft policy rendering, version fields in `src/content/legal/documents.ts`, admin content routes.

## Gate B — Identity and trust

Blocked until owner provides verified entity credentials. Placeholders must not render as fact.

## Gate C — Partners

No verified partner may be advertised until partner verification workflow completes (`docs/operations/partner-verification.md`).

## Gate D — Security

Required: RLS negative tests pass; MFA for staff/partner; private storage; audit append-only.

**Open:** shared preview/production Supabase project.

## Gate E — Operations

Staff queues, quotations, refunds and communications exist in codebase; production adapters need credentials.

## Gate F — Production release

Owner must approve the exact Vercel preview artifact. Production promotion is manual only.

See `docs/launch/acceptance-checklist.md` and `docs/launch/rollback.md`.
