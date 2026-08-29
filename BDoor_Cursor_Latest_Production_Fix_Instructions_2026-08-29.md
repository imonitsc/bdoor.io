# bdoor — Latest Production Fix Instructions for Cursor

## Project context

- Live website: https://www.bdoor.io/
- Legal company: bdoor compliance ltd.
- Primary market: Bangladesh
- Secondary routes: USA, UK, UAE, Saudi Arabia, Qatar and Singapore
- Product model: B2B2C coordination platform using appointed third-party professional providers
- Existing stack: inspect the repository first; preserve the current Next.js, Supabase, GitHub and Vercel architecture
- Audit date: 29 August 2026

---

# Cursor master prompt

Use Cursor Agent mode with the complete repository open. Read this document completely and inspect `@Codebase` before editing. Create a new branch named `feat/bdoor-premium-production-fix`. Preserve the current working Bangladesh/outside-Bangladesh route logic, authentication, Supabase schema/data, admin and partner functionality, English/Bangla routing and individual country URLs. Implement every requirement in this document; do not stop after a plan or homepage mockup. Run the complete test suite, add missing automated tests, build successfully and produce a Vercel preview only. Do not deploy to production or modify production secrets. Do not invent provider credentials, legal clauses, government relationships, reviews, customer statistics, prices or processing guarantees.

---

# 1. Latest verified live state

The live site was checked again on 29 August 2026. Do not work from an older screenshot or instruction that says the international country order is still wrong.

## Preserve these working improvements

1. Homepage is Bangladesh-first.
2. Main navigation contains Start, Services, Pricing and Resources—not Countries.
3. International country names are shown in the footer, not the homepage body.
4. Start flow first asks:
   - Bangladesh
   - Outside Bangladesh
5. Selecting Outside Bangladesh now correctly displays the six-country selector immediately:
   - United States
   - United Kingdom
   - United Arab Emirates
   - Saudi Arabia
   - Qatar
   - Singapore
6. Selecting Bangladesh asks:
   - Start a new business
   - Manage an existing business
7. Six Bangladesh packages exist across New business and Existing business tabs.
8. English and Bangla homepages are available.
9. Individual international country pages and deep application links exist.

Do not reverse or remove these behaviours.

## Verified remaining problems

### Homepage design

- Desktop hero is approximately 667 pixels tall.
- Homepage is approximately 4,003 pixels tall.
- Hero content is left aligned while the entire right side is empty.
- No homepage image is currently rendered.
- Six major sections still make the page longer than necessary.
- The pale blue-grey hero feels generic rather than premium.
- Existing-business support repeats information already available through the package tabs.

### Start flow

- Continue and Back block on `Saving…` for approximately six seconds.
- The form waits for persistence before changing screens.
- Progress remains `Stage 1 of 6: About you` across location, country, formation type and support questions.
- Save and exit appears even before a reliable resume identity is established.
- Cursor must verify every deep link visibly confirms the selected country/package.

### Content hierarchy

- Bangladesh country page contains approximately 1,176 characters and two main sections.
- United States page contains approximately 3,353 characters and eight main sections.
- International pages are more detailed than the flagship Bangladesh page.
- Services displays eight large cards.
- Pricing contains repeated explanations and approximately 3,021 characters.
- Resources contains only three guides.

### Legal readiness

- Privacy Policy and Terms remain `Under professional review`.
- The live text explicitly says payment, engagement, identity verification and document collection cannot begin yet.
- Free applications may remain open.
- The supplied `policies/BDoor_Legal_Policy_Content_Pack_EN_2026-08-29.md` now contains complete working drafts for all required policy routes.
- Cursor must replace the identical placeholder pages in the preview with the supplied substantive drafts, while keeping their status `Draft`, adding `noindex`, and preserving the legal launch gate until professional approval.

---

# 2. Required outcome

Make bdoor a restrained, premium Bangladesh business operating platform.

The homepage must communicate:

> Start and run your business in Bangladesh.

International routes must remain operational but quiet. A customer can select Outside Bangladesh and immediately choose a country, but no international sales grid or promotional country section should appear on the homepage.

The final experience must feel:

- Clear
- Calm
- Fast
- Human-reviewed
- Bangladesh-specialist
- Trustworthy
- Premium without decoration

It must not feel like:

- A generic AI-generated SaaS template
- A seven-country marketplace
- A legal-services directory
- A government portal
- A collection of repeated cards

