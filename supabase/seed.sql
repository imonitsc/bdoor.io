-- =============================================================================
-- BDoor development seed.
--
-- Everything here is FICTIONAL. There are no real names, national ID or
-- passport numbers, bank details, addresses, partner credentials or identity
-- documents in this file, and none may ever be added to it.
--
-- The auth.users rows below are created with an id and email only, so they
-- exist for foreign keys and RLS testing. They cannot sign in until a password
-- is set — run `pnpm exec tsx scripts/seed-auth-users.ts` against a project
-- with SUPABASE_SECRET_KEY to create real, signable accounts with the same ids.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-000000000001', 'founder.local@example.test'),
  ('11111111-1111-4111-8111-000000000002', 'founder.foreign@example.test'),
  ('11111111-1111-4111-8111-000000000003', 'colleague@example.test'),
  ('22222222-2222-4222-8222-000000000001', 'partner.owner@example.test'),
  ('22222222-2222-4222-8222-000000000002', 'partner.staff@example.test'),
  ('33333333-3333-4333-8333-000000000001', 'case.manager@bdoor.test'),
  ('33333333-3333-4333-8333-000000000002', 'compliance@bdoor.test'),
  ('33333333-3333-4333-8333-000000000003', 'finance@bdoor.test'),
  ('33333333-3333-4333-8333-000000000004', 'admin@bdoor.test')
on conflict (id) do nothing;

insert into public.profiles (id, full_name, email, preferred_locale, country_of_residence) values
  ('11111111-1111-4111-8111-000000000001', 'Anika Rahman (sample)', 'founder.local@example.test', 'bn', 'BD'),
  ('11111111-1111-4111-8111-000000000002', 'Jordan Miles (sample)', 'founder.foreign@example.test', 'en', 'SG'),
  ('11111111-1111-4111-8111-000000000003', 'Sabbir Hasan (sample)', 'colleague@example.test', 'bn', 'BD'),
  ('22222222-2222-4222-8222-000000000001', 'Adv. Nasrin Akter (sample)', 'partner.owner@example.test', 'en', 'BD'),
  ('22222222-2222-4222-8222-000000000002', 'Rafiul Karim (sample)', 'partner.staff@example.test', 'en', 'BD'),
  ('33333333-3333-4333-8333-000000000001', 'Case Manager (sample)', 'case.manager@bdoor.test', 'en', 'BD'),
  ('33333333-3333-4333-8333-000000000002', 'Compliance Officer (sample)', 'compliance@bdoor.test', 'en', 'BD'),
  ('33333333-3333-4333-8333-000000000003', 'Finance (sample)', 'finance@bdoor.test', 'en', 'BD'),
  ('33333333-3333-4333-8333-000000000004', 'Administrator (sample)', 'admin@bdoor.test', 'en', 'BD')
on conflict (id) do nothing;

insert into public.platform_roles (user_id, role) values
  ('33333333-3333-4333-8333-000000000001', 'case_manager'),
  ('33333333-3333-4333-8333-000000000002', 'compliance_officer'),
  ('33333333-3333-4333-8333-000000000003', 'finance'),
  ('33333333-3333-4333-8333-000000000004', 'admin')
on conflict do nothing;

-- Every staff account must carry MFA.
insert into public.user_security_settings (user_id, mfa_required)
select user_id, true from public.platform_roles
on conflict (user_id) do update set mfa_required = true;

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
insert into public.organizations (id, kind, name, slug, country, locale, created_by) values
  ('a0000000-0000-4000-8000-000000000001', 'customer', 'Padma Textiles (sample)', 'padma-textiles-sample', 'BD', 'bn',
   '11111111-1111-4111-8111-000000000001'),
  ('a0000000-0000-4000-8000-000000000002', 'customer', 'Northwind Sourcing Pte (sample)', 'northwind-sourcing-sample', 'SG', 'en',
   '11111111-1111-4111-8111-000000000002'),
  ('b0000000-0000-4000-8000-000000000001', 'partner', 'Meghna Legal Chambers (sample)', 'meghna-legal-sample', 'BD', 'en', null)
on conflict (id) do nothing;

insert into public.organization_memberships (organization_id, user_id, role) values
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-000000000001', 'customer_owner'),
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-000000000003', 'customer_member'),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-000000000002', 'customer_owner'),
  ('b0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-000000000001', 'partner_owner'),
  ('b0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-000000000002', 'partner_staff')
on conflict do nothing;

insert into public.partners (
  id, organization_id, legal_name, practice_type, geographic_coverage,
  contact_name, contact_email, verification_status,
  conflict_policy_accepted_at, dpa_accepted_at
) values (
  'b1000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'Meghna Legal Chambers (sample)',
  'law_firm',
  array['Dhaka', 'Chattogram'],
  'Adv. Nasrin Akter (sample)',
  'partner.owner@example.test',
  'verified',
  now() - interval '90 days',
  now() - interval '90 days'
) on conflict (id) do nothing;

insert into public.partner_verifications (partner_id, status, note, decided_by)
values ('b1000000-0000-4000-8000-000000000001', 'verified',
        'Sample verification record for development only.',
        '33333333-3333-4333-8333-000000000004')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Service catalog
-- ---------------------------------------------------------------------------
insert into public.service_categories (id, slug, name_en, name_bn, summary_en, summary_bn, icon, sort_order) values
  ('c0000000-0000-4000-8000-000000000001', 'company-formation', 'Company formation', 'কোম্পানি গঠন',
   'Register the right legal structure for what you actually plan to do.',
   'আপনি আসলে যা করতে চান, তার জন্য উপযুক্ত আইনি কাঠামো নিবন্ধন করুন।', 'building-2', 10),
  ('c0000000-0000-4000-8000-000000000002', 'licences', 'Trade and operating licences', 'ট্রেড ও পরিচালন লাইসেন্স',
   'The permissions you need before you can lawfully trade.',
   'বৈধভাবে ব্যবসা শুরুর আগে যেসব অনুমতি লাগে।', 'file-badge', 20),
  ('c0000000-0000-4000-8000-000000000003', 'import-export', 'Import and export registration', 'আমদানি ও রপ্তানি নিবন্ধন',
   'IRC, ERC and the bank steps that have to come first.',
   'IRC, ERC এবং যেসব ব্যাংক-ধাপ আগে সারতে হয়।', 'ship', 30),
  ('c0000000-0000-4000-8000-000000000004', 'tax-vat', 'Tax and VAT setup', 'কর ও ভ্যাট নিবন্ধন',
   'e-TIN, BIN/VAT registration and getting your filing calendar right.',
   'ই-টিআইএন, বিআইএন/ভ্যাট নিবন্ধন এবং রিটার্নের সময়সূচি ঠিক করা।', 'receipt', 40),
  ('c0000000-0000-4000-8000-000000000005', 'foreign-founders', 'Foreign-founder support', 'বিদেশি উদ্যোক্তা সহায়তা',
   'Ownership review, investment registration, remittance and visa support.',
   'মালিকানা যাচাই, বিনিয়োগ নিবন্ধন, রেমিট্যান্স ও ভিসা সহায়তা।', 'globe', 50),
  ('c0000000-0000-4000-8000-000000000006', 'compliance', 'Annual compliance and renewals', 'বার্ষিক কমপ্লায়েন্স ও নবায়ন',
   'Filings, renewals and the reminders that stop them being late.',
   'রিটার্ন, নবায়ন এবং সেগুলো যেন দেরি না হয় সেই রিমাইন্ডার।', 'calendar-check', 60)
on conflict (id) do nothing;

