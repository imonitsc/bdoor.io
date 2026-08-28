# Evidence and review workflow

Public regulatory or pricing claims require an evidence record before publication.

## Sources

1. **TypeScript register:** `src/content/evidence-register.ts` — platform positioning and static claims.
2. **Database:** `public.evidence_claims` — admin-managed claims with RLS (`verified` only public).

## Claim lifecycle

`draft` → `verified` → `expired` | `withdrawn`

Unverified claims must not render on marketing pages. Use `verifiedClaimsFor()` or query with `status = 'verified'`.

## Review fields

- Official source URL and publication date
- `last_verified_at` and reviewer
- Allowed countries/services scope

## Content pages

Resource articles use `content_pages` / `content_revisions` with staff-only editorial metadata. Align review dates with `docs/LAUNCH-CHECKLIST.md`.
