# Rollback plan

How to retreat safely if the immediate-operations release misbehaves in
production. Ordered from smallest hammer to largest.

## 1. Copy or price wrong on one route

Edit `src/content/packages/catalog.ts` (and the pinned figures in
`tests/unit/commercial-catalog.test.ts` in the same commit), push through
the normal PR flow. Never hand-edit rendered pages — everything reads the
catalog.

## 2. Application flow broken, marketing fine

Set the affected route's `mode` to `temporarily_paused` and its
`publicStatus` to `register_interest` in the catalog: the pages fall back
to honest non-operational copy without touching the rest of the release.
The unit ladder tests keep the combination consistent.

## 3. Submissions failing

- `application.insert_failed` in logs → the applications migration is
  missing or the table is broken; the `contact_requests` fallback is
  already catching the leads. Apply/repair migration `20260101002100`; no
  rollback needed.
- `application.fallback_failed` too → submissions are erroring visibly.
  Revert the flow commit (`git revert` the "country-first flow" commit) or
  roll the deployment back (below); the marketing pages do not depend on
  it.

## 4. Whole release

Vercel → project → Deployments → promote the last known-good deployment
(instant, no build). Then revert the merge commit on the production branch
so the next build matches what is serving.

## Data safety notes

- `public.applications` is additive: rolling code back does NOT require
  dropping the table, and dropping it would destroy submissions — never do
  that as part of a rollback ("never reset, reseed or recreate the
  production database").
- References already issued to customers must stay resolvable: if the flow
  is rolled back, keep collecting via the contact form and reconcile
  against issued references when it returns.
- No rollback step may re-enable checkout, payments or identity collection;
  those are opened only by the legal gates, never by deployment mechanics.
