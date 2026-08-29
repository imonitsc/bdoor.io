# Production-fix handoff (29 Aug 2026)

Branch: `cursor/premium-production-fix-f1f5`  
PR: https://github.com/imonitsc/bdoor.io/pull/35  
Preview: https://bdoor-io-git-cursor-premium-production-fix-f1f5-mik-partners.vercel.app  
Status: Ready to merge · preview-only — **do not deploy production**

## Done

1. Start flow: Bangladesh / Outside order (`market_scope`), truthful Step N of 6 progress, local-first Continue (background sync after email), submit answer sync, deep-link context.
2. Homepage: five sections; no international sales grid; Start now CTA; Countries out of header; operator line footer-only.
3. Legal: Aug 29 pack, draft banner/`noindex`, `/legal` index + four new policy routes, `LEGAL_LAUNCH_APPROVED`.
4. Bangladesh hub expanded; Services hides coming-soon + formation-documents slot.
5. Merged onto latest `claude/new-session-0n73z6` (CodeQL `asQuestionKey` + unbiased reference draws retained).
6. Local verify + full GitHub CI (format/lint/types/unit/build, migrations/RLS, Playwright/a11y) green before merge; re-check after conflict resolution.

## Missing owner inputs

| Item               | Path / action                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Hero image         | `public/images/bdoor/open-door-dhaka.webp`                                                  |
| How-it-works image | `public/images/bdoor/compliance-review.webp`                                                |
| Services image     | `public/images/bdoor/formation-documents.webp`                                              |
| Legal approval     | Keep `LEGAL_CONTENT_STATUS=draft` and `LEGAL_LAUNCH_APPROVED=false` until counsel signs off |

## Known limitations

- Bangla legal routes show the full English draft with a translation-review notice.
- International country pages can still be trimmed further after preview review.

## Env

```
LEGAL_CONTENT_STATUS=draft
LEGAL_LAUNCH_APPROVED=false
BANGLADESH_CHECKOUT_STATUS=disabled
KYC_UPLOAD_STATUS=disabled
PAYMENTS_STATUS=disabled
```
