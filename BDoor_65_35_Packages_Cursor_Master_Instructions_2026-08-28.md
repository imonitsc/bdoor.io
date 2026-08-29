# bdoor 65/35 Packages and International Expansion — Cursor Master Instructions

> Use this document with Cursor Agent inside the existing bdoor GitHub repository.  
> Pricing and source review date: 28 August 2026.  
> Legal operator name: **bdoor compliance ltd**.

This is the Cursor execution layer for the complete bdoor package and international-expansion specification. It converts the longer product specification into a workflow Cursor can execute safely across the existing repository.

---

## 1. Files to place in the repository root

Before starting Cursor Agent, place these files in the repository root:

```text
BDoor_65_35_Packages_Cursor_Master_Instructions_2026-08-28.md
BDoor_65_35_Packages_Claude_Code_Master_Instructions_2026-08-28.md
BDoor_Packages_and_International_Pricing_Research_2026-08-28.md
BDoor_Production_Claude_Code_Master_Instructions_2026-08-28.md
BDoor_Backend_Admin_and_Partner_Portals_Claude_Code_Instructions_2026-08-28.md
```

Also include when available:

```text
bdoor_branding/
assets/input/bdoor-homepage-founder-hero.png
```

If the founder image still has its generated filename, it may be present as:

```text
generated_images/exec-1da116c1-0ed1-4844-99cd-f9f94d6dc8b3.png
```

Do not rename or overwrite existing application files before Cursor has inspected the repository.

---

## 2. Exact prompt to paste into Cursor Agent

Use Cursor in **Agent mode** with the complete repository open. Allow repository indexing to finish, then paste:

```text
@BDoor_65_35_Packages_Cursor_Master_Instructions_2026-08-28.md
@BDoor_65_35_Packages_Claude_Code_Master_Instructions_2026-08-28.md
@BDoor_Packages_and_International_Pricing_Research_2026-08-28.md
@BDoor_Production_Claude_Code_Master_Instructions_2026-08-28.md
@BDoor_Backend_Admin_and_Partner_Portals_Claude_Code_Instructions_2026-08-28.md

Read every referenced file completely before editing. The file named Claude Code Master Instructions is the detailed product specification even though this implementation is being performed in Cursor. Apply its requirements exactly, subject to the authority order defined in the Cursor Master Instructions.

Inspect the existing repository, routes, components, design system, package data, Supabase migrations, RLS, Auth, Storage, admin and partner portals, customer workspace, locale system, tests, CI and Vercel configuration. Treat working code, URLs and production data as protected.

Create and work only on the branch feat/bdoor-65-35-packages. First create the required current-state audit and implementation plan. Then continue through implementation, migrations, tests and preview without stopping after the plan. Use additive changes and reversible migrations. Do not reset, reseed or recreate production data.

Implement a simple premium homepage with 65% Bangladesh emphasis and 35% international emphasis; six Bangladesh packages divided into New business and Existing business; transparent multi-layer pricing; concise USA, UK, UAE and Singapore formation routes; country pages; assessment and quotation logic; admin-controlled price versions and source evidence; English/Bangla content; production tests; and a Vercel preview.

Do not copy Rocketwave, Offisio, Firstbase, Stripe Atlas, Sleek, Osome or another competitor. Do not invent partners, reviews, legal details, company numbers, addresses, government approval, official fees or guaranteed outcomes. Use the exact legal operator name bdoor compliance ltd and do not show a public address. Seed partner-dependent international packages as draft and keep checkout disabled until an authorised administrator records an approved partner agreement and margin.

Do not push to the production branch, merge, apply destructive database operations or promote the Vercel preview to production. Finish with the required handoff report, screenshots, test results and preview URL.
```

---

## 3. Instruction authority

When requirements conflict, use this order:

1. Existing production data integrity and security
2. This Cursor master instruction
3. `BDoor_65_35_Packages_Claude_Code_Master_Instructions_2026-08-28.md`
4. Backend/admin/partner portal instruction
5. General production instruction
6. Existing implementation patterns