---

# 3. Non-negotiable constraints

1. Do not rebuild from scratch.
2. Do not change the Supabase project.
3. Do not delete or reset production data.
4. Use additive migrations only unless an explicit safe migration plan is documented.
5. Do not remove English/Bangla routing.
6. Do not restore Countries to the primary navigation.
7. Do not place country cards or country prices on the homepage.
8. Do not use emoji flags.
9. Do not use AI-generated faces, floating dashboards, rockets or globe illustrations.
10. Do not add gradients, glow effects, glassmorphism or excessive animation.
11. Do not fabricate providers, partners, reviews or customer numbers.
12. Do not claim government approval, affiliation or preferential processing.
13. Do not collect identity documents during the free assessment.
14. Do not enable payment/KYC until approved legal documents are supplied.
15. Do not display Coming soon services publicly.
16. Do not force account creation before an initial application can be submitted.
17. Do not deploy production from Cursor.

---

# 4. Image assets

The owner will provide these three generated assets. Expect them under `public/images/bdoor/` using these final names:

1. `open-door-dhaka.webp`
   - Architectural open doorway facing a modern Dhaka business district.
   - Use on the homepage hero.
2. `formation-documents.webp`
   - Premium navy document folio on a warm stone desk.
   - Use on Services or Pricing, not the homepage.
3. `compliance-review.webp`
   - Two professionals reviewing documents, faces excluded.
   - Use once on the homepage How it works/product section.

If the assets are absent:

- Do not generate substitutes.
- Do not use stock placeholders.
- Complete the layout with a clearly documented missing-asset report.
- Keep the component ready to accept the files later.

Image processing:

- Preserve the original source outside the public build if the repository already has an asset-source convention.
- Generate AVIF and WebP through the existing image pipeline or Next.js Image.
- Use responsive `sizes`.
- Do not upscale.
- Keep rendered image transfer below approximately 250 KB where quality permits.
- Use correct width and height to prevent CLS.
- No text over an image.
- No coloured overlay or gradient.
- No looping animation.
- Use meaningful alt text.

Recommended alt text:

- `An open doorway overlooking Dhaka's business district`
- `An organised business-formation document workspace`
- `Professionals reviewing a business compliance checklist`

---

# 5. Header and footer

## Desktop header

Keep:

- Logo
- Start
- Services
- Pricing
- Resources
- Language
- Sign in
- Primary button: Start now

Rules:

- Maximum inner width: 1180 pixels.
- Height: 72 pixels.
- Sticky only if the existing implementation is stable and does not shift content.
- White or warm-off-white background.
- One subtle bottom border.
- No oversized button.

## Mobile header

- Height: 64 pixels.
- Logo left.
- Language and menu right.
- Start now appears inside the accessible drawer.
- No wrapping, clipping or two-row header.
- Drawer closes after navigation and on Escape.
- Focus is trapped while open and returned to the trigger on close.

## Footer

Keep international countries only as small text links:

- United States
- United Kingdom
- United Arab Emirates
- Saudi Arabia
- Qatar
- Singapore

Footer groups:

- Bangladesh
- International
- Company
- Legal
- Contact

Do not add flags, cards, descriptions or prices.

---

# 6. Homepage redesign

Reduce the homepage to five major sections:

1. Hero
2. Bangladesh packages
3. How it works
4. Workspace/product proof
5. FAQ plus final CTA

Remove the separate `Support for existing businesses` section because the package tabs already cover existing businesses. Move detailed provider-model explanations to Partners and How it works.

## Section 1: Hero

Use a balanced two-column layout on desktop.

Left column:

**Eyebrow**  
`BUSINESS FORMATION & COMPLIANCE IN BANGLADESH`

**H1**  
`Start and run your business in Bangladesh.`

**Supporting text**  
`Company formation, licences, tax and ongoing compliance—coordinated through one clear process.`

**Primary button**  
`Start now`

**Trust line**  
`Free assessment · Itemised quote · No obligation`

**Operator line**  
`Operated by bdoor compliance ltd.`

Right column:

- Use `open-door-dhaka.webp`.
- Image fills the column without distortion.
- Aspect ratio around 4:5 on desktop crop.
- Border radius: 12 pixels.
- No card border, shadow, overlay or text.
- Use a right-biased `object-position` so the open doorway remains visible.