insert into public.services (
  id, category_id, slug, name_en, name_bn, summary_en, summary_bn,
  who_for_en, who_for_bn, included_en, included_bn, not_included_en, not_included_bn,
  eligibility_en, eligibility_bn, authority_name_en, authority_name_bn,
  starting_fee_bdt, estimated_days_min, estimated_days_max, time_reviewed_at,
  internal_source_ref, requires_partner, is_regulated, status, next_review_due, sort_order
) values
(
  'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
  'private-limited-company-incorporation',
  'Private limited company incorporation', 'প্রাইভেট লিমিটেড কোম্পানি নিবন্ধন',
  'The usual choice for a business with two or more shareholders and limited liability.',
  'দুই বা তার বেশি শেয়ারহোল্ডার এবং সীমিত দায়বদ্ধতার ব্যবসার জন্য প্রচলিত পছন্দ।',
  'Founders who want limited liability, a clear share structure, and the ability to bring in investors later.',
  'যাঁরা সীমিত দায়, স্পষ্ট শেয়ার কাঠামো এবং পরে বিনিয়োগকারী আনার সুযোগ চান।',
  array['Name clearance application', 'Memorandum and Articles of Association preparation',
        'Digital signature coordination', 'RJSC filing and follow-up',
        'Incorporation certificate delivery to your document vault'],
  array['নাম ছাড়পত্রের আবেদন', 'সংঘস্মারক ও সংঘবিধি প্রস্তুত',
        'ডিজিটাল স্বাক্ষরের সমন্বয়', 'RJSC-তে দাখিল ও ফলোআপ',
        'নিবন্ধন সনদ আপনার ডকুমেন্ট ভল্টে পৌঁছে দেওয়া'],
  array['Government fees, which are quoted separately at cost',
        'Trade licence, e-TIN and VAT registration (available as separate services)',
        'Bank account opening, which the bank decides',
        'Legal opinions or drafting beyond the standard constitutional documents'],
  array['সরকারি ফি, যা আলাদাভাবে প্রকৃত খরচে জানানো হয়',
        'ট্রেড লাইসেন্স, ই-টিআইএন ও ভ্যাট নিবন্ধন (আলাদা সেবা হিসেবে পাওয়া যায়)',
        'ব্যাংক হিসাব খোলা, যার সিদ্ধান্ত ব্যাংকের',
        'সাধারণ গঠনতান্ত্রিক দলিলের বাইরে আইনি মতামত বা খসড়া'],
  'At least two shareholders and two directors are usually required. Foreign shareholding, regulated activities and corporate shareholders are reviewed before we can confirm the path.',
  'সাধারণত অন্তত দুইজন শেয়ারহোল্ডার ও দুইজন পরিচালক প্রয়োজন। বিদেশি শেয়ারহোল্ডিং, নিয়ন্ত্রিত কার্যক্রম ও কর্পোরেট শেয়ারহোল্ডারের ক্ষেত্রে পথ নিশ্চিত করার আগে যাচাই করা হয়।',
  'Registrar of Joint Stock Companies and Firms (RJSC)', 'যৌথ মূলধন কোম্পানি ও ফার্মসমূহের পরিদপ্তর (RJSC)',
  25000, 7, 21, current_date - 20,
  'Internal process note BD-INC-2026-01. Verify RJSC schedule of fees before quoting.',
  false, false, 'published', current_date + 70, 10
),
(
  'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002',
  'trade-licence',
  'Trade licence', 'ট্রেড লাইসেন্স',
  'The local permission to operate from your business address.',
  'আপনার ব্যবসার ঠিকানা থেকে কার্যক্রম চালানোর স্থানীয় অনুমতি।',
  'Any business operating from a premises in Bangladesh, new or existing.',
  'বাংলাদেশে কোনো ঠিকানা থেকে পরিচালিত যেকোনো ব্যবসা, নতুন হোক বা চলমান।',
  array['Form preparation and document checklist', 'Submission to the relevant city corporation or municipality',
        'Follow-up until the licence is issued', 'Renewal reminder set up automatically'],
  array['ফরম প্রস্তুত ও কাগজপত্রের তালিকা', 'সংশ্লিষ্ট সিটি কর্পোরেশন বা পৌরসভায় দাখিল',
        'লাইসেন্স ইস্যু না হওয়া পর্যন্ত ফলোআপ', 'নবায়নের রিমাইন্ডার স্বয়ংক্রিয়ভাবে সেট করা'],
  array['The licence fee itself, which varies by location and business category',
        'Premises rent, utility connections or holding tax arrears',
        'Sector approvals for regulated activities'],
  array['লাইসেন্স ফি, যা অবস্থান ও ব্যবসার ধরন অনুযায়ী আলাদা',
        'ভাড়া, ইউটিলিটি সংযোগ বা হোল্ডিং ট্যাক্স বকেয়া',
        'নিয়ন্ত্রিত কার্যক্রমের খাতভিত্তিক অনুমোদন'],
  'You need a registrable business address and, for a company, your incorporation documents.',
  'নিবন্ধনযোগ্য একটি ঠিকানা লাগবে, আর কোম্পানির ক্ষেত্রে নিবন্ধনের কাগজপত্র।',
  'City corporation or municipality of your business location', 'আপনার ব্যবসার অবস্থানের সিটি কর্পোরেশন বা পৌরসভা',
  8000, 5, 15, current_date - 15,
  'Internal process note BD-TL-2026-01. Fee varies by category; never publish a single number.',
  false, false, 'published', current_date + 75, 10
),
(
  'd0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004',
  'etin-and-tax-setup',
  'e-TIN and initial tax setup', 'ই-টিআইএন ও প্রাথমিক কর সেটআপ',
  'Get your taxpayer identification in place and understand what you must file.',
  'করদাতা শনাক্তকরণ নম্বর নিন এবং কী কী দাখিল করতে হবে তা বুঝে নিন।',
  'Every company and most proprietors and directors.',
  'প্রতিটি কোম্পানি এবং অধিকাংশ মালিক ও পরিচালক।',
  array['e-TIN registration for the entity', 'e-TIN guidance for directors who need one',
        'Filing calendar added to your compliance page'],
  array['প্রতিষ্ঠানের জন্য ই-টিআইএন নিবন্ধন', 'যেসব পরিচালকের দরকার তাঁদের ই-টিআইএন নির্দেশনা',
        'আপনার কমপ্লায়েন্স পাতায় দাখিলের সময়সূচি যোগ'],
  array['Preparation or filing of income tax returns', 'Accounting, bookkeeping or audit',
        'Any tax advice, which is a separate professional engagement'],
  array['আয়কর রিটার্ন প্রস্তুত বা দাখিল', 'হিসাবরক্ষণ, বুককিপিং বা নিরীক্ষা',
        'কর বিষয়ক পরামর্শ, যা আলাদা পেশাদার চুক্তির বিষয়'],
  'Available once you have an incorporation certificate or a proprietorship trade licence.',
  'নিবন্ধন সনদ অথবা একক মালিকানার ট্রেড লাইসেন্স থাকলে এই সেবা নেওয়া যায়।',
  'National Board of Revenue (NBR)', 'জাতীয় রাজস্ব বোর্ড (NBR)',
  4000, 2, 7, current_date - 10,
  'Internal process note BD-TIN-2026-01.',
  false, false, 'published', current_date + 80, 10
),
(
  'd0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004',
  'bin-vat-registration',
  'BIN/VAT registration', 'বিআইএন/ভ্যাট নিবন্ধন',
  'Register for VAT where your turnover or activity requires it.',
  'টার্নওভার বা কার্যক্রমের কারণে যেখানে প্রয়োজন, সেখানে ভ্যাট নিবন্ধন।',
  'Businesses crossing the VAT threshold, importing, exporting, or supplying to VAT-registered buyers.',
  'যেসব ব্যবসা ভ্যাটের সীমা অতিক্রম করে, আমদানি-রপ্তানি করে, বা ভ্যাট-নিবন্ধিত ক্রেতাকে সরবরাহ করে।',
  array['Eligibility check against your activity and turnover', 'Application preparation and submission',
        'BIN certificate delivered to your vault'],
  array['আপনার কার্যক্রম ও টার্নওভারের ভিত্তিতে যোগ্যতা যাচাই', 'আবেদন প্রস্তুত ও দাখিল',
        'বিআইএন সনদ আপনার ভল্টে পৌঁছে দেওয়া'],
  array['Monthly VAT return preparation', 'VAT advisory or classification opinions',
        'Any penalty arising from earlier periods'],
  array['মাসিক ভ্যাট রিটার্ন প্রস্তুত', 'ভ্যাট পরামর্শ বা শ্রেণিবিন্যাস মতামত',
        'আগের সময়ের কোনো জরিমানা'],
  'Requires an active e-TIN and, in most cases, a trade licence and bank account.',
  'সক্রিয় ই-টিআইএন এবং সাধারণত ট্রেড লাইসেন্স ও ব্যাংক হিসাব থাকতে হবে।',
  'National Board of Revenue (NBR)', 'জাতীয় রাজস্ব বোর্ড (NBR)',
  6000, 3, 10, current_date - 10,
  'Internal process note BD-VAT-2026-01.',
  false, false, 'published', current_date + 80, 20
),
(
  'd0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003',
  'import-registration-certificate',
  'Commercial Import Registration Certificate (IRC)', 'বাণিজ্যিক আমদানি নিবন্ধন সনদ (IRC)',
  'The registration you need before you can import commercially.',
  'বাণিজ্যিকভাবে আমদানি শুরুর আগে যে নিবন্ধন লাগে।',
  'Businesses importing goods into Bangladesh for trade.',
  'যেসব ব্যবসা বাণিজ্যের জন্য বাংলাদেশে পণ্য আমদানি করে।',
  array['Document checklist and preparation', 'Bank solvency and association membership coordination',
        'Submission to CCI&E and follow-up', 'Certificate delivered to your vault'],
  array['কাগজপত্রের তালিকা ও প্রস্তুতি', 'ব্যাংক সচ্ছলতা ও অ্যাসোসিয়েশন সদস্যপদের সমন্বয়',
        'CCI&E-তে দাখিল ও ফলোআপ', 'সনদ আপনার ভল্টে পৌঁছে দেওয়া'],
  array['Association membership fees', 'Bank charges and solvency certificate fees',
        'Customs clearance or freight, which are separate services'],
  array['অ্যাসোসিয়েশন সদস্যপদ ফি', 'ব্যাংক চার্জ ও সচ্ছলতা সনদের ফি',
        'শুল্ক ছাড়করণ বা ফ্রেইট, যা আলাদা সেবা'],
  'You need a trade licence, e-TIN, BIN and a bank account before this can be filed.',
  'দাখিলের আগে ট্রেড লাইসেন্স, ই-টিআইএন, বিআইএন ও ব্যাংক হিসাব থাকতে হবে।',
  'Office of the Chief Controller of Imports and Exports (CCI&E)', 'আমদানি ও রপ্তানি প্রধান নিয়ন্ত্রকের দপ্তর (CCI&E)',
  15000, 10, 25, current_date - 25,
  'Internal process note BD-IRC-2026-01.',
  false, false, 'published', current_date + 65, 10
),
(
  'd0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000005',
  'foreign-ownership-eligibility-review',
  'Foreign ownership and sector eligibility review', 'বিদেশি মালিকানা ও খাত যোগ্যতা যাচাই',
  'Before you spend anything: can you own what you want to own, in this sector?',
  'খরচ করার আগেই জেনে নিন: এই খাতে আপনি যা চান তার মালিক হতে পারবেন কি না।',
  'Non-resident founders, foreign companies and anyone with a corporate shareholder.',
  'অনিবাসী উদ্যোক্তা, বিদেশি কোম্পানি এবং যাঁদের কর্পোরেট শেয়ারহোল্ডার আছে।',
  array['Structured review of your intended activity and ownership by a partner advocate',
        'A written note on the structure options open to you',
        'A list of the approvals your plan would need, in order'],
  array['অংশীদার আইনজীবীর মাধ্যমে আপনার কার্যক্রম ও মালিকানার কাঠামোবদ্ধ যাচাই',
        'আপনার জন্য খোলা কাঠামোগত বিকল্প নিয়ে লিখিত নোট',
        'আপনার পরিকল্পনার জন্য যে অনুমোদনগুলো লাগবে, ক্রম অনুযায়ী তালিকা'],
  array['Any guarantee of approval', 'The incorporation itself, quoted separately',
        'Immigration outcomes, which are decided by the authorities'],
  array['অনুমোদনের কোনো নিশ্চয়তা', 'কোম্পানি গঠন, যা আলাদাভাবে কোট করা হয়',
        'অভিবাসন সংক্রান্ত ফলাফল, যার সিদ্ধান্ত কর্তৃপক্ষের'],
  'Open to any prospective foreign founder. Some sectors are restricted or capped; that is exactly what this review establishes.',
  'যেকোনো সম্ভাব্য বিদেশি উদ্যোক্তার জন্য উন্মুক্ত। কিছু খাত সীমাবদ্ধ বা সীমা-নির্ধারিত; এই যাচাই ঠিক সেটিই নির্ধারণ করে।',
  'Bangladesh Investment Development Authority (BIDA) and sector regulators',
  'বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষ (BIDA) ও খাতভিত্তিক নিয়ন্ত্রক',
  null, null, null, null,
  'Partner-delivered. Quoted per matter; never publish a fixed fee.',
  true, false, 'published', current_date + 60, 10
),
(
  'd0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000006',
  'rjsc-annual-return',
  'RJSC annual filings and company changes', 'RJSC বার্ষিক রিটার্ন ও কোম্পানির পরিবর্তন',
  'Keep the register accurate: annual returns, director changes, share transfers.',
  'নিবন্ধন হালনাগাদ রাখুন: বার্ষিক রিটার্ন, পরিচালক পরিবর্তন, শেয়ার হস্তান্তর।',
  'Every registered company, every year.',
  'প্রতিটি নিবন্ধিত কোম্পানি, প্রতি বছর।',
  array['Annual return preparation and filing', 'Schedule X and related forms',
        'Director, address and share-structure changes when they happen',
        'Deadline reminders on your compliance calendar'],
  array['বার্ষিক রিটার্ন প্রস্তুত ও দাখিল', 'তফসিল X ও সংশ্লিষ্ট ফরম',
        'পরিচালক, ঠিকানা ও শেয়ার কাঠামোর পরিবর্তন যখন ঘটে',
        'আপনার কমপ্লায়েন্স ক্যালেন্ডারে সময়সীমার রিমাইন্ডার'],
  array['Statutory audit, which a chartered accountant must perform',
        'Late-filing penalties for periods before you engaged us'],
  array['বিধিবদ্ধ নিরীক্ষা, যা একজন চার্টার্ড অ্যাকাউন্ট্যান্টকে করতে হয়',
        'আমাদের নিয়োগের আগের সময়ের বিলম্ব জরিমানা'],
  'Requires an incorporated company and its audited accounts where applicable.',
  'নিবন্ধিত কোম্পানি এবং প্রযোজ্য ক্ষেত্রে নিরীক্ষিত হিসাব প্রয়োজন।',
  'Registrar of Joint Stock Companies and Firms (RJSC)', 'যৌথ মূলধন কোম্পানি ও ফার্মসমূহের পরিদপ্তর (RJSC)',
  12000, 5, 15, current_date - 30,
  'Internal process note BD-AR-2026-01.',
  false, false, 'published', current_date + 60, 10
),
(
  'd0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000002',
  'travel-agency-registration',
  'Travel agency registration', 'ট্রাভেল এজেন্সি নিবন্ধন',
  'Sector registration for travel businesses.',
  'ভ্রমণ ব্যবসার জন্য খাতভিত্তিক নিবন্ধন।',
  'Businesses selling travel services from Bangladesh.',
  'বাংলাদেশ থেকে ভ্রমণ সেবা বিক্রি করে এমন ব্যবসা।',
  array[]::text[], array[]::text[], array[]::text[], array[]::text[],
  'This is a regulated activity with its own eligibility conditions, security deposit and premises requirements. We will confirm what applies to you after review.',
  'এটি একটি নিয়ন্ত্রিত কার্যক্রম, যার নিজস্ব যোগ্যতার শর্ত, জামানত ও কার্যালয় সংক্রান্ত প্রয়োজনীয়তা আছে। যাচাইয়ের পর আপনার ক্ষেত্রে কী প্রযোজ্য তা আমরা নিশ্চিত করব।',
  'Ministry of Civil Aviation and Tourism', 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
  null, null, null, null,
  'Not yet open. Confirm current eligibility rules before launching.',
  true, true, 'coming_soon', current_date + 30, 90
)
on conflict (id) do nothing;

