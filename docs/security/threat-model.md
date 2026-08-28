# Threat model (summary)

## Assets

Customer PII and identity documents; company records; partner credentials; payment events; compliance screening detail; staff audit logs; service-role key.

## Trust boundaries

Browser (untrusted) → Next.js server → Supabase Data API (RLS) → private `compliance` / `app` schemas → third-party adapters.

## Top threats and controls

| Threat                            | Control                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Cross-tenant data read/write      | RLS ownership/membership/assignment predicates + Server Action capability checks |
| Privilege escalation via metadata | Roles in protected tables only                                                   |
| Session cookie forgery            | `getClaims()` signature verification                                             |
| Document URL leakage              | Private buckets; short-lived signed URLs after authz                             |
| Webhook spoofing / replay         | HMAC verify; provider event id idempotency; server-computed amounts              |
| Mock screening treated as real    | UI labels; launch gate; never onboard on mock                                    |
| Preview writes to production DB   | **Open risk** — separate staging project (O-17)                                  |
| Secret exfiltration               | No `NEXT_PUBLIC_` secrets; audit redaction                                       |
| XSS / injection                   | CSP planned; React escaping; Zod validation                                      |

## Residual risks (tracked)

- In-process rate limiter (multi-instance)
- Malware adapter mock
- Missing CSP / Turnstile until privacy review
- Shared preview Supabase