Specific rules in this file supersede older requirements that assigned 80% of the homepage to Bangladesh. The approved balance is now:

- 65% Bangladesh
- 35% USA, UK, UAE and Singapore combined

Do not treat the word `Claude` in an older filename as an instruction to ignore that specification. It remains the detailed product brief.

---

## 4. Cursor operating protocol

### Stage A — Inspect

Before changing code, Cursor must inspect:

- Git status, current branch and remotes
- Framework, runtime and dependency versions
- Package manager and lockfile
- Application routes
- Existing English/Bangla architecture
- Public homepage, pricing and service pages
- Authentication flows
- Questionnaire/recommendation flow
- Customer dashboard
- Admin dashboard
- Partner dashboard
- Package/service data sources
- Supabase schema and migration history
- Generated Supabase types
- RLS and grants
- Storage buckets and policies
- Quote, invoice and payment flows
- Analytics and monitoring
- GitHub Actions
- Vercel configuration
- Existing tests and build health
- Uncommitted user changes

Create:

```text
docs/product/65-35-packages-current-state.md
```

The audit must identify:

- What works and must be preserved
- What is incomplete or mocked
- Existing package and price conflicts
- Missing tables, policies or routes
- Legal/commercial placeholders
- Accessibility and performance problems
- Required additive migrations
- Production risks and blockers

### Stage B — Establish a baseline

Run the repository's existing:

- dependency installation
- lint
- typecheck
- unit tests
- integration tests
- end-to-end tests where configured
- production build

Record failures before fixing them. Do not hide failures by deleting tests, weakening TypeScript, disabling linting or loosening security.

### Stage C — Plan inside the repository

Create:

```text
docs/product/65-35-packages-implementation-plan.md
```

Divide implementation into small checkpoints:

1. Data model and migrations
2. Price/source administration
3. Public package components
4. Homepage redesign
5. Bangladesh service and package pages
6. International country pages
7. Assessment and recommendation rules
8. Quote and payment safeguards
9. English/Bangla content
10. Analytics, SEO and accessibility
11. Tests and Vercel preview

The plan is not the final deliverable. After writing it, continue implementing.

### Stage D — Implement incrementally

For each checkpoint:

1. Inspect relevant existing code.
2. Reuse existing conventions and components where sound.
3. Make the smallest coherent set of changes.
4. Add or update tests.
5. Run focused validation.
6. Update the implementation plan.
7. Commit a clear checkpoint when the repository workflow permits it.

Do not generate an entirely separate second application beside the existing one.

### Stage E — Verify the complete story

After implementation, verify:

- Public homepage
- New business package tab
- Existing business package tab
- Price-breakdown display
- Bangladesh assessment
- International assessment
- Quote creation and acceptance
- Customer dashboard result
- Admin price-version workflow
- Draft international checkout blocking
- English/Bangla routes
- Mobile and desktop layouts
- Supabase access boundaries
- Vercel production build

### Stage F — Preview only

Create a Vercel preview for the feature branch. Do not promote it to production.

---

## 5. Approved commercial structure

Cursor must implement exactly six primary Bangladesh packages.

### New business

| Package         |  bdoor fee | Public label                               |
| --------------- | ---------: | ------------------------------------------ |
| Solo Start      |  BDT 9,900 | BDT 9,900 + official fees                  |
| Limited Company | BDT 24,900 | BDT 24,900 + RJSC fees                     |
| Complete Launch | BDT 39,900 | BDT 39,900 + official and third-party fees |

### Existing business

| Package                      |                            bdoor fee | Public label                                          |
| ---------------------------- | -----------------------------------: | ----------------------------------------------------- |
| Compliance Check             |                           BDT 14,900 | BDT 14,900                                            |
| Annual Compliance            |                      BDT 49,900/year | BDT 49,900/year + official, audit and specialist fees |
| Managed Finance & Compliance | BDT 11,900/month or BDT 119,000/year | From BDT 11,900/month                                 |

The detailed inclusions, exclusions, limits and eligibility rules are authoritative in:

