# Owner acceptance checklist

Use this against the Vercel preview of this branch. Production stays unchanged until every P0 line is either accepted or explicitly deferred.

## P0 — must not ship as “commercially live”

- [ ] Legal pages still show “Draft awaiting professional review”
- [ ] No invented legal entity, address, phone, partner, review, statistic or government fee
- [ ] Independence disclosure present in English and Bangla
- [ ] Coming-soon international routes do not say the country is available
- [ ] Social links absent unless a verified `active` profile exists
- [ ] Existing URLs (`/start`, `/services`, `/foreign-founders`, `/pricing`, …) still resolve
- [ ] Customer, partner and admin areas still require auth; robots.txt still disallows them
- [ ] Preview data is not production data **or** the owner accepts the documented risk (O-16)

## Public product

- [ ] Homepage headline and supporting line match the approved promise
- [ ] Service finder lands on a real assessment or catalogue URL
- [ ] Pricing example itemises BDoor / government / partner / third-party; total is not a dash
- [ ] Bangla homepage is actually Bangla
- [ ] Keyboard: skip link, mega-nav, mobile menu Escape
- [ ] axe-core on new routes is clean

## Operational product

- [ ] Existing customer/admin/partner journeys still function
- [ ] `/admin/launch` shows open gates for staff with `settings.manage`

## Promotion

- [ ] Owner names the exact Vercel preview URL
- [ ] Owner says, in writing, to merge and promote
- [ ] Rollback target (deployment ID + SHA) is recorded
