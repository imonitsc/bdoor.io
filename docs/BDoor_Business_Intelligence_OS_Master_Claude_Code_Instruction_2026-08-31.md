# bdoor Business Intelligence OS
## Master Claude Code Product, Engineering and Fundability Instruction

**Product:** bdoor  
**Company:** bdoor compliance ltd.  
**Primary market:** Bangladesh  
**Instruction date:** 31 August 2026  
**Execution target:** Claude Code working inside the existing `imonitsc/bdoor.io` repository  
**Deployment policy:** Vercel preview only until founder approval

---

## 1. Mission

Transform bdoor from a business-formation website with an AI chat feature into **Bangladesh's Business Intelligence OS**: one AI-led platform that helps a person understand, start, operate, tax, fund, import, export and maintain a business through verified information and executable workflows.

This must become a defensible technology company capable of raising institutional funding. It must not remain a content website, generic chatbot, lead-generation agency or collection of static service pages.

The product promise is:

> **Ask any Bangladesh business question. Get a verified answer, personalised requirements and the next action in one place.**

The system must combine:

1. Authoritative Bangladesh regulatory intelligence.
2. Multi-model AI reasoning.
3. A structured profile for each business through a private bdoor ID.
4. Deterministic formation, tax, VAT, licence and compliance workflows.
5. Secure customer, provider and administrator workspaces.
6. Human review by qualified external professionals when required.
7. Measurable recurring revenue, usage and operational data.

Do not claim that any design or feature makes bdoor a billion-dollar company. Build the product, data moat, reliability, retention and revenue instrumentation that would allow investors to evaluate that possibility.

---

## 2. Mandatory starting procedure

Before editing:

1. Read this instruction completely.
2. Inspect the entire repository, package manager, framework version, lockfile and all repository instruction files.
3. Inspect the current production website, current Vercel deployment, current Supabase schema and applied migrations.
4. Read the current installed AI SDK documentation from `node_modules/ai/docs/` and source from `node_modules/ai/src/`. Do not implement from memory.
5. Check the current Vercel AI Gateway documentation and retrieve currently available model IDs. Do not guess or hardcode obsolete model IDs.
6. Check the current Supabase changelog for relevant breaking changes before database work.
7. Record the current production baseline for latency, retrieval, citations, accessibility and responsive behaviour.
8. Create branch `feat/bdoor-business-intelligence-os` from the latest approved base branch.
9. Preserve all working authentication, customer cases, provider assignments, policies, country routes and existing production data.
10. Use additive, reversible migrations. Never rewrite or delete production history.

The live `/en/ask` page already has a compact AI-first interface. Preserve its successful direction. At the latest verified baseline, a company-registration question took roughly 25 seconds and retrieved only the internal bdoor package catalogue instead of official RJSC guidance. Treat that as a launch-blocking knowledge and latency defect.

Do not deploy to production. Produce a tested Vercel preview and an implementation report.

---

## 3. Non-negotiable product principles

### 3.1 One bdoor AI

Customers must interact with one identity: **bdoor AI**. Do not expose a Claude/GPT/Gemini selector in the normal interface. Model providers are replaceable infrastructure, not the product.

### 3.2 Bangladesh first

Bangladesh must account for at least 80% of public product emphasis, default examples and initial knowledge coverage. International company formation may remain available through the existing Outside Bangladesh branch and footer routes, but it must not dominate the homepage or primary AI experience.

### 3.3 Evidence before language

Regulatory answers must be generated from retrieved, current, approved evidence. A fluent answer without sufficient evidence is a failed answer.

### 3.4 Action after answer

An answer should lead to a useful next action: create a checklist, calculate a fee, save an obligation, compare entity types, start an application or request specialist review.

### 3.5 Human review where required

bdoor is not a government authority, law firm, audit firm, bank, insurer or licensed tax/immigration practice. Regulated work must be handled by separately engaged, appropriately qualified and authorised professionals. Hiring a lawyer as an employee does not automatically convert bdoor into a law firm or authorise every regulated activity.

### 3.6 Trust through precision

Never invent fees, deadlines, processing times, tax rates, licence requirements, authorities, legal provisions or document lists. Clearly label official requirements, observed timelines, bdoor fees, third-party fees and estimates.

### 3.7 Mobile first and genuinely fast

The complete product must work at 320px width and on slow Bangladesh mobile connections. No critical interaction may wait for a database write before updating the screen.

---

## 4. Core product: one Business Intelligence OS

Build one connected system with the following surfaces.

### 4.1 Ask bdoor AI

The universal entry point for questions about:

