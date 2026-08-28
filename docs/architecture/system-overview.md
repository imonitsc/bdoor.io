# System overview

BDoor (brand: **bdoor**) is a Next.js 16 App Router application with a Supabase Postgres backend. Domain logic lives in `src/features/`. Integrations are adapters in `src/lib/<name>/` with mock defaults.

```
Browser
  → Next.js (Server Components by default)
       → Server Actions (requireCapability + Zod)
       → Route handlers (auth confirm, payment webhooks)
  → Supabase
       → public  (RLS)
       → app     (private predicates)
       → compliance (unexposed)
       → Storage (private buckets + public-marketing)
```

Public catalogue reads use a cookie-free client so marketing pages stay statically renderable, and fall back to `src/content/catalog-snapshot.ts`.

Authorisation is never UI visibility: Server Actions and RLS both check. Roles are not read from `raw_user_meta_data`.

Further reading: [ARCHITECTURE.md](../ARCHITECTURE.md), [auth-and-tenancy.md](./auth-and-tenancy.md), [data-model.md](./data-model.md).