Hero measurements:

- Maximum width: 1180 pixels.
- Desktop minimum/maximum height: 520–580 pixels.
- Desktop gap: 64 pixels.
- Copy width: approximately 620 pixels.
- Image width: approximately 440 pixels.
- Mobile: copy first, image second.
- Mobile image height: 260–320 pixels.
- Mobile hero uses natural height; never `100vh`.

## Section 2: Bangladesh packages

Keep New business and Existing business tabs.

New business:

- Solo Start
- Limited Company
- Complete Launch

Existing business:

- Compliance Check
- Annual Compliance
- Managed Finance & Compliance

Each package card shows only:

- Name
- One-sentence audience description
- bdoor fee
- Three inclusions maximum
- Start assessment

Move full inclusions, exclusions and fee explanations to Pricing.

Desktop: three columns.  
Tablet/mobile: one column.  
Do not place an image in this section.

## Section 3: How it works

Use a split layout.

Left:

1. Tell us what you need
2. Receive specialist review
3. Accept an itemised quote
4. Track your case and compliance

Right:

- Use `compliance-review.webp`.
- No text overlay.
- Maintain realistic crop.
- Maximum image height: 440 pixels.

Do not use four large cards. Use one numbered vertical list with subtle dividers.

## Section 4: Workspace proof

Use the existing real workspace-preview component.

Show only:

- Current milestone
- Required action
- Quote/payment status
- Next compliance date

Mark it `Product preview — sample data`.

Do not render more than four panels. Do not animate fake progress. Do not imply a sample company is a real customer.

## Section 5: FAQ and final CTA

Show four Bangladesh questions with accessible disclosure controls.

Final CTA:

**Heading:** `Ready to start?`  
**Text:** `Answer a few questions and receive an itemised quote before you commit.`  
**Button:** `Start now`

---

# 7. Start flow fixes

## Preserve correct route order

Stage 1:

> Where do you want to start or manage a business?

- Bangladesh
- Outside Bangladesh

If Outside Bangladesh, the immediate next screen must remain:

> Which country?

- United States
- United Kingdom
- United Arab Emirates
- Saudi Arabia
- Qatar
- Singapore

If Bangladesh, the immediate next screen must remain:

> What do you want to do in Bangladesh?

- Start a new business
- Manage an existing business

Do not reorder these screens.

## Replace misleading progress

Every visible question screen must map to a real step.

Use:

- `Step 1 of 6 · Location`
- `Step 2 of 6 · Country` for international, or `Business stage` for Bangladesh
- `Step 3 of 6 · Structure`
- `Step 4 of 6 · Support`
- `Step 5 of 6 · Business details`
- `Step 6 of 6 · Contact and review`

Update:

- Visible label
- Progressbar `aria-valuenow`
- `aria-valuemax`
- Accessible name
- Progress width

When a deep link preselects a country/package, calculate the first unanswered step correctly.

## Remove blocking saves

Current transitions take about six seconds because navigation appears to wait for persistence.

Required architecture:

1. Validate current answer locally.
2. Update local reducer/form state.
3. Change screen immediately.
4. Save local draft synchronously to safe browser storage.
5. Background-save to Supabase with debounce when a valid draft/application ID exists.
6. Retry transient background errors without blocking navigation.

Rules:

- Continue should feel immediate, target under 150 ms for local navigation.
- Do not show `Saving…` on ordinary Next/Back navigation.
- Show a small non-blocking `Saved`/`Saving` state near Save and exit only when meaningful.
- If background saving fails, retain local answers and show `Changes saved on this device. We will retry.`
- Back never performs a blocking network call.
- Changing an upstream answer clears incompatible downstream answers.
- Refresh retains the local draft.

## Save and exit

Before contact/email is known:

- Save locally only.
- Label: `Save on this device and exit` or hide the action if the promise cannot be met.

After verified email/account exists:

- Save server-side.
- Explain how to resume.

Do not promise cross-device resume without authentication or a secure emailed link.

## Deep links

Verify:

- `/en/start?country=usa`
- `/en/start?country=uk`
- `/en/start?country=uae`
- `/en/start?country=saudi-arabia`
- `/en/start?country=qatar`
- `/en/start?country=singapore`
- English/Bangla equivalents
- Every package query parameter

When preselected, show a persistent context row:

- `Starting in United States` + Change
- `Selected package: Limited Company` + Change