- Starting a company, proprietorship, partnership or other supported entity.
- Company ownership, directors, shareholders, authorised capital and paid-up capital.
- RJSC name clearance, registration, forms, returns and changes.
- Trade licences and local authority requirements.
- Income tax, withholding tax, e-TIN, returns and tax calendars.
- VAT/BIN, VAT rates, returns, exemptions, SROs and general orders.
- Investment approvals, foreign investment, capital injection and repatriation.
- Startup funding, investor readiness and due diligence.
- Import/export registration, IRC/ERC, customs, tariffs, HS codes and bonded facilities.
- Ports, shipping, freight, clearing and forwarding.
- Bangladesh Bank foreign-exchange rules and trade payments.
- Travel-agency, tour-operator, tour-guide, hotel, aviation and sector-specific licensing.
- Labour, factory, fire, environment, food, BSTI and industry approvals.
- Annual compliance and regulatory change.

### 4.2 bdoor ID

Create a stable private identifier for every verified Bangladesh business profile, including companies and proprietorships.

The bdoor ID may organise:

- Legal name and trading names.
- Entity type and registration identifiers.
- RJSC or trade-licence information.
- TIN, BIN/VAT and relevant tax status.
- Registered and operating addresses.
- Directors, shareholders or proprietor, subject to lawful access and consent.
- Licences and expiry dates.
- Filing obligations and compliance status.
- Industry and business activities.
- Import/export and investment registrations.
- Submitted and verified documents.
- Provider assignments and case history.

The bdoor ID is a private bdoor platform identifier. It must never be described as a government identifier, D-U-N-S number, official credit rating, guarantee of legitimacy or replacement for an authority-issued registration. Do not copy proprietary third-party scoring methodologies or protected datasets.

Public verification must be opt-in, narrowly scoped and privacy reviewed. Private tax, VAT, ownership, financial and customer information must never be exposed publicly by default.

### 4.3 Business roadmap

After a short adaptive assessment, generate a personalised roadmap containing:

- Suitable entity options and their trade-offs.
- Required registrations and licences.
- Document checklist.
- Government authorities.
- Official, professional and third-party fees shown separately.
- Dependencies and correct sequence.
- Estimated time with evidence type.
- Tax/VAT obligations.
- Renewal and annual compliance calendar.
- Risks, missing facts and questions requiring professional review.
- Actions that bdoor can coordinate.

### 4.4 Compliance workspace

Signed-in customers must be able to:

- See every business linked to their account.
- View bdoor ID and verified profile fields.
- Track formation and service cases.
- Upload and retrieve documents securely.
- See licence and filing deadlines.
- Receive change and expiry alerts.
- Ask AI with their business context after explicit consent.
- Create tasks from an AI answer.
- Request provider review.
- Review quotations, deliverables, payments and audit history.

### 4.5 Deterministic calculators

Create rule-based calculators for matters such as:

- RJSC fee components.
- Authorised-capital scenarios.
- Service package estimates.
- Tax/VAT filing calendars.
- Licence-renewal dates.
- Import/customs estimates when authoritative inputs are available.

Do not use an LLM as the calculator. Store versioned formulas, thresholds, source provisions, effective dates and test fixtures. The AI may explain a calculation but must not silently create the number.

### 4.6 Managed fulfilment network

Answers may create service cases for bdoor operations and approved external providers. Supported provider types should include:

- Advocates and partner law firms.
- Chartered accountants and audit firms.
- Tax and VAT practitioners.
- Company/RJSC and corporate-secretarial specialists.
- Investment and BIDA specialists.
- Customs, C&F, shipping and import/export specialists.
- Foreign-country formation and tax partners.
- Travel-agency and tourism licensing specialists.
- Sector-specific licence consultants.

Every provider engagement must be separately attributable, permissioned and auditable.

---

## 5. Public product experience

### 5.1 Homepage

Keep the homepage simple, premium and Bangladesh-first. It should communicate a technology platform, not an agency catalogue.

Above the fold include only:

- bdoor logo and minimal navigation.
- Clear headline: **Bangladesh business intelligence, from first question to next action.**
- Supporting line explaining formation, tax, licences, investment and compliance.
- A large working Ask bdoor AI composer.
- Four concise prompt starters: Start a business; Find licences; Understand tax and VAT; Prepare for investment.
- One secondary Start now action.
- A restrained trust line: answers cite current official sources and escalate uncertainty.

Do not show a seven-country grid, giant service catalogue, generic AI portrait, fake statistics, fake reviews, fake partner logos, decorative dashboards or repeated CTA sections.

Below the fold use no more than five concise sections:

1. What bdoor AI can solve.
2. How an answer becomes a roadmap and case.
3. bdoor ID and compliance workspace.
4. Verified provider review.
5. Final Ask/Start action.