-- Requirements
insert into public.service_requirements (service_id, code, label_en, label_bn, applies_to, is_mandatory, sort_order) values
  ('d0000000-0000-4000-8000-000000000001', 'nid_or_passport', 'National ID or passport', 'জাতীয় পরিচয়পত্র বা পাসপোর্ট', 'director', true, 10),
  ('d0000000-0000-4000-8000-000000000001', 'photo', 'Passport-size photograph', 'পাসপোর্ট সাইজের ছবি', 'director', true, 20),
  ('d0000000-0000-4000-8000-000000000001', 'etin_director', 'Director e-TIN certificate', 'পরিচালকের ই-টিআইএন সনদ', 'director', false, 30),
  ('d0000000-0000-4000-8000-000000000001', 'name_options', 'Three proposed company names', 'প্রস্তাবিত তিনটি কোম্পানির নাম', 'company', true, 40),
  ('d0000000-0000-4000-8000-000000000001', 'registered_address', 'Proof of registered address', 'নিবন্ধিত ঠিকানার প্রমাণ', 'premises', true, 50),
  ('d0000000-0000-4000-8000-000000000002', 'incorporation_certificate', 'Incorporation certificate or proprietorship details', 'নিবন্ধন সনদ বা একক মালিকানার তথ্য', 'company', true, 10),
  ('d0000000-0000-4000-8000-000000000002', 'premises_proof', 'Rental agreement or ownership deed', 'ভাড়ার চুক্তি বা মালিকানার দলিল', 'premises', true, 20),
  ('d0000000-0000-4000-8000-000000000005', 'trade_licence_copy', 'Current trade licence', 'চলতি ট্রেড লাইসেন্স', 'company', true, 10),
  ('d0000000-0000-4000-8000-000000000005', 'bank_solvency', 'Bank solvency certificate', 'ব্যাংক সচ্ছলতা সনদ', 'company', true, 20)
on conflict do nothing;

-- Milestone templates
insert into public.service_milestone_templates (service_id, code, label_en, label_bn, owner_kind, typical_days, weight, sort_order) values
  ('d0000000-0000-4000-8000-000000000001', 'kyc_complete', 'Identity and ownership checks complete', 'পরিচয় ও মালিকানা যাচাই সম্পন্ন', 'bdoor', 3, 2, 10),
  ('d0000000-0000-4000-8000-000000000001', 'name_clearance', 'Name clearance obtained', 'নাম ছাড়পত্র গ্রহণ', 'authority', 3, 2, 20),
  ('d0000000-0000-4000-8000-000000000001', 'documents_signed', 'Constitutional documents signed', 'গঠনতান্ত্রিক দলিলে স্বাক্ষর', 'customer', 3, 2, 30),
  ('d0000000-0000-4000-8000-000000000001', 'rjsc_submitted', 'Filed with RJSC', 'RJSC-তে দাখিল', 'bdoor', 2, 3, 40),
  ('d0000000-0000-4000-8000-000000000001', 'certificate_issued', 'Incorporation certificate issued', 'নিবন্ধন সনদ ইস্যু', 'authority', 7, 3, 50),
  ('d0000000-0000-4000-8000-000000000002', 'application_prepared', 'Application prepared', 'আবেদন প্রস্তুত', 'bdoor', 2, 1, 10),
  ('d0000000-0000-4000-8000-000000000002', 'submitted_to_authority', 'Submitted to the local authority', 'স্থানীয় কর্তৃপক্ষে দাখিল', 'bdoor', 1, 2, 20),
  ('d0000000-0000-4000-8000-000000000002', 'licence_issued', 'Licence issued', 'লাইসেন্স ইস্যু', 'authority', 7, 3, 30)
on conflict do nothing;

-- Fee components. Government amounts are deliberately left NULL: we do not
-- publish a government fee until an admin has entered a verified figure with a
-- source and a review date.
insert into public.service_fee_components
  (service_id, category, label_en, label_bn, payee, amount_bdt, is_estimate, is_refundable, tax_treatment, source_ref, reviewed_at, sort_order)
values
  ('d0000000-0000-4000-8000-000000000001', 'platform_service_fee', 'BDoor service fee', 'BDoor সেবা ফি', 'bdoor', 25000, false, false, 'exclusive', null, null, 10),
  ('d0000000-0000-4000-8000-000000000001', 'government_fee_estimate', 'RJSC registration fees', 'RJSC নিবন্ধন ফি', 'government_authority', null, true, true, 'not_applicable', null, null, 20),
  ('d0000000-0000-4000-8000-000000000001', 'third_party_cost', 'Digital signature certificate', 'ডিজিটাল স্বাক্ষর সনদ', 'third_party', null, true, false, 'exclusive', null, null, 30),
  ('d0000000-0000-4000-8000-000000000002', 'platform_service_fee', 'BDoor service fee', 'BDoor সেবা ফি', 'bdoor', 8000, false, false, 'exclusive', null, null, 10),
  ('d0000000-0000-4000-8000-000000000002', 'government_fee_estimate', 'Local authority licence fee', 'স্থানীয় কর্তৃপক্ষের লাইসেন্স ফি', 'government_authority', null, true, true, 'not_applicable', null, null, 20),
  ('d0000000-0000-4000-8000-000000000006', 'partner_professional_fee', 'Partner advocate review fee', 'অংশীদার আইনজীবীর যাচাই ফি', 'partner_firm', null, true, false, 'exclusive', null, null, 10)
on conflict do nothing;

commit;

-- =============================================================================
-- Part 2 — FAQs, editorial content, cases, quotes, documents, compliance.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- FAQs. Anything compliance-sensitive carries a review date and a source.
-- ---------------------------------------------------------------------------
insert into public.service_faqs
  (question_en, question_bn, answer_en, answer_bn, is_global, is_compliance_sensitive,
   internal_source_ref, last_reviewed_at, status, sort_order)