```text
BDoor_65_35_Packages_Claude_Code_Master_Instructions_2026-08-28.md
```

Do not shorten the stored data model even if the homepage displays only five inclusions per card.

---

## 6. Bangladesh standalone and complex services

Use the following proposed bdoor fees as reviewable, versioned catalogue records:

| Service                                       | Proposed bdoor fee | Required fee note                                     |
| --------------------------------------------- | -----------------: | ----------------------------------------------------- |
| e-TIN assistance                              |          BDT 4,000 | Government application fee BDT 0                      |
| BIN/VAT assessment and application assistance |          BDT 6,000 | Government application fee BDT 0                      |
| Trade-licence coordination                    |          BDT 8,000 | Authority fee varies                                  |
| Commercial IRC coordination                   |         BDT 15,000 | Official fee varies by class                          |
| ERC coordination                              |         BDT 15,000 | Official certificate/renewal costs separate           |
| Standard RJSC annual return/company change    |    From BDT 12,000 | Government and late fees at actuals                   |
| BIDA project-registration coordination        |    From BDT 25,000 | Official investment slab + applicable VAT             |
| Foreign-owned Bangladesh private company      |    From BDT 69,900 | Government, bank, attestation and partner costs extra |
| Branch/liaison/representative office          |   Custom quotation | Authority and partner costs at actuals                |

Never describe the BDT 4,000 e-TIN fee or BDT 6,000 BIN/VAT fee as a government charge.

---

## 7. Approved proposed international offers

All international prices begin in `draft` status. Their public information pages may invite users to request a quote, but checkout stays disabled until commercial and professional-partner gates pass.

| Country/route                               |   Proposed starting price | Mandatory condition                                     |
| ------------------------------------------- | ------------------------: | ------------------------------------------------------- |
| USA — Wyoming LLC                           |   USD 449 estimated total | USD 349 bdoor/partner fee + USD 100 state fee           |
| USA — Delaware LLC                          |   USD 459 estimated total | USD 349 bdoor/partner fee + USD 110 state fee           |
| USA — Florida LLC                           |   USD 474 estimated total | USD 349 bdoor/partner fee + USD 125 state fee           |
| UK non-resident LTD                         |   GBP 349 estimated total | GBP 249 bdoor/partner fee + GBP 100 Companies House fee |
| UAE eligible Sharjah no-visa route          | AED 9,375 estimated total | AED 2,500 bdoor fee + AED 6,875 licence                 |
| UAE Dubai route                             |           From AED 15,000 | AED 2,500 bdoor fee + licence from AED 12,500           |
| Singapore with qualifying resident director |              From S$1,500 | Partner/CSP scope must be confirmed                     |
| Singapore foreign-founder route             |              From S$3,690 | Nominee director/KYC; deposit separate when required    |

Required international disclosures:

- EIN has no IRS fee.
- US state and annual fees vary.
- Domestic US-created companies are currently exempt from standard FinCEN BOI reporting; do not sell BOI filing as a default deliverable.
- UK identity verification and registered-office eligibility apply.
- UAE activity, free zone, visa and facility determine final cost.
- Singapore foreign founders need a Corporate Service Provider and a qualifying resident director.
- A refundable nominee-director deposit is not a service fee.
- Banking, payment accounts, visas, licences and government approvals are never guaranteed.

---

## 8. Homepage implementation

The homepage must remain simple and spacious.

Required section order:

1. Bangladesh-first hero with international secondary CTA
2. Four-step bdoor process
3. Bangladesh package selector
4. Transparent-fee example
5. Real workspace preview
6. Compact Bangladesh specialist-services list
7. Four international country cards
8. Existing-business/compliance value
9. Six FAQs maximum
10. Final assessment CTA

### Package-selector rule

Use a two-option segmented control:

- New business
- Existing business

Show exactly three package cards at one time. Default to `New business`.

Do not place all six packages in one grid. Do not create a long six-card mobile stack by default.

### Hero copy

Eyebrow:

> Bangladesh business setup and compliance

Headline:

