import type { InternationalOffer, ServicePackage } from '@/features/packages/types';

/** The owner's last commercial review of every figure in this file. */
export const COMMERCIAL_REVIEW_DATE = '2026-08-28';
const REVIEW_DATE = COMMERCIAL_REVIEW_DATE;

/**
 * Research date of the seven-country specification. Internal working figures
 * added by that research carry this date; nothing they contain is published
 * until the availability ladder and the approval flags say it may be.
 */
const SEVEN_COUNTRY_RESEARCH_DATE = '2026-08-29';

function bdFee(
  amountBdt: number,
  label: { en: string; bn: string },
  opts?: { isEstimate?: boolean; notes?: { en: string; bn: string } },
) {
  return {
    layer: 'platform_service_fee' as const,
    label,
    amountMinor: amountBdt * 100,
    currency: 'BDT' as const,
    isEstimate: false,
    isRefundable: false,
    payee: 'bdoor' as const,
    taxTreatment: 'pending_review' as const,
    reviewedAt: REVIEW_DATE,
    ...opts,
  };
}

export const BANGLADESH_PACKAGES: ServicePackage[] = [
  {
    slug: 'solo-start',
    segment: 'new_business',
    jurisdictionCode: 'BD',
    sortOrder: 10,
    name: { en: 'Solo Start', bn: 'সোলো স্টার্ট' },
    versions: [
      {
        version: 1,
        effectiveFrom: REVIEW_DATE,
        status: 'published',
        checkoutEnabled: true,
        priceType: 'fixed',
        publicLabel: {
          en: 'BDT 9,900 + official fees',
          bn: '৯,৯০০ টাকা + সরকারি ফি',
        },
        summary: {
          en: 'For a sole proprietor or single-founder start with essential registrations.',
          bn: 'একক মালিকানা বা একজন প্রতিষ্ঠাতার জন্য প্রয়োজনীয় নিবন্ধন।',
        },
        inclusions: [
          { en: 'Business structure review', bn: 'ব্যবসার কাঠামো যাচাই' },
          { en: 'Trade-licence coordination', bn: 'ট্রেড লাইসেন্স সমন্বয়' },
          { en: 'e-TIN application assistance', bn: 'ই-টিআইএন আবেদন সহায়তা' },
          { en: 'Document checklist', bn: 'কাগজপত্রের চেকলিস্ট' },
          { en: 'Secure workspace onboarding', bn: 'নিরাপদ ওয়ার্কস্পেস অনবোর্ডিং' },
        ],
        exclusions: [
          { en: 'Government and authority fees', bn: 'সরকারি ও কর্তৃপক্ষের ফি' },
          { en: 'Notarisation and translation', bn: 'নোটারাইজেশন ও অনুবাদ' },
        ],
        limits: [{ en: 'One business location', bn: 'একটি ব্যবসার স্থান' }],
        feeComponents: [bdFee(9900, { en: 'bdoor professional fee', bn: 'bdoor পেশাদার ফি' })],
        assumptions: [
          {
            en: 'Government application fees are paid directly to authorities where applicable.',
            bn: 'প্রযোজ্য ক্ষেত্রে সরকারি আবেদন ফি সরাসরি কর্তৃপক্ষে পরিশোধিত হয়।',
          },
        ],
      },
    ],
  },
  {
    slug: 'limited-company',
    segment: 'new_business',
    jurisdictionCode: 'BD',
    sortOrder: 20,
    name: { en: 'Limited Company', bn: 'লিমিটেড কোম্পানি' },
    versions: [
      {
        version: 1,
        effectiveFrom: REVIEW_DATE,
        status: 'published',
        checkoutEnabled: true,
        priceType: 'fixed',
        publicLabel: {
          en: 'BDT 24,900 + RJSC fees',
          bn: '২৪,৯০০ টাকা + আরজেএসসি ফি',
        },
        summary: {
          en: 'Private limited company incorporation with RJSC filing coordination.',
          bn: 'আরজেএসসি ফাইলিং সমন্বয়সহ প্রাইভেট লিমিটেড কোম্পানি গঠন।',
        },
        inclusions: [
          { en: 'Name clearance coordination', bn: 'নাম ক্লিয়ারেন্স সমন্বয়' },
          { en: 'MOA/AOA preparation support', bn: 'MOA/AOA প্রস্তুতি সহায়তা' },
          { en: 'RJSC incorporation filing', bn: 'আরজেএসসি গঠন ফাইলিং' },
          { en: 'Share schedule setup', bn: 'শেয়ার তালিকা সেটআপ' },
          { en: 'Post-incorporation checklist', bn: 'গঠন-পরবর্তী চেকলিস্ট' },
        ],
        exclusions: [
          { en: 'RJSC statutory fees', bn: 'আরজেএসসি আইনগত ফি' },
          { en: 'Stamp and notary costs', bn: 'স্ট্যাম্প ও নোটারি খরচ' },
        ],
        limits: [
          {
            en: 'Up to four shareholders in base scope',
            bn: 'মূল সুযোগে সর্বোচ্চ চার শেয়ারহোল্ডার',
          },
        ],
        feeComponents: [bdFee(24900, { en: 'bdoor professional fee', bn: 'bdoor পেশাদার ফি' })],
        assumptions: [],
      },
    ],
  },
  {
    slug: 'complete-launch',
    segment: 'new_business',
    jurisdictionCode: 'BD',
    sortOrder: 30,
    name: { en: 'Complete Launch', bn: 'কমপ্লিট লঞ্চ' },
    versions: [
      {
        version: 1,
        effectiveFrom: REVIEW_DATE,
        status: 'published',
        checkoutEnabled: true,
        priceType: 'fixed',
        publicLabel: {
          en: 'BDT 39,900 + official and third-party fees',
          bn: '৩৯,৯০০ টাকা + সরকারি ও তৃতীয় পক্ষের ফি',
        },
        summary: {
          en: 'Incorporation plus the registrations most founders need to trade lawfully.',
          bn: 'গঠনসহ বৈধভাবে ব্যবসা শুরুর জন্য প্রয়োজনীয় নিবন্ধন।',
        },
        inclusions: [
          { en: 'Limited company incorporation', bn: 'লিমিটেড কোম্পানি গঠন' },
          { en: 'Trade-licence coordination', bn: 'ট্রেড লাইসেন্স সমন্বয়' },
          { en: 'e-TIN and BIN/VAT readiness', bn: 'ই-টিআইএন ও বিআইএন/ভ্যাট প্রস্তুতি' },
          { en: 'Bank-account readiness pack', bn: 'ব্যাংক হিসাব প্রস্তুতি প্যাক' },
          { en: 'Compliance calendar setup', bn: 'কমপ্লায়েন্স ক্যালেন্ডার সেটআপ' },
        ],
        exclusions: [
          { en: 'Government, bank and partner fees', bn: 'সরকারি, ব্যাংক ও অংশীদার ফি' },
        ],
        limits: [],
        feeComponents: [bdFee(39900, { en: 'bdoor professional fee', bn: 'bdoor পেশাদার ফি' })],
        assumptions: [],
      },
    ],
  },
  {
    slug: 'compliance-check',
    segment: 'existing_business',
    jurisdictionCode: 'BD',
    sortOrder: 40,
    name: { en: 'Compliance Check', bn: 'কমপ্লায়েন্স চেক' },
    versions: [
      {
        version: 1,
        effectiveFrom: REVIEW_DATE,
        status: 'published',
        checkoutEnabled: true,
        priceType: 'fixed',
        publicLabel: { en: 'BDT 14,900', bn: '১৪,৯০০ টাকা' },
        summary: {
          en: 'A structured review of filings, licences and registrations already on record.',
          bn: 'ইতিমধ্যে থাকা রিটার্ন, লাইসেন্স ও নিবন্ধনের কাঠামোবদ্ধ পর্যালোচনা।',
        },
        inclusions: [
          { en: 'Registration inventory', bn: 'নিবন্ধন তালিকা' },
          { en: 'Gap analysis report', bn: 'ঘাটতি বিশ্লেষণ রিপোর্ট' },
          { en: 'Renewal calendar setup', bn: 'নবায়ন ক্যালেন্ডার সেটআপ' },
          { en: 'Priority action list', bn: 'অগ্রাধিকার তালিকা' },
          { en: 'One follow-up consultation', bn: 'একটি ফলো-আপ পরামর্শ' },
        ],
        exclusions: [
          { en: 'Filing or penalty settlement fees', bn: 'ফাইলিং বা জরিমানা নিষ্পত্তি ফি' },
        ],
        limits: [{ en: 'One legal entity', bn: 'একটি আইনি সত্তা' }],
        feeComponents: [bdFee(14900, { en: 'bdoor professional fee', bn: 'bdoor পেশাদার ফি' })],
        assumptions: [],
      },
    ],
  },
  {
    slug: 'annual-compliance',
    segment: 'existing_business',
    jurisdictionCode: 'BD',
    sortOrder: 50,
    name: { en: 'Annual Compliance', bn: 'বার্ষিক কমপ্লায়েন্স' },
    versions: [
      {
        version: 1,
        effectiveFrom: REVIEW_DATE,
        status: 'published',
        checkoutEnabled: true,
        priceType: 'fixed',
        billingPeriod: 'year',
        publicLabel: {
          en: 'BDT 49,900/year + official, audit and specialist fees',
          bn: '৪৯,৯০০ টাকা/বছর + সরকারি, অডিট ও বিশেষজ্ঞ ফি',
        },
        summary: {
          en: 'Annual return, renewals and reminders for an operating company.',
          bn: 'চলমান কোম্পানির বার্ষিক রিটার্ন, নবায়ন ও রিমাইন্ডার।',
        },
        inclusions: [
          { en: 'Annual return coordination', bn: 'বার্ষিক রিটার্ন সমন্বয়' },
          { en: 'Licence renewal tracking', bn: 'লাইসেন্স নবায়ন ট্র্যাকিং' },
          { en: 'Compliance reminders', bn: 'কমপ্লায়েন্স রিমাইন্ডার' },
          { en: 'Document vault maintenance', bn: 'ডকুমেন্ট ভল্ট রক্ষণাবেক্ষণ' },
          { en: 'Quarterly status review', bn: 'ত্রৈমাসিক অবস্থা পর্যালোচনা' },
        ],
        exclusions: [
          { en: 'Audit, government and late-payment penalties', bn: 'অডিট, সরকারি ও দেরি জরিমানা' },
        ],
        limits: [],
        feeComponents: [bdFee(49900, { en: 'bdoor annual fee', bn: 'bdoor বার্ষিক ফি' })],
        assumptions: [],
      },
    ],
  },
  {
    slug: 'managed-finance-compliance',
    segment: 'existing_business',
    jurisdictionCode: 'BD',
    sortOrder: 60,
    name: { en: 'Managed Finance & Compliance', bn: 'ম্যানেজড ফাইন্যান্স ও কমপ্লায়েন্স' },
    versions: [
      {
        version: 1,
        effectiveFrom: REVIEW_DATE,
        status: 'published',
        checkoutEnabled: true,
        priceType: 'from',
        billingPeriod: 'month',
        publicLabel: {
          en: 'From BDT 11,900/month',
          bn: '১১,৯০০ টাকা/মাস থেকে',
        },
        summary: {
          en: 'Ongoing bookkeeping coordination, filings and compliance management.',
          bn: 'চলমান বুককিপিং সমন্বয়, ফাইলিং ও কমপ্লায়েন্স ব্যবস্থাপনা।',
        },
        inclusions: [
          { en: 'Monthly bookkeeping coordination', bn: 'মাসিক বুককিপিং সমন্বয়' },
          { en: 'VAT/tax filing coordination', bn: 'ভ্যাট/কর ফাইলিং সমন্বয়' },
          { en: 'Management accounts pack', bn: 'ম্যানেজমেন্ট অ্যাকাউন্ট প্যাক' },
          { en: 'Dedicated case manager', bn: 'নির্দিষ্ট কেস ম্যানেজার' },
          { en: 'Partner accountant engagement', bn: 'অংশীদার হিসাবরক্ষক এনগেজমেন্ট' },
        ],
        exclusions: [
          { en: 'Audit and specialist professional fees', bn: 'অডিট ও বিশেষজ্ঞ পেশাদার ফি' },
        ],
        limits: [
          { en: 'Annual prepay option BDT 119,000', bn: 'বার্ষিক প্রিপে বিকল্প ১,১৯,০০০ টাকা' },
        ],
        feeComponents: [bdFee(11900, { en: 'bdoor monthly fee', bn: 'bdoor মাসিক ফি' })],
        assumptions: [],
      },
    ],
  },
];

