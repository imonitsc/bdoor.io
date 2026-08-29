# Production-fix handoff (29 Aug 2026)

Branch: `cursor/premium-production-fix-f1f5`  
PR: https://github.com/imonitsc/bdoor.io/pull/35  
Status: preview-only — **do not deploy production**

## Done

1. Start flow: Bangladesh / Outside order, truthful Step N of 6 progress, non-blocking save, submit answer sync, deep-link context.
2. Homepage: five sections; no international sales grid; Start now CTA; Countries out of header.
3. Legal: Aug 29 pack, draft banner + noindex, `/legal` index + four new policy routes, `LEGAL_LAUNCH_APPROVED`.
4. Bangladesh hub expanded; Services hides coming-soon + formation-documents slot.
5. Unit/typecheck/lint/format/build green locally.

## Missing owner inputs

| Item               | Path / action                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Hero image         | `public/images/bdoor/open-door-dhaka.webp`                                                  |
| How-it-works image | `public/images/bdoor/compliance-review.webp`                                                |
| Services image     | `public/images/bdoor/formation-documents.webp`                                              |
| Legal approval     | Keep `LEGAL_CONTENT_STATUS=draft` and `LEGAL_LAUNCH_APPROVED=false` until counsel signs off |

## Known limitations

- Bangla legal routes show the full English draft with a translation-review notice.
- International country pages are still longer than ideal; further trim can follow once preview is reviewed.
- E2E/integration results will land from CI on this PR.

## Env

```
LEGAL_CONTENT_STATUS=draft
LEGAL_LAUNCH_APPROVED=false
BANGLADESH_CHECKOUT_STATUS=disabled
KYC_UPLOAD_STATUS=disabled
PAYMENTS_STATUS=disabled
```
