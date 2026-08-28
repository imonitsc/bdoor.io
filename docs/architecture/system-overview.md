# System overview

bdoor is a Next.js 16 App Router application with React 19 Server Components by default, next-intl locales (`en`/`bn`), and Supabase for Postgres (RLS), Auth (email + TOTP MFA) and private Storage.

```
Browser → Next.js (proxy: locale + cookie refresh, not authorisation)
        → Server Components / Server Actions (requireCapability)
        → Supabase (RLS) | adapters (payments, email, screening, malware, AI)
```

Route groups under `src/app/[locale]/`: `(marketing)`, `(auth)`, `(customer)`, `(partner)`, `(admin)`.

Domain logic lives in `src/features/<area>/`. Shared plumbing in `src/lib/`. Integrations are adapters with mock defaults.

Money is integer minor units (`src/features/quotes/money.ts`). Catalogue reads for marketing use cookie-free `public.ts` for static rendering, with `src/content/catalog-snapshot.ts` offline fallback.

See also: `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/audit/current-state.md`.
