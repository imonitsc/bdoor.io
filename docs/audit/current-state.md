# Current-state audit — production premium upgrade

**Date:** 28 August 2026  
**Branch:** `feat/bdoor-production-premium-upgrade`  
**Base:** `claude/new-session-0n73z6` @ `9a51d26` (includes branding package + prior redesign tokens)  
**Live baseline:** `https://www.bdoor.io/en`  
**Master brief:** `BDoor_Cursor_Production_Upgrade_Master_Instructions_2026-08-28`

This audit supersedes the redesign-only note in `docs/redesign/current-state-audit.md`
for upgrade planning. That file remains useful for colour-contrast decisions.

---

## 1. Repository snapshot

| Item | Value |
| ---- | ----- |
| Package manager | pnpm 10.33.0 |
| Node | ≥22 |
| Next.js | 16.3.2 (App Router) |
| React | 19.2.8 |
| Tailwind | 4.3.3 (CSS-first `@theme inline`) |
| next-intl | 4.13.7 (`en` / `bn`) |
| Supabase JS | 2.112.4 · SSR 0.12.5 |
| Migrations | 17 SQL files under `supabase/migrations/` |
| Tests | unit + integration (RLS) + Playwright e2e + axe |
| Branding package | Present under `bdoor_branding/` (PR #18) |
| Gap audit file | `BDoor_Live_Website_Gap_Audit_2026-08-28.md` was **not** supplied in this session; gaps below are from repo + live baseline inspection |

### Protected surfaces (do not break)

- Locale URLs `/en` and `/bn`
- Auth identities and customer/case/document data
- Existing service and pricing URLs
- Canonical / hreflang / OG metadata patterns
- RLS, private storage, capability matrix
- Draft legal banners until counsel sign-off

---

## 2. Feature inventory

Status key: **verified** · **unverified** · **mocked** · **missing** · **unsafe** · **blocked**

### Public marketing

| Feature | Status | Notes / proposed action |
| ------- | ------ | ----------------------- |
| Homepage hero + advisor | verified | Update copy to master promise; keep real product preview |
| How it works (4 steps) | verified | Expand to 7-step narrative where UX allows without inventing claims |
| Service categories (6) | verified | Expand taxonomy; keep published set honest |
| Foreign founders page | verified | Preserve URL; deepen when fees/sources verified |
| Services list + detail | verified | Thin catalogue (8 services); expand as `coming_soon`/`draft` |
| Pricing page | verified | Preserve approved BDT fees; no invented packages |
| Resources (few articles) | unverified | Editorial workflow + evidence required before growth |
| Partners enquiry | verified | No advertised “verified partner” until Gate C |
| About / Contact | verified | No address/phone until owner supplies |
| Legal (6 pages) | blocked | Draft banners; Gate A |
| Industries pages | missing | Add data model + inactive public routes |
| Authority directory | missing | Add data model + inactive public routes |
| International country pages | missing | Framework only; inactive until providers verified |
| Social footer links | missing | Config present only when `active` + verified |
| Evidence-backed trust strip | missing | Render only verified evidence-register rows |

### Assessment / onboarding

| Feature | Status | Proposed action |
| ------- | ------ | --------------- |
| 15-step questionnaire | verified | Preserve; improve save/resume UX |
| Recommendation engine | verified | Point at canonical catalogue (no duplicate lists) |
| Guest → account handoff | verified | Keep; add tests for retention |
| Country-aware branching | partial | Extend with inactive international countries |

### Customer workspace (`/app`)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Overview, cases, companies, documents | verified | Real data paths |
| Billing / quotes / payments | mocked payments | Mock gateway default |
| Compliance calendar | verified | |
| Messages / notifications | verified | Email delivery mocked |
| Security / MFA | verified | |
| Consent / privacy centre | partial | Expand policy versioning UI |
| Data export/deletion | partial | Request path; ops process blocked |

### Partner portal (`/partner`)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Cases, tasks, documents, team, org | verified | Scoped by assignment |
| Credential verification workflow | verified | Gate C for public claims |
| Partner quotation / payouts | partial | |

### Admin (`/admin`)

| Feature | Status | Notes |
| ------- | ------ | ----- |
| Leads, cases, KYC, partners, finance | verified | Capability-gated |
| Services / pricing / content | verified | |
| Users / invitations | unverified | Confirm migrations applied in prod |
| Access-denied route | missing | Non-staff `/admin` can hard-error |

### Integrations

| Adapter | Status |
| ------- | ------ |
| Payments | mocked (sslcommerz/stripe throw until implemented) |
| Email | mocked |
| Screening | mocked (must never onboard on mock) |
| Malware scan | mocked (never marks clean) |
| AI | disabled |
| Rate limit | in-process (unsafe multi-instance) |
| Turnstile / CSP / field encryption | reserved env; not wired |

### Infrastructure

| Item | Status |
| ---- | ------ |
| GitHub CI (verify, RLS, e2e, CodeQL) | verified |
| Preview vs production Supabase | **unsafe** — shared project risk |
| Vercel production promotion | manual (correct) |
| Automatic production migrations | must not run from unapproved preview |

---

## 3. Database and security snapshot

- RLS on exposed tables; private `app` predicates; `compliance` unexposed
- Storage: 5 private buckets + `public-marketing`
- Auth: email/password, TOTP MFA, step-up for sensitive capabilities
- Dual role axes: platform roles × organisation memberships
- Finance has no KYC decide; plain admin has no refund approve / KYC decide

Known gaps: malware live scan, CSP, bot protection, Redis rate limit, preview isolation, evidence claim table (to add), industries/authorities/countries tables (to add).

---

## 4. Content and truth rules

- No invented partners, reviews, fees, timelines, affiliations or office details
- Government fees only with source + review date (or “Quoted after review”)
- Brand spelling in guidelines: lowercase **bdoor** for marketing; legal entity name only when owner provides it
- Existing i18n still uses `BDoor` in many strings — migrate carefully without breaking disclosure E2E assertions until both locales update together

---

## 5. Baseline verification (this branch start)

Commands to re-run after each phase (record results in PR):

```bash
pnpm install --frozen-lockfile
pnpm run verify
scripts/local-db/apply.sh --seed && pnpm run test:integration
pnpm run test:e2e
```

Pre-existing failures must be listed, not hidden.

---

## 6. Implementation priority (this upgrade)

1. **Phase 0** — this audit, launch gates, owner-action register, threat model, ADRs  
2. **Phase 1** — evidence register, policy versioning hooks, access-denied, RLS negative coverage gaps  
3. **Phase 2** — operational gaps only where schema already supports them  
4. **Phase 3** — premium public IA: nav, homepage promise, service finder, inactive industries/authorities/international  
5. **Phase 4** — social config, SEO checklist, editorial evidence workflow  
6. **Phase 5** — country framework drafts (inactive)  
7. **Phase 6** — full verify matrix + Vercel preview; **no production promote**

Owner/legal/partner inputs stay in `docs/launch/owner-action-register.md` — never fabricated into public UI.