/**
 * Shared disclosures for every US LLC route (master §7).
 * Domestic US-created companies are currently exempt from standard FinCEN
 * BOI reporting — do not sell BOI filing as a default deliverable.
 */
const USA_DISCLOSURES = [
  { en: 'EIN has no IRS fee.', bn: 'EIN-এর জন্য IRS ফি নেই।' },
  { en: 'US state and annual fees vary.', bn: 'মার্কিন রাজ্য ও বার্ষিক ফি ভিন্ন হতে পারে।' },
  {
    en: 'Domestic US-created companies are currently exempt from standard FinCEN BOI reporting; BOI filing is not a default deliverable.',
    bn: 'দেশীয়ভাবে গঠিত মার্কিন কোম্পানি বর্তমানে মানক FinCEN BOI রিপোর্টিং থেকে অব্যাহতিপ্রাপ্ত; BOI ফাইলিং ডিফল্ট ডেলিভারেবল নয়।',
  },
  {
    en: 'Banking, payment accounts, visas, licences and government approvals are never guaranteed.',
    bn: 'ব্যাংকিং, পেমেন্ট অ্যাকাউন্ট, ভিসা, লাইসেন্স ও সরকারি অনুমোদন কখনোই নিশ্চিত নয়।',
  },
] as const;

function usaLlcOffer(opts: {
  slug: string;
  route: { en: string; bn: string };
  stateFeeMinor: number;
  stateFeeLabel: { en: string; bn: string };
  publicLabel: { en: string; bn: string };
  publicLabelAlt: { en: string; bn: string };
  publicQualifier: { en: string; bn: string };
}): InternationalOffer {
  return {
    slug: opts.slug,
    countryCode: 'US',
    countrySlug: 'usa',
    route: opts.route,
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    publicLabel: opts.publicLabel,
    publicLabelAlt: opts.publicLabelAlt,
    publicQualifier: opts.publicQualifier,
    summary: {
      en: 'LLC formation with EIN support, delivered with a licensed US provider.',
      bn: 'লাইসেন্সপ্রাপ্ত মার্কিন প্রদানকারীর সঙ্গে LLC গঠন ও EIN সহায়তা।',
    },
    disclosures: [...USA_DISCLOSURES],
    feeComponents: [
      {
        layer: 'platform_service_fee',
        label: { en: 'bdoor/partner fee', bn: 'bdoor/অংশীদার ফি' },
        amountMinor: 349_00,
        currency: 'USD',
        isEstimate: false,
        isRefundable: false,
        payee: 'bdoor',
        taxTreatment: 'pending_review',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: opts.stateFeeLabel,
        amountMinor: opts.stateFeeMinor,
        currency: 'USD',
        isEstimate: true,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
    ],
  };
}

export const INTERNATIONAL_OFFERS: InternationalOffer[] = [
  usaLlcOffer({
    slug: 'usa-wyoming-llc',
    route: { en: 'Wyoming LLC', bn: 'ওয়াইমিং LLC' },
    stateFeeMinor: 100_00,
    stateFeeLabel: { en: 'Wyoming state fee', bn: 'ওয়াইমিং রাজ্য ফি' },
    publicLabel: { en: 'USD 449 estimated total', bn: 'আনুমানিক মোট ৪৪৯ মার্কিন ডলার' },
    publicLabelAlt: { en: 'About ৳55,200', bn: 'আনুমানিক ৳৫৫,২০০' },
    publicQualifier: {
      en: 'Wyoming LLC estimated first-year package',
      bn: 'ওয়াইমিং LLC আনুমানিক প্রথম বছরের প্যাকেজ',
    },
  }),
  usaLlcOffer({
    slug: 'usa-delaware-llc',
    route: { en: 'Delaware LLC', bn: 'ডেলাওয়্যার LLC' },
    stateFeeMinor: 110_00,
    stateFeeLabel: { en: 'Delaware state fee', bn: 'ডেলাওয়্যার রাজ্য ফি' },
    publicLabel: { en: 'USD 459 estimated total', bn: 'আনুমানিক মোট ৪৫৯ মার্কিন ডলার' },
    publicLabelAlt: { en: 'About ৳56,500', bn: 'আনুমানিক ৳৫৬,৫০০' },
    publicQualifier: {
      en: 'Delaware LLC estimated first-year package',
      bn: 'ডেলাওয়্যার LLC আনুমানিক প্রথম বছরের প্যাকেজ',
    },
  }),
  usaLlcOffer({
    slug: 'usa-florida-llc',
    route: { en: 'Florida LLC', bn: 'ফ্লোরিডা LLC' },
    stateFeeMinor: 125_00,
    stateFeeLabel: { en: 'Florida state fee', bn: 'ফ্লোরিডা রাজ্য ফি' },
    publicLabel: { en: 'USD 474 estimated total', bn: 'আনুমানিক মোট ৪৭৪ মার্কিন ডলার' },
    publicLabelAlt: { en: 'About ৳58,300', bn: 'আনুমানিক ৳৫৮,৩০০' },
    publicQualifier: {
      en: 'Florida LLC estimated first-year package',
      bn: 'ফ্লোরিডা LLC আনুমানিক প্রথম বছরের প্যাকেজ',
    },
  }),
  {
    slug: 'uk-non-resident-ltd',
    countryCode: 'GB',
    countrySlug: 'uk',
    route: { en: 'Non-resident LTD', bn: 'নন-রেসিডেন্ট LTD' },
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    publicLabel: { en: 'GBP 349 estimated total', bn: 'আনুমানিক মোট ৩৪৯ পাউন্ড' },
    publicLabelAlt: { en: 'About ৳55,800', bn: 'আনুমানিক ৳৫৫,৮০০' },
    publicQualifier: {
      en: 'Non-resident LTD estimated first-year package',
      bn: 'অনাবাসী LTD আনুমানিক প্রথম বছরের প্যাকেজ',
    },
    summary: {
      en: 'Private limited company formation for non-resident founders.',
      bn: 'অনাবাসী প্রতিষ্ঠাতাদের জন্য প্রাইভেট লিমিটেড কোম্পানি গঠন।',
    },
    disclosures: [
      {
        en: 'UK identity verification and registered-office eligibility apply.',
        bn: 'যুক্তরাজ্য পরিচয় যাচাই ও নিবন্ধিত অফিস যোগ্যতা প্রযোজ্য।',
      },
      {
        en: 'Banking, payment accounts, visas, licences and government approvals are never guaranteed.',
        bn: 'ব্যাংকিং, পেমেন্ট অ্যাকাউন্ট, ভিসা, লাইসেন্স ও সরকারি অনুমোদন কখনোই নিশ্চিত নয়।',
      },
    ],
    feeComponents: [
      {
        layer: 'platform_service_fee',
        label: { en: 'bdoor/partner fee', bn: 'bdoor/অংশীদার ফি' },
        amountMinor: 249_00,
        currency: 'GBP',
        isEstimate: false,
        isRefundable: false,
        payee: 'bdoor',
        taxTreatment: 'pending_review',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'Companies House fee', bn: 'কোম্পানিজ হাউস ফি' },
        amountMinor: 100_00,
        currency: 'GBP',
        isEstimate: true,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
    ],
  },
  {
    slug: 'uae-sharjah-no-visa',
    countryCode: 'AE',
    countrySlug: 'uae',
    route: { en: 'Sharjah eligible no-visa route', bn: 'শারজাহ যোগ্য নো-ভিসা রুট' },
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    // "From" framing on purpose: this is the UAE's lowest-cost route and the
    // figure every listing card leads with, while the Dubai route below starts
    // at AED 15,000. The qualifier names both so the card, the country page
    // and the per-route list all tell one story instead of two prices.
    publicLabel: { en: 'From AED 9,375', bn: '৯,৩৭৫ দিরহাম থেকে' },
    publicLabelAlt: { en: 'About ৳314,000', bn: 'আনুমানিক ৳৩,১৪,০০০' },
    publicQualifier: {
      en: 'Sharjah eligible no-visa route, estimated total AED 9,375; Dubai routes from AED 15,000',
      bn: 'যোগ্য শারজাহ নো-ভিসা রুট, আনুমানিক মোট ৯,৩৭৫ দিরহাম; দুবাই রুট ১৫,০০০ দিরহাম থেকে',
    },
    summary: {
      en: 'Free-zone licence routes scoped to the intended activity.',
      bn: 'পরিকল্পিত কার্যক্রম অনুযায়ী ফ্রি-জোন লাইসেন্স রুট।',
    },
    disclosures: [
      {
        en: 'UAE activity, free zone, visa and facility determine final cost.',
        bn: 'ইউএই কার্যক্রম, ফ্রি জোন, ভিসা ও সুবিধা চূড়ান্ত খরচ নির্ধারণ করে।',
      },
      {
        en: 'Banking, payment accounts, visas, licences and government approvals are never guaranteed.',
        bn: 'ব্যাংকিং, পেমেন্ট অ্যাকাউন্ট, ভিসা, লাইসেন্স ও সরকারি অনুমোদন কখনোই নিশ্চিত নয়।',
      },
    ],
    feeComponents: [
      {
        layer: 'platform_service_fee',
        label: { en: 'bdoor fee', bn: 'bdoor ফি' },
        amountMinor: 250_000,
        currency: 'AED',
        isEstimate: false,
        isRefundable: false,
        payee: 'bdoor',
        taxTreatment: 'pending_review',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'Licence fee', bn: 'লাইসেন্স ফি' },
        amountMinor: 687_500,
        currency: 'AED',
        isEstimate: true,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
    ],
  },
  {
    slug: 'uae-dubai-route',
    countryCode: 'AE',
    countrySlug: 'uae',
    route: { en: 'Dubai formation route', bn: 'দুবাই গঠন রুট' },
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    publicLabel: { en: 'From AED 15,000', bn: '১৫,০০০ দিরহাম থেকে' },
    publicLabelAlt: { en: 'About ৳503,000', bn: 'আনুমানিক ৳৫,০৩,০০০' },
    publicQualifier: {
      en: 'Dubai licence from AED 12,500 plus bdoor fee; activity dependent',
      bn: 'দুবাই লাইসেন্স ১২,৫০০ দিরহাম থেকে + bdoor ফি; কার্যক্রম নির্ভর',
    },
    summary: {
      en: 'Dubai free-zone and mainland routes scoped after activity review.',
      bn: 'কার্যক্রম পর্যালোচনার পর দুবাই ফ্রি-জোন ও মেইনল্যান্ড রুট।',
    },
    disclosures: [
      {
        en: 'UAE activity, free zone, visa and facility determine final cost.',
        bn: 'ইউএই কার্যক্রম, ফ্রি জোন, ভিসা ও সুবিধা চূড়ান্ত খরচ নির্ধারণ করে।',
      },
      {
        en: 'Banking, payment accounts, visas, licences and government approvals are never guaranteed.',
        bn: 'ব্যাংকিং, পেমেন্ট অ্যাকাউন্ট, ভিসা, লাইসেন্স ও সরকারি অনুমোদন কখনোই নিশ্চিত নয়।',
      },
    ],
    feeComponents: [
      {
        layer: 'platform_service_fee',
        label: { en: 'bdoor fee', bn: 'bdoor ফি' },
        amountMinor: 250_000,
        currency: 'AED',
        isEstimate: false,
        isRefundable: false,
        payee: 'bdoor',
        taxTreatment: 'pending_review',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'Licence fee from', bn: 'লাইসেন্স ফি থেকে' },
        amountMinor: 1_250_000,
        currency: 'AED',
        isEstimate: true,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
    ],
  },
  {
    slug: 'singapore-resident-director',
    countryCode: 'SG',
    countrySlug: 'singapore',
    route: {
      en: 'Pte Ltd with qualifying resident director',
      bn: 'যোগ্য রেসিডেন্ট ডিরেক্টরসহ Pte Ltd',
    },
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    publicLabel: { en: 'From S$1,500', bn: 'S$১,৫০০ থেকে' },
    publicLabelAlt: { en: 'About ৳137,000', bn: 'আনুমানিক ৳১,৩৭,০০০' },
    publicQualifier: {
      en: 'Partner/CSP scope must be confirmed; government fees separate',
      bn: 'অংশীদার/CSP পরিধি নিশ্চিত করতে হবে; সরকারি ফি আলাদা',
    },
    summary: {
      en: 'Pte Ltd formation when a qualifying Singapore resident director is available.',
      bn: 'যোগ্য সিঙ্গাপুর রেসিডেন্ট ডিরেক্টর থাকলে Pte Ltd গঠন।',
    },
    disclosures: [
      {
        en: 'Singapore foreign founders need a Corporate Service Provider and a qualifying resident director.',
        bn: 'সিঙ্গাপুরে বিদেশি প্রতিষ্ঠাতাদের কর্পোরেট সার্ভিস প্রোভাইডার ও যোগ্য রেসিডেন্ট ডিরেক্টর প্রয়োজন।',
      },
      {
        en: 'A refundable nominee-director deposit is not a service fee.',
        bn: 'ফেরতযোগ্য নমিনি-ডিরেক্টর ডিপোজিট সেবা ফি নয়।',
      },
      {
        en: 'Banking, payment accounts, visas, licences and government approvals are never guaranteed.',
        bn: 'ব্যাংকিং, পেমেন্ট অ্যাকাউন্ট, ভিসা, লাইসেন্স ও সরকারি অনুমোদন কখনোই নিশ্চিত নয়।',
      },
    ],
    feeComponents: [
      {
        layer: 'platform_service_fee',
        label: { en: 'bdoor/partner fee from', bn: 'bdoor/অংশীদার ফি থেকে' },
        amountMinor: 150_000,
        currency: 'SGD',
        isEstimate: true,
        isRefundable: false,
        payee: 'partner_firm',
        taxTreatment: 'pending_review',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'ACRA filing', bn: 'ACRA ফাইলিং' },
        amountMinor: 15_00,
        currency: 'SGD',
        isEstimate: false,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'Name reservation', bn: 'নাম সংরক্ষণ' },
        amountMinor: 300_00,
        currency: 'SGD',
        isEstimate: false,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
    ],
  },
  {
    slug: 'singapore-foreign-founder',
    countryCode: 'SG',
    countrySlug: 'singapore',
    route: { en: 'Foreign-founder Pte Ltd', bn: 'বিদেশি-প্রতিষ্ঠাতা Pte Ltd' },
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    publicLabel: { en: 'From S$3,690', bn: 'S$৩,৬৯০ থেকে' },
    publicLabelAlt: { en: 'About ৳337,000', bn: 'আনুমানিক ৳৩,৩৭,০০০' },
    publicQualifier: {
      en: 'Nominee director/KYC; deposit separate when required',
      bn: 'নমিনি ডিরেক্টর/KYC; প্রয়োজনে ডিপোজিট আলাদা',
    },
    summary: {
      en: 'Pte Ltd formation for foreign founders through a licensed corporate service provider.',
      bn: 'লাইসেন্সপ্রাপ্ত কর্পোরেট সেবা প্রদানকারীর মাধ্যমে বিদেশি প্রতিষ্ঠাতাদের Pte Ltd গঠন।',
    },
    disclosures: [
      {
        en: 'Singapore foreign founders need a Corporate Service Provider and a qualifying resident director.',
        bn: 'সিঙ্গাপুরে বিদেশি প্রতিষ্ঠাতাদের কর্পোরেট সার্ভিস প্রোভাইডার ও যোগ্য রেসিডেন্ট ডিরেক্টর প্রয়োজন।',
      },
      {
        en: 'A refundable nominee-director deposit is not a service fee.',
        bn: 'ফেরতযোগ্য নমিনি-ডিরেক্টর ডিপোজিট সেবা ফি নয়।',
      },
      {
        en: 'Banking, payment accounts, visas, licences and government approvals are never guaranteed.',
        bn: 'ব্যাংকিং, পেমেন্ট অ্যাকাউন্ট, ভিসা, লাইসেন্স ও সরকারি অনুমোদন কখনোই নিশ্চিত নয়।',
      },
    ],
    feeComponents: [
      {
        layer: 'platform_service_fee',
        label: { en: 'bdoor/partner fee from', bn: 'bdoor/অংশীদার ফি থেকে' },
        amountMinor: 337_500,
        currency: 'SGD',
        isEstimate: true,
        isRefundable: false,
        payee: 'partner_firm',
        taxTreatment: 'pending_review',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'ACRA filing', bn: 'ACRA ফাইলিং' },
        amountMinor: 15_00,
        currency: 'SGD',
        isEstimate: false,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'Name reservation', bn: 'নাম সংরক্ষণ' },
        amountMinor: 300_00,
        currency: 'SGD',
        isEstimate: false,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
    ],
  },
  // Saudi Arabia and Qatar remain screened, eligibility-led markets.
  {
    slug: 'saudi-market-entry',
    countryCode: 'SA',
    countrySlug: 'saudi-arabia',
    route: { en: 'Screened market-entry routes', bn: 'যাচাইকৃত মার্কেট-এন্ট্রি রুট' },
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    eligibilityLed: true,
    publicLabel: { en: 'Professional setup from $4,900', bn: 'পেশাদার সেটআপ $৪,৯০০ থেকে' },
    publicLabelAlt: { en: 'About ৳603,000', bn: 'আনুমানিক ৳৬,০৩,০০০' },
    publicQualifier: {
      en: 'Authority, office and legalisation costs quoted after review',
      bn: 'কর্তৃপক্ষ, অফিস ও বৈধকরণ খরচ পর্যালোচনার পর জানানো হয়',
    },
    summary: {
      en: 'Investment-registration and company-setup routes, assessed for eligibility first.',
      bn: 'বিনিয়োগ নিবন্ধন ও কোম্পানি গঠনের রুট, আগে যোগ্যতা যাচাই করা হয়।',
    },
    disclosures: [
      {
        en: 'Every Saudi route starts with an eligibility assessment before any quotation.',
        bn: 'প্রতিটি সৌদি রুট কোনো মূল্য উদ্ধৃতির আগে যোগ্যতা যাচাই দিয়ে শুরু হয়।',
      },
      {
        en: 'Authority, legalisation, office and visa costs are quoted after review.',
        bn: 'কর্তৃপক্ষ, বৈধকরণ, অফিস ও ভিসা খরচ পর্যালোচনার পর জানানো হয়।',
      },
    ],
    feeComponents: [
      {
        layer: 'partner_professional_fee',
        label: {
          en: 'Partner and bdoor professional allowance (unvalidated)',
          bn: 'অংশীদার ও bdoor পেশাদার বরাদ্দ (অযাচাইকৃত)',
        },
        amountMinor: 4_900_00,
        currency: 'USD',
        isEstimate: true,
        isRefundable: false,
        payee: 'partner_firm',
        taxTreatment: 'pending_review',
        reviewedAt: SEVEN_COUNTRY_RESEARCH_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'LLC commercial registration', bn: 'LLC বাণিজ্যিক নিবন্ধন' },
        amountMinor: 1_200_00,
        currency: 'SAR',
        isEstimate: true,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        sourceUrl: 'https://business.sa/en/eservices/details/2487249f-078c-44e3-1063-08dd6aa798b2',
        reviewedAt: SEVEN_COUNTRY_RESEARCH_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'Registration publication', bn: 'নিবন্ধন প্রকাশনা' },
        amountMinor: 500_00,
        currency: 'SAR',
        isEstimate: true,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        sourceUrl: 'https://business.sa/en/eservices/details/2487249f-078c-44e3-1063-08dd6aa798b2',
        reviewedAt: SEVEN_COUNTRY_RESEARCH_DATE,
      },
    ],
  },
  {
    slug: 'qatar-qfc',
    countryCode: 'QA',
    countrySlug: 'qatar',
    route: { en: 'QFC professional-services route', bn: 'QFC পেশাদার-সেবা রুট' },
    status: 'draft',
    availability: 'available_by_quote',
    mode: 'managed_application',
    publicStatus: 'applications_open',
    providerApproved: false,
    priceApproved: true,
    checkoutEnabled: false,
    eligibilityLed: true,
    publicLabel: {
      en: 'First-year QFC estimate from $10,900',
      bn: 'প্রথম বছরের QFC আনুমানিক $১০,৯০০ থেকে',
    },
    publicLabelAlt: { en: 'About ৳1,341,500', bn: 'আনুমানিক ৳১৩,৪১,৫০০' },
    publicQualifier: {
      en: 'Non-regulated route; final quote after assessment',
      bn: 'অনিয়ন্ত্রিত রুট; মূল্যায়নের পর চূড়ান্ত উদ্ধৃতি',
    },
    summary: {
      en: 'A Qatar Financial Centre route for non-regulated activities, scoped after review.',
      bn: 'অনিয়ন্ত্রিত কার্যক্রমের জন্য কাতার ফাইন্যান্সিয়াল সেন্টার রুট, পর্যালোচনার পর নির্ধারিত।',
    },
    disclosures: [
      {
        en: 'QFC application and annual licence fees apply in addition to professional fees.',
        bn: 'পেশাদার ফির পাশাপাশি QFC আবেদন ও বার্ষিক লাইসেন্স ফি প্রযোজ্য।',
      },
      {
        en: 'Mainland, free-zone and regulated activities need a separate assessment.',
        bn: 'মেইনল্যান্ড, ফ্রি-জোন ও নিয়ন্ত্রিত কার্যক্রমের জন্য আলাদা যাচাই প্রয়োজন।',
      },
    ],
    feeComponents: [
      {
        layer: 'partner_professional_fee',
        label: {
          en: 'Partner, bdoor and office allowance (unvalidated)',
          bn: 'অংশীদার, bdoor ও অফিস বরাদ্দ (অযাচাইকৃত)',
        },
        amountMinor: 5_400_00,
        currency: 'USD',
        isEstimate: true,
        isRefundable: false,
        payee: 'partner_firm',
        taxTreatment: 'pending_review',
        reviewedAt: SEVEN_COUNTRY_RESEARCH_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: { en: 'QFC application fee', bn: 'QFC আবেদন ফি' },
        amountMinor: 500_00,
        currency: 'USD',
        isEstimate: false,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        sourceUrl: 'https://qfcra-en.thomsonreuters.com/rulebook/schedule-4-fees',
        reviewedAt: SEVEN_COUNTRY_RESEARCH_DATE,
      },
      {
        layer: 'government_fee_estimate',
        label: {
          en: 'QFC annual licence, single activity',
          bn: 'QFC বার্ষিক লাইসেন্স, একক কার্যক্রম',
        },
        amountMinor: 5_000_00,
        currency: 'USD',
        isEstimate: false,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        sourceUrl: 'https://qfcra-en.thomsonreuters.com/rulebook/schedule-4-fees',
        reviewedAt: SEVEN_COUNTRY_RESEARCH_DATE,
      },
    ],
  },
];

