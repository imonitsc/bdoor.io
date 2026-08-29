import type { LegalDocument } from './types';

/**
 * Draft legal documents from policies/BDoor_Legal_Policy_Content_Pack_EN_2026-08-29.md.
 *
 * EVERY document is a working draft (version 0.9). awaitingCounselReview stays
 * true until qualified counsel and compliance approve the text. Bangla routes
 * currently show the English draft with a translation-review notice — do not
 * invent a Bangla summary. See policies/README.md and docs/LAUNCH-CHECKLIST.md.
 */

const VERSION = '0.9-draft-2026-08-29';
const LAST_UPDATED = '2026-08-29';

export const TERMS: LegalDocument = {
  slug: 'terms',
  titleKey: 'legal.terms',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: '1-1',
      heading: { en: `About these Terms`, bn: `About these Terms` },
      body: { en: `These Terms govern access to bdoor.io and the services coordinated by bdoor compliance ltd. (“bdoor”, “we”, “us” or “our”). By using the website, creating an account, submitting an application or accepting a quotation, you agree to the version of these Terms shown to you at that time.

The website may be used to request support for company formation, registrations, licences, tax and accounting coordination, corporate secretarial work, document preparation and ongoing compliance. The precise service, responsible provider, deliverables, exclusions, price and expected timeline will be stated in a written quotation or engagement summary.`, bn: `These Terms govern access to bdoor.io and the services coordinated by bdoor compliance ltd. (“bdoor”, “we”, “us” or “our”). By using the website, creating an account, submitting an application or accepting a quotation, you agree to the version of these Terms shown to you at that time.

The website may be used to request support for company formation, registrations, licences, tax and accounting coordination, corporate secretarial work, document preparation and ongoing compliance. The precise service, responsible provider, deliverables, exclusions, price and expected timeline will be stated in a written quotation or engagement summary.` },
    },
    {
      id: '1-2',
      heading: { en: `Independent platform`, bn: `Independent platform` },
      body: { en: `bdoor is an independent business-setup and compliance coordination platform. It is not a government authority and does not issue registrations, licences, tax numbers, visas or approvals. Government authorities retain sole discretion over their decisions and timelines.

bdoor is not a law firm, chartered-accountancy firm or government office. Legal, tax, audit, immigration, notarial and other regulated work is performed only by an appropriately qualified third-party professional or provider where required. The identity and role of that provider must be disclosed before a binding engagement or document transfer.`, bn: `bdoor is an independent business-setup and compliance coordination platform. It is not a government authority and does not issue registrations, licences, tax numbers, visas or approvals. Government authorities retain sole discretion over their decisions and timelines.

bdoor is not a law firm, chartered-accountancy firm or government office. Legal, tax, audit, immigration, notarial and other regulated work is performed only by an appropriately qualified third-party professional or provider where required. The identity and role of that provider must be disclosed before a binding engagement or document transfer.` },
    },
    {
      id: '1-3',
      heading: { en: `Eligibility and authority`, bn: `Eligibility and authority` },
      body: { en: `You must be at least 18 years old and legally capable of entering into a contract. If you act for a company, partnership, founder group or another person, you confirm that you have authority to provide instructions and information on their behalf.

You must not impersonate another person or use bdoor to conceal ownership, control, source of funds or the true purpose of a business.`, bn: `You must be at least 18 years old and legally capable of entering into a contract. If you act for a company, partnership, founder group or another person, you confirm that you have authority to provide instructions and information on their behalf.

You must not impersonate another person or use bdoor to conceal ownership, control, source of funds or the true purpose of a business.` },
    },
    {
      id: '1-4',
      heading: { en: `Free applications and formation assessments`, bn: `Free applications and formation assessments` },
      body: { en: `A free application, questionnaire result, initial estimate or specialist review is non-binding. It does not create a paid engagement, reserve a company name, guarantee eligibility, appoint a professional provider or begin a government filing.

A paid engagement begins only when all required conditions are satisfied, including:

1. bdoor has issued a written, itemised quotation or engagement summary;
2. the scope, responsible provider and important exclusions have been disclosed;
3. required terms and policies have been accepted;
4. identity and risk checks required for that service have been completed;
5. payment or an agreed payment arrangement has been confirmed; and
6. bdoor has expressly confirmed that work has started.`, bn: `A free application, questionnaire result, initial estimate or specialist review is non-binding. It does not create a paid engagement, reserve a company name, guarantee eligibility, appoint a professional provider or begin a government filing.

A paid engagement begins only when all required conditions are satisfied, including:

1. bdoor has issued a written, itemised quotation or engagement summary;
2. the scope, responsible provider and important exclusions have been disclosed;
3. required terms and policies have been accepted;
4. identity and risk checks required for that service have been completed;
5. payment or an agreed payment arrangement has been confirmed; and
6. bdoor has expressly confirmed that work has started.` },
    },
    {
      id: '1-5',
      heading: { en: `Your responsibilities`, bn: `Your responsibilities` },
      body: { en: `You must:

- provide complete, accurate and current information;
- disclose every beneficial owner, controller, director, shareholder, partner and authorised representative requested for the service;
- provide authentic, legible and unaltered documents;
- review names, activities, addresses, ownership, capital, tax and filing information before submission;
- answer compliance and source-of-funds questions honestly;
- meet requested deadlines and keep your contact details current;
- obtain independent legal, tax or financial advice where the matter requires it; and
- notify us promptly if any submitted information changes.

You remain responsible for business decisions, tax positions, legal obligations and the accuracy of approved filings. We may pause work when information is missing, inconsistent or appears unreliable.`, bn: `You must:

- provide complete, accurate and current information;
- disclose every beneficial owner, controller, director, shareholder, partner and authorised representative requested for the service;
- provide authentic, legible and unaltered documents;
- review names, activities, addresses, ownership, capital, tax and filing information before submission;
- answer compliance and source-of-funds questions honestly;
- meet requested deadlines and keep your contact details current;
- obtain independent legal, tax or financial advice where the matter requires it; and
- notify us promptly if any submitted information changes.

You remain responsible for business decisions, tax positions, legal obligations and the accuracy of approved filings. We may pause work when information is missing, inconsistent or appears unreliable.` },
    },
    {
      id: '1-6',
      heading: { en: `Quotations, prices and third-party costs`, bn: `Quotations, prices and third-party costs` },
      body: { en: `Prices may be displayed in BDT or USD for convenience. Every binding quotation must separate:

- bdoor’s service fee;
- government or registry fees;
- regulated-professional or local-provider fees;
- payment, courier, translation, notarisation, legalisation or other third-party costs;
- applicable taxes; and
- the total amount currently payable.

Government and third-party fees may change without notice. Currency conversions are estimates unless the quotation fixes an exchange rate. If a cost changes before it is paid or committed, we will request approval for the difference or offer a revised scope.`, bn: `Prices may be displayed in BDT or USD for convenience. Every binding quotation must separate:

- bdoor’s service fee;
- government or registry fees;
- regulated-professional or local-provider fees;
- payment, courier, translation, notarisation, legalisation or other third-party costs;
- applicable taxes; and
- the total amount currently payable.

Government and third-party fees may change without notice. Currency conversions are estimates unless the quotation fixes an exchange rate. If a cost changes before it is paid or committed, we will request approval for the difference or offer a revised scope.` },
    },
    {
      id: '1-7',
      heading: { en: `Payments and invoices`, bn: `Payments and invoices` },
      body: { en: `Payment must be made through an approved payment method and in the currency stated on the invoice. You authorise bdoor and its payment processors to process the amount shown at checkout or on an accepted invoice.

We will not ask you to send money to a personal account. A payment is not complete until it is confirmed by the payment provider and reconciled to the relevant invoice. Refunds and cancellations are governed by the Refund and Cancellation Policy.`, bn: `Payment must be made through an approved payment method and in the currency stated on the invoice. You authorise bdoor and its payment processors to process the amount shown at checkout or on an accepted invoice.

We will not ask you to send money to a personal account. A payment is not complete until it is confirmed by the payment provider and reconciled to the relevant invoice. Refunds and cancellations are governed by the Refund and Cancellation Policy.` },
    },
    {
      id: '1-8',
      heading: { en: `Government and provider decisions`, bn: `Government and provider decisions` },
      body: { en: `Estimated timelines begin only after complete documents, cleared funds and all required approvals are received. Timelines exclude customer delays, government closures, enhanced review, name objections, banking review, courier time and events outside reasonable control.

We do not guarantee approval, processing time, bank-account opening, visa issuance, tax treatment, investment outcome or any preferential government treatment. If an application is rejected or queried, we will explain the known reason and the available next step within the agreed scope.`, bn: `Estimated timelines begin only after complete documents, cleared funds and all required approvals are received. Timelines exclude customer delays, government closures, enhanced review, name objections, banking review, courier time and events outside reasonable control.

We do not guarantee approval, processing time, bank-account opening, visa issuance, tax treatment, investment outcome or any preferential government treatment. If an application is rejected or queried, we will explain the known reason and the available next step within the agreed scope.` },
    },
    {
      id: '1-9',
      heading: { en: `Third-party professional services`, bn: `Third-party professional services` },
      body: { en: `Where a third party performs regulated or jurisdiction-specific work:

- the provider’s identity, jurisdiction and service role must be disclosed;
- separate provider terms may apply;
- documents may be shared only for the disclosed purpose and with the required authority or consent;
- the provider remains responsible for its professional work; and
- bdoor remains responsible for the coordination services it expressly agrees to deliver.

bdoor may replace a provider for capacity, conflict, quality or compliance reasons. If a change materially affects price, scope or timeline, we will tell you before continuing.`, bn: `Where a third party performs regulated or jurisdiction-specific work:

- the provider’s identity, jurisdiction and service role must be disclosed;
- separate provider terms may apply;
- documents may be shared only for the disclosed purpose and with the required authority or consent;
- the provider remains responsible for its professional work; and
- bdoor remains responsible for the coordination services it expressly agrees to deliver.

bdoor may replace a provider for capacity, conflict, quality or compliance reasons. If a change materially affects price, scope or timeline, we will tell you before continuing.` },
    },
    {
      id: '1-10',
      heading: { en: `Accounts and security`, bn: `Accounts and security` },
      body: { en: `You are responsible for protecting your login credentials and for activity performed through your account. Tell us immediately if you suspect unauthorised access. We may require multi-factor authentication, identity re-verification or additional controls for sensitive actions.`, bn: `You are responsible for protecting your login credentials and for activity performed through your account. Tell us immediately if you suspect unauthorised access. We may require multi-factor authentication, identity re-verification or additional controls for sensitive actions.` },
    },
    {
      id: '1-11',
      heading: { en: `Acceptable use`, bn: `Acceptable use` },
      body: { en: `You must comply with the Acceptable Use Policy. We may refuse, suspend or terminate access where use is unlawful, deceptive, abusive, unsafe or inconsistent with compliance obligations.`, bn: `You must comply with the Acceptable Use Policy. We may refuse, suspend or terminate access where use is unlawful, deceptive, abusive, unsafe or inconsistent with compliance obligations.` },
    },
    {
      id: '1-12',
      heading: { en: `Intellectual property`, bn: `Intellectual property` },
      body: { en: `The website, platform software, brand, layout and original content belong to bdoor or its licensors. You may use service outputs supplied specifically for your matter for their intended business purpose. Government forms, laws, official guidance and customer-owned material remain subject to their respective rights.`, bn: `The website, platform software, brand, layout and original content belong to bdoor or its licensors. You may use service outputs supplied specifically for your matter for their intended business purpose. Government forms, laws, official guidance and customer-owned material remain subject to their respective rights.` },
    },
    {
      id: '1-13',
      heading: { en: `Confidentiality and data`, bn: `Confidentiality and data` },
      body: { en: `We handle personal data according to the Privacy Policy. Confidential business information is used only to provide, secure and administer the requested service, meet legal obligations and exercise legitimate rights. Confidentiality does not prevent a disclosure required by law, court order, competent authority or a properly authorised service provider.`, bn: `We handle personal data according to the Privacy Policy. Confidential business information is used only to provide, secure and administer the requested service, meet legal obligations and exercise legitimate rights. Confidentiality does not prevent a disclosure required by law, court order, competent authority or a properly authorised service provider.` },
    },
    {
      id: '1-14',
      heading: { en: `Suspension and termination`, bn: `Suspension and termination` },
      body: { en: `We may pause or end a service if:

- required information, documents or payment are not provided;
- instructions conflict with law or professional obligations;
- identity, sanctions, fraud or source-of-funds concerns cannot be resolved;
- a provider or authority refuses the matter;
- the account is misused; or
- continuing would create an unreasonable legal, security or reputational risk.

We will give notice where lawful and practical. Fees for completed work and committed third-party costs remain payable. Unused amounts are handled under the Refund and Cancellation Policy.`, bn: `We may pause or end a service if:

- required information, documents or payment are not provided;
- instructions conflict with law or professional obligations;
- identity, sanctions, fraud or source-of-funds concerns cannot be resolved;
- a provider or authority refuses the matter;
- the account is misused; or
- continuing would create an unreasonable legal, security or reputational risk.

We will give notice where lawful and practical. Fees for completed work and committed third-party costs remain payable. Unused amounts are handled under the Refund and Cancellation Policy.` },
    },
    {
      id: '1-15',
      heading: { en: `Liability`, bn: `Liability` },
      body: { en: `Nothing in these Terms excludes liability that cannot lawfully be excluded. Subject to that rule, bdoor is responsible only for direct loss reasonably caused by its failure to perform the coordination service with reasonable care and skill. bdoor is not responsible for indirect loss, lost profit, loss caused by inaccurate customer information, or a decision or delay of a government authority, bank or independent provider outside bdoor’s reasonable control.

Any financial cap, exclusions and indemnity wording must be inserted or approved by Bangladesh counsel and must remain fair and enforceable under applicable consumer law. Cursor must not invent a monetary liability cap.`, bn: `Nothing in these Terms excludes liability that cannot lawfully be excluded. Subject to that rule, bdoor is responsible only for direct loss reasonably caused by its failure to perform the coordination service with reasonable care and skill. bdoor is not responsible for indirect loss, lost profit, loss caused by inaccurate customer information, or a decision or delay of a government authority, bank or independent provider outside bdoor’s reasonable control.

Any financial cap, exclusions and indemnity wording must be inserted or approved by Bangladesh counsel and must remain fair and enforceable under applicable consumer law. Cursor must not invent a monetary liability cap.` },
    },
    {
      id: '1-16',
      heading: { en: `Complaints and disputes`, bn: `Complaints and disputes` },
      body: { en: `Raise a complaint under the Complaints Policy. We will first try to resolve the matter in good faith. These Terms are governed by the laws of Bangladesh. Unless mandatory law gives another forum, disputes that cannot be resolved informally are subject to the competent courts of Bangladesh. This clause does not remove any non-waivable consumer right.`, bn: `Raise a complaint under the Complaints Policy. We will first try to resolve the matter in good faith. These Terms are governed by the laws of Bangladesh. Unless mandatory law gives another forum, disputes that cannot be resolved informally are subject to the competent courts of Bangladesh. This clause does not remove any non-waivable consumer right.` },
    },
    {
      id: '1-17',
      heading: { en: `Changes and notices`, bn: `Changes and notices` },
      body: { en: `We may update these Terms for legal, operational or security reasons. Material changes will be highlighted before they apply to an existing paid service. Each acceptance record must identify the policy version, language, timestamp and user.

Notices may be delivered to the email address associated with the account. Legal or policy enquiries may be sent to hello@bdoor.io.

---`, bn: `We may update these Terms for legal, operational or security reasons. Material changes will be highlighted before they apply to an existing paid service. Each acceptance record must identify the policy version, language, timestamp and user.

Notices may be delivered to the email address associated with the account. Legal or policy enquiries may be sent to hello@bdoor.io.

---` },
    },
  ],
};