Never silently skip context.

## Submission

- No login required before initial submission.
- No passport/NID/proof-of-address upload.
- Generate one unique application reference.
- Create one real Supabase application record.
- Prevent double submission.
- Show confirmation immediately.
- Send acknowledgement email.
- Notify internal operations.
- Offer account creation/magic-link access after submission.

---

# 8. Services page

Keep the Services page Bangladesh-only.

Replace eight equal large cards with compact service rows grouped under:

1. Start a business
2. Licences and registrations
3. Tax and accounting
4. Company changes and compliance
5. Foreign investment and specialist support

Each row may show:

- Service name
- Short description
- bdoor fee or `Quoted after review`
- Estimated time only when source-verified
- View details
- Start

Hide Travel agency registration if it is not ready to accept a real application. Do not show Coming soon.

Use `formation-documents.webp` once near the page introduction or fee explanation. Do not place an image behind service rows.

---

# 9. Pricing page

Keep six Bangladesh packages.

Order:

1. Heading and one short paragraph
2. New/Existing tabs
3. Three package cards
4. One itemised-quote example
5. Standalone services table
6. FAQ and Start CTA

Move all repeated fee-layer prose into one disclosure:

> How your quote is calculated

Continue separating:

- bdoor professional fee
- government fee
- partner professional fee
- third-party cost
- tax

Do not use `formation-documents.webp` on both Services and Pricing. Use it on one page only.

---

# 10. Bangladesh and international pages

## Bangladesh

Expand `/countries/bangladesh` so it contains more useful information than every international page.

Include:

- New-business routes
- Existing-business support
- Six packages
- Service categories
- Foreign-founder entry point
- Quote structure
- Start CTA

## International

Keep individual routes accessible through footer links and search engines.

Reduce each page to:

1. Route summary
2. What may be included
3. Starting estimate and exclusions
4. Basic documents/eligibility
5. Ongoing obligations
6. Start CTA

Use one provider disclosure and one legal disclaimer per page. Remove repeated warnings.

Use `appointed local provider` unless a current licence has actually been verified and recorded. Do not say `licensed local provider` based only on marketing assumptions.

No international pages in the primary navigation or homepage body.

---

# 11. Resources, partners and contact

## Resources

Keep the design simple. Add data/CMS capability for Bangladesh guides, but do not invent regulatory content.

Priority future guides:

- Company formation checklist
- Proprietorship vs limited company
- Trade-licence guide
- TIN and BIN/VAT guide
- RJSC annual compliance
- Foreign-owned company sequence
- Import/export registration

Every regulatory article requires:

- Last-reviewed date
- Source ledger reference
- Reviewer field
- English/Bangla status

## Partners

Clarify:

- bdoor coordinates the customer and case.
- Appointed providers perform regulated/professional work.
- Provider identity, scope and fees are disclosed before engagement.
- Provider access is case-specific and customer-consent-specific.

Partner registration must never grant automatic portal access.

## Contact

Keep `hello@bdoor.io`.

Add telephone/WhatsApp only when real values are supplied through configuration. Do not invent them.

Contact form must have:

- Server validation
- Honeypot
- Rate limiting
- Consent
- Clear success/error state
- Internal notification
- Database status record

---

# 12. Complete policy suite and legal launch gate

Read `policies/README.md` and `policies/BDoor_Legal_Policy_Content_Pack_EN_2026-08-29.md` completely before changing a legal route.

Implement all supplied policy content in the Vercel preview:

- Terms of Service
- Privacy Policy
- Refund and Cancellation Policy
- AML, KYC and Sanctions Policy
- Cookie Policy
- Legal and Professional Services Disclaimer
- Complaints Policy
- Acceptable Use Policy
- Third-Party Professional and Provider Disclosure
- Electronic Communications and Consent Policy

Create a clean `/[locale]/legal` policy index. Replace the current repeated placeholder text with the supplied substantive draft for each route. The pages must show `Draft version 0.9 — professional approval required`, use `noindex`, and must not be presented as operative final legal advice.

The supplied copy is owner-requested working content. Cursor may fix formatting and connect it to the application, but must not invent or silently change legal meaning. Do not add an address, registration number, liability cap, officer name, provider, regulator approval or government relationship.

Implement a server-controlled flag such as:

`LEGAL_LAUNCH_APPROVED=false`

When false, allow:

