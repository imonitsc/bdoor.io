# SEO indexing checklist

## Implemented in codebase

- [x] `robots.txt` via `src/app/robots.ts`
- [x] Locale sitemap via `src/app/sitemap.ts`
- [x] Canonical URLs and `hreflang` on marketing pages
- [x] Open Graph images (static `opengraph-image.png`)
- [x] `noindex` on `/app`, `/partner`, `/admin` routes
- [x] Draft legal banners (not indexed as final terms)

## Owner verification required

- [ ] Google Search Console property verified (`OWN-013`)
- [ ] Bing Webmaster Tools verified
- [ ] Submit sitemap after preview approval
- [ ] Confirm indexed URLs match canonicals (no duplicate locale indexation)
- [ ] Organisation schema `sameAs` only after social profiles active

## New routes (this branch)

Add to monitoring after deploy:

- `/international`
- `/industries` and `/industries/[slug]`
- `/authorities`

## Do not claim

Successful indexing until verified in Search Console/Bing dashboards.