> Start your business in Bangladesh. Grow beyond borders.

Body:

> Form your company, complete essential registrations and manage ongoing compliance in one secure workspace. When you are ready, bdoor also supports formation in the USA, UK, UAE and Singapore.

Primary CTA:

> Start in Bangladesh

Secondary CTA:

> Explore international formation

Operator disclosure:

> bdoor is operated by bdoor compliance ltd.

Do not display an invented address, company number or government affiliation.

---

## 9. Visual rules

Use:

- Midnight navy and warm off-white foundation
- Cobalt primary actions
- Rickshaw-inspired turquoise, vermilion and marigold only as accents
- Approved lowercase bdoor logo
- Strong editorial typography
- Large spacing and fewer, more meaningful sections
- Real product UI and case progress
- Subtle 150–250 ms motion

Avoid:

- Excessive gradients
- Glowing cards
- Glassmorphism everywhere
- Emoji flags
- Generic rocket illustrations
- Repetitive icon grids
- Fake reviews
- Fake partner logos
- AI-generated testimonial people
- Over-rounded “AI SaaS” components
- Unsupported “instant,” “guaranteed” or “official” claims

Use the supplied founder image in the homepage hero. Keep real HTML text and buttons outside the image.

---

## 10. Transparent pricing rules

Every package and quote must separate:

1. bdoor fee
2. Government/statutory fee
3. Professional-partner fee
4. Third-party expense
5. Applicable tax/VAT
6. Refundable deposit
7. Discount
8. Estimated total

Do not use one generic `price` field for regulated services.

Required behavior:

- Store money in minor units.
- Keep currency explicit.
- Version published prices.
- Never modify a package version already used in a quote.
- Store assumptions and exclusions.
- Store source URL, review date, reviewer and expiry.
- Block stale or expired statutory costs from automatic checkout.
- Require server-side price calculation.
- Reject client-supplied amount changes.
- Preserve the exact package/fee snapshot inside each quote.

The tax treatment of bdoor's professional fee begins as `pending_review`. Cursor must not invent whether it includes VAT.

---

## 11. Data, Supabase and RLS

Adapt the existing schema rather than duplicating tables. Use additive migrations.

Logical records required:

- jurisdictions
- service packages
- package versions
- package inclusions/exclusions/limits
- fee components
- fee sources/evidence
- partner price agreements
- assessment results
- quotes and line items
- price-review tasks
- approval records
- audit events

Security requirements:

- RLS on every exposed table
- Anonymous users read only published public package versions
- Customers read only their own assessments, quotes and cases
- Partners see only assigned cases and authorised documents
- Wholesale partner cost remains internal
- Only authorised roles can approve/publish price versions
- Service-role keys never enter the browser
- Private documents use private storage and short-lived signed URLs
- Publication, overrides and refunds are audited
- Negative cross-customer and cross-partner tests are mandatory

Cursor must check current Supabase documentation and the repository's current client/server patterns before writing new code.

---

## 12. Admin workflow

Create or extend an admin interface for:

- Packages
- Version history
- English/Bangla copy
- Inclusion/exclusion/limit editing
- Fee components
- Statutory-source evidence
- Partner price agreements
- Margin review
- Draft/review/approve/publish workflow
- Review expiry alerts
- Quote overrides with reason
- Audit history

International checkout may be enabled only after:

- active verified partner agreement
- recorded scope and eligibility
- approved wholesale and renewal cost
- minimum gross margin passes
- refund terms are mapped
- data-sharing terms are recorded
- legal/compliance approval exists

---

## 13. Assessment, quote and checkout

First assessment question:

> Where do you want help?

Options:

- Start a business in Bangladesh
- Manage an existing Bangladesh business
- Form a company outside Bangladesh
- I am not sure

Recommendation must produce:

- one primary package
- one alternative
- reason
- inclusions
- variable fees
- missing information
- exact-quote CTA

Require manual review for foreign ownership, regulated activities, historical non-compliance, uncertain government fees, UAE visa/facility routes, Singapore nominee directors, unclear US tax classification, unclear UK address/identity eligibility or any unapproved partner price.