Keep international country links in the footer and the Outside Bangladesh application branch.

### 5.2 Ask interface

The Ask page must feel like a serious AI product:

- Composer visible in the first viewport.
- Streaming responses.
- Bangla and English.
- Voice input when browser support exists, with typed fallback.
- Conversation history for signed-in users.
- Temporary local conversation for guests.
- Inline citation markers attached to claims.
- Expandable source cards with authority, title, date, effective status and official link.
- Clear separation between official information, bdoor service pricing and professional opinion.
- Suggested follow-up questions derived from the answer.
- Contextual actions such as Build my checklist or Start this process.
- Delete conversation control that actually deletes persisted data after confirmation.

Do not use verbose introductory copy, a large marketing footer or empty vertical space inside the AI route.

### 5.3 Responsive behaviour

Verify at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 and 2560px.

Requirements:

- No horizontal overflow.
- Mobile composer remains usable when the software keyboard is open.
- Minimum 44px touch targets.
- Citations open in an accessible bottom sheet on mobile and panel/popover on desktop.
- Tables become labelled cards or horizontal scrollers with clear affordance.
- Navigation collapses without hiding Ask or Start.
- Long Bangla text wraps correctly.
- Safe-area insets work on iOS.
- Focus never becomes trapped.
- Reduced-motion preference is respected.

### 5.4 Visual system

Preserve the lowercase bdoor identity and current approved brand colours. Use:

- White and very light neutral backgrounds.
- Deep navy text.
- Restrained bdoor blue as the primary action colour.
- Existing multicolour mark only where brand recognition matters.
- One modern sans-serif system with excellent Bangla fallback.
- Generous whitespace, subtle borders and restrained elevation.
- Short copy and functional components.

Do not use excessive gradients, glass effects, floating 3D icons, carousel sections, animated counters or decorative complexity. Premium means precise, calm, fast and trustworthy.

---

## 6. Multi-model AI architecture

Use the current Vercel AI SDK and Vercel AI Gateway. Follow the installed SDK documentation, not remembered APIs.

### 6.1 Model roles

Implement configurable roles rather than hardcoding one provider:

- **Router:** fast intent classification, language detection and retrieval plan.
- **Answer model:** ordinary evidence-grounded responses.
- **Expert model:** complex regulatory, tax, investment or cross-domain reasoning.
- **Verifier model:** independently checks high-risk answers against cited evidence.
- **Vision model:** reads uploaded forms, notices, licences, tables and scanned Bangla/English documents.
- **Embedding model:** direct supported embeddings provider for knowledge indexing.
- **Reranker:** improves retrieval ordering when needed.

At runtime retrieve available gateway models and map approved models to these roles through administrator configuration. Initially support providers from at least OpenAI, Anthropic and Google with automatic fallback. Do not display provider names to customers.

Add a clean provider adapter for a future self-hosted open-source model through vLLM or another OpenAI-compatible endpoint. A local model must not become a launch dependency and must pass the same evaluation before receiving customer traffic.

### 6.2 Routing policy

Do not ask several premium models to answer every question.

- Use the fast model for classification and low-risk, fully supported questions.
- Use the expert model for complex/high-stakes topics.
- Use the verifier only for legal, tax, VAT, customs, investment, foreign-exchange, licensing and other high-risk answers.
- Fail over when the primary provider times out or is unavailable.
- Never silently weaken citation requirements during fallback.
- Tag calls by environment, feature, user tier, risk class and model role.
- Store latency, tokens, cost, result status and failover path without exposing sensitive prompt content unnecessarily.

### 6.3 Evidence-first generation

The answer model may only receive retrieved passages that passed source, date, jurisdiction and publication-status filters. The prompt must require claim-level citations.

High-risk answer flow:

1. Classify intent, language, jurisdiction and risk.
2. Extract missing facts.
3. Retrieve evidence.
4. Apply deterministic rules/calculators.
5. Draft answer.
6. Verify claims against evidence using a separate configured model.
7. Remove or qualify unsupported claims.
8. Stream final answer and actions.
9. Persist asynchronously.

If current evidence is insufficient, say what cannot be verified and show the best official place or specialist path. Do not fill gaps from model memory.

### 6.4 Tool permissions

AI tools may read approved public knowledge without additional permission. Access to a signed-in customer's business profile, documents, payments or cases requires authentication, ownership checks and explicit contextual consent.

The AI may prepare a draft checklist or application. It must not submit government forms, send messages, engage a provider, reveal private business data, upload documents, create payment obligations or make irreversible changes without a clear confirmation step.

---

## 7. Bangladesh regulatory knowledge graph

