/**
 * Industry routes for Bangladesh. Pages may list these as informational
 * overviews; regulatory claims still need evidence-register entries.
 */

export type IndustryStatus = 'draft' | 'published' | 'coming_soon';

export type Industry = {
  slug: string;
  name: { en: string; bn: string };
  summary: { en: string; bn: string };
  status: IndustryStatus;
  relatedCategorySlugs: string[];
};

export const INDUSTRIES: readonly Industry[] = [
  {
    slug: 'technology-software',
    name: { en: 'Technology and software', bn: 'প্রযুক্তি ও সফটওয়্যার' },
    summary: {
      en: 'Entity choice, trade licence, tax setup and foreign-ownership considerations for software businesses.',
      bn: 'সফটওয়্যার ব্যবসার জন্য সত্তা নির্বাচন, ট্রেড লাইসেন্স, কর সেটআপ ও বিদেশি মালিকানা বিবেচনা।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['company-formation', 'tax-vat', 'foreign-founders'],
  },
  {
    slug: 'e-commerce',
    name: { en: 'E-commerce', bn: 'ই-কমার্স' },
    summary: {
      en: 'Formation, trade licence, VAT/BIN and payment-readiness for online sellers.',
      bn: 'অনলাইন বিক্রেতাদের জন্য গঠন, ট্রেড লাইসেন্স, ভ্যাট/বিআইএন ও পেমেন্ট প্রস্তুতি।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['company-formation', 'licences', 'tax-vat'],
  },
  {
    slug: 'import-export-logistics',
    name: { en: 'Import, export and logistics', bn: 'আমদানি, রপ্তানি ও লজিস্টিকস' },
    summary: {
      en: 'IRC/ERC readiness, customs coordination through qualified providers, and trade compliance.',
      bn: 'আইআরসি/ইআরসি প্রস্তুতি, যোগ্য প্রদানকারীর মাধ্যমে কাস্টমস সমন্বয় ও বাণিজ্য কমপ্লায়েন্স।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['import-export', 'tax-vat'],
  },
  {
    slug: 'manufacturing',
    name: { en: 'Manufacturing', bn: 'উৎপাদন' },
    summary: {
      en: 'Factory and sector permissions, environmental and fire clearances where they apply.',
      bn: 'কারখানা ও খাতভিত্তিক অনুমতি, প্রযোজ্য পরিবেশ ও অগ্নি ছাড়পত্র।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['licences', 'compliance'],
  },
  {
    slug: 'garments-textiles',
    name: { en: 'Garments and textiles', bn: 'পোশাক ও বস্ত্র' },
    summary: {
      en: 'Trade and export registrations commonly needed for apparel businesses.',
      bn: 'পোশাক ব্যবসার জন্য সাধারণত প্রয়োজনীয় বাণিজ্য ও রপ্তানি নিবন্ধন।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['import-export', 'licences'],
  },
  {
    slug: 'food-restaurant',
    name: { en: 'Food and restaurant', bn: 'খাদ্য ও রেস্তোরাঁ' },
    summary: {
      en: 'Trade licence, food-safety related permissions and tax setup for hospitality.',
      bn: 'আতিথেয়তার জন্য ট্রেড লাইসেন্স, খাদ্য-নিরাপত্তা সংক্রান্ত অনুমতি ও কর সেটআপ।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['licences', 'tax-vat'],
  },
  {
    slug: 'construction-engineering',
    name: { en: 'Construction and engineering', bn: 'নির্মাণ ও প্রকৌশল' },
    summary: {
      en: 'Entity and licence pathways often relevant to contractors and consultancies.',
      bn: 'ঠিকাদার ও পরামর্শক প্রতিষ্ঠানের জন্য প্রাসঙ্গিক সত্তা ও লাইসেন্স পথ।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['company-formation', 'licences'],
  },
  {
    slug: 'healthcare',
    name: { en: 'Healthcare', bn: 'স্বাস্থ্যসেবা' },
    summary: {
      en: 'Sector permissions vary widely — start with an assessment rather than a generic checklist.',
      bn: 'খাতভিত্তিক অনুমতি ব্যাপকভাবে ভিন্ন — সাধারণ চেকলিস্টের বদলে মূল্যায়ন দিয়ে শুরু করুন।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['licences', 'company-formation'],
  },
  {
    slug: 'education',
    name: { en: 'Education', bn: 'শিক্ষা' },
    summary: {
      en: 'Formation and licensing considerations for education providers; regulated advice is separate.',
      bn: 'শিক্ষা প্রদানকারীদের জন্য গঠন ও লাইসেন্সিং বিবেচনা; নিয়ন্ত্রিত পরামর্শ আলাদা।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['company-formation', 'licences'],
  },
  {
    slug: 'travel-tourism',
    name: { en: 'Travel and tourism', bn: 'ভ্রমণ ও পর্যটন' },
    summary: {
      en: 'Travel-agency registration and related licences when operationally verified.',
      bn: 'পরিচালন যাচাইয়ের পর ট্রাভেল এজেন্সি নিবন্ধন ও সংশ্লিষ্ট লাইসেন্স।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['licences'],
  },
  {
    slug: 'facility-services',
    name: { en: 'Facility services', bn: 'সুবিধা সেবা' },
    summary: {
      en: 'Company setup and trade licensing for facility and support-service operators.',
      bn: 'সুবিধা ও সহায়ক সেবা পরিচালনাকারীদের জন্য কোম্পানি সেটআপ ও ট্রেড লাইসেন্স।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['company-formation', 'licences'],
  },
  {
    slug: 'professional-services',
    name: { en: 'Professional services', bn: 'পেশাগত সেবা' },
    summary: {
      en: 'Formation and compliance for consultancies and professional practices.',
      bn: 'পরামর্শক ও পেশাগত অনুশীলনের জন্য গঠন ও কমপ্লায়েন্স।',
    },
    status: 'coming_soon',
    relatedCategorySlugs: ['company-formation', 'compliance'],
  },
] as const;

export function listIndustries(): Industry[] {
  return INDUSTRIES.filter((i) => i.status !== 'draft');
}
