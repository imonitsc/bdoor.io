// AUTO-GENERATED — DO NOT EDIT BY HAND.
//
// Offline snapshot of the published catalog, generated from supabase/seed.sql:
//
//   scripts/local-db/apply.sh --seed
//   node scripts/local-db/gen-catalog-snapshot.mjs
//
// The marketing site renders this when Supabase is unreachable (a fresh clone
// with no credentials, a preview build, an outage) so the public pages never
// go blank. `catalogSource` on every query result tells callers which was used.

import type { Faq, ResourcePage, Service, ServiceCategory } from '@/features/catalog/types';

export const SNAPSHOT_CATEGORIES: ServiceCategory[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    slug: 'company-formation',
    name: {
      en: 'Company formation',
      bn: 'কোম্পানি গঠন',
    },
    summary: {
      en: 'Register the right legal structure for what you actually plan to do.',
      bn: 'আপনি আসলে যা করতে চান, তার জন্য উপযুক্ত আইনি কাঠামো নিবন্ধন করুন।',
    },
    icon: 'building-2',
    sortOrder: 10,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    slug: 'licences',
    name: {
      en: 'Trade and operating licences',
      bn: 'ট্রেড ও পরিচালন লাইসেন্স',
    },
    summary: {
      en: 'The permissions you need before you can lawfully trade.',
      bn: 'বৈধভাবে ব্যবসা শুরুর আগে যেসব অনুমতি লাগে।',
    },
    icon: 'file-badge',
    sortOrder: 20,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    slug: 'import-export',
    name: {
      en: 'Import and export registration',
      bn: 'আমদানি ও রপ্তানি নিবন্ধন',
    },
    summary: {
      en: 'IRC, ERC and the bank steps that have to come first.',
      bn: 'IRC, ERC এবং যেসব ব্যাংক-ধাপ আগে সারতে হয়।',
    },
    icon: 'ship',
    sortOrder: 30,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    slug: 'tax-vat',
    name: {
      en: 'Tax and VAT setup',
      bn: 'কর ও ভ্যাট নিবন্ধন',
    },
    summary: {
      en: 'e-TIN, BIN/VAT registration and getting your filing calendar right.',
      bn: 'ই-টিআইএন, বিআইএন/ভ্যাট নিবন্ধন এবং রিটার্নের সময়সূচি ঠিক করা।',
    },
    icon: 'receipt',
    sortOrder: 40,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000005',
    slug: 'foreign-founders',
    name: {
      en: 'Foreign-founder support',
      bn: 'বিদেশি উদ্যোক্তা সহায়তা',
    },
    summary: {
      en: 'Ownership review, investment registration, remittance and visa support.',
      bn: 'মালিকানা যাচাই, বিনিয়োগ নিবন্ধন, রেমিট্যান্স ও ভিসা সহায়তা।',
    },
    icon: 'globe',
    sortOrder: 50,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000006',
    slug: 'compliance',
    name: {
      en: 'Annual compliance and renewals',
      bn: 'বার্ষিক কমপ্লায়েন্স ও নবায়ন',
    },
    summary: {
      en: 'Filings, renewals and the reminders that stop them being late.',
      bn: 'রিটার্ন, নবায়ন এবং সেগুলো যেন দেরি না হয় সেই রিমাইন্ডার।',
    },
    icon: 'calendar-check',
    sortOrder: 60,
  },
];