export const PRIVACY: LegalDocument = {
  slug: 'privacy',
  titleKey: 'legal.privacy',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: '2-1',
      heading: { en: `Scope and responsible organisation`, bn: `Scope and responsible organisation` },
      body: { en: `This Policy explains how bdoor compliance ltd. collects, uses, shares, protects and retains personal data through bdoor.io, customer applications, accounts, communications and coordinated services. bdoor acts as the organisation responsible for its own platform and coordination processing. A professional provider or government authority may separately control the data it receives for its own legal or professional duties.`, bn: `This Policy explains how bdoor compliance ltd. collects, uses, shares, protects and retains personal data through bdoor.io, customer applications, accounts, communications and coordinated services. bdoor acts as the organisation responsible for its own platform and coordination processing. A professional provider or government authority may separately control the data it receives for its own legal or professional duties.` },
    },
    {
      id: '2-2',
      heading: { en: `Data we collect`, bn: `Data we collect` },
      body: { en: `Depending on the stage and requested service, we may collect:

- contact data: name, email, telephone, preferred language and country;
- application data: intended jurisdiction, business activity, ownership plan, timeline, service needs and budget;
- account data: authentication identifiers, security events and preferences;
- identity and verification data after the legal launch gate opens: date of birth, nationality, NID or passport details, photograph, proof of address and verification results;
- business data: proposed names, addresses, ownership, capital, directors, shareholders, partners, beneficial owners, licences and corporate records;
- financial and risk data: invoices, payment status, refund information, source-of-funds information, tax residency, sanctions and politically exposed person screening results;
- communications: messages, calls, support requests, complaints and instructions;
- provider and case data: assignments, milestones, document requests, professional advice status and filing outcomes; and
- technical data: IP address, browser, device, language, referring page, security logs and cookie choices.

Do not submit passports, NIDs, proof of address or other sensitive documents through a free application or ordinary email unless bdoor has opened an approved secure collection step.`, bn: `Depending on the stage and requested service, we may collect:

- contact data: name, email, telephone, preferred language and country;
- application data: intended jurisdiction, business activity, ownership plan, timeline, service needs and budget;
- account data: authentication identifiers, security events and preferences;
- identity and verification data after the legal launch gate opens: date of birth, nationality, NID or passport details, photograph, proof of address and verification results;
- business data: proposed names, addresses, ownership, capital, directors, shareholders, partners, beneficial owners, licences and corporate records;
- financial and risk data: invoices, payment status, refund information, source-of-funds information, tax residency, sanctions and politically exposed person screening results;
- communications: messages, calls, support requests, complaints and instructions;
- provider and case data: assignments, milestones, document requests, professional advice status and filing outcomes; and
- technical data: IP address, browser, device, language, referring page, security logs and cookie choices.

Do not submit passports, NIDs, proof of address or other sensitive documents through a free application or ordinary email unless bdoor has opened an approved secure collection step.` },
    },
    {
      id: '2-3',
      heading: { en: `Why we use data`, bn: `Why we use data` },
      body: { en: `We use personal data to:

- provide the requested assessment, account and service;
- prepare an itemised quotation and determine eligibility;
- verify identity, ownership and authority where required;
- detect fraud, conflicts, sanctions and financial-crime risk;
- coordinate approved providers and government filings;
- process payments, refunds and accounting records;
- communicate case actions, deadlines and compliance reminders;
- secure, troubleshoot and improve the platform;
- respond to rights requests and complaints;
- comply with law, lawful orders and professional obligations; and
- send marketing only where permitted and with an available opt-out.

Processing must have a documented lawful basis. Depending on context, that basis may be steps requested before a contract, performance of a contract, a legal obligation, consent, protection of legitimate interests that do not override the individual’s rights, or another basis permitted by applicable law.`, bn: `We use personal data to:

- provide the requested assessment, account and service;
- prepare an itemised quotation and determine eligibility;
- verify identity, ownership and authority where required;
- detect fraud, conflicts, sanctions and financial-crime risk;
- coordinate approved providers and government filings;
- process payments, refunds and accounting records;
- communicate case actions, deadlines and compliance reminders;
- secure, troubleshoot and improve the platform;
- respond to rights requests and complaints;
- comply with law, lawful orders and professional obligations; and
- send marketing only where permitted and with an available opt-out.

Processing must have a documented lawful basis. Depending on context, that basis may be steps requested before a contract, performance of a contract, a legal obligation, consent, protection of legitimate interests that do not override the individual’s rights, or another basis permitted by applicable law.` },
    },
    {
      id: '2-4',
      heading: { en: `When we share data`, bn: `When we share data` },
      body: { en: `We may share only the data reasonably needed with:

- a provider selected for the customer’s service, after disclosure and required consent or authority;
- government registries, tax authorities, banks and licensing bodies as necessary for an authorised application;
- identity-verification, sanctions-screening, payment, email, hosting, database, security, analytics, storage, support and document-signing vendors under appropriate contractual safeguards;
- professional advisers, auditors and insurers subject to confidentiality; and
- courts, regulators or law-enforcement bodies where disclosure is required or lawfully authorised.

We do not sell personal data. We do not allow a partner to browse unassigned customer records. A current subprocessor register must be published separately and generated from the providers actually used in production; no vendor may be listed merely because it was proposed in a design brief.`, bn: `We may share only the data reasonably needed with:

- a provider selected for the customer’s service, after disclosure and required consent or authority;
- government registries, tax authorities, banks and licensing bodies as necessary for an authorised application;
- identity-verification, sanctions-screening, payment, email, hosting, database, security, analytics, storage, support and document-signing vendors under appropriate contractual safeguards;
- professional advisers, auditors and insurers subject to confidentiality; and
- courts, regulators or law-enforcement bodies where disclosure is required or lawfully authorised.

We do not sell personal data. We do not allow a partner to browse unassigned customer records. A current subprocessor register must be published separately and generated from the providers actually used in production; no vendor may be listed merely because it was proposed in a design brief.` },
    },
    {
      id: '2-5',
      heading: { en: `International transfers`, bn: `International transfers` },
      body: { en: `A cross-border formation request may require data to be processed in the selected jurisdiction. Technology and professional providers may also process data outside Bangladesh. Before such transfer, bdoor must identify the purpose, recipient category, destination and applicable safeguard or lawful basis. We will not claim that every overseas jurisdiction offers equivalent protection.`, bn: `A cross-border formation request may require data to be processed in the selected jurisdiction. Technology and professional providers may also process data outside Bangladesh. Before such transfer, bdoor must identify the purpose, recipient category, destination and applicable safeguard or lawful basis. We will not claim that every overseas jurisdiction offers equivalent protection.` },
    },
    {
      id: '2-6',
      heading: { en: `Retention`, bn: `Retention` },
      body: { en: `We keep personal data only for as long as needed for the stated purpose, legal duties, dispute handling and security. The production retention schedule must be approved by counsel and configured by data category. The intended schedule is:

- incomplete anonymous/free applications: delete or anonymise after 90 days of inactivity;
- unsuccessful or withdrawn pre-engagement applications: up to 2 years unless a shorter period is requested and no legal hold applies;
- customer, contract, case and corporate-compliance records: 7 years after the service or continuing relationship ends;
- identity, AML/KYC and beneficial-ownership records: for the period required by applicable AML/CFT law and approved compliance policy, and no longer than necessary;
- invoices, receipts, refunds and accounting records: for the period required by tax and company law;
- security and access logs: normally up to 12 months unless needed to investigate an incident; and
- marketing records: until opt-out, plus a minimal suppression record needed to respect the opt-out.

These are operational limits, not statements that every category is legally required for the full period. A legal hold, regulatory request or active dispute may extend retention. Deletion must include production systems and scheduled backup expiry where technically practicable.`, bn: `We keep personal data only for as long as needed for the stated purpose, legal duties, dispute handling and security. The production retention schedule must be approved by counsel and configured by data category. The intended schedule is:

- incomplete anonymous/free applications: delete or anonymise after 90 days of inactivity;
- unsuccessful or withdrawn pre-engagement applications: up to 2 years unless a shorter period is requested and no legal hold applies;
- customer, contract, case and corporate-compliance records: 7 years after the service or continuing relationship ends;
- identity, AML/KYC and beneficial-ownership records: for the period required by applicable AML/CFT law and approved compliance policy, and no longer than necessary;
- invoices, receipts, refunds and accounting records: for the period required by tax and company law;
- security and access logs: normally up to 12 months unless needed to investigate an incident; and
- marketing records: until opt-out, plus a minimal suppression record needed to respect the opt-out.

These are operational limits, not statements that every category is legally required for the full period. A legal hold, regulatory request or active dispute may extend retention. Deletion must include production systems and scheduled backup expiry where technically practicable.` },
    },
    {
      id: '2-7',
      heading: { en: `Your choices and rights`, bn: `Your choices and rights` },
      body: { en: `Subject to applicable law and valid exceptions, you may ask to:

- know whether and why your personal data is processed;
- access a copy of relevant personal data;
- correct, update or complete inaccurate data;
- withdraw consent for future consent-based processing;
- object to or restrict certain processing;
- request deletion when data is no longer required;
- request an available portable copy; and
- complain about the handling of personal data.

Send a request to hello@bdoor.io with the subject “Privacy request”. We may verify identity before acting and will not disclose another person’s information. We will acknowledge, track and answer requests within the period required by applicable law.`, bn: `Subject to applicable law and valid exceptions, you may ask to:

- know whether and why your personal data is processed;
- access a copy of relevant personal data;
- correct, update or complete inaccurate data;
- withdraw consent for future consent-based processing;
- object to or restrict certain processing;
- request deletion when data is no longer required;
- request an available portable copy; and
- complain about the handling of personal data.

Send a request to hello@bdoor.io with the subject “Privacy request”. We may verify identity before acting and will not disclose another person’s information. We will acknowledge, track and answer requests within the period required by applicable law.` },
    },
    {
      id: '2-8',
      heading: { en: `Automated decisions`, bn: `Automated decisions` },
      body: { en: `bdoor may use rules or software to identify missing documents, possible eligibility issues or risk indicators. No customer should be rejected, reported or subjected to a significant final decision solely by an unreviewed AI output. Material decisions require authorised human review, except where automated blocking is necessary to prevent an immediate security threat.`, bn: `bdoor may use rules or software to identify missing documents, possible eligibility issues or risk indicators. No customer should be rejected, reported or subjected to a significant final decision solely by an unreviewed AI output. Material decisions require authorised human review, except where automated blocking is necessary to prevent an immediate security threat.` },
    },
    {
      id: '2-9',
      heading: { en: `Security`, bn: `Security` },
      body: { en: `We use risk-appropriate technical and organisational safeguards, including access controls, private document storage, encrypted transport, role-based permissions, logging, backups and multi-factor authentication for privileged users. No internet service is completely secure. Customers must use the designated secure upload process and protect their account credentials.

If a personal-data incident occurs, bdoor will contain and assess it, preserve evidence, notify affected parties and authorities when required, and document remedial action.`, bn: `We use risk-appropriate technical and organisational safeguards, including access controls, private document storage, encrypted transport, role-based permissions, logging, backups and multi-factor authentication for privileged users. No internet service is completely secure. Customers must use the designated secure upload process and protect their account credentials.

If a personal-data incident occurs, bdoor will contain and assess it, preserve evidence, notify affected parties and authorities when required, and document remedial action.` },
    },
    {
      id: '2-10',
      heading: { en: `Cookies and analytics`, bn: `Cookies and analytics` },
      body: { en: `Cookies and similar technologies are governed by the Cookie Policy. Non-essential analytics or advertising technologies must not load until the required choice has been obtained. Sensitive application, KYC and document pages must be excluded from session replay.`, bn: `Cookies and similar technologies are governed by the Cookie Policy. Non-essential analytics or advertising technologies must not load until the required choice has been obtained. Sensitive application, KYC and document pages must be excluded from session replay.` },
    },
    {
      id: '2-11',
      heading: { en: `Children`, bn: `Children` },
      body: { en: `The service is intended for adults and business representatives. We do not knowingly collect applications from anyone under 18. If such data is identified, the application will be closed and the data deleted unless law requires otherwise.`, bn: `The service is intended for adults and business representatives. We do not knowingly collect applications from anyone under 18. If such data is identified, the application will be closed and the data deleted unless law requires otherwise.` },
    },
    {
      id: '2-12',
      heading: { en: `Changes and contact`, bn: `Changes and contact` },
      body: { en: `Material changes will be shown with a new version and effective date. Privacy questions and requests may be sent to hello@bdoor.io. Formal role titles and regulatory contact details must be added when appointed and legally required.

---`, bn: `Material changes will be shown with a new version and effective date. Privacy questions and requests may be sent to hello@bdoor.io. Formal role titles and regulatory contact details must be added when appointed and legally required.

---` },
    },
  ],
};

