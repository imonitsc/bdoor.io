# Social profile setup (owner checklist)

Cursor cannot create external accounts without authorised credentials. Complete this checklist and then set `status: active` in `src/lib/social/profiles.ts`.

## Unified identity

- **Brand name:** bdoor
- **Preferred handles (in order):** `@bdoorhq`, `@bdoorbusiness`, `@bdoorbangladesh`, `@getbdoor`, `@bdoorio`

## Channel setup

| Channel                 | Category                             | Owner action                                               |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Facebook                | Business Service                     | Create page, upload cover from `bdoor_branding/03_Social/` |
| LinkedIn                | Technology, Information and Internet | Company page + cover                                       |
| Instagram               | Business Service                     | Profile + bio                                              |
| WhatsApp Business       | Business Services                    | Verified number + hours                                    |
| YouTube                 | Education                            | Channel art                                                |
| X                       | Professional Services                | Header + bio                                               |
| TikTok / Threads        | Business education                   | Optional                                                   |
| Google Business Profile | Only with genuine staffed office     | **Blocked until OWN-002**                                  |

## Shared copy (approved starters)

See `bdoor_branding/04_Stationery/BRAND_COPY_STARTERS.md`.

**Short bio:** Start, license and manage your business in Bangladesh through one secure platform.

**Tagline:** Your door to business in Bangladesh.

## Website wiring

After verification, set each profile in `src/lib/social/profiles.ts`:

- `url` — public profile URL
- `status` — `active`
- `displayPermission` — `true`
- `lastVerifiedAt` — ISO date

Only then will footer links and Organisation `sameAs` schema include the profile.

## Assets

Export from `bdoor_branding/03_Social/` — do not add unverified metrics, government logos, or AI-generated people.
