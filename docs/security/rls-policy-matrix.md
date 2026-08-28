# RLS policy matrix

Authoritative policies live in `supabase/migrations/`. This is a map, not a substitute.

| Area                                     | anon                                            | authenticated customer | assigned partner          | staff                        | notes                                                   |
| ---------------------------------------- | ----------------------------------------------- | ---------------------- | ------------------------- | ---------------------------- | ------------------------------------------------------- |
| `services` / categories / fees           | select published + coming_soon                  | same                   | same                      | admin write                  | `internal_source_ref` is not selected by public queries |
| `countries`, `industries`, `authorities` | select published (+ coming_soon where intended) | same                   | same                      | admin write                  | authority URLs additionally require verified evidence   |
| `evidence_claims`                        | select `verified`                               | same                   | same                      | staff read all; admin write  | expired/withdrawn hidden                                |
| `social_profiles`                        | select `active` and verified                    | same                   | same                      | admin write                  | footer uses this                                        |
| `legal_policy_versions`                  | select `published`                              | same                   | same                      | staff read; admin write      | none published while drafts                             |
| `cases`                                  | none                                            | own org                | assigned only             | capability                   |                                                         |
| `documents`                              | none                                            | own org                | assigned + customer grant | capability                   | signed URLs after authz                                 |
| `quotes` / payments                      | none                                            | own org                | none                      | finance/ops split            |                                                         |
| `compliance.*`                           | none                                            | none                   | none                      | service role / staff helpers | not in Data API                                         |
| `audit_logs`                             | none                                            | none                   | none                      | `audit.read`                 | append-only trigger                                     |

`TO authenticated` is never sufficient by itself. UPDATE policies use `USING` and `WITH CHECK`. `SECURITY DEFINER` helpers stay in `app` with `search_path = ''`.
