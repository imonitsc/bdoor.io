# Launch gates

Machine-readable companion: treat each gate `status` as `open` | `in_progress` | `passed` | `blocked`.  
**Commercial launch is forbidden while any P0 gate is open or blocked.**

| Gate                       | Owner                           | Status      | Evidence                                                                                        | Blocking consequence                                                       |
| -------------------------- | ------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **A — Legal**              | Qualified BD counsel + director | blocked     | Draft policies in `src/content/legal/documents.ts`; banners asserted in e2e                     | Cannot remove draft banners; cannot take paying customers on live payments |
| **B — Identity and trust** | Director                        | blocked     | No verified entity, address, phone, leadership bios                                             | Public trust strip and structured Organisation identity remain minimal     |
| **C — Partners**           | Ops + compliance                | blocked     | No publicly advertised verified partner                                                         | Partner page stays enquiry-only; no partner logo wall                      |
| **D — Security**           | Engineering + security reviewer | in_progress | RLS suites; CI; remaining: live malware, CSP, Turnstile, preview DB isolation, Redis rate limit | No production customer KYC at scale                                        |
| **E — Operations**         | Ops lead                        | in_progress | Admin queues exist; SLAs/procedures need rehearsal                                              | No SLAs published; escalate via runbook                                    |
| **F — Production release** | Director                        | open        | Requires explicit approval of exact Vercel preview artifact                                     | No merge-to-prod / promote without written approval                        |

## Gate A detail

Required before commercial launch:

- approved final text for Privacy, Terms, Refund, AML/KYC, Legal Disclaimer, Cookie
- legal entity and contact details
- effective date and version
- processor/subprocessor register
- retention schedule
- cross-border transfer position
- liability, governing-law and dispute wording
- refund/consumer-protection position
- AML officer, thresholds and escalation
- cookie/analytics statement matching deployed system

Engineering may ship: policy versioning, approval workflow states, consent records, locale parity checks, owner/legal dashboard. Engineering must **not** publish final legal advice.

## Gate D checklist (engineering)

- [ ] Auth + MFA + step-up negative tests green
- [ ] RLS tenancy negative tests green
- [ ] Storage private + signed URL expiry tested
- [ ] Payment webhook HMAC + idempotency tested (even on mock)
- [ ] Preview does not share production Supabase write path
- [ ] Secret scan / dependency audit clean on release candidate

## Gate F procedure

1. Owner reviews Vercel preview URL for this branch.
2. Owner confirms acceptance checklist in `docs/launch/acceptance-checklist.md`.
3. Owner explicitly authorises promote of **that** preview artifact.
4. Rollback target recorded in `docs/launch/rollback.md` before promote.
