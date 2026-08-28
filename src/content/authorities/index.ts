/**
 * Informational authority directory. bdoor is not affiliated with these bodies.
 * No government logos without written permission. Official URLs must be verified
 * before a profile moves from draft to published.
 */

export type AuthorityStatus = 'draft' | 'published' | 'coming_soon';

export type Authority = {
  slug: string;
  name: { en: string; bn: string };
  role: { en: string; bn: string };
  officialWebsite: string | null;
  status: AuthorityStatus;
  lastVerifiedAt: string | null;
  relatedCategorySlugs: string[];
};

export const AUTHORITIES: readonly Authority[] = [
  {
    slug: 'rjsc',
    name: {
      en: 'Registrar of Joint Stock Companies and Firms (RJSC)',
      bn: 'যৌথ মূলধনী কোম্পানি ও ফার্মসমূহের নিবন্ধক (আরজেএসসি)',
    },
    role: {
      en: 'Company registration and corporate filings in Bangladesh.',
      bn: 'বাংলাদেশে কোম্পানি নিবন্ধন ও কর্পোরেট ফাইলিং।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['company-formation', 'compliance'],
  },
  {
    slug: 'nbr',
    name: {
      en: 'National Board of Revenue (NBR)',
      bn: 'জাতীয় রাজস্ব বোর্ড (এনবিআর)',
    },
    role: {
      en: 'Tax and VAT administration relevant to e-TIN, BIN and returns.',
      bn: 'ই-টিআইএন, বিআইএন ও রিটার্ন সম্পর্কিত কর ও ভ্যাট প্রশাসন।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['tax-vat'],
  },
  {
    slug: 'bida',
    name: {
      en: 'Bangladesh Investment Development Authority (BIDA)',
      bn: 'বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষ (বিডা)',
    },
    role: {
      en: 'Investment and project registration pathways for eligible foreign investment.',
      bn: 'যোগ্য বিদেশি বিনিয়োগের জন্য বিনিয়োগ ও প্রকল্প নিবন্ধন পথ।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['foreign-founders'],
  },
  {
    slug: 'ccie',
    name: {
      en: 'Chief Controller of Imports and Exports (CCI&E)',
      bn: 'আমদানি ও রপ্তানি প্রধান নিয়ন্ত্রক (সিসিআইঅ্যান্ডই)',
    },
    role: {
      en: 'Import and export registration (IRC/ERC) administration.',
      bn: 'আমদানি ও রপ্তানি নিবন্ধন (আইআরসি/ইআরসি) প্রশাসন।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['import-export'],
  },
  {
    slug: 'city-corporations',
    name: {
      en: 'City corporations and local authorities',
      bn: 'সিটি করপোরেশন ও স্থানীয় কর্তৃপক্ষ',
    },
    role: {
      en: 'Trade licences and local operating permissions by location.',
      bn: 'অবস্থান অনুযায়ী ট্রেড লাইসেন্স ও স্থানীয় পরিচালন অনুমতি।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['licences'],
  },
  {
    slug: 'dife',
    name: {
      en: 'Department of Inspection for Factories and Establishments (DIFE)',
      bn: 'কারখানা ও প্রতিষ্ঠান পরিদর্শন অধিদপ্তর (ডিআইএফই)',
    },
    role: {
      en: 'Factory and establishment registration where applicable.',
      bn: 'প্রযোজ্য ক্ষেত্রে কারখানা ও প্রতিষ্ঠান নিবন্ধন।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['licences'],
  },
  {
    slug: 'doe',
    name: {
      en: 'Department of Environment',
      bn: 'পরিবেশ অধিদপ্তর',
    },
    role: {
      en: 'Environmental clearance processes for applicable activities.',
      bn: 'প্রযোজ্য কার্যক্রমের জন্য পরিবেশগত ছাড়পত্র প্রক্রিয়া।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['licences'],
  },
  {
    slug: 'bsti',
    name: {
      en: 'Bangladesh Standards and Testing Institution (BSTI)',
      bn: 'বাংলাদেশ স্ট্যান্ডার্ডস অ্যান্ড টেস্টিং ইনস্টিটিউশন (বিএসটিআই)',
    },
    role: {
      en: 'Standards and product certification coordination where required.',
      bn: 'প্রয়োজন অনুযায়ী মান ও পণ্য সনদ সমন্বয়।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['licences'],
  },
  {
    slug: 'egp',
    name: {
      en: 'e-GP / public procurement systems',
      bn: 'ই-জিপি / সরকারি ক্রয় ব্যবস্থা',
    },
    role: {
      en: 'Government procurement registration readiness support.',
      bn: 'সরকারি ক্রয় নিবন্ধন প্রস্তুতি সহায়তা।',
    },
    officialWebsite: null,
    status: 'coming_soon',
    lastVerifiedAt: null,
    relatedCategorySlugs: ['compliance'],
  },
] as const;

export function listAuthorities(): Authority[] {
  return AUTHORITIES.filter((a) => a.status !== 'draft');
}
