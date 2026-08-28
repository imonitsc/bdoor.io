# Threat model

Scope: the bdoor web application, Supabase project, Vercel deployment and adapters. Date: 28 August 2026.

## Assets

Customer identity and corporate documents; KYC/UBO detail; quotes and payments; partner credentials; staff audit logs; service-role key.

## Adversaries

Anonymous enumerator; authenticated customer of another tenant; partner on an unassigned case; compromised staff session; hostile payment webhook; preview deployment reaching production data.

## Controls already in place

- RLS on every exposed table; capability checks in Server Actions
- Roles not in user-editable metadata
- Private storage, server-generated paths, short-lived signed URLs
- Webhook HMAC + idempotency + server-computed amounts
- Append-only audit and case history
- Mock adapters that refuse to pretend they screened or scanned
- Rate limits on auth, intake, contact, uploads

## Open risks this branch does not silently close

| Risk                                              | Treatment                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Preview and production share one Supabase project | Owner action O-16. Documented, not “fixed” by pointing previews at production with fewer guards. |
| Malware scanner is a mock                         | Uploads stay `pending`; staff UI warns. Gate D.                                                  |
| Screening is a mock                               | Results labelled non-screening. Do not onboard on that basis.                                    |
| In-process rate limiter                           | Resets per instance. Fine for a single instance; Redis later.                                    |
| No CSP nonce wired through every path             | Existing header work in `next.config.ts` / `proxy.ts` stays; no weakening.                       |

## Negative tests that must keep passing

Customer A ↛ B; firm A ↛ firm B; unassigned partner ↛ case; metadata cannot self-promote to staff; anonymous users cannot enumerate identities; finance cannot decide KYC; audit rows cannot be updated or deleted.
