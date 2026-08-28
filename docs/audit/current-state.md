# Current-state audit

**Date:** 28 August 2026  
**Branch:** `cursor/bdoor-production-premium-upgrade-f693`, cut from `9a51d26` on `claude/new-session-0n73z6` (the branch Vercel deploys).  
**Brief:** bdoor Production Upgrade Master Instructions, 28 August 2026.  
**Live baseline:** `https://www.bdoor.io/en`

Everything below was read from this head or from the live origin. Nothing is inferred from the brief.

---

## 1. Git, packages and framework

| Item                        | State                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Default / production branch | `claude/new-session-0n73z6`                                                        |
| Package manager             | pnpm 10.33.0, lockfile committed                                                   |
| Node                        | `>=22.0.0`                                                                         |
| Next.js                     | 16.3.2 App Router                                                                  |
| React                       | 19.2.8                                                                             |
| TypeScript                  | 6.0.3, strict, `noUncheckedIndexedAccess`                                          |
| Tailwind                    | 4.3.3, CSS-first `@theme inline`                                                   |
| next-intl                   | 4.13.7, locales `en` / `bn`                                                        |
| Supabase JS                 | `@supabase/supabase-js` 2.112.4, `@supabase/ssr` 0.12.5                            |
| Brand package               | `bdoor_branding/` committed (PR #18). Official lockups served from `/brand/*.svg`. |

The production upgrade does **not** rebuild the platform. It extends the existing catalogue, public information architecture, evidence gating and launch controls.

## 2. Route tree

Five groups under `src/app/[locale]/`:

| Group         | Base                                                                                                                                           | Indexed |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `(marketing)` | `/`, `/start`, `/services`, `/pricing`, `/foreign-founders`, `/resources`, `/about`, `/contact`, `/partners`, `/how-it-works`, six legal pages | yes     |
| `(auth)`      | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/mfa/challenge`, staff invite                                                     | no      |
| `(customer)`  | `/app/*`                                                                                                                                       | no      |
| `(partner)`   | `/partner/*`                                                                                                                                   | no      |
| `(admin)`     | `/admin/*`                                                                                                                                     | no      |

`proxy.ts` negotiates locale and refreshes the auth cookie. It does not authorise.

**Missing public routes relative to the brief:** `/industries`, `/authorities`, `/international`. Existing URLs are preserved.

## 3. Feature register

Status key: **verified** = implemented and covered by tests; **unverified** = implemented but not owner-confirmed for publication; **mocked** = adapter with a mock default; **missing**; **unsafe**; **blocked**.

| Feature                                | Status                                  | Proposed action                                            |
| -------------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| Locale routing, hreflang, canonicals   | verified                                | preserve                                                   |
| 15-step assessment                     | verified                                | preserve; keep recommendation non-advisory                 |
| Sign-in / sign-up / recovery           | verified                                | preserve                                                   |
| Customer / partner / admin workspaces  | verified                                | preserve; do not mock production cards                     |
| RLS on public + compliance tables      | verified                                | additive migrations only                                   |
| Private storage + signed URLs          | verified                                | preserve                                                   |
| MFA for staff and partner roles        | verified                                | preserve                                                   |
| Itemised quotes, integer money         | verified                                | show a real example on the homepage; never a dash-as-total |
| Independence disclosure                | verified                                | preserve wording; E2E asserts it                           |
| Official wordmark                      | verified                                | use supplied SVGs only                                     |
| Homepage promise in the brief          | missing                                 | replace hero copy; keep `/start` URL                       |
| Service finder intents                 | partial                                 | expand hero advisor; URL-addressable `/services` filters   |
| Full Bangladesh taxonomy               | partial (8 services)                    | add coming-soon rows, no invented fees                     |
| Industries pages                       | missing                                 | informational pages, no legal advice                       |
| Authority directory                    | missing                                 | names + independent disclaimer; no unverified URLs         |
| International (US/UK/UAE/SG)           | missing                                 | coming-soon country pages; not “available”                 |
| Evidence register                      | missing                                 | structured source; unverified claims do not render         |
| Verified social profiles               | blocked                                 | config only; footer renders none until owner verifies URLs |
| Published partners / reviews / metrics | blocked                                 | omit publicly                                              |
| Legal policy final text                | blocked                                 | keep draft banners; add versioning tables, do not publish  |
| Operator legal entity, address, phone  | blocked                                 | placeholders in env only                                   |
| Payment merchant (SSLCommerz / Stripe) | mocked                                  | leave mock default                                         |
| Email / screening / malware / AI       | mocked / disabled                       | leave                                                      |
| Preview sharing production Supabase    | unsafe                                  | document; do not “fix” by writing production               |
| Government fees                        | unverified except “quoted after review” | keep that rule                                             |
| Case studies                           | blocked                                 | do not invent                                              |

## 4. Data and security (this head)

- 17 migrations, RLS on every `public` and `compliance` table.
- Roles on two axes (`platform_roles`, `organization_memberships`). Capabilities in `src/lib/permissions/roles.ts`.
- `finance` has no `kyc.decide` / `kyc.read` / `risk.read`. Plain `admin` has no `kyc.decide` or `refund.approve`.
- Service-role client is `server-only`. No secret has a `NEXT_PUBLIC_` prefix.
- Quote statuses already include `draft`, `internal_review`, `sent`, `accepted`, `expired`, `superseded`, `withdrawn`. `viewed` / `rejected` are not modelled; recording a view is a later additive enum value, not a rewrite.
- Screening and malware adapters are mocks and say so in the UI.

## 5. Content and copy

- Catalogue snapshot at `src/content/catalog-snapshot.ts` backs the marketing site when Supabase is unreachable.
- Eight services: seven published, `travel-agency-registration` coming soon.
- Legal pages are drafts (`awaitingCounselReview: true`).
- Brand-facing name in JSON is still `BDoor`; the supplied lockup is lowercase `bdoor`. This upgrade does not rewrite every historical string; new public copy uses **bdoor** where it is brand-facing, and leaves the tested independence disclosure intact.

## 6. CI and deployment

- `.github/workflows/ci.yml` runs format, lint, typecheck, unit+coverage, build, migrations+RLS, Playwright+axe, `pnpm audit`.
- Production promotion is GitHub → Vercel preview → manual approval. This branch must not merge or promote itself.
- Preview and production currently share one Supabase project. That is recorded as an owner infrastructure action, not silently “fixed”.

## 7. What this branch will change

Public information architecture, homepage, service taxonomy (coming soon), industries, authorities, international coming-soon routes, evidence-gated trust, social-profile configuration, launch-gate register, and the documentation the brief requires.

## 8. What this branch will not change

Auth identities, customer data, existing URLs, published prices, RLS strength, TypeScript strictness, legal final text, invented partners/reviews/fees, or production.
