import type { AuthorityRecord } from '@/features/directory/types';

/**
 * Informational directory. bdoor is not affiliated with any of these
 * authorities. Official websites are omitted until a verified evidence row
 * exists — names already appear on published service pages.
 */
export const AUTHORITIES: readonly AuthorityRecord[] = [
  {
    slug: 'rjsc',
    name: {
      en: 'Registrar of Joint Stock Companies and Firms (RJSC)',
      bn: 'যৌথ মূলধন কোম্পানি ও ফার্মসমূহের পরিদপ্তর (RJSC)',
    },
    role: {
      en: 'Company incorporation, annual returns and changes to the company register.',
      bn: 'কোম্পানি নিবন্ধন, বার্ষিক রিটার্ন ও কোম্পানি রেজিস্টারের পরিবর্তন।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['company-formation', 'compliance'],
    operationalStatus: 'active',
    sortOrder: 10,
  },
  {
    slug: 'nbr',
    name: { en: 'National Board of Revenue (NBR)', bn: 'জাতীয় রাজস্ব বোর্ড (NBR)' },
    role: {
      en: 'e-TIN, BIN/VAT and tax administration.',
      bn: 'ই-টিআইএন, বিআইএন/ভ্যাট ও কর প্রশাসন।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['tax-vat'],
    operationalStatus: 'active',
    sortOrder: 20,
  },
  {
    slug: 'bida',
    name: {
      en: 'Bangladesh Investment Development Authority (BIDA)',
      bn: 'বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষ (BIDA)',
    },
    role: {
      en: 'Investment and project registration relevant to many foreign-owned structures.',
      bn: 'অনেক বিদেশি মালিকানা কাঠামোর জন্য বিনিয়োগ ও প্রকল্প নিবন্ধন।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['foreign-founders'],
    operationalStatus: 'active',
    sortOrder: 30,
  },
  {
    slug: 'ccie',
    name: {
      en: 'Office of the Chief Controller of Imports and Exports (CCI&E)',
      bn: 'আমদানি ও রপ্তানি প্রধান নিয়ন্ত্রকের দপ্তর (CCI&E)',
    },
    role: {
      en: 'Commercial IRC and ERC.',
      bn: 'বাণিজ্যিক IRC ও ERC।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['import-export'],
    operationalStatus: 'active',
    sortOrder: 40,
  },
  {
    slug: 'city-corporations',
    name: {
      en: 'City corporations and municipalities',
      bn: 'সিটি কর্পোরেশন ও পৌরসভা',
    },
    role: {
      en: 'Trade licences for the premises you operate from. The issuing body depends on location.',
      bn: 'আপনি যে ঠিকানা থেকে কাজ করেন তার ট্রেড লাইসেন্স। ইস্যুকারী নির্ভর করে অবস্থানের ওপর।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['licences'],
    operationalStatus: 'active',
    sortOrder: 50,
  },
  {
    slug: 'dife',
    name: {
      en: 'Department of Inspection for Factories and Establishments (DIFE)',
      bn: 'কারখানা ও প্রতিষ্ঠান পরিদর্শন অধিদপ্তর (DIFE)',
    },
    role: {
      en: 'Factory and establishment inspection relevant to manufacturing premises.',
      bn: 'উৎপাদন স্থাপনার জন্য কারখানা ও প্রতিষ্ঠান পরিদর্শন।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['licences'],
    operationalStatus: 'coming_soon',
    sortOrder: 60,
  },
  {
    slug: 'doe',
    name: {
      en: 'Department of Environment',
      bn: 'পরিবেশ অধিদপ্তর',
    },
    role: {
      en: 'Environmental clearance where the activity requires it.',
      bn: 'কার্যক্রমের প্রয়োজনে পরিবেশগত ছাড়পত্র।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['licences'],
    operationalStatus: 'coming_soon',
    sortOrder: 70,
  },
  {
    slug: 'bsti',
    name: {
      en: 'Bangladesh Standards and Testing Institution (BSTI)',
      bn: 'বাংলাদেশ স্ট্যান্ডার্ডস অ্যান্ড টেস্টিং ইনস্টিটিউশন (BSTI)',
    },
    role: {
      en: 'Standards and certification coordination for specified products.',
      bn: 'নির্দিষ্ট পণ্যের মান ও সনদ সমন্বয়।',
    },
    officialUrl: null,
    urlVerified: false,
    relatedCategorySlugs: ['licences'],
    operationalStatus: 'coming_soon',
    sortOrder: 80,
  },
];