export const REFUND_POLICY: LegalDocument = {
  slug: 'refund-policy',
  titleKey: 'legal.refund',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: '3-1',
      heading: { en: `Purpose`, bn: `Purpose` },
      body: { en: `This Policy explains how bdoor handles cancellation, unused service fees, government charges and third-party costs. It forms part of the Terms of Service and does not remove any mandatory consumer right.`, bn: `This Policy explains how bdoor handles cancellation, unused service fees, government charges and third-party costs. It forms part of the Terms of Service and does not remove any mandatory consumer right.` },
    },
    {
      id: '3-2',
      heading: { en: `Before a paid engagement begins`, bn: `Before a paid engagement begins` },
      body: { en: `Submitting a free application creates no payment obligation. If a customer pays but bdoor has not started work, appointed a provider, made a filing or committed any third-party cost, the customer may cancel and receive a refund of the amount received. Any payment-provider charge that cannot be recovered may be deducted only if it was disclosed before payment and bdoor does not retain it.`, bn: `Submitting a free application creates no payment obligation. If a customer pays but bdoor has not started work, appointed a provider, made a filing or committed any third-party cost, the customer may cancel and receive a refund of the amount received. Any payment-provider charge that cannot be recovered may be deducted only if it was disclosed before payment and bdoor does not retain it.` },
    },
    {
      id: '3-3',
      heading: { en: `After work begins`, bn: `After work begins` },
      body: { en: `If the customer cancels after work starts, bdoor will provide an itemised closing statement showing:

- work completed;
- bdoor fees earned for that work;
- government or third-party amounts already paid or irrevocably committed;
- any credit or refund obtained from a provider; and
- the unused refundable balance.

Unused bdoor fees will be refunded. Government fees, registry fees, professional-provider costs, legalisation, courier and other third-party amounts are refundable only to the extent the recipient returns or releases them.`, bn: `If the customer cancels after work starts, bdoor will provide an itemised closing statement showing:

- work completed;
- bdoor fees earned for that work;
- government or third-party amounts already paid or irrevocably committed;
- any credit or refund obtained from a provider; and
- the unused refundable balance.

Unused bdoor fees will be refunded. Government fees, registry fees, professional-provider costs, legalisation, courier and other third-party amounts are refundable only to the extent the recipient returns or releases them.` },
    },
    {
      id: '3-4',
      heading: { en: `Rejection, delay or customer ineligibility`, bn: `Rejection, delay or customer ineligibility` },
      body: { en: `A government rejection, name objection, bank refusal, visa refusal or processing delay does not automatically make completed work refundable. However, bdoor will refund unused bdoor fees and uncommitted pass-through amounts. If bdoor materially fails to deliver an agreed service and does not correct the failure within a reasonable opportunity, the affected service fee will be refunded or re-performed without an additional bdoor fee, subject to the customer’s mandatory legal rights.`, bn: `A government rejection, name objection, bank refusal, visa refusal or processing delay does not automatically make completed work refundable. However, bdoor will refund unused bdoor fees and uncommitted pass-through amounts. If bdoor materially fails to deliver an agreed service and does not correct the failure within a reasonable opportunity, the affected service fee will be refunded or re-performed without an additional bdoor fee, subject to the customer’s mandatory legal rights.` },
    },
    {
      id: '3-5',
      heading: { en: `Customer-caused closure`, bn: `Customer-caused closure` },
      body: { en: `bdoor may close a matter if the customer supplies false or altered documents, conceals ownership, does not answer required checks, requests unlawful activity, fails to pay an agreed invoice or remains inactive after reasonable reminders. Completed work and committed costs remain chargeable; unused funds will be handled lawfully and may be held where a legal restriction prevents repayment.`, bn: `bdoor may close a matter if the customer supplies false or altered documents, conceals ownership, does not answer required checks, requests unlawful activity, fails to pay an agreed invoice or remains inactive after reasonable reminders. Completed work and committed costs remain chargeable; unused funds will be handled lawfully and may be held where a legal restriction prevents repayment.` },
    },
    {
      id: '3-6',
      heading: { en: `Duplicate and unauthorised payments`, bn: `Duplicate and unauthorised payments` },
      body: { en: `Report a duplicate or unauthorised payment promptly. We will investigate with the payment provider and refund a verified duplicate. Suspected account compromise may require identity verification. Starting a chargeback does not remove the parties’ obligation to provide truthful evidence to the payment provider.`, bn: `Report a duplicate or unauthorised payment promptly. We will investigate with the payment provider and refund a verified duplicate. Suspected account compromise may require identity verification. Starting a chargeback does not remove the parties’ obligation to provide truthful evidence to the payment provider.` },
    },
    {
      id: '3-7',
      heading: { en: `How to request cancellation or refund`, bn: `How to request cancellation or refund` },
      body: { en: `Email hello@bdoor.io with the subject “Cancellation or refund”, the customer name, application or invoice reference, payment date, amount and reason. Do not send full card or mobile-wallet credentials.

We aim to acknowledge a request within 2 business days and issue a written decision or request for information within 10 business days. Approved refunds are sent to the original payment method where practicable and may take a further 5–15 business days to appear, depending on the provider.`, bn: `Email hello@bdoor.io with the subject “Cancellation or refund”, the customer name, application or invoice reference, payment date, amount and reason. Do not send full card or mobile-wallet credentials.

We aim to acknowledge a request within 2 business days and issue a written decision or request for information within 10 business days. Approved refunds are sent to the original payment method where practicable and may take a further 5–15 business days to appear, depending on the provider.` },
    },
    {
      id: '3-8',
      heading: { en: `No misleading guarantee`, bn: `No misleading guarantee` },
      body: { en: `Marketing must not state “money-back guarantee”, “guaranteed approval” or “full refund” unless the exact conditions have been approved by counsel and are shown immediately beside the claim.

---`, bn: `Marketing must not state “money-back guarantee”, “guaranteed approval” or “full refund” unless the exact conditions have been approved by counsel and are shown immediately beside the claim.

---` },
    },
  ],
};