/**
 * Homepage and country-card featured slug per country (master §7 / §8).
 * Extra routes for the same country remain on the country page and in admin.
 */
export const FEATURED_INTERNATIONAL_SLUGS = [
  'usa-wyoming-llc',
  'uk-non-resident-ltd',
  'uae-sharjah-no-visa',
  'singapore-resident-director',
] as const;

/** The four homepage international cards (USA, UK, UAE, Singapore). */
export function homepageInternationalOffers(): InternationalOffer[] {
  return FEATURED_INTERNATIONAL_SLUGS.map((slug) =>
    INTERNATIONAL_OFFERS.find((o) => o.slug === slug)!,
  );
}

/** Featured offer for a country slug (lowest / primary starting estimate). */
export function featuredOfferForCountry(countrySlug: string): InternationalOffer | undefined {
  const featured = FEATURED_INTERNATIONAL_SLUGS.map((slug) =>
    INTERNATIONAL_OFFERS.find((o) => o.slug === slug)!,
  ).find((o) => o.countrySlug === countrySlug);
  if (featured) return featured;
  return INTERNATIONAL_OFFERS.find((o) => o.countrySlug === countrySlug);
}

export function offersForCountry(countrySlug: string): InternationalOffer[] {
  return INTERNATIONAL_OFFERS.filter((o) => o.countrySlug === countrySlug);
}