### 7.1 Initial authority coverage

Create and maintain a registry for at least:

- Bangladesh Laws / official statutes and gazettes.
- Registrar of Joint Stock Companies and Firms.
- National Board of Revenue: income tax, VAT and customs.
- Bangladesh Bank and BFIU.
- BIDA / Invest Bangladesh and OSS.
- BEZA, BEPZA, BHTPA and BSCIC.
- Ministry of Commerce and Chief Controller of Imports and Exports.
- Bangladesh Customs and Bangladesh Single Window.
- Chattogram, Mongla, Payra and relevant land-port authorities.
- Ministry of Civil Aviation and Tourism.
- Bangladesh Tourism Board and travel-agency/tour-operator registration systems.
- Local Government Division and city-corporation trade-licence sources.
- Department of Environment.
- Fire Service and Civil Defence.
- Department of Inspection for Factories and Establishments.
- Ministry of Labour and Employment.
- BSTI, Bangladesh Food Safety Authority and sector regulators.
- Election, telecom, health, education, energy and other authorities only as relevant business modules are approved.

### 7.2 Source lifecycle

Use this lifecycle:

`discovered → fetched → integrity_checked → parsed/OCR → classified → compared → expert_reviewed → published → superseded/withdrawn/quarantined`

Every source version must retain:

- Authority and official domain.
- Canonical URL.
- Title and document type.
- Gazette/SRO/circular/form number where applicable.
- Publication date.
- Effective date and expiry/repeal date.
- Jurisdiction and industry.
- Language.
- Content hash and snapshot.
- Retrieval time and HTTP metadata.
- Review status, reviewer and review time.
- Superseding and superseded relationships.
- Extraction quality and OCR confidence.
- Integrity warnings.

Never overwrite an old legal version. Preserve a complete change history.

### 7.3 Source security and integrity

Government sites can be outdated, inconsistent or compromised. Do not equate a government-looking domain with trustworthy current content.

Implement:

- Domain allowlist plus page-level integrity checks.
- Unexpected-language, gambling, malware, redirect and content-drift detection.
- File-type and MIME validation.
- Malware scanning for downloads.
- Hash-based change detection.
- Quarantine instead of automatic publication when anomalies occur.
- Manual review for high-impact changes.
- Alert when an authority page disappears or materially changes.

The Bangladesh Trade Portal root has recently surfaced unrelated gambling content in search results. Do not ingest it automatically until the specific source page and content integrity are independently verified.

### 7.4 Parsing and indexing

Support:

- HTML, searchable PDFs, scanned PDFs, Word and spreadsheet source documents.
- Bangla and English OCR.
- Page, section, schedule, table and footnote preservation.
- Structure-aware chunking rather than fixed-size arbitrary fragments.
- Bangla normalisation and bilingual terminology aliases.
- Exact reference matching for Act, Rule, SRO, section, form and authority names.
- pgvector semantic retrieval plus Postgres full-text search.
- Metadata filtering by effective date, authority, jurisdiction, entity type and industry.
- Reranking with authority, recency, specificity and review status.

### 7.5 Answer citation contract

Every material regulatory claim must link to the exact supporting source. A Sources section alone is insufficient.

Source cards must show:

- Official authority.
- Document/page title.
- Relevant provision or section when available.
- Publication/effective date.
- Last checked date.
- Current/superseded status.
- Official external link.

Do not cite bdoor pricing as evidence for government procedure. Show bdoor service information in a separate clearly labelled block.

---

## 8. Required knowledge domains and workflows

### 8.1 Formation and entity management

Cover local and foreign founders, proprietorships, partnerships, private companies, public companies and other legally supportable entities. Include name clearance, MOA/AOA, directors, shareholders, registered office, capital, prescribed forms, incorporation, post-incorporation, changes, annual returns and closure.

### 8.2 Tax and VAT

Cover business/proprietor/company TIN, income tax, minimum tax where applicable, withholding, tax deduction/collection, VAT/BIN, turnover tax where applicable, VAT rates, exemptions, returns, source-tax certificates, record keeping, audits and appeals at an informational level.

Build obligation calendars from versioned rules. Never present a tax position as personalised professional advice without qualified review.

### 8.3 Investment and fundraising

Cover domestic and foreign investment registration, share issuance, valuation records, board/shareholder approvals, foreign-remittance evidence, Bangladesh Bank/BIDA considerations, dividend/repatriation pathways, investor due diligence and data-room readiness.

Create an Investor Readiness workspace containing:

- Corporate records checklist.
- Capitalisation table.
- Founder and share records.
- KPI definitions and verified metrics.
- Financial/document checklist.
- Material contracts register.
- Compliance status.
- Data-room permissions and audit log.

