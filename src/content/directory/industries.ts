import type { IndustryRecord } from '@/features/directory/types';

/**
 * Industry pages explain likely next steps and link to catalogue categories.
 * They are not legal advice and they do not invent sector-specific fees.
 */
export const INDUSTRIES: readonly IndustryRecord[] = [
  {
    slug: 'technology-software',
    name: { en: 'Technology and software', bn: 'প্রযুক্তি ও সফটওয়্যার' },
    summary: {
      en: 'Usually a private limited company, e-TIN and, where you trade from premises, a trade licence.',
      bn: 'সাধারণত প্রাইভেট লিমিটেড কোম্পানি, ই-টিআইএন, আর কার্যালয় থেকে ব্যবসা করলে ট্রেড লাইসেন্স।',
    },
    relatedCategorySlugs: ['company-formation', 'tax-vat', 'licences'],
    operationalStatus: 'active',
    sortOrder: 10,
  },
  {
    slug: 'ecommerce',
    name: { en: 'E-commerce', bn: 'ই-কমার্স' },
    summary: {
      en: 'Structure, trade licence, tax/VAT and, if you import stock, IRC — confirmed after review of what you actually sell.',
      bn: 'কাঠামো, ট্রেড লাইসেন্স, কর/ভ্যাট, আর মজুদ আমদানি করলে IRC — আপনি আসলে কী বিক্রি করেন তা দেখে নিশ্চিত।',
    },
    relatedCategorySlugs: ['company-formation', 'licences', 'import-export', 'tax-vat'],
    operationalStatus: 'active',
    sortOrder: 20,
  },
  {
    slug: 'import-export',
    name: { en: 'Import and export', bn: 'আমদানি ও রপ্তানি' },
    summary: {
      en: 'IRC or ERC sit after trade licence, e-TIN, BIN and a bank account — not before.',
      bn: 'IRC বা ERC আসে ট্রেড লাইসেন্স, ই-টিআইএন, বিআইএন ও ব্যাংক হিসাবের পরে — আগে নয়।',
    },
    relatedCategorySlugs: ['import-export', 'licences', 'tax-vat'],
    operationalStatus: 'active',
    sortOrder: 30,
  },
  {
    slug: 'logistics',
    name: { en: 'Logistics', bn: 'লজিস্টিকস' },
    summary: {
      en: 'Operating licences depend on the mode (road, warehouse, freight forwarding). We map them after review.',
      bn: 'পরিচালন লাইসেন্স নির্ভর করে ধরনের ওপর (সড়ক, গুদাম, ফ্রেইট)। যাচাইয়ের পর আমরা মিলিয়ে দেখি।',
    },
    relatedCategorySlugs: ['licences', 'import-export', 'company-formation'],
    operationalStatus: 'coming_soon',
    sortOrder: 40,
  },
  {
    slug: 'manufacturing',
    name: { en: 'Manufacturing', bn: 'উৎপাদন' },
    summary: {
      en: 'Factory and environmental permissions are separate from company registration. Timing is estimated after review.',
      bn: 'কারখানা ও পরিবেশগত অনুমতি কোম্পানি নিবন্ধন থেকে আলাদা। সময় যাচাইয়ের পর হিসাব করা হয়।',
    },
    relatedCategorySlugs: ['company-formation', 'licences', 'compliance'],
    operationalStatus: 'coming_soon',
    sortOrder: 50,
  },
  {
    slug: 'garments-textiles',
    name: { en: 'Garments and textiles', bn: 'পোশাক ও বস্ত্র' },
    summary: {
      en: 'Often combines formation, IRC/ERC and buyer-driven compliance calendars. Sector rules are confirmed per matter.',
      bn: 'প্রায়ই গঠন, IRC/ERC ও ক্রেতা-চালিত কমপ্লায়েন্স একসঙ্গে। খাতের নিয়ম প্রতিটি বিষয়ে নিশ্চিত করা হয়।',
    },
    relatedCategorySlugs: ['company-formation', 'import-export', 'compliance'],
    operationalStatus: 'coming_soon',
    sortOrder: 60,
  },
  {
    slug: 'food-restaurant',
    name: { en: 'Food and restaurant', bn: 'খাদ্য ও রেস্তোরাঁ' },
    summary: {
      en: 'Premises licences and food-safety permissions sit with local and sector authorities, not with incorporation alone.',
      bn: 'স্থাপনা ও খাদ্য-নিরাপত্তা অনুমতি স্থানীয় ও খাত কর্তৃপক্ষের — শুধু কোম্পানি গঠনে হয় না।',
    },
    relatedCategorySlugs: ['licences', 'company-formation', 'tax-vat'],
    operationalStatus: 'coming_soon',
    sortOrder: 70,
  },
  {
    slug: 'construction-engineering',
    name: { en: 'Construction and engineering', bn: 'নির্মাণ ও প্রকৌশল' },
    summary: {
      en: 'Contractor enlistment and e-GP readiness are separate from forming the company.',
      bn: 'ঠিকাদার তালিকাভুক্তি ও ই-জিপি প্রস্তুতি কোম্পানি গঠন থেকে আলাদা।',
    },
    relatedCategorySlugs: ['company-formation', 'licences', 'compliance'],
    operationalStatus: 'coming_soon',
    sortOrder: 80,
  },
  {
    slug: 'healthcare',
    name: { en: 'Healthcare', bn: 'স্বাস্থ্যসেবা' },
    summary: {
      en: 'A regulated activity. Eligibility and premises rules are confirmed by a qualified professional after review.',
      bn: 'নিয়ন্ত্রিত কার্যক্রম। যোগ্যতা ও স্থাপনার নিয়ম যাচাইয়ের পর যোগ্য পেশাজীবী নিশ্চিত করেন।',
    },
    relatedCategorySlugs: ['company-formation', 'licences', 'foreign-founders'],
    operationalStatus: 'coming_soon',
    sortOrder: 90,
  },
  {
    slug: 'education',
    name: { en: 'Education', bn: 'শিক্ষা' },
    summary: {
      en: 'School or training permissions are distinct from company registration. We coordinate; the authority decides.',
      bn: 'স্কুল বা প্রশিক্ষণের অনুমতি কোম্পানি নিবন্ধন থেকে আলাদা। আমরা সমন্বয় করি; সিদ্ধান্ত কর্তৃপক্ষের।',
    },
    relatedCategorySlugs: ['company-formation', 'licences'],
    operationalStatus: 'coming_soon',
    sortOrder: 100,
  },
  {
    slug: 'travel-tourism',
    name: { en: 'Travel and tourism', bn: 'ভ্রমণ ও পর্যটন' },
    summary: {
      en: 'Travel-agency registration is a regulated, coming-soon service. Do not treat incorporation as a licence to sell travel.',
      bn: 'ট্রাভেল এজেন্সি নিবন্ধন একটি নিয়ন্ত্রিত, শিগগির আসছে সেবা। কোম্পানি গঠনকে ভ্রমণ বিক্রির লাইসেন্স মনে করবেন না।',
    },
    relatedCategorySlugs: ['licences', 'company-formation'],
    operationalStatus: 'coming_soon',
    sortOrder: 110,
  },
  {
    slug: 'professional-services',
    name: { en: 'Professional services', bn: 'পেশাগত সেবা' },
    summary: {
      en: 'A company or partnership depending on owners, liability and whether anyone will invest. The assessment is the starting point.',
      bn: 'মালিক, দায় ও বিনিয়োগের সম্ভাবনা দেখে কোম্পানি বা পার্টনারশিপ। শুরুটা প্রশ্নমালা দিয়ে।',
    },
    relatedCategorySlugs: ['company-formation', 'tax-vat', 'compliance'],
    operationalStatus: 'active',
    sortOrder: 120,
  },
];