export const SNAPSHOT_SERVICES: Service[] = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    slug: 'private-limited-company-incorporation',
    categorySlug: 'company-formation',
    name: {
      en: 'Private limited company incorporation',
      bn: 'প্রাইভেট লিমিটেড কোম্পানি নিবন্ধন',
    },
    summary: {
      en: 'The usual choice for a business with two or more shareholders and limited liability.',
      bn: 'দুই বা তার বেশি শেয়ারহোল্ডার এবং সীমিত দায়বদ্ধতার ব্যবসার জন্য প্রচলিত পছন্দ।',
    },
    whoFor: {
      en: 'Founders who want limited liability, a clear share structure, and the ability to bring in investors later.',
      bn: 'যাঁরা সীমিত দায়, স্পষ্ট শেয়ার কাঠামো এবং পরে বিনিয়োগকারী আনার সুযোগ চান।',
    },
    included: {
      en: [
        'Name clearance application',
        'Memorandum and Articles of Association preparation',
        'Digital signature coordination',
        'RJSC filing and follow-up',
        'Incorporation certificate delivery to your document vault',
      ],
      bn: [
        'নাম ছাড়পত্রের আবেদন',
        'সংঘস্মারক ও সংঘবিধি প্রস্তুত',
        'ডিজিটাল স্বাক্ষরের সমন্বয়',
        'RJSC-তে দাখিল ও ফলোআপ',
        'নিবন্ধন সনদ আপনার ডকুমেন্ট ভল্টে পৌঁছে দেওয়া',
      ],
    },
    notIncluded: {
      en: [
        'Government fees, which are quoted separately at cost',
        'Trade licence, e-TIN and VAT registration (available as separate services)',
        'Bank account opening, which the bank decides',
        'Legal opinions or drafting beyond the standard constitutional documents',
      ],
      bn: [
        'সরকারি ফি, যা আলাদাভাবে প্রকৃত খরচে জানানো হয়',
        'ট্রেড লাইসেন্স, ই-টিআইএন ও ভ্যাট নিবন্ধন (আলাদা সেবা হিসেবে পাওয়া যায়)',
        'ব্যাংক হিসাব খোলা, যার সিদ্ধান্ত ব্যাংকের',
        'সাধারণ গঠনতান্ত্রিক দলিলের বাইরে আইনি মতামত বা খসড়া',
      ],
    },
    eligibility: {
      en: 'At least two shareholders and two directors are usually required. Foreign shareholding, regulated activities and corporate shareholders are reviewed before we can confirm the path.',
      bn: 'সাধারণত অন্তত দুইজন শেয়ারহোল্ডার ও দুইজন পরিচালক প্রয়োজন। বিদেশি শেয়ারহোল্ডিং, নিয়ন্ত্রিত কার্যক্রম ও কর্পোরেট শেয়ারহোল্ডারের ক্ষেত্রে পথ নিশ্চিত করার আগে যাচাই করা হয়।',
    },
    authorityName: {
      en: 'Registrar of Joint Stock Companies and Firms (RJSC)',
      bn: 'যৌথ মূলধন কোম্পানি ও ফার্মসমূহের পরিদপ্তর (RJSC)',
    },
    startingFeeBdt: 24900,
    estimatedDaysMin: 7,
    estimatedDaysMax: 21,
    timeReviewedAt: '2026-08-02',
    requiresPartner: false,
    isRegulated: false,
    status: 'published',
    sortOrder: 10,
    requirements: [
      {
        code: 'nid_or_passport',
        label: {
          en: 'National ID or passport',
          bn: 'জাতীয় পরিচয়পত্র বা পাসপোর্ট',
        },
        help: null,
        appliesTo: 'director',
        isMandatory: true,
      },
      {
        code: 'photo',
        label: {
          en: 'Passport-size photograph',
          bn: 'পাসপোর্ট সাইজের ছবি',
        },
        help: null,
        appliesTo: 'director',
        isMandatory: true,
      },
      {
        code: 'etin_director',
        label: {
          en: 'Director e-TIN certificate',
          bn: 'পরিচালকের ই-টিআইএন সনদ',
        },
        help: null,
        appliesTo: 'director',
        isMandatory: false,
      },
      {
        code: 'name_options',
        label: {
          en: 'Three proposed company names',
          bn: 'প্রস্তাবিত তিনটি কোম্পানির নাম',
        },
        help: null,
        appliesTo: 'company',
        isMandatory: true,
      },
      {
        code: 'registered_address',
        label: {
          en: 'Proof of registered address',
          bn: 'নিবন্ধিত ঠিকানার প্রমাণ',
        },
        help: null,
        appliesTo: 'premises',
        isMandatory: true,
      },
    ],
    milestones: [
      {
        code: 'kyc_complete',
        label: {
          en: 'Identity and ownership checks complete',
          bn: 'পরিচয় ও মালিকানা যাচাই সম্পন্ন',
        },
        ownerKind: 'bdoor',
        typicalDays: 3,
        weight: 2,
      },
      {
        code: 'name_clearance',
        label: {
          en: 'Name clearance obtained',
          bn: 'নাম ছাড়পত্র গ্রহণ',
        },
        ownerKind: 'authority',
        typicalDays: 3,
        weight: 2,
      },
      {
        code: 'documents_signed',
        label: {
          en: 'Constitutional documents signed',
          bn: 'গঠনতান্ত্রিক দলিলে স্বাক্ষর',
        },
        ownerKind: 'customer',
        typicalDays: 3,
        weight: 2,
      },
      {
        code: 'rjsc_submitted',
        label: {
          en: 'Filed with RJSC',
          bn: 'RJSC-তে দাখিল',
        },
        ownerKind: 'bdoor',
        typicalDays: 2,
        weight: 3,
      },
      {
        code: 'certificate_issued',
        label: {
          en: 'Incorporation certificate issued',
          bn: 'নিবন্ধন সনদ ইস্যু',
        },
        ownerKind: 'authority',
        typicalDays: 7,
        weight: 3,
      },
    ],
    feeComponents: [
      {
        category: 'platform_service_fee',
        label: {
          en: 'BDoor service fee',
          bn: 'BDoor সেবা ফি',
        },
        payee: 'bdoor',
        amountBdt: 24900,
        isEstimate: false,
        isRefundable: false,
        taxTreatment: 'exclusive',
        reviewedAt: null,
      },
      {
        category: 'government_fee_estimate',
        label: {
          en: 'RJSC registration fees',
          bn: 'RJSC নিবন্ধন ফি',
        },
        payee: 'government_authority',
        amountBdt: null,
        isEstimate: true,
        isRefundable: true,
        taxTreatment: 'not_applicable',
        reviewedAt: null,
      },
      {
        category: 'third_party_cost',
        label: {
          en: 'Digital signature certificate',
          bn: 'ডিজিটাল স্বাক্ষর সনদ',
        },
        payee: 'third_party',
        amountBdt: null,
        isEstimate: true,
        isRefundable: false,
        taxTreatment: 'exclusive',
        reviewedAt: null,
      },
    ],
  },
  {
    id: 'd0000000-0000-4000-8000-000000000006',
    slug: 'foreign-ownership-eligibility-review',
    categorySlug: 'foreign-founders',
    name: {
      en: 'Foreign ownership and sector eligibility review',
      bn: 'বিদেশি মালিকানা ও খাত যোগ্যতা যাচাই',
    },
    summary: {
      en: 'Before you spend anything: can you own what you want to own, in this sector?',
      bn: 'খরচ করার আগেই জেনে নিন: এই খাতে আপনি যা চান তার মালিক হতে পারবেন কি না।',
    },
    whoFor: {
      en: 'Non-resident founders, foreign companies and anyone with a corporate shareholder.',
      bn: 'অনিবাসী উদ্যোক্তা, বিদেশি কোম্পানি এবং যাঁদের কর্পোরেট শেয়ারহোল্ডার আছে।',
    },
    included: {
      en: [
        'Structured review of your intended activity and ownership by a partner advocate',
        'A written note on the structure options open to you',
        'A list of the approvals your plan would need, in order',
      ],
      bn: [
        'অংশীদার আইনজীবীর মাধ্যমে আপনার কার্যক্রম ও মালিকানার কাঠামোবদ্ধ যাচাই',
        'আপনার জন্য খোলা কাঠামোগত বিকল্প নিয়ে লিখিত নোট',
        'আপনার পরিকল্পনার জন্য যে অনুমোদনগুলো লাগবে, ক্রম অনুযায়ী তালিকা',
      ],
    },
    notIncluded: {
      en: [
        'Any guarantee of approval',
        'The incorporation itself, quoted separately',
        'Immigration outcomes, which are decided by the authorities',
      ],
      bn: [
        'অনুমোদনের কোনো নিশ্চয়তা',
        'কোম্পানি গঠন, যা আলাদাভাবে কোট করা হয়',
        'অভিবাসন সংক্রান্ত ফলাফল, যার সিদ্ধান্ত কর্তৃপক্ষের',
      ],
    },
    eligibility: {
      en: 'Open to any prospective foreign founder. Some sectors are restricted or capped; that is exactly what this review establishes.',
      bn: 'যেকোনো সম্ভাব্য বিদেশি উদ্যোক্তার জন্য উন্মুক্ত। কিছু খাত সীমাবদ্ধ বা সীমা-নির্ধারিত; এই যাচাই ঠিক সেটিই নির্ধারণ করে।',
    },
    authorityName: {
      en: 'Bangladesh Investment Development Authority (BIDA) and sector regulators',
      bn: 'বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষ (BIDA) ও খাতভিত্তিক নিয়ন্ত্রক',
    },
    startingFeeBdt: null,
    estimatedDaysMin: null,
    estimatedDaysMax: null,
    timeReviewedAt: null,
    requiresPartner: true,
    isRegulated: false,
    status: 'published',
    sortOrder: 10,
    requirements: [],
    milestones: [],
    feeComponents: [
      {
        category: 'partner_professional_fee',
        label: {
          en: 'Partner advocate review fee',
          bn: 'অংশীদার আইনজীবীর যাচাই ফি',
        },
        payee: 'partner_firm',
        amountBdt: null,
        isEstimate: true,
        isRefundable: false,
        taxTreatment: 'exclusive',
        reviewedAt: null,
      },
    ],
  },
  {
    id: 'd0000000-0000-4000-8000-000000000007',
    slug: 'rjsc-annual-return',
    categorySlug: 'compliance',
    name: {
      en: 'RJSC annual filings and company changes',
      bn: 'RJSC বার্ষিক রিটার্ন ও কোম্পানির পরিবর্তন',
    },
    summary: {
      en: 'Keep the register accurate: annual returns, director changes, share transfers.',
      bn: 'নিবন্ধন হালনাগাদ রাখুন: বার্ষিক রিটার্ন, পরিচালক পরিবর্তন, শেয়ার হস্তান্তর।',
    },
    whoFor: {
      en: 'Every registered company, every year.',
      bn: 'প্রতিটি নিবন্ধিত কোম্পানি, প্রতি বছর।',
    },
    included: {
      en: [
        'Annual return preparation and filing',
        'Schedule X and related forms',
        'Director, address and share-structure changes when they happen',
        'Deadline reminders on your compliance calendar',
      ],
      bn: [
        'বার্ষিক রিটার্ন প্রস্তুত ও দাখিল',
        'তফসিল X ও সংশ্লিষ্ট ফরম',
        'পরিচালক, ঠিকানা ও শেয়ার কাঠামোর পরিবর্তন যখন ঘটে',
        'আপনার কমপ্লায়েন্স ক্যালেন্ডারে সময়সীমার রিমাইন্ডার',
      ],
    },
    notIncluded: {
      en: [
        'Statutory audit, which a chartered accountant must perform',
        'Late-filing penalties for periods before you engaged us',
      ],
      bn: [
        'বিধিবদ্ধ নিরীক্ষা, যা একজন চার্টার্ড অ্যাকাউন্ট্যান্টকে করতে হয়',
        'আমাদের নিয়োগের আগের সময়ের বিলম্ব জরিমানা',
      ],
    },
    eligibility: {
      en: 'Requires an incorporated company and its audited accounts where applicable.',
      bn: 'নিবন্ধিত কোম্পানি এবং প্রযোজ্য ক্ষেত্রে নিরীক্ষিত হিসাব প্রয়োজন।',
    },
    authorityName: {
      en: 'Registrar of Joint Stock Companies and Firms (RJSC)',
      bn: 'যৌথ মূলধন কোম্পানি ও ফার্মসমূহের পরিদপ্তর (RJSC)',
    },
    startingFeeBdt: 12000,
    estimatedDaysMin: 5,
    estimatedDaysMax: 15,
    timeReviewedAt: '2026-07-23',
    requiresPartner: false,
    isRegulated: false,
    status: 'published',
    sortOrder: 10,
    requirements: [],
    milestones: [],
    feeComponents: [],
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    slug: 'trade-licence',
    categorySlug: 'licences',
    name: {
      en: 'Trade licence',
      bn: 'ট্রেড লাইসেন্স',
    },
    summary: {
      en: 'The local permission to operate from your business address.',
      bn: 'আপনার ব্যবসার ঠিকানা থেকে কার্যক্রম চালানোর স্থানীয় অনুমতি।',
    },
    whoFor: {
      en: 'Any business operating from a premises in Bangladesh, new or existing.',
      bn: 'বাংলাদেশে কোনো ঠিকানা থেকে পরিচালিত যেকোনো ব্যবসা, নতুন হোক বা চলমান।',
    },
    included: {
      en: [
        'Form preparation and document checklist',
        'Submission to the relevant city corporation or municipality',
        'Follow-up until the licence is issued',
        'Renewal reminder set up automatically',
      ],
      bn: [
        'ফরম প্রস্তুত ও কাগজপত্রের তালিকা',
        'সংশ্লিষ্ট সিটি কর্পোরেশন বা পৌরসভায় দাখিল',
        'লাইসেন্স ইস্যু না হওয়া পর্যন্ত ফলোআপ',
        'নবায়নের রিমাইন্ডার স্বয়ংক্রিয়ভাবে সেট করা',
      ],
    },
    notIncluded: {
      en: [
        'The licence fee itself, which varies by location and business category',
        'Premises rent, utility connections or holding tax arrears',
        'Sector approvals for regulated activities',
      ],
      bn: [
        'লাইসেন্স ফি, যা অবস্থান ও ব্যবসার ধরন অনুযায়ী আলাদা',
        'ভাড়া, ইউটিলিটি সংযোগ বা হোল্ডিং ট্যাক্স বকেয়া',
        'নিয়ন্ত্রিত কার্যক্রমের খাতভিত্তিক অনুমোদন',
      ],
    },
    eligibility: {
      en: 'You need a registrable business address and, for a company, your incorporation documents.',
      bn: 'নিবন্ধনযোগ্য একটি ঠিকানা লাগবে, আর কোম্পানির ক্ষেত্রে নিবন্ধনের কাগজপত্র।',
    },
    authorityName: {
      en: 'City corporation or municipality of your business location',
      bn: 'আপনার ব্যবসার অবস্থানের সিটি কর্পোরেশন বা পৌরসভা',
    },
    startingFeeBdt: 8000,
    estimatedDaysMin: 5,
    estimatedDaysMax: 15,
    timeReviewedAt: '2026-08-07',
    requiresPartner: false,
    isRegulated: false,
    status: 'published',
    sortOrder: 10,
    requirements: [
      {
        code: 'incorporation_certificate',
        label: {
          en: 'Incorporation certificate or proprietorship details',
          bn: 'নিবন্ধন সনদ বা একক মালিকানার তথ্য',
        },
        help: null,
        appliesTo: 'company',
        isMandatory: true,
      },
      {
        code: 'premises_proof',
        label: {
          en: 'Rental agreement or ownership deed',
          bn: 'ভাড়ার চুক্তি বা মালিকানার দলিল',
        },
        help: null,
        appliesTo: 'premises',
        isMandatory: true,
      },
    ],
    milestones: [
      {
        code: 'application_prepared',
        label: {
          en: 'Application prepared',
          bn: 'আবেদন প্রস্তুত',
        },
        ownerKind: 'bdoor',
        typicalDays: 2,
        weight: 1,
      },
      {
        code: 'submitted_to_authority',
        label: {
          en: 'Submitted to the local authority',
          bn: 'স্থানীয় কর্তৃপক্ষে দাখিল',
        },
        ownerKind: 'bdoor',
        typicalDays: 1,
        weight: 2,
      },
      {
        code: 'licence_issued',
        label: {
          en: 'Licence issued',
          bn: 'লাইসেন্স ইস্যু',
        },
        ownerKind: 'authority',
        typicalDays: 7,
        weight: 3,
      },
    ],
    feeComponents: [
      {
        category: 'platform_service_fee',
        label: {
          en: 'BDoor service fee',
          bn: 'BDoor সেবা ফি',
        },
        payee: 'bdoor',
        amountBdt: 8000,
        isEstimate: false,
        isRefundable: false,
        taxTreatment: 'exclusive',
        reviewedAt: null,
      },
      {
        category: 'government_fee_estimate',
        label: {
          en: 'Local authority licence fee',
          bn: 'স্থানীয় কর্তৃপক্ষের লাইসেন্স ফি',
        },
        payee: 'government_authority',
        amountBdt: null,
        isEstimate: true,
        isRefundable: true,
        taxTreatment: 'not_applicable',
        reviewedAt: null,
      },
    ],
  },
  {
    id: 'd0000000-0000-4000-8000-000000000005',
    slug: 'import-registration-certificate',
    categorySlug: 'import-export',
    name: {
      en: 'Commercial Import Registration Certificate (IRC)',
      bn: 'বাণিজ্যিক আমদানি নিবন্ধন সনদ (IRC)',
    },
    summary: {
      en: 'The registration you need before you can import commercially.',
      bn: 'বাণিজ্যিকভাবে আমদানি শুরুর আগে যে নিবন্ধন লাগে।',
    },
    whoFor: {
      en: 'Businesses importing goods into Bangladesh for trade.',
      bn: 'যেসব ব্যবসা বাণিজ্যের জন্য বাংলাদেশে পণ্য আমদানি করে।',
    },
    included: {
      en: [
        'Document checklist and preparation',
        'Bank solvency and association membership coordination',
        'Submission to CCI&E and follow-up',
        'Certificate delivered to your vault',
      ],
      bn: [
        'কাগজপত্রের তালিকা ও প্রস্তুতি',
        'ব্যাংক সচ্ছলতা ও অ্যাসোসিয়েশন সদস্যপদের সমন্বয়',
        'CCI&E-তে দাখিল ও ফলোআপ',
        'সনদ আপনার ভল্টে পৌঁছে দেওয়া',
      ],
    },
    notIncluded: {
      en: [
        'Association membership fees',
        'Bank charges and solvency certificate fees',
        'Customs clearance or freight, which are separate services',
      ],
      bn: [
        'অ্যাসোসিয়েশন সদস্যপদ ফি',
        'ব্যাংক চার্জ ও সচ্ছলতা সনদের ফি',
        'শুল্ক ছাড়করণ বা ফ্রেইট, যা আলাদা সেবা',
      ],
    },
    eligibility: {
      en: 'You need a trade licence, e-TIN, BIN and a bank account before this can be filed.',
      bn: 'দাখিলের আগে ট্রেড লাইসেন্স, ই-টিআইএন, বিআইএন ও ব্যাংক হিসাব থাকতে হবে।',
    },
    authorityName: {
      en: 'Office of the Chief Controller of Imports and Exports (CCI&E)',
      bn: 'আমদানি ও রপ্তানি প্রধান নিয়ন্ত্রকের দপ্তর (CCI&E)',
    },
    startingFeeBdt: 15000,
    estimatedDaysMin: 10,
    estimatedDaysMax: 25,
    timeReviewedAt: '2026-07-28',
    requiresPartner: false,
    isRegulated: false,
    status: 'published',
    sortOrder: 10,
    requirements: [
      {
        code: 'trade_licence_copy',
        label: {
          en: 'Current trade licence',
          bn: 'চলতি ট্রেড লাইসেন্স',
        },
        help: null,
        appliesTo: 'company',
        isMandatory: true,
      },
      {
        code: 'bank_solvency',
        label: {
          en: 'Bank solvency certificate',
          bn: 'ব্যাংক সচ্ছলতা সনদ',
        },
        help: null,
        appliesTo: 'company',
        isMandatory: true,
      },
    ],
    milestones: [],
    feeComponents: [],
  },
  {
    id: 'd0000000-0000-4000-8000-000000000003',
    slug: 'etin-and-tax-setup',
    categorySlug: 'tax-vat',
    name: {
      en: 'e-TIN and initial tax setup',
      bn: 'ই-টিআইএন ও প্রাথমিক কর সেটআপ',
    },
    summary: {
      en: 'Get your taxpayer identification in place and understand what you must file.',
      bn: 'করদাতা শনাক্তকরণ নম্বর নিন এবং কী কী দাখিল করতে হবে তা বুঝে নিন।',
    },
    whoFor: {
      en: 'Every company and most proprietors and directors.',
      bn: 'প্রতিটি কোম্পানি এবং অধিকাংশ মালিক ও পরিচালক।',
    },
    included: {
      en: [
        'e-TIN registration for the entity',
        'e-TIN guidance for directors who need one',
        'Filing calendar added to your compliance page',
      ],
      bn: [
        'প্রতিষ্ঠানের জন্য ই-টিআইএন নিবন্ধন',
        'যেসব পরিচালকের দরকার তাঁদের ই-টিআইএন নির্দেশনা',
        'আপনার কমপ্লায়েন্স পাতায় দাখিলের সময়সূচি যোগ',
      ],
    },
    notIncluded: {
      en: [
        'Preparation or filing of income tax returns',
        'Accounting, bookkeeping or audit',
        'Any tax advice, which is a separate professional engagement',
      ],
      bn: [
        'আয়কর রিটার্ন প্রস্তুত বা দাখিল',
        'হিসাবরক্ষণ, বুককিপিং বা নিরীক্ষা',
        'কর বিষয়ক পরামর্শ, যা আলাদা পেশাদার চুক্তির বিষয়',
      ],
    },
    eligibility: {
      en: 'Available once you have an incorporation certificate or a proprietorship trade licence.',
      bn: 'নিবন্ধন সনদ অথবা একক মালিকানার ট্রেড লাইসেন্স থাকলে এই সেবা নেওয়া যায়।',
    },
    authorityName: {
      en: 'National Board of Revenue (NBR)',
      bn: 'জাতীয় রাজস্ব বোর্ড (NBR)',
    },
    startingFeeBdt: 4000,
    estimatedDaysMin: 2,
    estimatedDaysMax: 7,
    timeReviewedAt: '2026-08-12',
    requiresPartner: false,
    isRegulated: false,
    status: 'published',
    sortOrder: 10,
    requirements: [],
    milestones: [],
    feeComponents: [],
  },
  {
    id: 'd0000000-0000-4000-8000-000000000004',
    slug: 'bin-vat-registration',
    categorySlug: 'tax-vat',
    name: {
      en: 'BIN/VAT registration',
      bn: 'বিআইএন/ভ্যাট নিবন্ধন',
    },
    summary: {
      en: 'Register for VAT where your turnover or activity requires it.',
      bn: 'টার্নওভার বা কার্যক্রমের কারণে যেখানে প্রয়োজন, সেখানে ভ্যাট নিবন্ধন।',
    },
    whoFor: {
      en: 'Businesses crossing the VAT threshold, importing, exporting, or supplying to VAT-registered buyers.',
      bn: 'যেসব ব্যবসা ভ্যাটের সীমা অতিক্রম করে, আমদানি-রপ্তানি করে, বা ভ্যাট-নিবন্ধিত ক্রেতাকে সরবরাহ করে।',
    },
    included: {
      en: [
        'Eligibility check against your activity and turnover',
        'Application preparation and submission',
        'BIN certificate delivered to your vault',
      ],
      bn: [
        'আপনার কার্যক্রম ও টার্নওভারের ভিত্তিতে যোগ্যতা যাচাই',
        'আবেদন প্রস্তুত ও দাখিল',
        'বিআইএন সনদ আপনার ভল্টে পৌঁছে দেওয়া',
      ],
    },
    notIncluded: {
      en: [
        'Monthly VAT return preparation',
        'VAT advisory or classification opinions',
        'Any penalty arising from earlier periods',
      ],
      bn: [
        'মাসিক ভ্যাট রিটার্ন প্রস্তুত',
        'ভ্যাট পরামর্শ বা শ্রেণিবিন্যাস মতামত',
        'আগের সময়ের কোনো জরিমানা',
      ],
    },
    eligibility: {
      en: 'Requires an active e-TIN and, in most cases, a trade licence and bank account.',
      bn: 'সক্রিয় ই-টিআইএন এবং সাধারণত ট্রেড লাইসেন্স ও ব্যাংক হিসাব থাকতে হবে।',
    },
    authorityName: {
      en: 'National Board of Revenue (NBR)',
      bn: 'জাতীয় রাজস্ব বোর্ড (NBR)',
    },
    startingFeeBdt: 6000,
    estimatedDaysMin: 3,
    estimatedDaysMax: 10,
    timeReviewedAt: '2026-08-12',
    requiresPartner: false,
    isRegulated: false,
    status: 'published',
    sortOrder: 20,
    requirements: [],
    milestones: [],
    feeComponents: [],
  },
  {
    id: 'd0000000-0000-4000-8000-000000000008',
    slug: 'travel-agency-registration',
    categorySlug: 'licences',
    name: {
      en: 'Travel agency registration',
      bn: 'ট্রাভেল এজেন্সি নিবন্ধন',
    },
    summary: {
      en: 'Sector registration for travel businesses.',
      bn: 'ভ্রমণ ব্যবসার জন্য খাতভিত্তিক নিবন্ধন।',
    },
    whoFor: {
      en: 'Businesses selling travel services from Bangladesh.',
      bn: 'বাংলাদেশ থেকে ভ্রমণ সেবা বিক্রি করে এমন ব্যবসা।',
    },
    included: {
      en: [],
      bn: [],
    },
    notIncluded: {
      en: [],
      bn: [],
    },
    eligibility: {
      en: 'This is a regulated activity with its own eligibility conditions, security deposit and premises requirements. We will confirm what applies to you after review.',
      bn: 'এটি একটি নিয়ন্ত্রিত কার্যক্রম, যার নিজস্ব যোগ্যতার শর্ত, জামানত ও কার্যালয় সংক্রান্ত প্রয়োজনীয়তা আছে। যাচাইয়ের পর আপনার ক্ষেত্রে কী প্রযোজ্য তা আমরা নিশ্চিত করব।',
    },
    authorityName: {
      en: 'Ministry of Civil Aviation and Tourism',
      bn: 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয়',
    },
    startingFeeBdt: null,
    estimatedDaysMin: null,
    estimatedDaysMax: null,
    timeReviewedAt: null,
    requiresPartner: true,
    isRegulated: true,
    status: 'coming_soon',
    sortOrder: 90,
    requirements: [],
    milestones: [],
    feeComponents: [],
  },
];