Do not accept payment for an unreviewed or ineligible route.

---

## 14. English and Bangla

All new public pages, package content, forms, validation, metadata, quote output and transactional messages must support English and Bangla.

Requirements:

- Preserve locale between routes.
- Do not leave obvious English fallback on completed Bangla pages.
- Keep formal entity names/currency codes where needed for legal clarity.
- Human-review Bangla legal/commercial wording before production.
- Test text expansion and line wrapping at mobile widths.

---

## 15. Quality gates

Cursor must complete:

### Code quality

- Lint
- Typecheck
- Production build
- Unit tests
- Integration tests
- End-to-end tests

### Pricing tests

- UK: GBP 249 + GBP 100 = GBP 349
- UAE value route: AED 2,500 + AED 6,875 = AED 9,375
- UAE Dubai route: AED 2,500 + AED 12,500 = AED 15,000
- Singapore government fees: S$15 + S$300 = S$315
- USA representative totals
- BIDA fee slab and tax layer
- Price versioning and source expiry
- Currency formatting
- `pending_review` tax behavior

### Access tests

- Anonymous cannot read drafts.
- Customer A cannot read Customer B's data.
- Partner A cannot read unassigned cases.
- Editor cannot bypass required approval.
- Browser cannot change server-calculated price.
- Private documents cannot be guessed by URL.

### Visual tests

Capture at 1440px and 390px:

- Homepage hero
- New business packages
- Existing business packages
- Fee breakdown
- International cards
- At least one country page
- Assessment result
- Mobile navigation

### Accessibility

- WCAG 2.2 AA
- Keyboard-operable tabs
- Correct tab/tabpanel semantics
- Visible focus
- Accessible currency/fee labels
- Reduced-motion support
- Form error summaries
- No colour-only meaning
- No horizontal mobile overflow

---

## 16. Cursor stop conditions

Cursor may ask for direction only when blocked by:

- Missing credential required for a real integration
- Destructive or irreversible action
- Conflict with existing production data
- Unresolved legal/commercial claim
- Unverified partner required before checkout
- Schema conflict that risks customer data
- Request to merge or deploy production

Cursor should not stop for:

- Routine component choices
- Naming internal helper functions
- Ordinary test fixes
- Documentation
- Reversible additive migrations
- Feature-branch commits
- Preview deployment

If a required external service is unavailable, implement the production-safe adapter, validation, feature flag and test double; document the missing credential or contract. Do not simulate a live integration in production.

---

## 17. Required handoff from Cursor

Cursor must finish by reporting:

1. Branch name and commits
2. Current-state audit result
3. Implementation-plan completion
4. Routes and components changed
5. Database migrations and RLS added
6. Package versions seeded
7. Prices published versus left in draft
8. Required partner/legal/finance decisions
9. Lint, typecheck, test and build results
10. Accessibility results
11. Vercel preview URL
12. Desktop and mobile screenshots
13. Known limitations
14. Rollback plan
15. Exact approval steps before production

Cursor must not claim production completion when a partner, price, payment, email, legal review or security gate remains mocked or unverified.

---

## 18. Definition of done

The Cursor task is complete only when:

- Existing working functionality remains intact.
- The new work is on `feat/bdoor-65-35-packages`.
- The homepage is premium, simple and responsive.
- Bangladesh receives approximately 65% emphasis.
- International formation receives approximately 35% emphasis.
- Six Bangladesh packages exist behind New/Existing tabs.
- Exactly three Bangladesh packages display at once.
- Every fee layer is transparent.
- e-TIN and BIN/VAT government application fees are not misrepresented.
- USA, UK, UAE and Singapore have accurate conditional starting prices.
- Partner-dependent international checkout remains gated.
- The legal operator appears as bdoor compliance ltd.
- No public address is invented or displayed.
- English and Bangla content is complete.
- Supabase RLS and negative access tests pass.
- Lint, typecheck, tests and production build pass.
- A Vercel preview is ready.
- No production merge or promotion has occurred.