Do not invent that a SAFE, convertible note or foreign investment structure is valid for a particular company. Present alternatives only when supported and require professional review.

### 8.4 Import, export, customs and ports

Cover IRC/ERC, import/export policy orders, LC and payment considerations, customs declarations, HS classification evidence, tariffs, VAT/tax at import, restricted goods, certificates, bonded facilities, export incentives, freight, C&F roles and relevant port processes.

Customs calculations must be deterministic, dated and based on verified tariff inputs. Always show the HS-code assumption and warn that classification may require customs review.

### 8.5 Travel agency and tourism

Cover company/entity setup, trade licence, TIN/BIN, Ministry travel-agency registration/renewal, tour-operator and tour-guide registration, tourism rules, aviation/ticketing dependencies, hotel/restaurant licensing and separate Hajj/Umrah considerations where authoritative sources are available.

Do not confuse travel-agency registration, tour-operator registration, association membership, IATA accreditation, CAAB permissions or religious-travel approvals. Treat each as a separate requirement with its own authority and evidence.

### 8.6 Sector licensing

Build a reusable rules engine where requirements depend on:

- Entity type.
- Business activity.
- Products/services.
- Location.
- Employee count.
- Premises type.
- Local/foreign ownership.
- Import/export activity.
- Revenue/turnover thresholds.
- Regulated professional activity.

The engine must explain why each licence is required and cite the rule.

---

## 9. Supabase data architecture

Inspect and extend the existing schema instead of creating duplicates. Use descriptive names consistent with the repository.

At minimum model these concepts:

### 9.1 Identity and organisations

- users and app roles.
- organisations/businesses.
- business memberships.
- bdoor IDs and verification status.
- entity identifiers.
- addresses and activities.
- ownership/director records with private access.
- licences, registrations and expiry dates.

### 9.2 Knowledge

- authorities.
- source registry.
- source fetches and snapshots.
- source documents and versions.
- provisions/sections.
- chunks and embeddings.
- legal relationships and supersession.
- business activities and sectors.
- entity types.
- requirement rules.
- document requirements.
- fees and calculation rules.
- processing-time evidence.
- obligations and deadlines.
- review/approval records.
- ingestion events and quarantine findings.

### 9.3 AI

- conversations and messages.
- retrieval runs and selected evidence.
- answer citations.
- model-routing runs.
- provider attempts/fallbacks.
- token, latency and cost usage.
- feedback and corrections.
- evaluation datasets, runs and results.
- prompt/configuration versions.

### 9.4 Operations

- applications and cases.
- tasks and milestones.
- provider firms and individual professionals.
- provider capabilities, jurisdictions and verification.
- assignments and conflict checks.
- quotations, line items and approvals.
- documents, requests and deliverables.
- messages and notifications.
- SLA events.
- invoices/payments when legally enabled.
- complete audit events.

### 9.5 Security requirements

- Enable RLS on every exposed table.
- Do not treat `TO authenticated` as authorisation; enforce ownership, membership and assigned-case predicates.
- Keep privileged ingestion, prompts, source snapshots, model controls and operational internals in an unexposed/private schema.
- Prefer security-invoker database functions and views.
- If a security-definer function is genuinely required, keep it outside the exposed schema, revoke public execution and validate the caller internally.
- Never use user-editable metadata for authorisation.
- Never expose service-role or secret keys to clients.
- Add both `USING` and `WITH CHECK` to update policies.
- Run database/security advisors and resolve all material findings.

---

## 10. Customer, provider and admin portals

### 10.1 Customer workspace

Provide:

- Business switcher.
- bdoor ID profile.
- AI conversations and saved answers.
- Personalised roadmap.
- Compliance timeline.
- Applications/cases.
- Secure documents.
- Quotations and payments.
- Provider communications.
- Team members and permissions.
- Data export and deletion requests.

### 10.2 Provider-firm portal

External law, tax, accounting, formation, customs and other firms must receive their own organisation-scoped login.

Provide:

- Firm profile and verification.
- Team-member invitations.
- Role/capability management.
- Assigned-case inbox.
- Conflict acceptance/decline.
- SLA deadlines.
- Secure document requests.
- Notes separated into customer-visible and internal.
- Deliverable upload and approval.
- Quote/invoice submission.
- Communication history.
- Capacity and availability.
- Performance metrics and quality review.

A provider must never see another provider's cases, unrelated customer records, bdoor internal margins, AI prompts or full platform data.

### 10.3 Admin/operations portal

Create permissioned areas for:

