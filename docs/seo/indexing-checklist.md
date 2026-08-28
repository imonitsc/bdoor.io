# SEO indexing checklist

## Automated / in-repo

- [x] `robots.txt` excludes private areas
- [x] Sitemap includes public marketing routes
- [x] Canonical URLs via `localizedUrl`
- [x] `hreflang` en + bn-BD
- [x] Open Graph / Twitter metadata
- [ ] Organisation `sameAs` only for verified social profiles
- [ ] Service schema only for `published` available services
- [ ] FAQ schema only when FAQs are visible on the page
- [ ] noindex on auth, app, partner, admin, draft and search-result pages
- [ ] Industry / authority / country pages: noindex while inactive if thin

## Owner actions (do not claim success until verified in-account)

1. Google Search Console — verify property with token (O-15); submit sitemap.
2. Bing Webmaster Tools — verify; submit sitemap.
3. Inspect homepage, `/services`, `/pricing`, `/start` URL inspection.
4. Confirm no accidental indexation of `/app`, `/admin`, `/partner`.
5. Monitor coverage for soft-404s from Suspense boundaries.

## Regulatory pages

Every regulatory claim needs an evidence-register entry with source URL and review date before indexing is treated as “accurate content.”