export const AML_KYC_POLICY: LegalDocument = {
  slug: 'aml-kyc-policy',
  titleKey: 'legal.amlKyc',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: '4-1',
      heading: { en: `Purpose and scope`, bn: `Purpose and scope` },
      body: { en: `bdoor supports lawful business formation and compliance. It does not assist anonymous ownership, sanctions evasion, money laundering, terrorist financing, proliferation financing, bribery, tax evasion, fraud or concealment of criminal proceeds.

Bangladesh law identifies trust and company service providers, lawyers, notaries, other legal professionals and accountants among reporting organisations and designated non-financial businesses and professions. bdoor must obtain a formal Bangladesh legal opinion on its exact classification and reporting duties before paid company-service operations begin. This Policy does not itself claim that bdoor has completed registration with, or received approval from, BFIU.`, bn: `bdoor supports lawful business formation and compliance. It does not assist anonymous ownership, sanctions evasion, money laundering, terrorist financing, proliferation financing, bribery, tax evasion, fraud or concealment of criminal proceeds.

Bangladesh law identifies trust and company service providers, lawyers, notaries, other legal professionals and accountants among reporting organisations and designated non-financial businesses and professions. bdoor must obtain a formal Bangladesh legal opinion on its exact classification and reporting duties before paid company-service operations begin. This Policy does not itself claim that bdoor has completed registration with, or received approval from, BFIU.` },
    },
    {
      id: '4-2',
      heading: { en: `When checks occur`, bn: `When checks occur` },
      body: { en: `The free initial application should collect only the minimum non-sensitive information needed for routing and assessment. Identity documents and detailed source-of-funds evidence may be requested only after:

- the legal launch gate is approved;
- the customer receives a clear collection notice;
- an authorised secure upload route is available; and
- the requested data is necessary for the proposed engagement.`, bn: `The free initial application should collect only the minimum non-sensitive information needed for routing and assessment. Identity documents and detailed source-of-funds evidence may be requested only after:

- the legal launch gate is approved;
- the customer receives a clear collection notice;
- an authorised secure upload route is available; and
- the requested data is necessary for the proposed engagement.` },
    },
    {
      id: '4-3',
      heading: { en: `Customer due diligence`, bn: `Customer due diligence` },
      body: { en: `Depending on risk and jurisdiction, bdoor or the appointed regulated provider may verify:

- full legal name, date of birth, nationality and residential address;
- government-issued identity document and likeness;
- authority to act for another person or entity;
- proposed business activity and expected countries of operation;
- directors, shareholders, partners and beneficial owners;
- ownership and control structure;
- source of funds and, where proportionate, source of wealth;
- tax residence and relevant identification numbers;
- sanctions, adverse information and politically exposed person status; and
- the purpose and expected nature of the business relationship.

Information must be refreshed when circumstances change or the risk requires it.`, bn: `Depending on risk and jurisdiction, bdoor or the appointed regulated provider may verify:

- full legal name, date of birth, nationality and residential address;
- government-issued identity document and likeness;
- authority to act for another person or entity;
- proposed business activity and expected countries of operation;
- directors, shareholders, partners and beneficial owners;
- ownership and control structure;
- source of funds and, where proportionate, source of wealth;
- tax residence and relevant identification numbers;
- sanctions, adverse information and politically exposed person status; and
- the purpose and expected nature of the business relationship.

Information must be refreshed when circumstances change or the risk requires it.` },
    },
    {
      id: '4-4',
      heading: { en: `Enhanced due diligence`, bn: `Enhanced due diligence` },
      body: { en: `Additional review may be required for complex or unusual structures, high-risk jurisdictions, politically exposed persons, sanctioned-country exposure, cash-intensive or regulated activity, nominee arrangements, inconsistent documents, unexplained third-party payments, adverse information or unusually urgent instructions.

Enhanced review may include independent evidence of wealth or funds, corporate-chain documents, translations, video verification, professional references, local legal advice, senior approval or refusal of the matter.`, bn: `Additional review may be required for complex or unusual structures, high-risk jurisdictions, politically exposed persons, sanctioned-country exposure, cash-intensive or regulated activity, nominee arrangements, inconsistent documents, unexplained third-party payments, adverse information or unusually urgent instructions.

Enhanced review may include independent evidence of wealth or funds, corporate-chain documents, translations, video verification, professional references, local legal advice, senior approval or refusal of the matter.` },
    },
    {
      id: '4-5',
      heading: { en: `Sanctions screening`, bn: `Sanctions screening` },
      body: { en: `Screening must use the lists and legal restrictions applicable to bdoor, the customer, payment provider, appointed professional and requested jurisdiction. This may include United Nations and Bangladesh domestic sanctions and locally required lists. A possible match must be reviewed by an authorised person; an unreviewed software match must not be treated as proof.`, bn: `Screening must use the lists and legal restrictions applicable to bdoor, the customer, payment provider, appointed professional and requested jurisdiction. This may include United Nations and Bangladesh domestic sanctions and locally required lists. A possible match must be reviewed by an authorised person; an unreviewed software match must not be treated as proof.` },
    },
    {
      id: '4-6',
      heading: { en: `Monitoring and reporting`, bn: `Monitoring and reporting` },
      body: { en: `bdoor will monitor relevant customer and case information for material inconsistencies or suspicious activity. Where bdoor or an appointed provider has a legal reporting obligation, a report may be made to the competent authority without customer consent and without notice where notice is prohibited. Only a properly authorised compliance person may decide or submit a report on bdoor’s behalf.`, bn: `bdoor will monitor relevant customer and case information for material inconsistencies or suspicious activity. Where bdoor or an appointed provider has a legal reporting obligation, a report may be made to the competent authority without customer consent and without notice where notice is prohibited. Only a properly authorised compliance person may decide or submit a report on bdoor’s behalf.` },
    },
    {
      id: '4-7',
      heading: { en: `Refusal, restriction and exit`, bn: `Refusal, restriction and exit` },
      body: { en: `bdoor may decline, suspend or terminate a relationship where required information is unavailable, risk cannot be adequately managed, instructions may be unlawful, a sanctions restriction applies or a provider cannot accept the matter. bdoor is not required to disclose confidential risk rules or information whose disclosure would be unlawful.`, bn: `bdoor may decline, suspend or terminate a relationship where required information is unavailable, risk cannot be adequately managed, instructions may be unlawful, a sanctions restriction applies or a provider cannot accept the matter. bdoor is not required to disclose confidential risk rules or information whose disclosure would be unlawful.` },
    },
    {
      id: '4-8',
      heading: { en: `Records and confidentiality`, bn: `Records and confidentiality` },
      body: { en: `Due-diligence and case records will be kept for the legally required period under the approved retention schedule, protected with restricted access and disclosed only for an authorised purpose. Staff and providers must not discuss suspicious-activity reviews outside authorised channels.`, bn: `Due-diligence and case records will be kept for the legally required period under the approved retention schedule, protected with restricted access and disclosed only for an authorised purpose. Staff and providers must not discuss suspicious-activity reviews outside authorised channels.` },
    },
    {
      id: '4-9',
      heading: { en: `Governance`, bn: `Governance` },
      body: { en: `Before launch, bdoor must appoint an accountable AML/compliance lead, approve a business-wide risk assessment, document customer-risk scoring, train relevant staff, define escalation and reporting procedures, test the controls and maintain a current sanctions source list. Public wording must never imply BFIU endorsement.

Questions may be sent to hello@bdoor.io with the subject “Compliance”.

---`, bn: `Before launch, bdoor must appoint an accountable AML/compliance lead, approve a business-wide risk assessment, document customer-risk scoring, train relevant staff, define escalation and reporting procedures, test the controls and maintain a current sanctions source list. Public wording must never imply BFIU endorsement.

Questions may be sent to hello@bdoor.io with the subject “Compliance”.

---` },
    },
  ],
};