- Executive overview.
- Customer and organisation support.
- Cases and SLA operations.
- Provider firms and professionals.
- Conflicts and assignments.
- Source registry and ingestion.
- Expert review and publishing.
- Regulatory-change alerts.
- Retrieval debugger.
- Model routing and feature flags.
- AI costs, latency and failures.
- Evaluation runs and regressions.
- Feedback/unanswered-question clusters.
- Product analytics and funnels.
- Pricing/package configuration.
- Consent/policy versions.
- Audit and security events.

High-risk controls need maker-checker approval. Source publication, model-routing changes, provider approval, refunds, data exports and role elevation must be audited.

---

## 11. Speed, reliability and cost budgets

### 11.1 Interaction targets

- Client acknowledgment after Send: under 100 ms.
- Input must clear/freeze into the conversation immediately.
- P75 first useful streamed text: under 2 seconds for cached/simple queries.
- P95 first useful streamed text: under 5 seconds.
- P95 complete ordinary answer: under 12 seconds.
- Navigation actions: under 100 ms perceived response.
- No blocking save on Continue, Back or Send.

If retrieval or verification takes longer, stream meaningful state updates and partial supported content. Never show a frozen button.

### 11.2 Technical performance

- Select the closest currently supported Vercel compute region based on measured Bangladesh latency; do not guess a region code.
- Start retrieval and safe contextual preparation concurrently.
- Persist conversation and analytics asynchronously after the response begins.
- Cache only public, non-personal, version-keyed answers and retrieval results.
- Invalidate cache when any supporting source version changes.
- Do not cache customer-specific or document-specific responses.
- Precompute embeddings and popular deterministic answers.
- Use streaming end-to-end without buffering at proxies or middleware.
- Set provider timeouts and fast model fallback.
- Cancel abandoned generations.
- Enforce input/output token budgets.

### 11.3 Frontend performance budgets

On a representative mid-range mobile profile:

- Target LCP below 2.5 seconds.
- Target INP below 200 ms.
- Target CLS below 0.1.
- Keep initial Ask route JavaScript intentionally small.
- Lazy-load admin, charts, secondary panels and document viewers.
- Avoid large client state libraries unless already justified.
- Optimise images and fonts.
- Use server components where appropriate while keeping the composer interactive.

Measure rather than claiming compliance.

### 11.4 Availability and graceful failure

- Gateway model failover.
- Retrieval timeout fallback that never invents an answer.
- Readable handling for 402, 429, provider outage and internal errors.
- Idempotency for case creation, message persistence and payments.
- Retries only for safe idempotent operations.
- Health checks for ingestion, retrieval, generation and background workers.
- Alerting for latency, error, citation and cost thresholds.

---

## 12. Privacy, security and responsible AI

Implement:

- Clear guest vs signed-in behaviour.
- Consent before using private business context in AI.
- Data minimisation.
- Encryption in transit and at rest.
- Secure private storage with short-lived signed access.
- File validation, malware scanning and size/type limits.
- Prompt-injection resistance for retrieved pages and uploaded documents.
- Separation of source text from system instructions.
- Rate limiting by IP/session/user and plan.
- Abuse, scraping and automated-extraction controls.
- CSRF, XSS, SSRF and injection protections.
- Secure headers and Content Security Policy.
- Audit logging without unnecessary secret or document content.
- Retention schedules and deletion/export workflows.
- Production/staging/dev secret and budget separation.

Never send a customer's documents, tax data or personal information to a model provider unless the feature requires it, the user consented, the privacy terms permit it and the selected provider configuration is approved.

Publish substantive legal and privacy policies only with accurate effective dates and internal versioning. Policies may be visible publicly while marked with their true review status. Do not represent an unreviewed draft as professionally approved. Keep regulated payments, KYC/document collection or professional engagements behind the applicable legal/compliance launch gates.

---

## 13. Revenue model and fundability

Build revenue instrumentation from the beginning. Do not insert fake traction or vanity metrics.

### 13.1 Product tiers

Make pricing configurable by administrators. Architect for:

- Free public AI with fair limits.
- Individual/Founder plan with saved roadmaps and compliance reminders.
- Business plan with bdoor ID, team access, business context and compliance workspace.
- Managed formation/compliance services.
- Specialist-reviewed advisory engagements through qualified providers.
- Enterprise/API access to approved non-personal regulatory intelligence.
- Provider platform fees or operational commercial arrangements where lawful and disclosed.

Do not publish new prices until approved by the founder.

### 13.2 Defensible assets

The product moat must be measurable through:

- Versioned Bangladesh regulatory knowledge graph.
- Bilingual regulatory terminology and evaluation corpus.
- Rule/calculator library.
- Source-change and supersession history.
- Real anonymised question-intent patterns.
- Verified business profiles and compliance workflows.
- Expert corrections and review history.
- Provider coverage, performance and SLA data.
- Conversion from answer to completed business action.