- Browsing
- Free non-binding application
- Contact information
- Non-sensitive business information
- Manual specialist review
- Non-binding estimate

When false, block:

- Payment
- Binding quote acceptance
- KYC/AML processing
- Passport/NID upload
- Proof-of-address upload
- Provider engagement
- Paid case commencement

The flag must be enforced server-side. A client-side change must never enable blocked actions.

Before an authorised owner changes the flag to true:

- Bangladesh counsel must approve the Terms, refund, consumer and disclaimer wording.
- A privacy reviewer must approve data flows, retention, cookies, subprocessors and the Personal Data Protection Act, 2026 mapping.
- An AML/compliance reviewer must confirm bdoor's classification and operating procedure under the Money Laundering Prevention Act and BFIU guidance.
- The approved English and Bangla versions must carry an effective date and immutable version.

When approved policies are published:

- Store policy version and effective date.
- Record the accepted version and timestamp.
- Store the locale and immutable content hash/document reference.
- Keep Terms, Privacy acknowledgement, marketing, cookies and provider document-sharing consent separate.
- Enable relevant actions only after explicit acceptance.

Until the Bangla text is professionally translated and reviewed, a Bangla legal route must show the complete English draft with a clear Bangla translation-review notice. Do not publish an abbreviated Bangla summary or an automatic translation as the full policy.

---

# 13. Supabase and security

Inspect current migrations and RLS before changes.

Requirements:

- Additive migrations.
- RLS for every exposed table.
- Anonymous application creation only through validated server paths.
- Users cannot read another applicant's data.
- Submitted applications cannot be freely overwritten by the browser.
- Provider access remains assigned-case-only.
- Admin actions are audited.
- Storage is private.
- Service-role key stays server-only.
- PII is not included in analytics, URLs or logs.
- No sensitive values in repository or Vercel preview output.

Do not perform a Supabase write for every answer if it slows navigation.

---

# 14. Premium visual system

## Colours

- Warm canvas: `#FBFAF7`
- White: `#FFFFFF`
- Midnight navy: `#081633`
- Secondary text: `#5F6B7A`
- Cobalt: `#164EEB`
- Cobalt hover: `#103FC4`
- Border: `#DDE3EA`
- Success: `#14805E`
- Warning: `#A56A00`
- Error: `#B42318`

Keep rickshaw colours inside the approved logo and very small accents only.

## Typography

Continue Manrope.

- H1 desktop: 56–64 pixels, line-height 1.04, weight 650.
- H1 mobile: 40–46 pixels.
- H2 desktop: 38–44 pixels.
- H2 mobile: 30–34 pixels.
- Body lead: 18–20 pixels.
- Body: 16 pixels, line-height 1.6.
- Reading width: 65 characters maximum.

## Layout

- Global max width: 1180 pixels.
- Section spacing desktop: 96–112 pixels.
- Section spacing mobile: 64–80 pixels.
- Card radius: 12 pixels.
- Button radius: 8 pixels.
- Minimal shadow.
- No more than three cards in one row.
- Use typography and dividers instead of card containers where possible.

## Motion

- 160–220 ms.
- Opacity/transform only.
- Respect `prefers-reduced-motion`.
- No parallax or auto-playing carousel.

---

# 15. Responsive and accessibility tests

Test:

- 320
- 360
- 390
- 768
- 1024
- 1280
- 1440 pixels

Requirements:

- No horizontal overflow.
- No fixed hero height on mobile.
- No clipped logo, heading, button or form control.
- 44×44-pixel tap targets.
- Visible keyboard focus.
- Proper labels and error messages.
- Accessible progress values.
- Accessible tabs and disclosures.
- WCAG 2.2 AA colour contrast.
- English and Bangla both pass.
- Tables become labelled stacked rows on small screens.

---

# 16. Required tests

## Unit tests

- Branch routing
- Progress calculation
- Deep-link selection
- Local draft reducer
- Clearing incompatible downstream answers
- Legal launch flag
- Policy route and status manifest
- Policy content hash/version generation
- Currency formatting
- Locale copy presence

## Integration tests

- Local draft persists on refresh
- Background save does not block navigation
- One submission creates one application
- Duplicate submission is prevented
- RLS prevents cross-user access
- Provider cannot access an unassigned case
- Legal gate blocks payment/KYC/upload
- Every policy route renders substantive content and the correct draft/approved status
- Draft policies are `noindex`; approved policies use canonical and locale metadata
- Terms, cookie, marketing and provider-sharing consents are stored separately
- Acknowledgement/notification failure does not lose an application