export const SNAPSHOT_FAQS: Faq[] = [
  {
    id: '7a1858f1-21cb-436a-906e-5cb6cd92581d',
    serviceSlug: null,
    question: {
      en: 'Can a foreign national own a company in Bangladesh?',
      bn: 'বিদেশি নাগরিক কি বাংলাদেশে কোম্পানির মালিক হতে পারেন?',
    },
    answer: {
      en: 'In many sectors, yes — foreign shareholding is permitted, and in some it can be up to full ownership. But some sectors are restricted, capped or closed, and the answer depends on exactly what the business will do. We arrange a partner review of your specific activity and ownership before you commit to anything.',
      bn: 'অনেক খাতেই হ্যাঁ — বিদেশি শেয়ারহোল্ডিং অনুমোদিত, কোথাও কোথাও শতভাগ মালিকানাও সম্ভব। তবে কিছু খাত সীমাবদ্ধ, সীমা-নির্ধারিত বা বন্ধ, আর উত্তরটা নির্ভর করে ব্যবসাটি ঠিক কী করবে তার ওপর। আপনি কিছুতে প্রতিশ্রুতিবদ্ধ হওয়ার আগেই আমরা আপনার নির্দিষ্ট কার্যক্রম ও মালিকানার অংশীদার-যাচাইয়ের ব্যবস্থা করি।',
    },
    isGlobal: true,
    isComplianceSensitive: true,
    lastReviewedAt: '2026-08-02',
    sortOrder: 10,
  },
  {
    id: '00357936-c5e9-4dda-a361-e109d9cfaf49',
    serviceSlug: null,
    question: {
      en: 'Does registering a company give me a visa or work permit?',
      bn: 'কোম্পানি নিবন্ধন করলে কি ভিসা বা ওয়ার্ক পারমিট পাওয়া যায়?',
    },
    answer: {
      en: 'No. Incorporation and immigration are separate processes decided by different authorities. Owning shares in a Bangladeshi company does not by itself give you the right to live or work in Bangladesh. Visa and work-permit applications are their own applications, with their own conditions and their own outcome.',
      bn: 'না। কোম্পানি গঠন ও অভিবাসন আলাদা প্রক্রিয়া, সিদ্ধান্ত নেয় ভিন্ন কর্তৃপক্ষ। বাংলাদেশি কোম্পানির শেয়ার থাকা মানেই বাংলাদেশে বসবাস বা কাজ করার অধিকার নয়। ভিসা ও ওয়ার্ক পারমিট আলাদা আবেদন, যার নিজস্ব শর্ত ও নিজস্ব ফলাফল আছে।',
    },
    isGlobal: true,
    isComplianceSensitive: true,
    lastReviewedAt: '2026-08-02',
    sortOrder: 20,
  },
  {
    id: '63cafe7e-8af4-48b8-9ad9-3490da86b9a0',
    serviceSlug: null,
    question: {
      en: 'Are government fees included in your price?',
      bn: 'আপনাদের মূল্যে কি সরকারি ফি অন্তর্ভুক্ত?',
    },
    answer: {
      en: 'No. Our service fee and government fees are always shown as separate lines. Government fees vary with capital, location and category, so we show them as an estimate until the authority issues a receipt. When we pay a fee on your behalf we attach the official receipt or challan to your case, and any unused advance is returned to you.',
      bn: 'না। আমাদের সেবা ফি ও সরকারি ফি সবসময় আলাদা লাইনে দেখানো হয়। মূলধন, অবস্থান ও শ্রেণি অনুযায়ী সরকারি ফি বদলায়, তাই কর্তৃপক্ষ রসিদ না দেওয়া পর্যন্ত আমরা সেটি আনুমানিক হিসেবে দেখাই। আপনার পক্ষে ফি পরিশোধ করলে সরকারি রসিদ বা চালান আপনার কেসে সংযুক্ত করি, আর অব্যবহৃত অগ্রিম ফেরত দিই।',
    },
    isGlobal: true,
    isComplianceSensitive: false,
    lastReviewedAt: '2026-08-12',
    sortOrder: 30,
  },
  {
    id: '749f2e0c-145b-4613-95ff-a7730d1c4a8d',
    serviceSlug: null,
    question: {
      en: 'Who does the legal work?',
      bn: 'আইনি কাজটা কে করেন?',
    },
    answer: {
      en: 'BDoor is not a law firm. We coordinate your case, hold your documents and manage the process. Where a matter needs legal or specialist authority — drafting, representation, regulated filings — a verified partner advocate or firm is engaged under a separate agreement with you. We tell you which partner, and what they will receive, before anything is shared.',
      bn: 'BDoor কোনো আইনি প্রতিষ্ঠান নয়। আমরা আপনার কেস সমন্বয় করি, কাগজপত্র রাখি এবং প্রক্রিয়াটি পরিচালনা করি। যেখানে আইনি বা বিশেষায়িত কর্তৃত্ব দরকার — খসড়া প্রণয়ন, প্রতিনিধিত্ব, নিয়ন্ত্রিত দাখিল — সেখানে যাচাইকৃত অংশীদার আইনজীবী বা প্রতিষ্ঠান আপনার সঙ্গে আলাদা চুক্তিতে যুক্ত হন। কোনো কিছু শেয়ার করার আগেই আমরা জানাই কোন অংশীদার এবং তাঁরা কী পাবেন।',
    },
    isGlobal: true,
    isComplianceSensitive: false,
    lastReviewedAt: '2026-08-12',
    sortOrder: 40,
  },
  {
    id: '8fdbed78-745a-4626-8733-03d5a35ffca4',
    serviceSlug: null,
    question: {
      en: 'How long does registration take?',
      bn: 'নিবন্ধনে কত সময় লাগে?',
    },
    answer: {
      en: 'It depends on the structure, whether there is foreign ownership, and how quickly complete documents arrive. Each service page shows an estimated range and the date that estimate was last reviewed. That range assumes complete documents and a successful review; it is not a guarantee, and the clock pauses while we are waiting on you, a partner or an authority.',
      bn: 'এটি নির্ভর করে কাঠামো, বিদেশি মালিকানা আছে কি না, এবং সম্পূর্ণ কাগজপত্র কত দ্রুত আসে তার ওপর। প্রতিটি সেবার পাতায় আনুমানিক সময়সীমা এবং সেটি সর্বশেষ কবে পর্যালোচনা হয়েছে তা দেখানো থাকে। এই হিসাব সম্পূর্ণ কাগজপত্র ও সফল যাচাই ধরে নিয়ে; এটি নিশ্চয়তা নয়, আর আপনার, অংশীদারের বা কর্তৃপক্ষের অপেক্ষায় থাকলে ঘড়ি থেমে থাকে।',
    },
    isGlobal: true,
    isComplianceSensitive: false,
    lastReviewedAt: '2026-08-12',
    sortOrder: 50,
  },
  {
    id: '05c983dd-50b0-43c3-af0d-ec009165e5c2',
    serviceSlug: null,
    question: {
      en: 'How are my documents protected?',
      bn: 'আমার কাগজপত্র কীভাবে সুরক্ষিত থাকে?',
    },
    answer: {
      en: 'Documents go into private storage, never a public link and never email. Download links are short-lived and every view, download and replacement is logged with who did it and when. Your assigned BDoor case team can see them; a partner can only see them after you have authorised that specific sharing, and we show you which partner and why.',
      bn: 'কাগজপত্র যায় ব্যক্তিগত স্টোরেজে — কখনো পাবলিক লিঙ্কে বা ইমেইলে নয়। ডাউনলোড লিঙ্ক স্বল্পস্থায়ী, আর প্রতিটি দেখা, ডাউনলোড ও প্রতিস্থাপন কে কখন করল তা নথিভুক্ত হয়। আপনার নিযুক্ত BDoor কেস টিম এগুলো দেখতে পায়; অংশীদার দেখতে পান কেবল আপনি ওই নির্দিষ্ট শেয়ারিং অনুমোদন করার পর, এবং কোন অংশীদার ও কেন তা আমরা আপনাকে জানাই।',
    },
    isGlobal: true,
    isComplianceSensitive: false,
    lastReviewedAt: '2026-08-12',
    sortOrder: 60,
  },
  {
    id: '8501b4b7-da44-47cd-ade4-732ec30596be',
    serviceSlug: null,
    question: {
      en: 'Can BDoor guarantee approval?',
      bn: 'BDoor কি অনুমোদনের নিশ্চয়তা দিতে পারে?',
    },
    answer: {
      en: 'No, and nobody honestly can. Approval is a decision for the relevant authority. What we can do is make sure your application is complete, correct and submitted properly, tell you plainly if we think something will not be approved, and keep you informed if a query is raised.',
      bn: 'না, এবং সততার সঙ্গে কেউই পারে না। অনুমোদনের সিদ্ধান্ত সংশ্লিষ্ট কর্তৃপক্ষের। আমরা যা পারি তা হলো আপনার আবেদন সম্পূর্ণ, নির্ভুল ও যথাযথভাবে দাখিল করা, কোনো কিছু অনুমোদিত হবে না মনে হলে সরাসরি বলা, এবং কোনো প্রশ্ন উঠলে আপনাকে জানানো।',
    },
    isGlobal: true,
    isComplianceSensitive: true,
    lastReviewedAt: '2026-08-02',
    sortOrder: 70,
  },
];