Do not sell or repurpose customer data without explicit lawful permission.

### 13.3 Investor metrics

Instrument and display accurate internal metrics for:

- Monthly and weekly active users.
- New and returning business users.
- Questions per active user.
- Successful-answer rate.
- Citation coverage and source freshness.
- Answer latency and model cost.
- AI-to-roadmap conversion.
- Roadmap-to-case conversion.
- Free-to-paid conversion.
- Monthly recurring revenue.
- Managed-service revenue and gross margin.
- Retention and compliance-workspace engagement.
- Customer acquisition cost by channel.
- Revenue retention and churn.
- Case completion time.
- Provider SLA and rework rate.
- Number of verified business profiles.
- Regulatory domains and provisions covered.

Create a restricted Investor Metrics view using only verified, reproducible aggregate data. Every displayed metric must have a written definition and underlying query.

### 13.4 Funding narrative implemented in the product

The product must support this truthful narrative:

> bdoor is building Bangladesh's business intelligence and compliance operating system. It converts fragmented laws, rules, circulars and authority processes into verified AI answers, structured business profiles and executable workflows, fulfilled through a permissioned network of qualified professionals.

The website must never claim funding, partnerships, customers, government integration, accuracy rates or market leadership that cannot be proven.

---

## 14. Analytics and experimentation

Track privacy-conscious product events such as:

- Ask page viewed.
- Question submitted.
- Intent/risk class.
- First-token and completion latency.
- Citation opened.
- Follow-up asked.
- Checklist created.
- Roadmap saved.
- Business profile started/completed.
- Application started/submitted.
- Specialist requested.
- Quote viewed/accepted.
- Subscription started/cancelled.

Do not place raw private question content into general analytics. Use internal pseudonymous IDs and controlled AI observability.

Add feature flags for model routes, retrieval strategies, prompts, homepage AI composer, voice input, bdoor ID and new domains. Support safe staged rollout and rollback.

---

## 15. Evaluation system

### 15.1 Golden dataset

Build an initial minimum 500-question bilingual evaluation set and design it to expand beyond 2,000 questions.

Include:

- Formation and RJSC.
- Proprietorship and trade licence.
- Tax and withholding.
- VAT/BIN.
- Local and foreign investment.
- Import/export and customs.
- Ports/logistics.
- Travel agency and tour operator.
- Labour, fire, environment, factory and sector licensing.
- Ambiguous, adversarial and out-of-scope questions.
- Superseded-rule traps.
- Bangla, English and mixed Bangla-English language.

Each test should define expected authority, required evidence, prohibited claims, date sensitivity and acceptable uncertainty.

### 15.2 Automated quality gates

Production must fail closed if:

- A regulatory claim has no supporting citation.
- A citation does not entail the claim.
- A superseded source is presented as current.
- An official fee is confused with a bdoor fee.
- The wrong authority is identified.
- The answer invents a deadline, rate or requirement.
- Bangla changes the substantive meaning.
- Private data leaks across users or organisations.
- Provider failover removes safety rules.

Targets before broad launch:

- At least 95% citation coverage for material regulatory claims.
- Zero tolerated unsupported fee/rate/deadline in the golden evaluation.
- At least 90% correct authority and applicability classification, followed by continuous improvement.
- All critical RLS and cross-tenant tests passing.
- No critical accessibility failures.
- Performance targets reported from measured preview results.

Do not manufacture a score. Preserve failed evaluations and regressions.

### 15.3 Required end-to-end questions

Test at minimum:

1. How do I register a private limited company in Bangladesh?
2. What authorised capital should my startup use and how does it affect RJSC fees?
3. What tax and VAT registrations does a proprietorship need?
4. Can a foreign investor own this Bangladesh business?
5. How do I obtain an IRC and import through Chattogram Port?
6. What is required to operate a travel agency?
7. What is the difference between a travel agency and tour operator registration?
8. What annual returns and tax filings does my company have?
9. What changes if a cited rule was amended this month?
10. Show the official source for every requirement.

---

## 16. Testing requirements

Add and run:

- Unit tests for routing, citations, rules and calculators.
- Integration tests for hybrid retrieval and source-version filters.
- Contract tests for every configured model role and fallback.
- RLS and cross-tenant isolation tests.
- Prompt-injection and malicious-document tests.
- Playwright tests for guest and signed-in AI journeys.
- Playwright tests for customer, provider and admin permissions.
- English/Bangla parity tests.
- Keyboard-only and screen-reader smoke tests.
- Responsive screenshots for critical breakpoints.
- Performance tests under representative Bangladesh mobile/network conditions.
- Load tests with strict cost limits in non-production.
- Migration tests from the current production schema.