export const COOKIE_POLICY: LegalDocument = {
  slug: 'cookie-policy',
  titleKey: 'legal.cookies',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: '5-1',
      heading: { en: `What cookies are`, bn: `What cookies are` },
      body: { en: `Cookies and similar storage technologies allow a website to remember information about a browser or device. This Policy explains the categories bdoor may use and the choices available.`, bn: `Cookies and similar storage technologies allow a website to remember information about a browser or device. This Policy explains the categories bdoor may use and the choices available.` },
    },
    {
      id: '5-2',
      heading: { en: `Categories`, bn: `Categories` },
      body: { en: `### Strictly necessary

Required for security, authentication, language routing, load balancing, fraud prevention, form continuity and saved cookie choices. These operate because the requested website cannot function securely without them.

### Preferences

Remember optional settings such as currency or display choices. These should load only after the required consent or choice.

### Analytics

Help measure page performance and service usage. Analytics must use data minimisation, mask or exclude sensitive fields and remain disabled until required consent is obtained. Application, KYC, payment and document pages must never be recorded through session replay.

### Marketing

Used to measure or personalise advertising. bdoor must not activate this category unless a real marketing vendor is integrated, the vendor is disclosed and the required opt-in has been obtained.`, bn: `### Strictly necessary

Required for security, authentication, language routing, load balancing, fraud prevention, form continuity and saved cookie choices. These operate because the requested website cannot function securely without them.

### Preferences

Remember optional settings such as currency or display choices. These should load only after the required consent or choice.

### Analytics

Help measure page performance and service usage. Analytics must use data minimisation, mask or exclude sensitive fields and remain disabled until required consent is obtained. Application, KYC, payment and document pages must never be recorded through session replay.

### Marketing

Used to measure or personalise advertising. bdoor must not activate this category unless a real marketing vendor is integrated, the vendor is disclosed and the required opt-in has been obtained.` },
    },
    {
      id: '5-3',
      heading: { en: `Cookie register`, bn: `Cookie register` },
      body: { en: `Cursor must generate the production cookie register by auditing actual code, response headers and third-party scripts. The register must show cookie or storage key, provider, purpose, category, duration and whether information is transferred internationally. Do not invent vendor names or cookie durations.`, bn: `Cursor must generate the production cookie register by auditing actual code, response headers and third-party scripts. The register must show cookie or storage key, provider, purpose, category, duration and whether information is transferred internationally. Do not invent vendor names or cookie durations.` },
    },
    {
      id: '5-4',
      heading: { en: `Choices`, bn: `Choices` },
      body: { en: `On first eligible visit, show a clear choice to accept, reject or customise non-essential cookies. Reject must be as easy as accept. Consent must be granular, recorded by version and withdrawable through a persistent “Cookie settings” link in the footer.

Browser controls may also delete or block cookies, but blocking necessary storage may prevent sign-in or form continuity.`, bn: `On first eligible visit, show a clear choice to accept, reject or customise non-essential cookies. Reject must be as easy as accept. Consent must be granular, recorded by version and withdrawable through a persistent “Cookie settings” link in the footer.

Browser controls may also delete or block cookies, but blocking necessary storage may prevent sign-in or form continuity.` },
    },
    {
      id: '5-5',
      heading: { en: `Changes and contact`, bn: `Changes and contact` },
      body: { en: `Update this Policy and the consent record when categories or vendors materially change. Questions may be sent to hello@bdoor.io.

---`, bn: `Update this Policy and the consent record when categories or vendors materially change. Questions may be sent to hello@bdoor.io.

---` },
    },
  ],
};

