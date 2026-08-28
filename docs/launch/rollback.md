# Rollback

## Principle

Never promote an untested production migration or an unapproved preview artifact. Prefer forward-fix migrations; keep additive SQL reversible where practical.

## Application rollback (Vercel)

1. Identify the last known-good production deployment in the Vercel project.
2. Instant rollback to that deployment (do not re-deploy an untested commit).
3. Confirm `NEXT_PUBLIC_SITE_URL`, Supabase URL and payment webhook still point at production intentionally.
4. Record incident in `docs/INCIDENT-RESPONSE.md` process.

## Database rollback

- Prefer a new forward migration that undoes the change.
- Do **not** rewrite or delete migrations already applied to production.
- Do **not** run `supabase db reset` or apply `seed.sql` against production.
- For catalogue/content mistakes: set `status` to `draft` / `retired` rather than deleting rows with customer FK history.

## Feature-flag / content rollback

- Unverified claims: set evidence status to `withdrawn` or `draft` (see `content/evidence-register`).
- Social links: set profile `status` to `inactive` so footer/`sameAs` stop rendering.
- Country routes: keep `coming_soon` / inactive provider status.

## Preview branch rollback

If a preview branch writes to a shared Supabase project (current risk — O-17):

1. Stop the preview.
2. Audit recent writes from preview identities.
3. Escalate before any further preview deploys with write credentials.