The Send button must be tested by clicking it, not only by pressing Enter.

---

## 17. Implementation phases

Implement in reviewable pull requests or commits while keeping one coherent branch.

### Phase 0 — Audit and foundations

- Repository, live site, Supabase and Vercel audit.
- Current latency/retrieval/security baseline.
- Architecture decision records.
- Feature flags, environment separation and observability.

### Phase 1 — Reliable multi-model Ask

- Gateway model roles and fallback.
- True streaming.
- Non-blocking persistence.
- Citation UI.
- Cost/latency tracking.
- Existing Ask production bug fixes.

### Phase 2 — Bangladesh knowledge core

- Authority/source registry.
- Secure ingestion and review workflow.
- Versioned knowledge graph.
- Hybrid retrieval.
- RJSC, formation, tax/VAT foundation.
- Initial evaluation suite.

### Phase 3 — bdoor ID and business workspace

- Business profiles and verification.
- Personalised roadmap.
- Compliance obligations and reminders.
- Customer workspace and secure documents.

### Phase 4 — High-value domain expansion

- Investment/fundraising readiness.
- Import/export, customs and ports.
- Travel agency and tourism.
- Sector licensing rules engine.

### Phase 5 — Provider and operations network

- Provider-firm onboarding and verification.
- Firm/team permissions.
- Assignments, conflicts, SLA, quotes and deliverables.
- Full admin operations.

### Phase 6 — Monetisation and investor readiness

- Configurable plans and entitlements.
- Conversion flows.
- Verified KPI dashboard.
- Data-room readiness.
- Cost and gross-margin reporting.

Do not wait until every domain is complete to produce a preview. Each phase must remain behind a feature flag until its quality gate passes.

---

## 18. Deliverables

Claude Code must deliver:

1. Implemented repository changes on `feat/bdoor-business-intelligence-os`.
2. Additive Supabase migrations.
3. Updated architecture and data-flow documentation.
4. Source-governance and editorial-review policy.
5. AI routing and fallback configuration documentation.
6. Evaluation dataset and reproducible test runner.
7. Security/RLS test report.
8. Accessibility and responsive test report.
9. Performance and AI-latency report.
10. Model usage and cost report.
11. Vercel preview URL.
12. Route-by-route screenshots or test evidence.
13. Deployment/rollback plan.
14. Known limitations and unresolved legal/source gaps.

The final implementation report must state exactly what is implemented, mocked, gated, incomplete or awaiting professional review.

---

## 19. Production launch gates

Do not promote the preview to production until all applicable conditions pass:

- Founder approves the product and visual result.
- Database migrations are reviewed and backed up.
- RLS/cross-tenant tests pass.
- Official source coverage passes the defined launch domains.
- Regulatory claims meet citation and accuracy gates.
- Multi-model failover works.
- Performance targets are measured and acceptable.
- Budget/rate limits are configured.
- Policies accurately describe AI, data, providers and limitations.
- Professional legal/compliance review clears any gated payment, KYC or regulated-service functionality.
- Monitoring, incident response and rollback are ready.

---

## 20. Final Claude Code command

Use this command after placing this file in the repository root or `docs/`:

> Read `BDoor_Business_Intelligence_OS_Master_Claude_Code_Instruction_2026-08-31.md` completely. Inspect the current repository, live production site, Vercel project, installed AI SDK documentation and Supabase schema before editing. Create or switch to `feat/bdoor-business-intelligence-os`. Implement the instruction in phased, tested, feature-flagged increments. Preserve the current compact Ask bdoor AI interface and all working production data. Fix the existing latency and official-source retrieval failures first, then build the versioned Bangladesh knowledge graph, bdoor ID, business/compliance workspace, provider portal, admin intelligence system, monetisation instrumentation and evaluation gates. Use Vercel AI Gateway for dynamic multi-provider routing and failover; do not hardcode obsolete models. Use additive Supabase migrations with strict RLS. Run typecheck, lint, unit, integration, RLS, accessibility, performance and Playwright tests. Create a Vercel preview and a complete evidence-based implementation report. Do not deploy production, change production secrets, fabricate content or stop after planning.

---

## 21. Definition of success

bdoor succeeds when a Bangladesh founder can ask a real question, receive a current answer supported by exact official evidence, turn it into a personalised roadmap, create or connect a verified business profile, complete the next authorised action and continue managing compliance—quickly, securely and with qualified human review whenever AI should not act alone.

That connected data-and-workflow system is the fundable company. The chatbot is only its front door.
