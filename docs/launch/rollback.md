# Rollback

Production is not changed by this branch. Use this procedure only after an approved promotion of a later preview.

## Rollback target

The last known-good production deployment on Vercel for `claude/new-session-0n73z6`, recorded at promotion time (deployment ID + git SHA).

Until this branch is promoted, the rollback target is the current production SHA (`9a51d26` at audit time — confirm in Vercel before relying on that number).

## Application rollback

1. In Vercel, promote the previous production deployment (instant), or revert the merge commit on the production branch and redeploy.
2. Do not “fix forward” by resetting the production database.

## Database rollback

Migrations in this branch are additive (new tables, new columns with defaults, new seed rows with `on conflict do nothing`).

- Prefer a **forward fix** (stop reading a column, hide a route) over `DOWN` scripts.
- Do not `DROP` tables that may already hold production rows.
- Never re-run `seed.sql` against production. It is fictional development data.

If a migration must be undone before it is applied to production, do not apply it. If it has been applied, add a new migration that is safe on live data.

## Content rollback

Public claims are evidence-gated. Setting an `evidence_claims` or `social_profiles` row back to `draft` / `inactive` hides it on the next request without a deploy.
