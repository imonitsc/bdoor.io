# RLS policy matrix (upgrade)

Full policy definitions live in `supabase/migrations/`. Integration tests under `tests/integration/` prove negative access.

| Domain                           | anon                         | authenticated customer | partner              | staff                  | notes                  |
| -------------------------------- | ---------------------------- | ---------------------- | -------------------- | ---------------------- | ---------------------- |
| Published services/categories    | SELECT                       | SELECT                 | SELECT               | SELECT/admin write     | `coming_soon` readable |
| Draft services                   | —                            | —                      | —                    | staff/admin            |                        |
| Cases                            | —                            | org members            | assigned only        | capability             |                        |
| Documents                        | —                            | org + grants           | assignment + consent | capability             | signed URLs            |
| Quotes/invoices                  | —                            | org                    | limited              | finance caps           |                        |
| KYC status (public)              | —                            | subject org            | —                    | kyc caps               |                        |
| Screening detail                 | —                            | —                      | —                    | compliance schema only | not in PostgREST       |
| Audit logs                       | —                            | —                      | —                    | audit read             | append-only            |
| Evidence claims (new)            | SELECT verified+public       | same                   | same                 | admin write            |                        |
| Social profiles (new)            | SELECT active                | same                   | same                 | admin write            |                        |
| Countries/industries/authorities | SELECT published/coming_soon | same                   | same                 | admin write            |                        |

UPDATE policies require both `USING` and `WITH CHECK`. Prefer invoker security on views.