export const LEGAL_DISCLAIMER: LegalDocument = {
  slug: 'legal-disclaimer',
  titleKey: 'legal.disclaimer',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'overview',
      heading: { en: `Legal and Professional Services Disclaimer`, bn: `Legal and Professional Services Disclaimer` },
      body: { en: ``, bn: `` },
    },
  ],
};

export const COMPLAINTS: LegalDocument = {
  slug: 'complaints',
  titleKey: 'legal.complaints',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: '7-1',
      heading: { en: `How to complain`, bn: `How to complain` },
      body: { en: `Email hello@bdoor.io with the subject “Complaint”. Include your name, application or case reference, the service or provider involved, what happened, the outcome you seek and any relevant non-sensitive evidence. Do not send card credentials or identity documents by ordinary email.`, bn: `Email hello@bdoor.io with the subject “Complaint”. Include your name, application or case reference, the service or provider involved, what happened, the outcome you seek and any relevant non-sensitive evidence. Do not send card credentials or identity documents by ordinary email.` },
    },
    {
      id: '7-2',
      heading: { en: `Handling process`, bn: `Handling process` },
      body: { en: `bdoor will:

1. acknowledge the complaint, normally within 2 business days;
2. assign a person who was not solely responsible for the disputed action where practical;
3. review the case record, quotation, communications, payments and provider input;
4. request any missing information;
5. provide a reasoned written response, normally within 15 business days; and
6. explain any remedy, further review or external route available.

Complex complaints may require more time. We will explain the reason and provide an updated target date.`, bn: `bdoor will:

1. acknowledge the complaint, normally within 2 business days;
2. assign a person who was not solely responsible for the disputed action where practical;
3. review the case record, quotation, communications, payments and provider input;
4. request any missing information;
5. provide a reasoned written response, normally within 15 business days; and
6. explain any remedy, further review or external route available.

Complex complaints may require more time. We will explain the reason and provide an updated target date.` },
    },
    {
      id: '7-3',
      heading: { en: `Provider complaints`, bn: `Provider complaints` },
      body: { en: `If the complaint concerns an independent professional, bdoor may share the relevant complaint information with that provider and coordinate its response. This does not remove any right to complain directly to the provider’s professional body or regulator.`, bn: `If the complaint concerns an independent professional, bdoor may share the relevant complaint information with that provider and coordinate its response. This does not remove any right to complain directly to the provider’s professional body or regulator.` },
    },
    {
      id: '7-4',
      heading: { en: `No retaliation and recordkeeping`, bn: `No retaliation and recordkeeping` },
      body: { en: `Making a good-faith complaint will not result in retaliation. Complaint records will be restricted, retained under the approved schedule and analysed for recurring problems.`, bn: `Making a good-faith complaint will not result in retaliation. Complaint records will be restricted, retained under the approved schedule and analysed for recurring problems.` },
    },
    {
      id: '7-5',
      heading: { en: `External rights`, bn: `External rights` },
      body: { en: `Nothing in this Policy prevents a customer from using a court, regulator, professional body, payment-provider dispute process or Bangladesh consumer complaint route available under applicable law. The National Consumer Complaint Centre currently publishes hotline 16121 and an online complaint route; Cursor must link to the current official DNCRP page rather than hard-code an unofficial domain.

---`, bn: `Nothing in this Policy prevents a customer from using a court, regulator, professional body, payment-provider dispute process or Bangladesh consumer complaint route available under applicable law. The National Consumer Complaint Centre currently publishes hotline 16121 and an online complaint route; Cursor must link to the current official DNCRP page rather than hard-code an unofficial domain.

---` },
    },
  ],
};

