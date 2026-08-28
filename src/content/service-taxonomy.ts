/**
 * Canonical Bangladesh service taxonomy for discovery and assessment alignment.
 *
 * Services remain `draft` or `coming_soon` until operationally verified.
 * The published catalog in Supabase is the source of truth for live pages;
 * this file powers the service finder and recommendation intent mapping.
 */

export type TaxonomyServiceStatus = 'available' | 'pilot' | 'coming_soon' | 'consultation';

export type TaxonomyService = {
  slug: string;
  category: string;
  title: { en: string; bn: string };
  intent: string;
  status: TaxonomyServiceStatus;
  businessStages: string[];
};

export const SERVICE_FINDER_INTENTS = [
  { id: 'start_company', labelKey: 'startCompany' },
  { id: 'get_licence', labelKey: 'getLicence' },
  { id: 'register_tax', labelKey: 'registerTax' },
  { id: 'import_export', labelKey: 'importExport' },
  { id: 'manage_existing', labelKey: 'manageExisting' },
  { id: 'hire_foreign', labelKey: 'hireForeign' },
  { id: 'protect_brand', labelKey: 'protectBrand' },
  { id: 'government_procurement', labelKey: 'governmentProcurement' },
  { id: 'annual_compliance', labelKey: 'annualCompliance' },
  { id: 'expand_international', labelKey: 'expandInternational' },
] as const;

export const TAXONOMY_SERVICES: TaxonomyService[] = [
  {
    slug: 'private-limited-company',
    category: 'company-formation',
    title: { en: 'Private limited company', bn: 'প্রাইভেট লিমিটেড কোম্পানি' },
    intent: 'start_company',
    status: 'available',
    businessStages: ['new'],
  },
  {
    slug: 'trade-licence',
    category: 'licences',
    title: { en: 'Trade licence', bn: 'ট্রেড লাইসেন্স' },
    intent: 'get_licence',
    status: 'available',
    businessStages: ['new', 'operating'],
  },
  {
    slug: 'bin-vat-registration',
    category: 'tax-vat',
    title: { en: 'BIN/VAT registration', bn: 'বিআইএন/ভ্যাট নিবন্ধন' },
    intent: 'register_tax',
    status: 'available',
    businessStages: ['new', 'operating'],
  },
  {
    slug: 'import-registration-certificate',
    category: 'import-export',
    title: { en: 'Import registration (IRC)', bn: 'আমদানি নিবন্ধন (IRC)' },
    intent: 'import_export',
    status: 'available',
    businessStages: ['operating'],
  },
  {
    slug: 'annual-return-compliance',
    category: 'compliance',
    title: { en: 'Annual return and AGM compliance', bn: 'বার্ষিক রিটার্ন ও AGM কমপ্লায়েন্স' },
    intent: 'annual_compliance',
    status: 'available',
    businessStages: ['operating'],
  },
  {
    slug: 'foreign-owned-company',
    category: 'foreign-founders',
    title: { en: 'Foreign-owned company', bn: 'বিদেশি মালিকানাধীন কোম্পানি' },
    intent: 'start_company',
    status: 'available',
    businessStages: ['new'],
  },
  {
    slug: 'work-permit-coordination',
    category: 'foreign-founders',
    title: { en: 'Work permit coordination', bn: 'ওয়ার্ক পারমিট সমন্বয়' },
    intent: 'hire_foreign',
    status: 'consultation',
    businessStages: ['operating'],
  },
  {
    slug: 'trademark-application',
    category: 'intellectual-property',
    title: { en: 'Trademark search and application', bn: 'ট্রেডমার্ক অনুসন্ধান ও আবেদন' },
    intent: 'protect_brand',
    status: 'coming_soon',
    businessStages: ['new', 'operating'],
  },
  {
    slug: 'egp-readiness',
    category: 'trade-procurement',
    title: { en: 'e-GP registration readiness', bn: 'ই-জিপি নিবন্ধন প্রস্তুতি' },
    intent: 'government_procurement',
    status: 'coming_soon',
    businessStages: ['operating'],
  },
];

export function servicesForIntent(intent: string): TaxonomyService[] {
  return TAXONOMY_SERVICES.filter((s) => s.intent === intent);
}
