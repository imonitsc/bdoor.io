# Acceptance checklist (preview)

Owner sign-off before production promotion (Gate F).

## Public

- [ ] `/en` and `/bn` homepage render new hero without unverified claims
- [ ] Header links resolve (including Industries, International, Partners)
- [ ] Service finder routes to catalogue or contact
- [ ] International page shows BD available, others coming soon
- [ ] Legal draft banners still visible
- [ ] No invented fees, partners, reviews or statistics

## Authenticated

- [ ] Customer login and workspace load
- [ ] Partner MFA path works
- [ ] Admin routes enforce capabilities

## Technical

- [ ] CI green on feature branch
- [ ] Integration tests pass with migration 1700
- [ ] Preview URL recorded below

**Preview URL:** _filled by owner after Vercel preview deploy_

**Approved by:** _______________ **Date:** _______________
