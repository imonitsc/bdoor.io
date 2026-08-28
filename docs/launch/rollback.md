# Rollback

## Target

Revert production to the last owner-approved Vercel deployment and database migration set.

## Application rollback

1. In Vercel, promote the previous production deployment (record SHA).
2. Confirm `NEXT_PUBLIC_SITE_URL` and Supabase env vars unchanged.
3. Smoke-test `/en`, `/bn`, login, and `/app`.

## Database rollback

Migrations are additive. Roll forward preferred:

- `20260101001700_production_catalog_expansion.sql` adds tables/columns only.
- To hide new public routes without revert: set `status` to `draft` on countries/industries/authorities.

**Do not** rewrite applied migration history on production.

## Communication

Notify owner if rollback touches customer-visible pricing or legal text.
