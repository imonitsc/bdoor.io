import type { InternationalOffer, ServicePackage } from '@/features/packages/types';

/** The owner's last commercial review of every figure in this file. */
export const COMMERCIAL_REVIEW_DATE = '2026-08-28';
const REVIEW_DATE = COMMERCIAL_REVIEW_DATE;

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

export const INTERNATIONAL_OFFERS: InternationalOffer[] = [
  {
    slug: 'usa-wyoming-llc',
    countryCode: 'US',
    countrySlug: 'united-states',
    route: { en: 'Wyoming LLC', bn: 'ওয়াইমিং LLC' },
    status: 'draft',
    publicStatus: 'register_interest',
    providerApproved: false,
    priceApproved: false,
    checkoutEnabled: false,
    summary: {
      en: 'LLC formation with EIN support, delivered with a licensed US provider.',
      bn: 'লাইসেন্সপ্রাপ্ত মার্কিন প্রদানকারীর সঙ্গে LLC গঠন ও EIN সহায়তা।',
    },
    disclosures: [
      { en: 'EIN has no IRS fee.', bn: 'EIN-এর জন্য IRS ফি নেই।' },
      { en: 'State and annual fees vary.', bn: 'রাজ্য ও বার্ষিক ফি ভিন্ন হতে পারে।' },
    ],
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
        label: { en: 'Wyoming state fee', bn: 'ওয়াইমিং রাজ্য ফি' },
        amountMinor: 100_00,
        currency: 'USD',
        isEstimate: true,
        isRefundable: false,
        payee: 'government_authority',
        taxTreatment: 'not_applicable',
        reviewedAt: REVIEW_DATE,
      },
    ],
  },
  {
    slug: 'uk-non-resident-ltd',
    countryCode: 'GB',
    countrySlug: 'united-kingdom',
    route: { en: 'Non-resident LTD', bn: 'নন-রেসিডেন্ট LTD' },
    status: 'draft',
    publicStatus: 'register_interest',
    providerApproved: false,
    priceApproved: false,
    checkoutEnabled: false,
    summary: {
      en: 'Private limited company formation for non-resident founders.',
      bn: 'অনাবাসী প্রতিষ্ঠাতাদের জন্য প্রাইভেট লিমিটেড কোম্পানি গঠন।',
    },
    disclosures: [
      {
        en: 'UK identity verification and registered-office eligibility apply.',
        bn: 'যুক্তরাজ্য পরিচয় যাচাই ও নিবন্ধিত অফিস যোগ্যতা প্রযোজ্য।',
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
    route: { en: 'Sharjah no-visa route', bn: 'শারজাহ নো-ভিসা রুট' },
    status: 'draft',
    publicStatus: 'register_interest',
    providerApproved: false,
    priceApproved: false,
    checkoutEnabled: false,
    summary: {
      en: 'Free-zone licence routes scoped to the intended activity.',
      bn: 'পরিকল্পিত কার্যক্রম অনুযায়ী ফ্রি-জোন লাইসেন্স রুট।',
    },
    disclosures: [
      {
        en: 'Activity, free zone and facility determine final cost.',
        bn: 'কার্যক্রম, ফ্রি জোন ও সুবিধা চূড়ান্ত খরচ নির্ধারণ করে।',
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
    slug: 'singapore-pte-ltd',
    countryCode: 'SG',
    countrySlug: 'singapore',
    route: { en: 'Pte Ltd with resident director', bn: 'রেসিডেন্ট ডিরেক্টরসহ Pte Ltd' },
    status: 'draft',
    publicStatus: 'register_interest',
    providerApproved: false,
    priceApproved: false,
    checkoutEnabled: false,
    summary: {
      en: 'Pte Ltd formation through a licensed corporate service provider.',
      bn: 'লাইসেন্সপ্রাপ্ত কর্পোরেট সেবা প্রদানকারীর মাধ্যমে Pte Ltd গঠন।',
    },
    disclosures: [
      {
        en: 'A refundable nominee-director deposit is not a service fee.',
        bn: 'ফেরতযোগ্য নমিনি-ডিরেক্টর ডিপোজিট সেবা ফি নয়।',
      },
    ],
    feeComponents: [
      {
        layer: 'platform_service_fee',
        label: { en: 'bdoor/partner fee', bn: 'bdoor/অংশীদার ফি' },
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
];

export const STANDALONE_SERVICES = [
  {
    slug: 'etin-assistance',
    name: { en: 'e-TIN assistance', bn: 'ই-টিআইএন সহায়তা' },
    bdoorFeeBdt: 4000,
    note: { en: 'Government application fee BDT 0', bn: 'সরকারি আবেদন ফি ০ টাকা' },
  },
  {
    slug: 'bin-vat-assistance',
    name: { en: 'BIN/VAT application assistance', bn: 'বিআইএন/ভ্যাট আবেদন সহায়তা' },
    bdoorFeeBdt: 6000,
    note: { en: 'Government application fee BDT 0', bn: 'সরকারি আবেদন ফি ০ টাকা' },
  },
  {
    slug: 'trade-licence-coordination',
    name: { en: 'Trade-licence coordination', bn: 'ট্রেড লাইসেন্স সমন্বয়' },
    bdoorFeeBdt: 8000,
    note: { en: 'Authority fee varies', bn: 'কর্তৃপক্ষের ফি ভিন্ন' },
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
