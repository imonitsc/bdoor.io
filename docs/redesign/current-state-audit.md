# Current-state audit

**Date:** 28 August 2026
**Branch:** `feat/bdoor-premium-bangladesh-redesign`, cut from `a3c1b6c` on
`claude/new-session-0n73z6` (the branch Vercel deploys to production).
**Brief:** BDoor Premium Redesign, 28 August 2026, §4.1.

Everything below was executed or read on this head. Nothing is inferred from
the brief or from earlier reports.

---

## 1. Launch blocker: the branding package is not here

`bdoor_branding/` does not exist in the repository, and the session upload
contains only the three brief documents. Every file §5 names as authoritative is
absent:

- `00_README/README.md`, `00_README/ASSET_MANIFEST.md`
- `06_Design_Tokens/bdoor-tokens.json`, `bdoor-colors.css`, `tailwind-theme.ts`
- `07_Fonts/FONT_GUIDE.md`
- `04_Stationery/BRAND_COPY_STARTERS.md`
- `01_Logos/SVG/bdoor-primary-horizontal.svg`, `bdoor-primary-reversed.svg`
- the favicon and app-icon directories

**What this blocks, precisely:** the wordmark and icon assets, and only those.
§5.1 says to use the supplied outlined SVGs and not to recreate the wordmark in
a font, so the existing `BDoorLogo` component stays until the real files arrive.
Substituting a lookalike would be worse than waiting.

**What it does not block:** the colour tokens and typography are specified by
name and exact hex inside the brief itself (§5.2, §5.3), so the design
foundation can be built without the package and reconciled against
`bdoor-tokens.json` when it lands.

## 2. Second finding: three brand colours cannot carry text

Measured with the WCAG 2.x relative-luminance formula against the mandated
values, before assigning any of them a role:

| Pairing                        | Ratio | Verdict                    |
| ------------------------------ | ----- | -------------------------- |
| White on Cobalt `#164EEB`      | 6.32  | AA for normal text         |
| Cobalt on white                | 6.32  | AA for normal text         |
| White on Midnight `#081633`    | 17.90 | AA                         |
| Midnight on Cloud `#F2F5F8`    | 16.36 | AA                         |
| Midnight on Marigold `#FFBE2E` | 10.79 | AA                         |
| White on Vermilion `#FF2630`   | 3.77  | **large text and UI only** |
| Vermilion on white             | 3.77  | **large text and UI only** |
| White on Turquoise `#13B8AE`   | 2.47  | **fails even 3:1**         |
| Turquoise on white             | 2.47  | **fails even 3:1**         |
| White on Marigold              | 1.66  | **fails**                  |

§24 requires WCAG 2.2 AA and §5.2 requires these exact tokens. Both hold only if
the accents are treated as fills and the palette also carries darkened variants
for text. Derived by scaling toward black until 4.5:1 on white, hue preserved:

| Brand               | Text-safe variant | Ratio |
| ------------------- | ----------------- | ----- |
| Turquoise `#13B8AE` | `#0E847D`         | 4.55  |
| Vermilion `#FF2630` | `#E6222B`         | 4.54  |
| Marigold `#FFBE2E`  | `#96701B`         | 4.54  |

The brand hexes stay exact wherever they are fills, borders or large display
type. Text and small UI use the derived variants. This needs sign-off from
whoever owns the brand.

---

## 3. What already works, and must be preserved

| Area          | State                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16.3.2, React 19.2.8, Tailwind 4.3.3, next-intl 4.13.7, pnpm 10.33.0                                                                            |
| Routes        | 63 pages across `(marketing)`, `(auth)`, `(customer)`, `(partner)`, `(admin)`                                                                           |
| Public pages  | 17 marketing routes incl. `/services`, `/services/[slug]`, `/pricing`, `/start`, `/resources/[slug]`, and 6 legal pages                                 |
| Locales       | `en` and `bn`, complete and key-for-key in step                                                                                                         |
| Database      | 17 migrations, 82 public tables, RLS on 87 relations across `public` and `compliance`, **252 policies**                                                 |
| Storage       | 6 buckets, 5 private (`identity-documents`, `case-documents`, `official-records`, `message-attachments`, `partner-credentials`) plus `public-marketing` |
| Auth          | Supabase Auth, TOTP MFA with enrol and challenge, step-up enforced in Server Actions and RLS                                                            |
| Roles         | Platform roles and organisation memberships on two independent axes, plus the authorization core added this week                                        |
| Design tokens | Already a three-layer system: raw `--bd-*` palette, semantic tokens, `@theme inline`. Components reference semantics only                               |

### Baseline, executed on this head

| Check                            | Result         |
| -------------------------------- | -------------- |
| `pnpm install --frozen-lockfile` | pass           |
| `pnpm run lint`                  | pass           |
| `pnpm run typecheck`             | pass           |
| `pnpm run format:check`          | pass           |
| `pnpm run test:unit`             | **153 passed** |
| Migrations from zero + seed      | pass           |
| `pnpm run test:integration`      | **151 passed** |
| `pnpm run build`                 | pass           |

**No pre-existing failures.** Nothing below is hiding a broken test.

---

## 4. What is incomplete or mocked

- **Payments** — mock adapter is the default; SSLCommerz credentials absent.
- **Email, screening, malware scanning, AI** — adapters with mock or disabled
  defaults. `AI_PROVIDER` defaults to `disabled`.
- **Service catalogue** — only **8** rows in `public.services`. The brief's
  Bangladesh catalogue (§7) runs to roughly 100 services across eight groups.
- **No authority records** — `/authorities` (§12) does not exist in any form.
- **No industries taxonomy** — §7.9 lists fifteen; none are modelled.
- **No delivery classification** — §8 requires one of seven per service; the
  column does not exist.
- **Fee model** — quotes and fee components exist, but not the §13 pricing
  architecture: no `price_versions`, no effective/verified dates, no approval
  state, no central government-fee registry.
- **No publishing workflow** — §14's draft → in review → approved → published →
  archived, and the translation-state workflow of §19, are not modelled.
- **`/admin/users`** errors in production: it reads `role_templates` and
  `platform_invitations`, and migrations 1300–1600 are not applied there.

## 5. What is unsafe or outstanding

- **Preview and production share one Supabase project.** A preview deployment
  can read and write production data. Unchanged, and still the highest-priority
  infrastructure fix.
- **A non-staff visitor to `/admin` gets an error page, not a redirect.**
  `admin/page.tsx` calls `requireStaff()` and the page renders concurrently with
  the layout, so the throw beats the layout's redirect. `/auth/access-denied`
  from the backend brief is not built.
- **No CSP, no Turnstile, no field-level encryption.** Environment variables are
  reserved; nothing is wired.
- **Rate limiting is in-process** — resets on deploy, per-instance.

## 6. What this redesign will change

Tokens, typography, layout primitives, public information architecture, the
service and authority data model, the pricing architecture, and the presentation
layer of all three workspaces.

## 7. What it will not change

Auth, customer records, cases, quotes, payments, documents, messages, compliance
reminders, RLS policies, storage policies, existing English/Bangla URLs, or any
published price. Migrations stay additive and reversible. The production
database is never reset or reseeded.

---

## 8. Honest scope note

§7 alone specifies roughly 100 services, each needing the 24-field detail
template of §11; §12 adds 22 authorities; §13, §14 and §19 add a versioned,
reviewed, bilingual content model. That is a programme of work, not a single
change, and every regulatory record needs a human verifier and a source URL
before it may be published (§14, §26). This branch will land it in reviewable
slices, and no phase will be reported complete on the strength of scaffolding.