values
(
  'Can a foreign national own a company in Bangladesh?',
  'বিদেশি নাগরিক কি বাংলাদেশে কোম্পানির মালিক হতে পারেন?',
  'In many sectors, yes — foreign shareholding is permitted, and in some it can be up to full ownership. But some sectors are restricted, capped or closed, and the answer depends on exactly what the business will do. We arrange a partner review of your specific activity and ownership before you commit to anything.',
  'অনেক খাতেই হ্যাঁ — বিদেশি শেয়ারহোল্ডিং অনুমোদিত, কোথাও কোথাও শতভাগ মালিকানাও সম্ভব। তবে কিছু খাত সীমাবদ্ধ, সীমা-নির্ধারিত বা বন্ধ, আর উত্তরটা নির্ভর করে ব্যবসাটি ঠিক কী করবে তার ওপর। আপনি কিছুতে প্রতিশ্রুতিবদ্ধ হওয়ার আগেই আমরা আপনার নির্দিষ্ট কার্যক্রম ও মালিকানার অংশীদার-যাচাইয়ের ব্যবস্থা করি।',
  true, true, 'Internal note FAQ-FOREIGN-OWN-2026-01. Re-verify sector restrictions each quarter.',
  current_date - 20, 'published', 10
),
(
  'Does registering a company give me a visa or work permit?',
  'কোম্পানি নিবন্ধন করলে কি ভিসা বা ওয়ার্ক পারমিট পাওয়া যায়?',
  'No. Incorporation and immigration are separate processes decided by different authorities. Owning shares in a Bangladeshi company does not by itself give you the right to live or work in Bangladesh. Visa and work-permit applications are their own applications, with their own conditions and their own outcome.',
  'না। কোম্পানি গঠন ও অভিবাসন আলাদা প্রক্রিয়া, সিদ্ধান্ত নেয় ভিন্ন কর্তৃপক্ষ। বাংলাদেশি কোম্পানির শেয়ার থাকা মানেই বাংলাদেশে বসবাস বা কাজ করার অধিকার নয়। ভিসা ও ওয়ার্ক পারমিট আলাদা আবেদন, যার নিজস্ব শর্ত ও নিজস্ব ফলাফল আছে।',
  true, true, 'Internal note FAQ-VISA-2026-01.', current_date - 20, 'published', 20
),
(
  'Are government fees included in your price?',
  'আপনাদের মূল্যে কি সরকারি ফি অন্তর্ভুক্ত?',
  'No. Our service fee and government fees are always shown as separate lines. Government fees vary with capital, location and category, so we show them as an estimate until the authority issues a receipt. When we pay a fee on your behalf we attach the official receipt or challan to your case, and any unused advance is returned to you.',
  'না। আমাদের সেবা ফি ও সরকারি ফি সবসময় আলাদা লাইনে দেখানো হয়। মূলধন, অবস্থান ও শ্রেণি অনুযায়ী সরকারি ফি বদলায়, তাই কর্তৃপক্ষ রসিদ না দেওয়া পর্যন্ত আমরা সেটি আনুমানিক হিসেবে দেখাই। আপনার পক্ষে ফি পরিশোধ করলে সরকারি রসিদ বা চালান আপনার কেসে সংযুক্ত করি, আর অব্যবহৃত অগ্রিম ফেরত দিই।',
  true, false, null, current_date - 10, 'published', 30
),
(
  'Who does the legal work?',
  'আইনি কাজটা কে করেন?',
  'BDoor is not a law firm. We coordinate your case, hold your documents and manage the process. Where a matter needs legal or specialist authority — drafting, representation, regulated filings — a verified partner advocate or firm is engaged under a separate agreement with you. We tell you which partner, and what they will receive, before anything is shared.',
  'BDoor কোনো আইনি প্রতিষ্ঠান নয়। আমরা আপনার কেস সমন্বয় করি, কাগজপত্র রাখি এবং প্রক্রিয়াটি পরিচালনা করি। যেখানে আইনি বা বিশেষায়িত কর্তৃত্ব দরকার — খসড়া প্রণয়ন, প্রতিনিধিত্ব, নিয়ন্ত্রিত দাখিল — সেখানে যাচাইকৃত অংশীদার আইনজীবী বা প্রতিষ্ঠান আপনার সঙ্গে আলাদা চুক্তিতে যুক্ত হন। কোনো কিছু শেয়ার করার আগেই আমরা জানাই কোন অংশীদার এবং তাঁরা কী পাবেন।',
  true, false, null, current_date - 10, 'published', 40
),
(
  'How long does registration take?',
  'নিবন্ধনে কত সময় লাগে?',
  'It depends on the structure, whether there is foreign ownership, and how quickly complete documents arrive. Each service page shows an estimated range and the date that estimate was last reviewed. That range assumes complete documents and a successful review; it is not a guarantee, and the clock pauses while we are waiting on you, a partner or an authority.',
  'এটি নির্ভর করে কাঠামো, বিদেশি মালিকানা আছে কি না, এবং সম্পূর্ণ কাগজপত্র কত দ্রুত আসে তার ওপর। প্রতিটি সেবার পাতায় আনুমানিক সময়সীমা এবং সেটি সর্বশেষ কবে পর্যালোচনা হয়েছে তা দেখানো থাকে। এই হিসাব সম্পূর্ণ কাগজপত্র ও সফল যাচাই ধরে নিয়ে; এটি নিশ্চয়তা নয়, আর আপনার, অংশীদারের বা কর্তৃপক্ষের অপেক্ষায় থাকলে ঘড়ি থেমে থাকে।',
  true, false, null, current_date - 10, 'published', 50
),
(
  'How are my documents protected?',
  'আমার কাগজপত্র কীভাবে সুরক্ষিত থাকে?',
  'Documents go into private storage, never a public link and never email. Download links are short-lived and every view, download and replacement is logged with who did it and when. Your assigned BDoor case team can see them; a partner can only see them after you have authorised that specific sharing, and we show you which partner and why.',
  'কাগজপত্র যায় ব্যক্তিগত স্টোরেজে — কখনো পাবলিক লিঙ্কে বা ইমেইলে নয়। ডাউনলোড লিঙ্ক স্বল্পস্থায়ী, আর প্রতিটি দেখা, ডাউনলোড ও প্রতিস্থাপন কে কখন করল তা নথিভুক্ত হয়। আপনার নিযুক্ত BDoor কেস টিম এগুলো দেখতে পায়; অংশীদার দেখতে পান কেবল আপনি ওই নির্দিষ্ট শেয়ারিং অনুমোদন করার পর, এবং কোন অংশীদার ও কেন তা আমরা আপনাকে জানাই।',
  true, false, null, current_date - 10, 'published', 60
),
(
  'Can BDoor guarantee approval?',
  'BDoor কি অনুমোদনের নিশ্চয়তা দিতে পারে?',
  'No, and nobody honestly can. Approval is a decision for the relevant authority. What we can do is make sure your application is complete, correct and submitted properly, tell you plainly if we think something will not be approved, and keep you informed if a query is raised.',
  'না, এবং সততার সঙ্গে কেউই পারে না। অনুমোদনের সিদ্ধান্ত সংশ্লিষ্ট কর্তৃপক্ষের। আমরা যা পারি তা হলো আপনার আবেদন সম্পূর্ণ, নির্ভুল ও যথাযথভাবে দাখিল করা, কোনো কিছু অনুমোদিত হবে না মনে হলে সরাসরি বলা, এবং কোনো প্রশ্ন উঠলে আপনাকে জানানো।',
  true, true, 'Internal note FAQ-GUARANTEE-2026-01. Never soften this answer.',
  current_date - 20, 'published', 70
)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Resource guides
-- ---------------------------------------------------------------------------
insert into public.content_pages
  (slug, kind, title_en, title_bn, excerpt_en, excerpt_bn, body_en, body_bn,
   status, is_compliance_sensitive, last_reviewed_at, next_review_due, published_at, reading_minutes)