export const STANDALONE_SERVICES = [
  {
    slug: 'etin-assistance',
    name: { en: 'e-TIN assistance', bn: 'ই-টিআইএন সহায়তা' },
    bdoorFeeBdt: 4000,
    note: { en: 'Government application fee BDT 0', bn: 'সরকারি আবেদন ফি ০ টাকা' },
  },
  {
    slug: 'bin-vat-assistance',
    name: {
      en: 'BIN/VAT assessment and application assistance',
      bn: 'বিআইএন/ভ্যাট যাচাই ও আবেদন সহায়তা',
    },
    bdoorFeeBdt: 6000,
    note: { en: 'Government application fee BDT 0', bn: 'সরকারি আবেদন ফি ০ টাকা' },
  },
  {
    slug: 'trade-licence-coordination',
    name: { en: 'Trade-licence coordination', bn: 'ট্রেড লাইসেন্স সমন্বয়' },
    bdoorFeeBdt: 8000,
    note: { en: 'Authority fee varies', bn: 'কর্তৃপক্ষের ফি ভিন্ন' },
  },
  {
    slug: 'commercial-irc-coordination',
    name: { en: 'Commercial IRC coordination', bn: 'বাণিজ্যিক IRC সমন্বয়' },
    bdoorFeeBdt: 15000,
    note: { en: 'Official fee varies by class', bn: 'শ্রেণি অনুযায়ী সরকারি ফি ভিন্ন' },
  },
  {
    slug: 'erc-coordination',
    name: { en: 'ERC coordination', bn: 'ERC সমন্বয়' },
    bdoorFeeBdt: 15000,
    note: {
      en: 'Official certificate/renewal costs separate',
      bn: 'সরকারি সনদ/নবায়ন খরচ আলাদা',
    },
  },
  {
    slug: 'rjsc-annual-return',
    name: {
      en: 'Standard RJSC annual return/company change',
      bn: 'মানক RJSC বার্ষিক রিটার্ন/কোম্পানি পরিবর্তন',
    },
    bdoorFeeBdt: 12000,
    note: {
      en: 'From BDT 12,000; government and late fees at actuals',
      bn: '১২,০০০ টাকা থেকে; সরকারি ও বিলম্ব ফি প্রকৃত খরচে',
    },
    priceType: 'from' as const,
  },
  {
    slug: 'bida-project-registration',
    name: { en: 'BIDA project-registration coordination', bn: 'বিডা প্রকল্প-নিবন্ধন সমন্বয়' },
    bdoorFeeBdt: 25000,
    note: {
      en: 'From BDT 25,000; official investment slab + applicable VAT',
      bn: '২৫,০০০ টাকা থেকে; সরকারি বিনিয়োগ স্তর + প্রযোজ্য ভ্যাট',
    },
    priceType: 'from' as const,
  },
  {
    slug: 'foreign-owned-private-company',
    name: {
      en: 'Foreign-owned Bangladesh private company',
      bn: 'বিদেশি-মালিকানাধীন বাংলাদেশি প্রাইভেট কোম্পানি',
    },
    bdoorFeeBdt: 69900,
    note: {
      en: 'From BDT 69,900; government, bank, attestation and partner costs extra',
      bn: '৬৯,৯০০ টাকা থেকে; সরকারি, ব্যাংক, অ্যাটেস্টেশন ও অংশীদার খরচ অতিরিক্ত',
    },
    priceType: 'from' as const,
  },
  {
    slug: 'branch-liaison-representative',
    name: { en: 'Branch/liaison/representative office', bn: 'শাখা/লিয়াজোঁ/প্রতিনিধি অফিস' },
    bdoorFeeBdt: null,
    note: {
      en: 'Custom quotation; authority and partner costs at actuals',
      bn: 'কাস্টম উদ্ধৃতি; কর্তৃপক্ষ ও অংশীদার খরচ প্রকৃত হিসাবে',
    },
    priceType: 'quote_required' as const,
  },
] as const;

export function publishedPackages(
  segment?: 'new_business' | 'existing_business',
): ServicePackage[] {
  return BANGLADESH_PACKAGES.filter((p) => {
    if (segment && p.segment !== segment) return false;
    const v = p.versions[0];
    return v?.status === 'published';
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function packageBySlug(slug: string): ServicePackage | undefined {
  return BANGLADESH_PACKAGES.find((p) => p.slug === slug);
}

export function activePackageVersion(pkg: ServicePackage) {
  return pkg.versions.find((v) => v.status === 'published') ?? pkg.versions[0];
}
