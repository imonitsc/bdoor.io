# Owner action register

Inputs the agent must **request** and must **never invent**. Until provided, use private config, inactive records, and internal notices — not public fabricated claims.

| ID   | Input                                                | Why it blocks                              | Where to provide      | Status                          |
| ---- | ---------------------------------------------------- | ------------------------------------------ | --------------------- | ------------------------------- |
| O-01 | Registered operating entity name + credentials       | Legal pages, Organisation schema, invoices | Legal pack / director | open                            |
| O-02 | Office address (if any)                              | Contact, GBP, trust                        | Owner                 | open                            |
| O-03 | Business phone + WhatsApp Business                   | Contact, social, messaging                 | Owner                 | open                            |
| O-04 | Support, legal, privacy, partner contact emails      | Policies, footer, routing                  | Owner                 | partial (`hello@bdoor.io` only) |
| O-05 | Founders / leadership bios (approved)                | About page depth                           | Owner                 | open                            |
| O-06 | Final lawyer-approved policy texts                   | Gate A                                     | Counsel               | open                            |
| O-07 | AML officer + escalation procedure                   | AML policy, ops                            | Compliance            | open                            |
| O-08 | Processor/subprocessor list + retention              | Privacy                                    | Counsel + eng         | open                            |
| O-09 | Approved public prices + statutory fee sources       | Pricing pages                              | Owner + counsel       | partial (8 seed fees)           |
| O-10 | Signed/verified partner orgs                         | Gate C, partner marks                      | Ops                   | open                            |
| O-11 | Consented case studies / reviews                     | Homepage trust                             | Owner                 | open                            |
| O-12 | Payment merchant credentials                         | Live payments                              | Finance               | open                            |
| O-13 | Email / WhatsApp provider credentials                | Transactional comms                        | Ops                   | open                            |
| O-14 | Official social profile URLs + admins                | Footer `sameAs`                            | Marketing             | open                            |
| O-15 | Search Console / Bing verification tokens            | SEO                                        | Marketing             | open                            |
| O-16 | Explicit approval to merge + promote production      | Gate F                                     | Director              | open                            |
| O-17 | Separate preview/staging Supabase project            | Preview safety                             | Eng + owner           | open                            |
| O-18 | Brand text-safe accent sign-off (`-text` companions) | AA compliance                              | Brand owner           | open                            |

## How engineering handles open items

1. Typed config field or inactive draft record.
2. Label blocked / unverified in admin or docs.
3. Prevent public render as verified claim.
4. Continue other safe work.
