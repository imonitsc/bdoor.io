# Indexing checklist

Do not claim successful indexing until the owner confirms it in Search Console / Bing Webmaster Tools (owner action O-15).

## On-site (this branch)

- [x] `robots.txt` allows public routes, disallows `/app/`, `/partner/`, `/admin/`, `/api/`
- [x] `sitemap.xml` from `src/app/sitemap.ts` — public routes only
- [x] Canonical URLs via `localizedUrl`
- [x] `hreflang` `en`, `bn-BD`, `x-default` on the root layout
- [x] Unique titles/descriptions per page
- [x] Open Graph / Twitter from the root layout; file-convention OG image
- [x] Web manifest
- [ ] Organisation `sameAs` — only after verified social rows exist
- [x] Service pages for published + coming-soon catalogue rows
- [x] FAQ schema only where FAQs are visible (existing FAQ list)
- [x] Auth and workspace routes `noindex`
- [x] 404 via `[...rest]`
- [x] Source/review dates on services that have `time_reviewed_at`

New routes (`/industries`, `/authorities`, `/international`) are added to `SITEMAP_ROUTES`.

## Owner accounts

1. Google Search Console — add `https://www.bdoor.io`, verify (DNS or HTML file env), submit sitemap `https://www.bdoor.io/sitemap.xml`.
2. Bing Webmaster Tools — import the Search Console property or verify separately.
3. Inspect `/en` and `/bn` after the preview is promoted, not before.

Verification tokens belong in environment variables, never in the repository.
