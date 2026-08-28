# Acceptance checklist (owner)

Use this against the **exact** Vercel preview for `feat/bdoor-production-premium-upgrade` (or its successor). Do not tick from memory of localhost.

## Product

- [ ] Homepage promise matches approved copy (EN + BN)
- [ ] No invented partners, reviews, fees, stats, addresses or affiliations
- [ ] Draft legal banners still visible until Gate A closes
- [ ] Existing service/pricing URLs still resolve
- [ ] Assessment completes in EN and BN
- [ ] Customer workspace shows real authorised data only
- [ ] Partner sees only assigned cases/documents
- [ ] Admin capabilities match `docs/ROLES.md` (finance ≠ KYC decide)

## Security

- [ ] Signed-out user cannot reach `/app`, `/partner`, `/admin` data
- [ ] Cross-tenant document access fails
- [ ] Payment still requires verified webhook path (not browser redirect alone)

## Release

- [ ] `pnpm run verify` green on the candidate commit
- [ ] Integration + e2e green (or waivers recorded)
- [ ] Preview accessibility/performance notes reviewed
- [ ] Rollback target recorded
- [ ] **Written approval** to promote this preview artifact

Until Gate F is explicitly approved, production must remain on the current live deployment.
