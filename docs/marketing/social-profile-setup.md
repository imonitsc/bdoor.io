# Social profile setup (owner checklist)

Cursor cannot create external accounts without authorised credentials. This document is the website/infrastructure contract plus the owner checklist.

## Unified identity

- Brand name: **bdoor**
- Preferred username order: `@bdoorhq` → `@bdoorbusiness` → `@bdoorbangladesh` → `@getbdoor` → `@bdoorio`
- Use one verified handle across channels where possible

## Channel categories

| Channel | Recommended category | Notes |
| ------- | -------------------- | ----- |
| Facebook | Business Service | Not Government Organization |
| LinkedIn | Technology, Information and Internet | |
| Instagram | Business Service | |
| WhatsApp Business | Business Services | Needs verified number (O-03) |
| YouTube | Education | |
| TikTok | Business Service | |
| X | Professional Services | |
| Threads | Entrepreneur/business education | |
| Google Business Profile | Business Management Consultant | Only with genuine staffed office |

Do **not** select Law Firm, Accounting Firm, Tax Preparation Service or Government Organization unless bdoor itself is legally entitled.

## Shared copy

**Short bio:** Start, license and manage your business in Bangladesh through one secure platform.

**Long description:** bdoor helps local and international founders start, operate and manage businesses in Bangladesh. From company formation and trade licences to tax coordination, import/export registrations and ongoing compliance, bdoor brings the process into one secure workspace with transparent fees, organised documents and support from verified professionals where required. bdoor is an independent business setup and administrative-support platform. It is not a government authority or law firm. Government decisions remain with the responsible authorities, and regulated professional services are provided under separate engagements by qualified independent professionals.

**Tagline:** Your door to business in Bangladesh.

**Cover:** Everything your business needs in Bangladesh. One door. / Formation · Licences · Tax · Compliance

## Website implementation

Canonical config: `src/content/social/profiles.ts`

Each row: network, public URL, handle, status (`reserved` | `verified` | `active` | `inactive`), locale, lastVerifiedAt, displayPermission.

**Only `active` profiles with verification may render** in the footer or Organisation `sameAs`.

Assets for covers/icons: export from `bdoor_branding/03_Social/` and `02_Icons/` — do not invent phone numbers, partner logos, government logos, fake metrics or AI people.

## Owner setup steps

1. Reserve preferred handles (O-14).
2. Enrol MFA and store backup codes securely.
3. Set support email / WhatsApp (O-03, O-04).
4. Mark profiles `verified` then `active` in config after URL confirmation.
5. Provide Search Console / Bing tokens (O-15).
