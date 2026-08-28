# Owner action register

Items Cursor cannot invent. Until provided, use inactive configuration and record the blocker here.

| ID      | Missing input                                        | Why it blocks publication                           | Where to provide                                    |
| ------- | ---------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| OWN-001 | Registered legal entity name and registration number | Required for legal pages, invoices, structured data | Owner → `platform_settings` / legal review          |
| OWN-002 | Office address                                       | Footer, Google Business Profile, letterhead         | `docs/marketing/social-profile-setup.md`            |
| OWN-003 | Business phone and WhatsApp Business                 | Contact surfaces, WhatsApp adapter                  | `.env.example` variables + owner                    |
| OWN-004 | Support, legal, privacy, partner email addresses     | Routing and policies                                | Owner                                               |
| OWN-005 | Final lawyer-approved policies                       | Gate A                                              | Counsel sign-off → `src/content/legal/documents.ts` |
| OWN-006 | AML/compliance officer and escalation process        | Gate A AML page                                     | Compliance owner                                    |
| OWN-007 | Approved public prices and government fee sources    | Pricing pages and quotes                            | Admin pricing + evidence register                   |
| OWN-008 | Verified partner organisations                       | Gate C, partner marks                               | Partner verification workflow                       |
| OWN-009 | Customer reviews and case-study consent              | Marketing claims                                    | Owner marketing                                     |
| OWN-010 | Payment merchant credentials (SSLCommerz/bKash)      | Live payments                                       | `.env` + README                                     |
| OWN-011 | Email/WhatsApp provider credentials                  | Transactional comms                                 | `.env` + README                                     |
| OWN-012 | Official social profile URLs                         | Footer `sameAs`, social icons                       | `src/lib/social/profiles.ts`                        |
| OWN-013 | Search Console / Bing verification tokens            | SEO tooling                                         | `.env.example`                                      |
| OWN-014 | Preview Supabase project credentials                 | Safe preview testing                                | Infrastructure owner                                |
| OWN-015 | Explicit approval to merge and promote production    | Gate F                                              | Owner sign-off on preview URL                       |

**Process:** When an owner item arrives, update the relevant config/DB row, add an evidence claim with `status: verified`, and close the row here.