export const ACCEPTABLE_USE: LegalDocument = {
  slug: 'acceptable-use',
  titleKey: 'legal.acceptableUse',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'overview',
      heading: { en: `Acceptable Use Policy`, bn: `Acceptable Use Policy` },
      body: { en: ``, bn: `` },
    },
  ],
};

export const PROVIDER_DISCLOSURE: LegalDocument = {
  slug: 'provider-disclosure',
  titleKey: 'legal.providerDisclosure',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: '9-1',
      heading: { en: `B2B2C operating model`, bn: `B2B2C operating model` },
      body: { en: `bdoor coordinates services through vetted third-party firms and specialists where it does not perform the work itself. These may include law firms, chartered-accountancy firms, company-secretarial practices, registered agents, corporate-service providers, tax practitioners, banks, immigration specialists, notaries, translators and licensing consultants.`, bn: `bdoor coordinates services through vetted third-party firms and specialists where it does not perform the work itself. These may include law firms, chartered-accountancy firms, company-secretarial practices, registered agents, corporate-service providers, tax practitioners, banks, immigration specialists, notaries, translators and licensing consultants.` },
    },
    {
      id: '9-2',
      heading: { en: `Before engagement`, bn: `Before engagement` },
      body: { en: `Before a provider is appointed, the customer must receive:

- the provider’s legal or trading name;
- country and service role;
- the professional category and credential status relevant to the work;
- the exact scope and important exclusions;
- the provider fee and applicable taxes;
- any separate terms, conflicts procedure and complaint route;
- the data and documents to be shared; and
- whether the provider acts independently or as bdoor’s subcontractor for that task.

Do not call a provider “verified” unless the credential, issuer, status, expiry date and last-check date are recorded.`, bn: `Before a provider is appointed, the customer must receive:

- the provider’s legal or trading name;
- country and service role;
- the professional category and credential status relevant to the work;
- the exact scope and important exclusions;
- the provider fee and applicable taxes;
- any separate terms, conflicts procedure and complaint route;
- the data and documents to be shared; and
- whether the provider acts independently or as bdoor’s subcontractor for that task.

Do not call a provider “verified” unless the credential, issuer, status, expiry date and last-check date are recorded.` },
    },
    {
      id: '9-3',
      heading: { en: `Customer choice and consent`, bn: `Customer choice and consent` },
      body: { en: `The customer may ask reasonable questions about a proposed provider before appointment. Sensitive documents may be shared only for the assigned case and disclosed purpose after the required consent or contractual authority is recorded. Revoking document access does not reverse a lawful filing or a provider’s mandatory recordkeeping.`, bn: `The customer may ask reasonable questions about a proposed provider before appointment. Sensitive documents may be shared only for the assigned case and disclosed purpose after the required consent or contractual authority is recorded. Revoking document access does not reverse a lawful filing or a provider’s mandatory recordkeeping.` },
    },
    {
      id: '9-4',
      heading: { en: `Responsibility`, bn: `Responsibility` },
      body: { en: `Each provider is responsible for its own professional judgement, regulated obligations and deliverables. bdoor remains responsible for the coordination, platform and support commitments stated in its quotation. A customer must not be passed between bdoor and a provider without a clear owner for the complaint or next action.`, bn: `Each provider is responsible for its own professional judgement, regulated obligations and deliverables. bdoor remains responsible for the coordination, platform and support commitments stated in its quotation. A customer must not be passed between bdoor and a provider without a clear owner for the complaint or next action.` },
    },
    {
      id: '9-5',
      heading: { en: `Conflicts, quality and replacement`, bn: `Conflicts, quality and replacement` },
      body: { en: `Providers must disclose relevant conflicts and protect confidential information. bdoor may reassign a matter for conflict, capacity, quality, credential or risk reasons. A material change in provider, scope, fee or timing requires customer notice and, where appropriate, renewed consent.`, bn: `Providers must disclose relevant conflicts and protect confidential information. bdoor may reassign a matter for conflict, capacity, quality, credential or risk reasons. A material change in provider, scope, fee or timing requires customer notice and, where appropriate, renewed consent.` },
    },
    {
      id: '9-6',
      heading: { en: `No government endorsement`, bn: `No government endorsement` },
      body: { en: `An external provider’s registration or professional membership does not make bdoor government-approved or endorsed. Government and regulator logos must not be displayed without written permission.

---`, bn: `An external provider’s registration or professional membership does not make bdoor government-approved or endorsed. Government and regulator logos must not be displayed without written permission.

---` },
    },
  ],
};

export const ELECTRONIC_CONSENT: LegalDocument = {
  slug: 'electronic-consent',
  titleKey: 'legal.electronicConsent',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'overview',
      heading: { en: `Electronic Communications and Consent Policy`, bn: `Electronic Communications and Consent Policy` },
      body: { en: ``, bn: `` },
    },
  ],
};

export const LEGAL_DOCUMENTS = {
  terms: TERMS,
  privacy: PRIVACY,
  'refund-policy': REFUND_POLICY,
  'aml-kyc-policy': AML_KYC_POLICY,
  'cookie-policy': COOKIE_POLICY,
  'legal-disclaimer': LEGAL_DISCLAIMER,
  complaints: COMPLAINTS,
  'acceptable-use': ACCEPTABLE_USE,
  'provider-disclosure': PROVIDER_DISCLOSURE,
  'electronic-consent': ELECTRONIC_CONSENT,
} as const satisfies Record<string, LegalDocument>;

export function legalDocumentBySlug(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS[slug as keyof typeof LEGAL_DOCUMENTS];
}

/** Immutable content reference for acceptance records (draft gate). */
export const POLICY_VERSIONS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.values(LEGAL_DOCUMENTS).map((d) => [d.slug, d.version]),
);