values
(
  'choosing-a-structure', 'resource',
  'Choosing a structure: private limited, partnership or proprietorship',
  'কাঠামো বাছাই: প্রাইভেট লিমিটেড, পার্টনারশিপ নাকি একক মালিকানা',
  'The practical differences that actually change your day-to-day, not the textbook ones.',
  'পাঠ্যবইয়ের নয় — বাস্তবে আপনার দৈনন্দিন কাজ যেগুলোর জন্য বদলে যায়, সেই পার্থক্যগুলো।',
  E'## Start from what you are actually doing\n\nMost founders pick a structure because someone told them to. That is backwards. The structure should follow three things: how many people own the business, whether you need limited liability, and whether anyone will ever invest.\n\n## Private limited company\n\nThe default for a business with two or more owners. Liability is limited to what you put in, shares can be transferred, and investors understand it. In exchange you accept annual filings, a statutory audit and a registered office.\n\n## Partnership\n\nSimpler to set up and cheaper to run, but partners are personally liable. Reasonable for a professional practice between people who trust each other completely. Rarely the right answer if you plan to raise money.\n\n## Sole proprietorship\n\nThere is no separate legal person: the business is you. That means the fastest start and the least paperwork, and also that a business debt is your debt. Fine for a small trading or service operation you run yourself.\n\n## What actually changes your mind\n\n- **Foreign ownership.** A proprietorship is not the route. If a non-resident will own part of the business, you are almost certainly looking at a company.\n- **A corporate shareholder.** Only a company can hold shares in a company.\n- **Bank and buyer expectations.** Larger buyers and most banks are more comfortable with an incorporated entity.\n\nIf you are unsure, answer the questionnaire and say so — "I''m not sure" is a valid answer and we will come back with a recommendation rather than a guess.',
  E'## যা আসলে করছেন, সেখান থেকে শুরু করুন\n\nবেশিরভাগ উদ্যোক্তা কাঠামো বাছেন কারণ কেউ একজন বলেছে। এটা উল্টো পথ। কাঠামো ঠিক হওয়া উচিত তিনটি বিষয় দেখে: কতজন মালিক, সীমিত দায় দরকার কি না, আর কখনো কেউ বিনিয়োগ করবে কি না।\n\n## প্রাইভেট লিমিটেড কোম্পানি\n\nদুই বা তার বেশি মালিকের ব্যবসার জন্য সাধারণ পছন্দ। দায় সীমাবদ্ধ থাকে আপনার বিনিয়োগ পর্যন্ত, শেয়ার হস্তান্তরযোগ্য, আর বিনিয়োগকারীরা এই কাঠামো বোঝেন। বিনিময়ে মেনে নিতে হয় বার্ষিক রিটার্ন, বিধিবদ্ধ নিরীক্ষা ও নিবন্ধিত কার্যালয়।\n\n## পার্টনারশিপ\n\nগঠন সহজ, চালানো সস্তা, কিন্তু অংশীদাররা ব্যক্তিগতভাবে দায়ী। পরস্পরের ওপর পূর্ণ আস্থা আছে এমন পেশাজীবীদের যৌথ প্র্যাকটিসের জন্য যুক্তিসঙ্গত। টাকা তুলতে চাইলে সাধারণত এটি সঠিক উত্তর নয়।\n\n## একক মালিকানা\n\nএখানে আলাদা কোনো আইনি সত্তা নেই: ব্যবসাটাই আপনি। মানে সবচেয়ে দ্রুত শুরু আর সবচেয়ে কম কাগজপত্র, আবার ব্যবসার দেনাও আপনারই দেনা। নিজে চালানো ছোট ব্যবসা বা সেবার জন্য ঠিক আছে।\n\n## যা আসলে সিদ্ধান্ত বদলে দেয়\n\n- **বিদেশি মালিকানা।** একক মালিকানা এখানে পথ নয়। কোনো অনিবাসী ব্যবসার অংশীদার হলে প্রায় নিশ্চিতভাবেই কোম্পানির দিকেই যেতে হবে।\n- **কর্পোরেট শেয়ারহোল্ডার।** কোম্পানির শেয়ার কেবল কোম্পানিই ধরে রাখতে পারে।\n- **ব্যাংক ও ক্রেতার প্রত্যাশা।** বড় ক্রেতা ও অধিকাংশ ব্যাংক নিবন্ধিত প্রতিষ্ঠানেই বেশি স্বাচ্ছন্দ্য বোধ করেন।\n\nনিশ্চিত না হলে প্রশ্নমালায় সেটাই লিখুন — “নিশ্চিত নই” একটি বৈধ উত্তর, আর আমরা অনুমান না করে সুপারিশ নিয়ে ফিরব।',
  'published', true, current_date - 25, current_date + 65, now() - interval '25 days', 6
),
(
  'documents-you-will-need', 'resource',
  'The documents you will actually be asked for',
  'আপনার কাছে আসলে যেসব কাগজ চাওয়া হবে',
  'A realistic checklist, and why each item is requested.',
  'বাস্তবসম্মত একটি তালিকা, আর প্রতিটি কাগজ কেন চাওয়া হয়।',
  E'## Why we ask for so much up front\n\nTwo reasons. First, registrations fail on missing paperwork far more often than on anything substantive. Second, we are required to identify who is behind a business before we act for them — that is an anti-money-laundering obligation, not administrative curiosity.\n\n## For every person involved\n\n- **National ID or passport.** Identity, nationality and date of birth.\n- **Photograph.** Required by several forms.\n- **Proof of address.** A recent utility bill or bank statement is usually accepted.\n- **e-TIN.** Where the person needs one.\n\n## For the business\n\n- **Proposed names.** Bring three, in order of preference.\n- **Registered address evidence.** A rental agreement or ownership deed.\n- **Activity description.** In plain language. This decides which licences apply.\n\n## Where a company owns part of the business\n\nWe will need that company''s incorporation documents, its register of members, and enough of its ownership chain to identify the people who ultimately control it. If that chain runs through several countries, expect this step to take longer.\n\n## What we do not want\n\nDo not email documents. Do not send originals. Do not upload anything that is not asked for — collecting more than we need is a liability for both of us.',
  E'## শুরুতেই এত কিছু কেন চাই\n\nদুটি কারণ। প্রথমত, নিবন্ধন আটকে যায় মূল বিষয়ের চেয়ে অনেক বেশি বার কাগজপত্রের ঘাটতিতে। দ্বিতীয়ত, কারও পক্ষে কাজ করার আগে ব্যবসার পেছনে কারা আছেন তা শনাক্ত করা আমাদের বাধ্যবাধকতা — এটি মানি লন্ডারিং প্রতিরোধের দায়, নিছক কৌতূহল নয়।\n\n## সংশ্লিষ্ট প্রত্যেকের জন্য\n\n- **জাতীয় পরিচয়পত্র বা পাসপোর্ট।** পরিচয়, নাগরিকত্ব ও জন্মতারিখ।\n- **ছবি।** একাধিক ফরমে প্রয়োজন হয়।\n- **ঠিকানার প্রমাণ।** সাম্প্রতিক ইউটিলিটি বিল বা ব্যাংক স্টেটমেন্ট সাধারণত গ্রহণযোগ্য।\n- **ই-টিআইএন।** যাঁর প্রয়োজন, তাঁর জন্য।\n\n## ব্যবসার জন্য\n\n- **প্রস্তাবিত নাম।** পছন্দের ক্রম অনুযায়ী তিনটি রাখুন।\n- **নিবন্ধিত ঠিকানার প্রমাণ।** ভাড়ার চুক্তি বা মালিকানার দলিল।\n- **কার্যক্রমের বিবরণ।** সহজ ভাষায়। এর ওপরই নির্ভর করে কোন লাইসেন্স লাগবে।\n\n## ব্যবসার অংশীদার যখন একটি কোম্পানি\n\nওই কোম্পানির নিবন্ধন দলিল, সদস্য তালিকা, এবং মালিকানার শৃঙ্খলের যতটুকু দরকার — যাতে শেষ পর্যন্ত কারা নিয়ন্ত্রণ করেন তা শনাক্ত করা যায় — সবই লাগবে। শৃঙ্খলটি একাধিক দেশ ছুঁয়ে গেলে এই ধাপে বেশি সময় লাগবে ধরে নিন।\n\n## যা আমরা চাই না\n\nকাগজ ইমেইল করবেন না। মূল কপি পাঠাবেন না। যা চাওয়া হয়নি তা আপলোড করবেন না — প্রয়োজনের বেশি তথ্য রাখা আমাদের দুজনের জন্যই ঝুঁকি।',
  'published', true, current_date - 15, current_date + 75, now() - interval '15 days', 5
),
(
  'foreign-investment-first-steps', 'resource',
  'Foreign investment: the order the steps have to happen in',
  'বিদেশি বিনিয়োগ: ধাপগুলো যে ক্রমে হতে হয়',
  'Most delays come from doing the right things in the wrong order.',
  'বেশিরভাগ দেরি হয় ঠিক কাজগুলো ভুল ক্রমে করার কারণে।',
  E'## The order matters more than the speed\n\nA foreign-invested company in Bangladesh involves a bank, a registrar, a revenue authority and sometimes an investment authority. Each expects something the previous step produced. Do them out of order and you will redo them.\n\n## A typical sequence\n\n1. **Eligibility review.** Can this activity be foreign-owned, and to what extent? Establish this before spending anything.\n2. **Name clearance.** Reserve the proposed company name.\n3. **Temporary bank account.** Opened in the proposed company''s name so capital can be received before the company legally exists.\n4. **Inward remittance.** Capital is sent from abroad into that account, and the bank issues an encashment certificate. **This money goes to the bank, never to BDoor.**\n5. **Incorporation.** Filed with the encashment certificate as evidence of capital.\n6. **Post-incorporation registrations.** Trade licence, e-TIN, BIN/VAT, and any sector licence.\n7. **Investment registration.** Where applicable, registered with the investment authority.\n\n## What this does not give you\n\nNone of the above is an immigration decision. If you intend to live or work in Bangladesh, a visa and usually a work permit are separate applications with their own requirements and their own outcome.\n\n## Where it usually goes wrong\n\n- Sending capital before the account exists in the right name.\n- Assuming the sector is open without checking.\n- Discovering a corporate shareholder''s ownership chain cannot be documented.',
  E'## গতি নয়, ক্রমটাই বেশি গুরুত্বপূর্ণ\n\nবাংলাদেশে বিদেশি-বিনিয়োগকৃত কোম্পানির সঙ্গে জড়িত থাকে ব্যাংক, নিবন্ধক, রাজস্ব কর্তৃপক্ষ এবং কখনো বিনিয়োগ কর্তৃপক্ষ। প্রত্যেকে চায় আগের ধাপে তৈরি হওয়া কিছু একটা। ক্রম উল্টে গেলে কাজ আবার করতে হবে।\n\n## সাধারণ ক্রম\n\n১. **যোগ্যতা যাচাই।** এই কার্যক্রমে বিদেশি মালিকানা চলে কি, চললে কতটুকু? খরচ করার আগেই নিশ্চিত হোন।\n২. **নাম ছাড়পত্র।** প্রস্তাবিত কোম্পানির নাম সংরক্ষণ করুন।\n৩. **অস্থায়ী ব্যাংক হিসাব।** প্রস্তাবিত কোম্পানির নামে খোলা হয়, যাতে কোম্পানি আইনত অস্তিত্ব পাওয়ার আগেই মূলধন গ্রহণ করা যায়।\n৪. **বিদেশ থেকে অর্থ প্রেরণ।** ওই হিসাবে বিদেশ থেকে মূলধন আসে, ব্যাংক এনক্যাশমেন্ট সার্টিফিকেট দেয়। **এই অর্থ যায় ব্যাংকে, কখনোই BDoor-এ নয়।**\n৫. **কোম্পানি গঠন।** মূলধনের প্রমাণ হিসেবে এনক্যাশমেন্ট সার্টিফিকেটসহ দাখিল।\n৬. **গঠন-পরবর্তী নিবন্ধন।** ট্রেড লাইসেন্স, ই-টিআইএন, বিআইএন/ভ্যাট এবং প্রযোজ্য খাত-লাইসেন্স।\n৭. **বিনিয়োগ নিবন্ধন।** প্রযোজ্য ক্ষেত্রে বিনিয়োগ কর্তৃপক্ষে নিবন্ধন।\n\n## এতে যা পাওয়া যায় না\n\nউপরের কোনোটিই অভিবাসনের সিদ্ধান্ত নয়। বাংলাদেশে থাকতে বা কাজ করতে চাইলে ভিসা এবং সাধারণত ওয়ার্ক পারমিট আলাদা আবেদন, যার নিজস্ব শর্ত ও নিজস্ব ফলাফল।\n\n## সাধারণত যেখানে ভুল হয়\n\n- সঠিক নামে হিসাব খোলার আগেই মূলধন পাঠানো।\n- যাচাই না করে ধরে নেওয়া যে খাতটি উন্মুক্ত।\n- কর্পোরেট শেয়ারহোল্ডারের মালিকানা-শৃঙ্খল নথিভুক্ত করা যাচ্ছে না, তা দেরিতে বোঝা।',
  'published', true, current_date - 5, current_date + 85, now() - interval '5 days', 7
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Retention rules
-- ---------------------------------------------------------------------------
insert into public.document_retention_rules (retention_category, label_en, label_bn, retain_years, legal_basis, allows_early_deletion) values
  ('standard', 'Standard case document', 'সাধারণ কেস ডকুমেন্ট', 6,
   'Retained while the customer relationship is active plus a contractual limitation period. Configure against final legal advice before launch.', true),
  ('aml_record', 'AML/KYC record', 'AML/KYC রেকর্ড', 5,
   'Customer due-diligence records must be retained for a statutory period after the relationship ends. Confirm the exact period with Bangladesh counsel before launch.', false),
  ('financial_record', 'Financial record', 'আর্থিক রেকর্ড', 6,
   'Accounting and tax records retention. Confirm the exact period with a chartered accountant before launch.', false),
  ('transient', 'Transient upload', 'অস্থায়ী আপলোড', 0,
   'Working copies with no retention requirement; deletable once superseded.', true)
on conflict (retention_category) do nothing;

-- ---------------------------------------------------------------------------
-- Platform settings and flags
-- ---------------------------------------------------------------------------
insert into public.platform_settings (key, value, description, is_public) values
  ('legal.policy_versions',
   '{"terms":"draft-2026-01","privacy":"draft-2026-01","refund":"draft-2026-01","aml_kyc":"draft-2026-01","disclaimer":"draft-2026-01"}'::jsonb,
   'Version stamps recorded against every acceptance. Bump when a policy changes.', true),
  ('legal.review_status',
   '{"reviewed_by_counsel":false,"note":"All legal pages are drafts pending review by qualified Bangladesh counsel."}'::jsonb,
   'Whether the legal pages have been signed off. Must be true before public launch.', true),
  ('quotes.default_validity_days', '14'::jsonb, 'How long a sent quote stays acceptable.', false),
  ('documents.max_upload_mb', '25'::jsonb, 'Maximum accepted upload size in megabytes.', true),
  ('documents.signed_url_ttl_seconds', '300'::jsonb, 'Lifetime of a document download link.', false),
  ('compliance.reminder_offsets_days', '[60, 30, 14, 7, 1]'::jsonb, 'When obligation reminders are scheduled.', false),
  ('pricing.display_currency', '"BDT"'::jsonb, 'Default display currency.', true),
  ('pricing.allow_usd_display', 'false'::jsonb, 'Show USD alongside BDT for foreign-founder quotes.', true)
on conflict (key) do nothing;

insert into public.feature_flags (key, description, is_enabled, rollout_note) values
  ('compliance_subscription', 'Recurring compliance subscription sign-up', false, 'Blocked until pricing is approved.'),
  ('ai_guide', 'BDoor Guide assistant surface', true, 'Runs on deterministic rules unless AI_PROVIDER is configured.'),
  ('google_sign_in', 'Google OAuth sign-in button', false, 'Enable once the OAuth client is configured in Supabase.'),
  ('usd_quotes', 'Allow USD quotes for foreign founders', false, 'Requires finance sign-off.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Recommendation rules (deterministic engine, no LLM required)
-- ---------------------------------------------------------------------------
insert into public.recommendation_rules (key, description, conditions, outcome, priority) values
(
  'foreign-founder-review',
  'Any foreign founder or foreign ownership needs a partner eligibility review first.',
  '{"any":[{"field":"founder_location","equals":"outside"},{"field":"foreign_owners","equals":true},{"field":"foreign_ownership_percent","gt":0}]}'::jsonb,
  '{"services":["foreign-ownership-eligibility-review"],"partnerQuestions":["Is the intended activity open to foreign ownership, and up to what percentage?"],"assumptions":["Foreign ownership rules depend on the exact activity, so this is confirmed by a partner before we quote."]}'::jsonb,
  10
),
(
  'entity-owner-manual-review',
  'A corporate, trust or fund shareholder always goes to manual review.',
  '{"all":[{"field":"entity_owner","equals":true}]}'::jsonb,
  '{"manualReview":true,"manualReviewReasons":["A corporate or trust shareholder requires the ultimate beneficial owners to be identified and documented."],"partnerQuestions":["Can the ownership chain of the corporate shareholder be fully documented?"]}'::jsonb,
  15
),
(
  'regulated-activity-manual-review',
  'Regulated sectors need eligibility confirmed before anything is promised.',
  '{"all":[{"field":"regulated_activity","equals":true}]}'::jsonb,
  '{"manualReview":true,"manualReviewReasons":["The activity appears to be in a regulated sector, which has its own eligibility conditions."],"assumptions":["Sector approval is a separate decision by the relevant regulator."]}'::jsonb,
  16
),
(
  'private-limited-default',
  'Two or more owners, no special circumstances: private limited company.',
  '{"all":[{"field":"owner_count","gte":2},{"field":"existing_business","equals":false}]}'::jsonb,
  '{"structure":"private_limited","services":["private-limited-company-incorporation","trade-licence","etin-and-tax-setup"]}'::jsonb,
  40
),
(
  'sole-proprietor-default',
  'One local owner, no foreign ownership, simple activity.',
  '{"all":[{"field":"owner_count","equals":1},{"field":"founder_location","equals":"bangladesh"},{"field":"foreign_owners","equals":false},{"field":"existing_business","equals":false}]}'::jsonb,
  '{"structure":"sole_proprietorship","services":["trade-licence","etin-and-tax-setup"],"assumptions":["A sole proprietorship has no separate legal personality, so business debts are personal debts."]}'::jsonb,
  45
),
(
  'import-adds-irc',
  'Importing requires an IRC, which itself requires a trade licence, TIN, BIN and bank account.',
  '{"any":[{"field":"import_export","equals":"import"},{"field":"import_export","equals":"both"}]}'::jsonb,
  '{"services":["import-registration-certificate","bin-vat-registration"],"assumptions":["An IRC can only be filed once the trade licence, e-TIN, BIN and a bank account are in place."]}'::jsonb,
  50
),
(
  'export-adds-erc',
  'Exporting requires an ERC.',
  '{"any":[{"field":"import_export","equals":"export"},{"field":"import_export","equals":"both"}]}'::jsonb,
  '{"services":["bin-vat-registration"],"partnerQuestions":["Confirm the current ERC application route for this product category."]}'::jsonb,
  51
),
(
  'work-in-bangladesh-note',
  'Founders intending to work in Bangladesh must be told incorporation is not immigration.',
  '{"all":[{"field":"founder_will_work","equals":true}]}'::jsonb,
  '{"assumptions":["Incorporation does not grant residency or work authorisation. A visa and usually a work permit are separate applications."],"partnerQuestions":["Which visa category fits the founder''s intended role?"]}'::jsonb,
  60
),
(
  'remittance-note',
  'Capital remittance has a required order of steps.',
  '{"all":[{"field":"remit_capital","equals":true}]}'::jsonb,
  '{"assumptions":["Investment capital is remitted to a bank account in the company''s name and evidenced by an encashment certificate. It is never paid to BDoor."]}'::jsonb,
  61
),
(
  'existing-business-compliance',
  'Existing companies start from compliance, not formation.',
  '{"all":[{"field":"existing_business","equals":true}]}'::jsonb,
  '{"services":["rjsc-annual-return"],"assumptions":["We work from your existing registrations rather than starting a new formation."]}'::jsonb,
  30
)
on conflict (key) do nothing;

commit;

-- =============================================================================
-- Part 3 — four cases in different states, with quotes, documents, messages,
-- submissions and compliance obligations.
-- =============================================================================

begin;

insert into public.companies (id, organization_id, legal_name, structure, status, currency) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Padma Textiles Limited (sample)', 'private_limited', 'incorporated', 'BDT'),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'Northwind Bangladesh Limited (sample)', 'private_limited', 'proposed', 'BDT')
on conflict (id) do nothing;

update public.companies
   set registration_no = 'C-SAMPLE-000001', incorporation_date = current_date - 400,
       authorized_capital = 5000000, paid_up_capital = 1000000
 where id = 'e0000000-0000-4000-8000-000000000001';

insert into public.company_addresses (company_id, kind, line1, city, district, country) values
  ('e0000000-0000-4000-8000-000000000001', 'registered', 'Sample House 1, Sample Road', 'Dhaka', 'Dhaka', 'BD')
on conflict do nothing;

insert into public.company_people (id, company_id, user_id, full_name, role, nationality, country_of_residence, is_signatory) values
  ('e1000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-000000000001', 'Anika Rahman (sample)', 'director', 'BD', 'BD', true),
  ('e1000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-000000000003', 'Sabbir Hasan (sample)', 'shareholder', 'BD', 'BD', false),
  ('e1000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-000000000002', 'Jordan Miles (sample)', 'director', 'SG', 'SG', true)
on conflict (id) do nothing;

insert into public.ownership_links (company_id, owner_person_id, ownership_percent, control_method) values
  ('e0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 70, 'shareholding'),
  ('e0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 30, 'shareholding'),
  ('e0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003', 100, 'shareholding')
on conflict do nothing;

insert into public.beneficial_owners
  (company_id, person_id, full_name, nationality, country_of_residence, effective_ownership_percent, control_description, declared_by)
values
  ('e0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001',
   'Anika Rahman (sample)', 'BD', 'BD', 70, 'Majority shareholder and director.',
   '11111111-1111-4111-8111-000000000001'),
  ('e0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003',
   'Jordan Miles (sample)', 'SG', 'SG', 100, 'Sole shareholder and director.',
   '11111111-1111-4111-8111-000000000002')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Cases
-- ---------------------------------------------------------------------------
insert into public.cases
  (id, reference, organization_id, company_id, title, status, waiting_on, waiting_since,
   estimated_days_min, estimated_days_max, assigned_manager_id, created_by, opened_at)
values
  -- 1. Draft
  ('f0000000-0000-4000-8000-000000000001', 'BD-2026-000101', 'a0000000-0000-4000-8000-000000000001',
   null, 'Trade licence renewal (sample draft)', 'draft', 'none', null, 5, 15,
   null, '11111111-1111-4111-8111-000000000001', now() - interval '2 days'),
  -- 2. Awaiting documents
  ('f0000000-0000-4000-8000-000000000002', 'BD-2026-000102', 'a0000000-0000-4000-8000-000000000002',
   'e0000000-0000-4000-8000-000000000002', 'Incorporation for Northwind Bangladesh (sample)',
   'documents_required', 'customer', now() - interval '3 days', 7, 21,
   '33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000002', now() - interval '18 days'),
  -- 3. Submitted, with an authority query
  ('f0000000-0000-4000-8000-000000000003', 'BD-2026-000103', 'a0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000001', 'Import Registration Certificate (sample)',
   'authority_query', 'authority', now() - interval '4 days', 10, 25,
   '33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000001', now() - interval '40 days'),
  -- 4. Approved, with compliance obligations
  ('f0000000-0000-4000-8000-000000000004', 'BD-2026-000104', 'a0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000001', 'Company incorporation (sample, completed)',
   'approved', 'none', null, 7, 21,
   '33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000001', now() - interval '400 days')
on conflict (id) do nothing;

update public.cases set elapsed_days_banked = 12 where id = 'f0000000-0000-4000-8000-000000000002';
update public.cases set elapsed_days_banked = 31 where id = 'f0000000-0000-4000-8000-000000000003';

insert into public.case_services (case_id, service_id, name_snapshot, is_primary) values
  ('f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'Trade licence', true),
  ('f0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'Private limited company incorporation', true),
  ('f0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000006', 'Foreign ownership and sector eligibility review', false),
  ('f0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000005', 'Commercial Import Registration Certificate (IRC)', true),
  ('f0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', 'Private limited company incorporation', true)
on conflict do nothing;

insert into public.case_participants (case_id, user_id, role) values
  ('f0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-000000000002', 'customer_contact'),
  ('f0000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-000000000001', 'case_manager'),
  ('f0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-000000000001', 'customer_contact'),
  ('f0000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-000000000001', 'case_manager')
on conflict do nothing;

-- Partner assigned to the foreign-founder case, with customer authorisation.
insert into public.case_partner_assignments
  (id, case_id, partner_org_id, status, scope_note, customer_authorized_at, customer_authorized_by,
   conflict_check_confirmed, offered_by, offered_at, responded_at)
values
  ('f1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002',
   'b0000000-0000-4000-8000-000000000001', 'accepted',
   'Foreign ownership eligibility review and constitutional document drafting.',
   now() - interval '12 days', '11111111-1111-4111-8111-000000000002',
   true, '33333333-3333-4333-8333-000000000001', now() - interval '14 days', now() - interval '13 days')
on conflict (id) do nothing;

-- Milestones
insert into public.case_milestones (case_id, code, label_en, label_bn, owner_kind, status, weight, sort_order, due_on, completed_at) values
  ('f0000000-0000-4000-8000-000000000002', 'kyc_complete', 'Identity and ownership checks complete', 'পরিচয় ও মালিকানা যাচাই সম্পন্ন', 'bdoor', 'complete', 2, 10, null, now() - interval '14 days'),
  ('f0000000-0000-4000-8000-000000000002', 'eligibility_review', 'Partner eligibility review', 'অংশীদারের যোগ্যতা যাচাই', 'partner', 'complete', 2, 20, null, now() - interval '9 days'),
  ('f0000000-0000-4000-8000-000000000002', 'name_clearance', 'Name clearance obtained', 'নাম ছাড়পত্র গ্রহণ', 'authority', 'in_progress', 2, 30, current_date + 4, null),
  ('f0000000-0000-4000-8000-000000000002', 'documents_signed', 'Constitutional documents signed', 'গঠনতান্ত্রিক দলিলে স্বাক্ষর', 'customer', 'blocked', 2, 40, current_date + 6, null),
  ('f0000000-0000-4000-8000-000000000002', 'rjsc_submitted', 'Filed with RJSC', 'RJSC-তে দাখিল', 'bdoor', 'pending', 3, 50, null, null),
  ('f0000000-0000-4000-8000-000000000002', 'certificate_issued', 'Incorporation certificate issued', 'নিবন্ধন সনদ ইস্যু', 'authority', 'pending', 3, 60, null, null),
  ('f0000000-0000-4000-8000-000000000003', 'documents_collected', 'Supporting documents collected', 'সহায়ক কাগজপত্র সংগ্রহ', 'customer', 'complete', 2, 10, null, now() - interval '30 days'),
  ('f0000000-0000-4000-8000-000000000003', 'application_filed', 'Application filed with CCI&E', 'CCI&E-তে আবেদন দাখিল', 'bdoor', 'complete', 3, 20, null, now() - interval '12 days'),
  ('f0000000-0000-4000-8000-000000000003', 'query_response', 'Respond to authority query', 'কর্তৃপক্ষের প্রশ্নের জবাব', 'bdoor', 'in_progress', 2, 30, current_date + 3, null),
  ('f0000000-0000-4000-8000-000000000003', 'certificate_issued', 'IRC issued', 'IRC ইস্যু', 'authority', 'pending', 3, 40, null, null),
  ('f0000000-0000-4000-8000-000000000004', 'certificate_issued', 'Incorporation certificate issued', 'নিবন্ধন সনদ ইস্যু', 'authority', 'complete', 3, 10, null, now() - interval '380 days')
on conflict do nothing;

-- Status history (public + internal notes are separated on purpose)
insert into public.case_status_history
  (case_id, from_status, to_status, from_waiting_on, to_waiting_on, reason, public_note, internal_note, actor_id, actor_kind)
values
  ('f0000000-0000-4000-8000-000000000002', 'kyc_review', 'quote_ready', 'none', 'none',
   'Identity checks completed.', 'Your identity checks are done. We are preparing your quote.',
   'Sample internal note — never shown to the customer.', '33333333-3333-4333-8333-000000000002', 'staff'),
  ('f0000000-0000-4000-8000-000000000002', 'awaiting_payment', 'documents_required', 'payment', 'customer',
   'Payment received; document checklist issued.',
   'Payment received. Please upload the documents on your checklist.',
   null, '33333333-3333-4333-8333-000000000001', 'staff'),
  ('f0000000-0000-4000-8000-000000000003', 'submitted', 'authority_query', 'authority', 'authority',
   'Authority raised a query on the application.',
   'The authority has asked a question about your application. We are preparing the response.',
   null, '33333333-3333-4333-8333-000000000001', 'staff')
on conflict do nothing;

-- Document requests
insert into public.document_requests (id, case_id, requirement_code, label_en, label_bn, category, status, is_mandatory, due_on, requested_by) values
  ('f2000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'nid_or_passport',
   'Passport (director)', 'পাসপোর্ট (পরিচালক)', 'identity', 'accepted', true, current_date - 5, '33333333-3333-4333-8333-000000000001'),
  ('f2000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002', 'registered_address',
   'Proof of registered address', 'নিবন্ধিত ঠিকানার প্রমাণ', 'address_proof', 'requested', true, current_date + 5, '33333333-3333-4333-8333-000000000001'),
  ('f2000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000002', 'photo',
   'Passport-size photograph', 'পাসপোর্ট সাইজের ছবি', 'photo', 'replacement_requested', true, current_date + 3, '33333333-3333-4333-8333-000000000001'),
  ('f2000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000003', 'bank_solvency',
   'Bank solvency certificate', 'ব্যাংক সচ্ছলতা সনদ', 'financial', 'accepted', true, current_date - 20, '33333333-3333-4333-8333-000000000001')
on conflict (id) do nothing;

-- Documents (placeholder metadata only — no real files, no real identity data)
insert into public.documents
  (id, organization_id, case_id, request_id, title, category, visibility, status, current_version,
   bucket_id, retention_category, uploaded_by)
values
  ('f3000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'f0000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000001',
   'Passport (sample placeholder)', 'identity', 'partner_shared', 'accepted', 1,
   'identity-documents', 'aml_record', '11111111-1111-4111-8111-000000000002'),
  ('f3000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'f0000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000003',
   'Photograph (sample placeholder)', 'photo', 'customer', 'replacement_requested', 1,
   'case-documents', 'standard', '11111111-1111-4111-8111-000000000002'),
  ('f3000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000004', null,
   'Incorporation certificate (sample placeholder)', 'official_record', 'customer', 'accepted', 1,
   'official-records', 'financial_record', '33333333-3333-4333-8333-000000000001')
on conflict (id) do nothing;

insert into public.document_versions
  (document_id, version_no, storage_path, file_name, mime_type, byte_size, checksum_sha256, scan_status, scan_provider, scanned_at, uploaded_by)
values
  ('f3000000-0000-4000-8000-000000000001', 1,
   'org/a0000000-0000-4000-8000-000000000002/case/f0000000-0000-4000-8000-000000000002/doc/f3000000-0000-4000-8000-000000000001/v1.pdf',
   'passport-sample.pdf', 'application/pdf', 184320,
   '0000000000000000000000000000000000000000000000000000000000000000', 'clean', 'mock', now() - interval '15 days',
   '11111111-1111-4111-8111-000000000002'),
  ('f3000000-0000-4000-8000-000000000002', 1,
   'org/a0000000-0000-4000-8000-000000000002/case/f0000000-0000-4000-8000-000000000002/doc/f3000000-0000-4000-8000-000000000002/v1.png',
   'photo-sample.png', 'image/png', 65536,
   '1111111111111111111111111111111111111111111111111111111111111111', 'clean', 'mock', now() - interval '10 days',
   '11111111-1111-4111-8111-000000000002'),
  ('f3000000-0000-4000-8000-000000000003', 1,
   'org/a0000000-0000-4000-8000-000000000001/case/f0000000-0000-4000-8000-000000000004/doc/f3000000-0000-4000-8000-000000000003/v1.pdf',
   'incorporation-certificate-sample.pdf', 'application/pdf', 262144,
   '2222222222222222222222222222222222222222222222222222222222222222', 'clean', 'mock', now() - interval '380 days',
   '33333333-3333-4333-8333-000000000001')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Quotes: two versions, the second accepted. Fee categories are itemised and
-- government amounts are marked as estimates payable to the authority.
-- ---------------------------------------------------------------------------
insert into public.quotes (id, case_id, organization_id, reference, current_version, status, created_by)
values ('f4000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002',
        'a0000000-0000-4000-8000-000000000002', 'Q-2026-000102', 2, 'accepted',
        '33333333-3333-4333-8333-000000000003')
on conflict (id) do nothing;

insert into public.quote_versions
  (id, quote_id, version_no, status, currency, subtotal_minor, tax_minor, total_minor,
   bdoor_revenue_minor, pass_through_minor, valid_until, notes_en, notes_bn,
   prepared_by, approved_by, approved_at, sent_at, superseded_at)
values
  ('f5000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 1, 'superseded', 'BDT',
   6500000, 0, 6500000, 2500000, 4000000, current_date - 5,
   'Initial quote. Superseded after the partner review scope was reduced.',
   'প্রাথমিক কোটেশন। অংশীদারের যাচাইয়ের পরিধি কমে যাওয়ায় প্রতিস্থাপিত।',
   '33333333-3333-4333-8333-000000000003', '33333333-3333-4333-8333-000000000004',
   now() - interval '20 days', now() - interval '20 days', now() - interval '16 days')
on conflict (id) do nothing;

insert into public.quote_versions
  (id, quote_id, version_no, status, currency, subtotal_minor, tax_minor, total_minor,
   bdoor_revenue_minor, pass_through_minor, valid_until, notes_en, notes_bn,
   prepared_by, approved_by, approved_at, sent_at, accepted_at)
values
  ('f5000000-0000-4000-8000-000000000002', 'f4000000-0000-4000-8000-000000000001', 2, 'accepted', 'BDT',
   5750000, 375000, 6125000, 2500000, 3250000, current_date + 9,
   'Government fees are an estimate until the authority issues a receipt. Any unused advance is returned to you.',
   'কর্তৃপক্ষ রসিদ না দেওয়া পর্যন্ত সরকারি ফি আনুমানিক। অব্যবহৃত অগ্রিম আপনাকে ফেরত দেওয়া হয়।',
   '33333333-3333-4333-8333-000000000003', '33333333-3333-4333-8333-000000000004',
   now() - interval '16 days', now() - interval '16 days', now() - interval '15 days')
on conflict (id) do nothing;

insert into public.quote_items
  (quote_version_id, category, service_id, description_en, description_bn, quantity, unit_amount_minor,
   currency, tax_treatment, tax_rate_bp, is_estimate, is_refundable, payee, payee_name, sort_order)
values
  ('f5000000-0000-4000-8000-000000000002', 'platform_service_fee', 'd0000000-0000-4000-8000-000000000001',
   'Private limited company incorporation — BDoor service fee', 'প্রাইভেট লিমিটেড কোম্পানি নিবন্ধন — BDoor সেবা ফি',
   1, 2500000, 'BDT', 'exclusive', 1500, false, false, 'bdoor', 'BDoor', 10),
  ('f5000000-0000-4000-8000-000000000002', 'government_fee_estimate', 'd0000000-0000-4000-8000-000000000001',
   'RJSC registration and stamp fees (estimate)', 'RJSC নিবন্ধন ও স্ট্যাম্প ফি (আনুমানিক)',
   1, 1800000, 'BDT', 'not_applicable', 0, true, true, 'government_authority', 'RJSC', 20),
  ('f5000000-0000-4000-8000-000000000002', 'partner_professional_fee', 'd0000000-0000-4000-8000-000000000006',
   'Partner advocate — foreign ownership eligibility review', 'অংশীদার আইনজীবী — বিদেশি মালিকানা যোগ্যতা যাচাই',
   1, 1200000, 'BDT', 'exclusive', 0, false, false, 'partner_firm', 'Meghna Legal Chambers (sample)', 30),
  ('f5000000-0000-4000-8000-000000000002', 'third_party_cost', null,
   'Digital signature certificate (at cost)', 'ডিজিটাল স্বাক্ষর সনদ (প্রকৃত খরচে)',
   1, 250000, 'BDT', 'exclusive', 0, true, false, 'third_party', 'Certifying authority', 40),
  ('f5000000-0000-4000-8000-000000000002', 'tax', null,
   'VAT on BDoor service fee', 'BDoor সেবা ফির উপর ভ্যাট',
   1, 375000, 'BDT', 'not_applicable', 0, false, false, 'bdoor', 'BDoor', 50)
on conflict do nothing;

insert into public.engagement_acceptances
  (case_id, quote_version_id, acceptance_type, accepted_by, organization_id, document_version, locale)
values
  ('f0000000-0000-4000-8000-000000000002', 'f5000000-0000-4000-8000-000000000002', 'quote_acceptance',
   '11111111-1111-4111-8111-000000000002', 'a0000000-0000-4000-8000-000000000002', 'draft-2026-01', 'en'),
  ('f0000000-0000-4000-8000-000000000002', null, 'partner_engagement',
   '11111111-1111-4111-8111-000000000002', 'a0000000-0000-4000-8000-000000000002', 'draft-2026-01', 'en')
on conflict do nothing;

insert into public.invoices (id, case_id, organization_id, quote_version_id, number, status, currency,
                            subtotal_minor, tax_minor, total_minor, paid_minor, issued_at, due_on)
values ('f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002',
        'a0000000-0000-4000-8000-000000000002', 'f5000000-0000-4000-8000-000000000002',
        'INV-2026-000102', 'paid', 'BDT', 5750000, 375000, 6125000, 6125000,
        now() - interval '15 days', current_date - 8)
on conflict (id) do nothing;

insert into public.payments (id, invoice_id, case_id, organization_id, provider, provider_ref,
                            status, currency, amount_minor, is_sandbox, reconciled_at, reconciled_by)
values ('f7000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001',
        'f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
        'mock', 'mock_pay_sample_000102', 'paid', 'BDT', 6125000, true,
        now() - interval '14 days', '33333333-3333-4333-8333-000000000003')
on conflict (id) do nothing;

insert into public.government_fee_advances (id, case_id, organization_id, payment_id, currency,
                                            received_minor, disbursed_minor, refunded_minor)
values ('f8000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002',
        'a0000000-0000-4000-8000-000000000002', 'f7000000-0000-4000-8000-000000000001',
        'BDT', 1800000, 0, 0)
on conflict (id) do nothing;

insert into public.receipts (case_id, organization_id, kind, payment_id, number, issued_on, amount_minor)
values ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
        'platform_payment', 'f7000000-0000-4000-8000-000000000001', 'RCP-2026-000102',
        current_date - 14, 6125000)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Authority submission and query
-- ---------------------------------------------------------------------------
insert into public.authority_submissions (id, case_id, authority_name, submission_type, reference_no,
                                          submitted_on, submitted_by_user_id, outcome)
values ('f9000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000003',
        'Office of the Chief Controller of Imports and Exports (CCI&E)', 'IRC application',
        'SAMPLE-IRC-000103', current_date - 12, '33333333-3333-4333-8333-000000000001', 'query_raised')
on conflict (id) do nothing;

insert into public.authority_queries (submission_id, case_id, raised_on, respond_by, question, status)
values ('f9000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000003',
        current_date - 4, current_date + 3,
        'Sample query: clarification requested on the declared product categories.', 'open')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
insert into public.message_threads (id, case_id, subject, audience, created_by) values
  ('fa000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002',
   'Document checklist', 'customer', '33333333-3333-4333-8333-000000000001'),
  ('fa000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002',
   'Partner coordination', 'partner', '33333333-3333-4333-8333-000000000001'),
  ('fa000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000003',
   'Authority query response', 'customer', '33333333-3333-4333-8333-000000000001')
on conflict (id) do nothing;

insert into public.messages (thread_id, author_id, author_kind, body, is_internal_note) values
  ('fa000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-000000000001', 'staff',
   'Your passport has been accepted. We still need proof of the registered address, and the photograph needs to be replaced — the current one is too low-resolution for the form.', false),
  ('fa000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-000000000002', 'customer',
   'Understood. I will upload the tenancy agreement tomorrow and take a new photo.', false),
  ('fa000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-000000000001', 'partner',
   'Eligibility review complete. No sector restriction applies to the declared activity. Draft constitutional documents attached to the case.', false),
  ('fa000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-000000000001', 'staff',
   'The authority has asked us to clarify the declared product categories. We are drafting the response and will share it with you before we file it.', false)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Compliance obligations for the approved case
-- ---------------------------------------------------------------------------
insert into public.compliance_obligations
  (id, organization_id, company_id, case_id, obligation_type, label_en, label_bn, authority_name,
   responsible_kind, due_on, status, source, source_rule_ref, required_documents)
values
  ('fb000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000004',
   'rjsc_annual_return', 'RJSC annual return', 'RJSC বার্ষিক রিটার্ন',
   'Registrar of Joint Stock Companies and Firms (RJSC)', 'bdoor',
   current_date + 45, 'upcoming', 'verified_rule', 'BD-RULE-RJSC-AR-01',
   array['Audited financial statements', 'Schedule X']),
  ('fb000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000001', null,
   'trade_licence_renewal', 'Trade licence renewal', 'ট্রেড লাইসেন্স নবায়ন',
   'City corporation', 'customer',
   current_date + 20, 'due', 'verified_rule', 'BD-RULE-TL-RENEW-01',
   array['Current trade licence', 'Last paid receipt']),
  ('fb000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000001', null,
   'income_tax_return', 'Company income tax return', 'কোম্পানি আয়কর রিটার্ন',
   'National Board of Revenue (NBR)', 'customer',
   current_date - 6, 'overdue', 'admin', null,
   array['Audited accounts'])
on conflict (id) do nothing;

insert into public.compliance_reminders (obligation_id, offset_days, channel, scheduled_for) values
  ('fb000000-0000-4000-8000-000000000001', 30, 'in_app', current_date + 15),
  ('fb000000-0000-4000-8000-000000000001', 30, 'email', current_date + 15),
  ('fb000000-0000-4000-8000-000000000001', 7, 'in_app', current_date + 38),
  ('fb000000-0000-4000-8000-000000000002', 14, 'in_app', current_date + 6),
  ('fb000000-0000-4000-8000-000000000002', 7, 'email', current_date + 13)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- KYC (customer-visible half only; the restricted schema stays empty in seed)
-- ---------------------------------------------------------------------------
insert into public.kyc_cases (id, case_id, organization_id, subject_type, subject_person_id,
                              subject_label, overall_status, risk_rating, decided_at)
values ('fc000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002',
        'a0000000-0000-4000-8000-000000000002', 'individual', 'e1000000-0000-4000-8000-000000000003',
        'Jordan Miles (sample)', 'passed', 'medium', now() - interval '14 days')
on conflict (id) do nothing;

insert into public.kyc_checks (kyc_case_id, check_type, status, customer_note, performed_at) values
  ('fc000000-0000-4000-8000-000000000001', 'identity', 'passed', 'Passport accepted.', now() - interval '15 days'),
  ('fc000000-0000-4000-8000-000000000001', 'address', 'pending', 'Waiting for proof of address.', null),
  ('fc000000-0000-4000-8000-000000000001', 'beneficial_owner', 'passed', 'Sole shareholder confirmed.', now() - interval '14 days'),
  ('fc000000-0000-4000-8000-000000000001', 'pep', 'passed', null, now() - interval '14 days'),
  ('fc000000-0000-4000-8000-000000000001', 'sanctions', 'passed', null, now() - interval '14 days'),
  ('fc000000-0000-4000-8000-000000000001', 'source_of_funds', 'manual_review', 'Under review by our compliance team.', null)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Leads and notifications
-- ---------------------------------------------------------------------------
insert into public.leads (full_name, email, country, intent, source, status, assigned_to) values
  ('Sample Lead One', 'lead.one@example.test', 'BD', 'Start a local company', 'questionnaire', 'new', null),
  ('Sample Lead Two', 'lead.two@example.test', 'GB', 'Start as a foreign founder', 'questionnaire', 'contacted',
   '33333333-3333-4333-8333-000000000001')
on conflict do nothing;

insert into public.notifications (user_id, organization_id, case_id, kind, title_en, title_bn, body_en, body_bn, href) values
  ('11111111-1111-4111-8111-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'f0000000-0000-4000-8000-000000000002', 'document_requested',
   'Two documents still needed', 'দুটি কাগজ এখনো প্রয়োজন',
   'Proof of registered address, and a replacement photograph.',
   'নিবন্ধিত ঠিকানার প্রমাণ এবং ছবির নতুন সংস্করণ।',
   '/app/applications/f0000000-0000-4000-8000-000000000002'),
  ('11111111-1111-4111-8111-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'f0000000-0000-4000-8000-000000000003', 'authority_query',
   'The authority raised a query', 'কর্তৃপক্ষ একটি প্রশ্ন করেছে',
   'We are preparing the response and will share it before filing.',
   'আমরা জবাব প্রস্তুত করছি এবং দাখিলের আগে আপনাকে দেখাব।',
   '/app/applications/f0000000-0000-4000-8000-000000000003')
on conflict do nothing;

commit;
