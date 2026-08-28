# Social profile setup

Cursor cannot create external accounts. This is the owner checklist plus what the website will render.

## Unified identity

Brand name: **bdoor**  
Preferred username order: `@bdoorhq` → `@bdoorbusiness` → `@bdoorbangladesh` → `@getbdoor` → `@bdoorio`

Use one handle across channels where possible.

## Channel categories

Do **not** select Government Organization, Law Firm, Accounting Firm or Tax Preparation Service unless bdoor itself is legally entitled to that description.

| Channel                 | Recommended category                                                |
| ----------------------- | ------------------------------------------------------------------- |
| Facebook                | Business Service                                                    |
| LinkedIn                | Technology, Information and Internet                                |
| Instagram               | Business Service                                                    |
| WhatsApp Business       | Business Services                                                   |
| YouTube                 | Education                                                           |
| TikTok                  | Business Service                                                    |
| X                       | Professional Services                                               |
| Threads                 | Entrepreneur / business education                                   |
| Google Business Profile | Business Management Consultant — only with a genuine staffed office |

## Shared copy (approved starters)

Short bio: Start, license and manage your business in Bangladesh through one secure platform.

Long description: see master instructions §25.3 (independent platform; not a government authority or law firm).

Tagline: Your door to business in Bangladesh.  
Cover: Everything your business needs in Bangladesh. One door.  
Cover support: Formation · Licences · Tax · Compliance

## Website behaviour

Configuration: `src/content/directory/social-profiles.ts` and `public.social_profiles`.

Only rows with `status = active` **and** `verified` appear in the footer or Organisation `sameAs`. **None are active in this branch.**

Assets (do not add phone numbers, unverified partner/government logos, fake metrics or AI people):

- square profile: `bdoor_branding/03_Social/bdoor-social-avatar-source.svg`
- Facebook / LinkedIn covers and OG source in the same folder

## Owner must still provide

Verified business phone, WhatsApp Business number, support/partner emails, office address, hours, SLA, named administrators, recovery contacts, MFA custody for each network.
