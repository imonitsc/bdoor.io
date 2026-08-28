# Evidence and review

Public regulatory or trust claims need a row in `content/evidence-register` (JSON) and `public.evidence_claims`.

Fields: claim ID, text, source type, official URL, publication date, date last verified, reviewer, status (`draft` / `verified` / `expired` / `withdrawn`), countries/services in scope.

**Unverified claims must not render publicly.** The UI reads `listVerifiedClaims()` only.

Do not generate regulatory filler. Resource articles that make legal claims need a reviewer, a source and a next-review date, matching `content_pages`.

The independence disclosure is product positioning already asserted by `tests/e2e/marketing.spec.ts`. It is not a government-fee claim.