export const SNAPSHOT_RESOURCES: ResourcePage[] = [
  {
    slug: 'foreign-investment-first-steps',
    kind: 'resource',
    title: {
      en: 'Foreign investment: the order the steps have to happen in',
      bn: 'বিদেশি বিনিয়োগ: ধাপগুলো যে ক্রমে হতে হয়',
    },
    excerpt: {
      en: 'Most delays come from doing the right things in the wrong order.',
      bn: 'বেশিরভাগ দেরি হয় ঠিক কাজগুলো ভুল ক্রমে করার কারণে।',
    },
    body: {
      en: "## The order matters more than the speed\n\nA foreign-invested company in Bangladesh involves a bank, a registrar, a revenue authority and sometimes an investment authority. Each expects something the previous step produced. Do them out of order and you will redo them.\n\n## A typical sequence\n\n1. **Eligibility review.** Can this activity be foreign-owned, and to what extent? Establish this before spending anything.\n2. **Name clearance.** Reserve the proposed company name.\n3. **Temporary bank account.** Opened in the proposed company's name so capital can be received before the company legally exists.\n4. **Inward remittance.** Capital is sent from abroad into that account, and the bank issues an encashment certificate. **This money goes to the bank, never to BDoor.**\n5. **Incorporation.** Filed with the encashment certificate as evidence of capital.\n6. **Post-incorporation registrations.** Trade licence, e-TIN, BIN/VAT, and any sector licence.\n7. **Investment registration.** Where applicable, registered with the investment authority.\n\n## What this does not give you\n\nNone of the above is an immigration decision. If you intend to live or work in Bangladesh, a visa and usually a work permit are separate applications with their own requirements and their own outcome.\n\n## Where it usually goes wrong\n\n- Sending capital before the account exists in the right name.\n- Assuming the sector is open without checking.\n- Discovering a corporate shareholder's ownership chain cannot be documented.",
      bn: '## গতি নয়, ক্রমটাই বেশি গুরুত্বপূর্ণ\n\nবাংলাদেশে বিদেশি-বিনিয়োগকৃত কোম্পানির সঙ্গে জড়িত থাকে ব্যাংক, নিবন্ধক, রাজস্ব কর্তৃপক্ষ এবং কখনো বিনিয়োগ কর্তৃপক্ষ। প্রত্যেকে চায় আগের ধাপে তৈরি হওয়া কিছু একটা। ক্রম উল্টে গেলে কাজ আবার করতে হবে।\n\n## সাধারণ ক্রম\n\n১. **যোগ্যতা যাচাই।** এই কার্যক্রমে বিদেশি মালিকানা চলে কি, চললে কতটুকু? খরচ করার আগেই নিশ্চিত হোন।\n২. **নাম ছাড়পত্র।** প্রস্তাবিত কোম্পানির নাম সংরক্ষণ করুন।\n৩. **অস্থায়ী ব্যাংক হিসাব।** প্রস্তাবিত কোম্পানির নামে খোলা হয়, যাতে কোম্পানি আইনত অস্তিত্ব পাওয়ার আগেই মূলধন গ্রহণ করা যায়।\n৪. **বিদেশ থেকে অর্থ প্রেরণ।** ওই হিসাবে বিদেশ থেকে মূলধন আসে, ব্যাংক এনক্যাশমেন্ট সার্টিফিকেট দেয়। **এই অর্থ যায় ব্যাংকে, কখনোই BDoor-এ নয়।**\n৫. **কোম্পানি গঠন।** মূলধনের প্রমাণ হিসেবে এনক্যাশমেন্ট সার্টিফিকেটসহ দাখিল।\n৬. **গঠন-পরবর্তী নিবন্ধন।** ট্রেড লাইসেন্স, ই-টিআইএন, বিআইএন/ভ্যাট এবং প্রযোজ্য খাত-লাইসেন্স।\n৭. **বিনিয়োগ নিবন্ধন।** প্রযোজ্য ক্ষেত্রে বিনিয়োগ কর্তৃপক্ষে নিবন্ধন।\n\n## এতে যা পাওয়া যায় না\n\nউপরের কোনোটিই অভিবাসনের সিদ্ধান্ত নয়। বাংলাদেশে থাকতে বা কাজ করতে চাইলে ভিসা এবং সাধারণত ওয়ার্ক পারমিট আলাদা আবেদন, যার নিজস্ব শর্ত ও নিজস্ব ফলাফল।\n\n## সাধারণত যেখানে ভুল হয়\n\n- সঠিক নামে হিসাব খোলার আগেই মূলধন পাঠানো।\n- যাচাই না করে ধরে নেওয়া যে খাতটি উন্মুক্ত।\n- কর্পোরেট শেয়ারহোল্ডারের মালিকানা-শৃঙ্খল নথিভুক্ত করা যাচ্ছে না, তা দেরিতে বোঝা।',
    },
    lastReviewedAt: '2026-08-17',
    nextReviewDue: '2026-11-15',
    publishedAt: '2026-08-17 20:14:40.384184+00',
    readingMinutes: 7,
  },
  {
    slug: 'documents-you-will-need',
    kind: 'resource',
    title: {
      en: 'The documents you will actually be asked for',
      bn: 'আপনার কাছে আসলে যেসব কাগজ চাওয়া হবে',
    },
    excerpt: {
      en: 'A realistic checklist, and why each item is requested.',
      bn: 'বাস্তবসম্মত একটি তালিকা, আর প্রতিটি কাগজ কেন চাওয়া হয়।',
    },
    body: {
      en: "## Why we ask for so much up front\n\nTwo reasons. First, registrations fail on missing paperwork far more often than on anything substantive. Second, we are required to identify who is behind a business before we act for them — that is an anti-money-laundering obligation, not administrative curiosity.\n\n## For every person involved\n\n- **National ID or passport.** Identity, nationality and date of birth.\n- **Photograph.** Required by several forms.\n- **Proof of address.** A recent utility bill or bank statement is usually accepted.\n- **e-TIN.** Where the person needs one.\n\n## For the business\n\n- **Proposed names.** Bring three, in order of preference.\n- **Registered address evidence.** A rental agreement or ownership deed.\n- **Activity description.** In plain language. This decides which licences apply.\n\n## Where a company owns part of the business\n\nWe will need that company's incorporation documents, its register of members, and enough of its ownership chain to identify the people who ultimately control it. If that chain runs through several countries, expect this step to take longer.\n\n## What we do not want\n\nDo not email documents. Do not send originals. Do not upload anything that is not asked for — collecting more than we need is a liability for both of us.",
      bn: '## শুরুতেই এত কিছু কেন চাই\n\nদুটি কারণ। প্রথমত, নিবন্ধন আটকে যায় মূল বিষয়ের চেয়ে অনেক বেশি বার কাগজপত্রের ঘাটতিতে। দ্বিতীয়ত, কারও পক্ষে কাজ করার আগে ব্যবসার পেছনে কারা আছেন তা শনাক্ত করা আমাদের বাধ্যবাধকতা — এটি মানি লন্ডারিং প্রতিরোধের দায়, নিছক কৌতূহল নয়।\n\n## সংশ্লিষ্ট প্রত্যেকের জন্য\n\n- **জাতীয় পরিচয়পত্র বা পাসপোর্ট।** পরিচয়, নাগরিকত্ব ও জন্মতারিখ।\n- **ছবি।** একাধিক ফরমে প্রয়োজন হয়।\n- **ঠিকানার প্রমাণ।** সাম্প্রতিক ইউটিলিটি বিল বা ব্যাংক স্টেটমেন্ট সাধারণত গ্রহণযোগ্য।\n- **ই-টিআইএন।** যাঁর প্রয়োজন, তাঁর জন্য।\n\n## ব্যবসার জন্য\n\n- **প্রস্তাবিত নাম।** পছন্দের ক্রম অনুযায়ী তিনটি রাখুন।\n- **নিবন্ধিত ঠিকানার প্রমাণ।** ভাড়ার চুক্তি বা মালিকানার দলিল।\n- **কার্যক্রমের বিবরণ।** সহজ ভাষায়। এর ওপরই নির্ভর করে কোন লাইসেন্স লাগবে।\n\n## ব্যবসার অংশীদার যখন একটি কোম্পানি\n\nওই কোম্পানির নিবন্ধন দলিল, সদস্য তালিকা, এবং মালিকানার শৃঙ্খলের যতটুকু দরকার — যাতে শেষ পর্যন্ত কারা নিয়ন্ত্রণ করেন তা শনাক্ত করা যায় — সবই লাগবে। শৃঙ্খলটি একাধিক দেশ ছুঁয়ে গেলে এই ধাপে বেশি সময় লাগবে ধরে নিন।\n\n## যা আমরা চাই না\n\nকাগজ ইমেইল করবেন না। মূল কপি পাঠাবেন না। যা চাওয়া হয়নি তা আপলোড করবেন না — প্রয়োজনের বেশি তথ্য রাখা আমাদের দুজনের জন্যই ঝুঁকি।',
    },
    lastReviewedAt: '2026-08-07',
    nextReviewDue: '2026-11-05',
    publishedAt: '2026-08-07 20:14:40.384184+00',
    readingMinutes: 5,
  },
  {
    slug: 'choosing-a-structure',
    kind: 'resource',
    title: {
      en: 'Choosing a structure: private limited, partnership or proprietorship',
      bn: 'কাঠামো বাছাই: প্রাইভেট লিমিটেড, পার্টনারশিপ নাকি একক মালিকানা',
    },
    excerpt: {
      en: 'The practical differences that actually change your day-to-day, not the textbook ones.',
      bn: 'পাঠ্যবইয়ের নয় — বাস্তবে আপনার দৈনন্দিন কাজ যেগুলোর জন্য বদলে যায়, সেই পার্থক্যগুলো।',
    },
    body: {
      en: '## Start from what you are actually doing\n\nMost founders pick a structure because someone told them to. That is backwards. The structure should follow three things: how many people own the business, whether you need limited liability, and whether anyone will ever invest.\n\n## Private limited company\n\nThe default for a business with two or more owners. Liability is limited to what you put in, shares can be transferred, and investors understand it. In exchange you accept annual filings, a statutory audit and a registered office.\n\n## Partnership\n\nSimpler to set up and cheaper to run, but partners are personally liable. Reasonable for a professional practice between people who trust each other completely. Rarely the right answer if you plan to raise money.\n\n## Sole proprietorship\n\nThere is no separate legal person: the business is you. That means the fastest start and the least paperwork, and also that a business debt is your debt. Fine for a small trading or service operation you run yourself.\n\n## What actually changes your mind\n\n- **Foreign ownership.** A proprietorship is not the route. If a non-resident will own part of the business, you are almost certainly looking at a company.\n- **A corporate shareholder.** Only a company can hold shares in a company.\n- **Bank and buyer expectations.** Larger buyers and most banks are more comfortable with an incorporated entity.\n\nIf you are unsure, answer the questionnaire and say so — "I\'m not sure" is a valid answer and we will come back with a recommendation rather than a guess.',
      bn: '## যা আসলে করছেন, সেখান থেকে শুরু করুন\n\nবেশিরভাগ উদ্যোক্তা কাঠামো বাছেন কারণ কেউ একজন বলেছে। এটা উল্টো পথ। কাঠামো ঠিক হওয়া উচিত তিনটি বিষয় দেখে: কতজন মালিক, সীমিত দায় দরকার কি না, আর কখনো কেউ বিনিয়োগ করবে কি না।\n\n## প্রাইভেট লিমিটেড কোম্পানি\n\nদুই বা তার বেশি মালিকের ব্যবসার জন্য সাধারণ পছন্দ। দায় সীমাবদ্ধ থাকে আপনার বিনিয়োগ পর্যন্ত, শেয়ার হস্তান্তরযোগ্য, আর বিনিয়োগকারীরা এই কাঠামো বোঝেন। বিনিময়ে মেনে নিতে হয় বার্ষিক রিটার্ন, বিধিবদ্ধ নিরীক্ষা ও নিবন্ধিত কার্যালয়।\n\n## পার্টনারশিপ\n\nগঠন সহজ, চালানো সস্তা, কিন্তু অংশীদাররা ব্যক্তিগতভাবে দায়ী। পরস্পরের ওপর পূর্ণ আস্থা আছে এমন পেশাজীবীদের যৌথ প্র্যাকটিসের জন্য যুক্তিসঙ্গত। টাকা তুলতে চাইলে সাধারণত এটি সঠিক উত্তর নয়।\n\n## একক মালিকানা\n\nএখানে আলাদা কোনো আইনি সত্তা নেই: ব্যবসাটাই আপনি। মানে সবচেয়ে দ্রুত শুরু আর সবচেয়ে কম কাগজপত্র, আবার ব্যবসার দেনাও আপনারই দেনা। নিজে চালানো ছোট ব্যবসা বা সেবার জন্য ঠিক আছে।\n\n## যা আসলে সিদ্ধান্ত বদলে দেয়\n\n- **বিদেশি মালিকানা।** একক মালিকানা এখানে পথ নয়। কোনো অনিবাসী ব্যবসার অংশীদার হলে প্রায় নিশ্চিতভাবেই কোম্পানির দিকেই যেতে হবে।\n- **কর্পোরেট শেয়ারহোল্ডার।** কোম্পানির শেয়ার কেবল কোম্পানিই ধরে রাখতে পারে।\n- **ব্যাংক ও ক্রেতার প্রত্যাশা।** বড় ক্রেতা ও অধিকাংশ ব্যাংক নিবন্ধিত প্রতিষ্ঠানেই বেশি স্বাচ্ছন্দ্য বোধ করেন।\n\nনিশ্চিত না হলে প্রশ্নমালায় সেটাই লিখুন — “নিশ্চিত নই” একটি বৈধ উত্তর, আর আমরা অনুমান না করে সুপারিশ নিয়ে ফিরব।',
    },
    lastReviewedAt: '2026-07-28',
    nextReviewDue: '2026-10-26',
    publishedAt: '2026-07-28 20:14:40.384184+00',
    readingMinutes: 6,
  },
];