## End-to-end tests

1. English → Bangladesh → New business → Limited Company → submit.
2. Bangla → Bangladesh → Existing business → Annual Compliance → submit.
3. Outside Bangladesh → USA → New company → submit.
4. Outside Bangladesh → UK → New company → submit.
5. Legal index → open every policy → verify title, version, contact, table of contents and mobile layout.
6. Attempt payment/KYC with draft policies → server denies the action even after client-side flag tampering.
7. Approve a test policy version → acceptance record stores version, locale, timestamp and immutable content reference.
8. Outside Bangladesh → UAE → Formation/visa support → submit.
9. Outside Bangladesh → Saudi Arabia → eligibility route → submit.
10. Outside Bangladesh → Qatar → new company → submit.
11. Outside Bangladesh → Singapore → new company → submit.
12. Every country deep link shows selected-country context.
13. Back and refresh retain answers.
14. Progress updates correctly.
15. Legal gate prevents sensitive actions.
16. Header, mobile drawer, language switch and footer work.
17. No dead links or Coming soon buttons.

Visual regression at 360, 768 and 1440 for:

- Homepage
- Services
- Pricing
- Start step 1
- International country selector
- Bangladesh next step
- One international country page
- Login

---

# 17. Performance requirements

- Mobile Lighthouse Performance ≥ 90.
- Accessibility ≥ 95.
- Best Practices ≥ 95.
- SEO ≥ 95.
- LCP under 2.5 seconds.
- CLS under 0.1.
- No image without dimensions.
- No unnecessary animation dependency.
- No client-side fetch waterfall for static homepage content.
- Use Next.js Image correctly.

Analytics must not include PII.

Track only:

- Start clicked
- Market scope selected
- Country selected
- Step completed
- Application submitted
- Application error

---

# 18. Definition of done

All must be true:

- Homepage is Bangladesh-only except footer country links.
- Header has no Countries/International item.
- Homepage has five major sections.
- Hero uses the approved open-door image without overlay text.
- Hero has no empty right-hand area.
- Only two photographs appear on the homepage.
- Formation-documents image is used on Services or Pricing, not the homepage.
- Outside Bangladesh immediately opens the country selector.
- Bangladesh immediately opens New/Existing business choice.
- Step progress is accurate.
- Continue/Back do not wait for Supabase.
- All country/package deep links show context.
- Application submission works without prior login.
- No identity documents are requested in the free application.
- Free applications create real Supabase records.
- Legal launch gate blocks payment/KYC/uploads.
- Bangladesh content is richer than international content.
- No public Coming soon service appears.
- English and Bangla work at every tested width.
- No fabricated claim or contact detail exists.
- Build, lint, types, tests and end-to-end checks pass.
- Vercel preview works with no application console errors.
- Production is untouched pending owner approval.

---

# 19. Cursor execution sequence

1. Read this file and inspect `@Codebase`.
2. Inspect package scripts, framework version, app routing, Supabase clients, migrations, RLS and test setup.
3. Check git status and preserve unrelated user work.
4. Create `feat/bdoor-premium-production-fix`.
5. Add regression tests for the correct location/country order.
6. Fix progress and non-blocking persistence first.
7. Add/verify submission reliability and legal gate.
8. Implement the new homepage layout and image components.
9. Simplify Services and Pricing.
10. Expand Bangladesh and reduce international page repetition.
11. Verify English/Bangla parity.
12. Run responsive/accessibility/performance tests.
13. Run lint, types, unit, integration, E2E and production build.
14. Create a Vercel preview only if the project is already linked and preview credentials are safely configured.
15. Return:
    - Changed files
    - Database migrations
    - Environment variables required
    - Test results
    - Lighthouse results
    - Preview URL
    - Missing owner inputs
    - Known limitations
16. Stop and wait for approval. Do not deploy production.

---

# Final Cursor instruction

This is a production-quality correction, not another concept redesign. Preserve the latest working Bangladesh/outside-Bangladesh and outside-country order. Concentrate on speed, truthful progress, premium composition, correct image use, Bangladesh content depth, legal safety and reliable application submission. Do not hide problems behind mockups or decorative UI. Every visible action must work.
