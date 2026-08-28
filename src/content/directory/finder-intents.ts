import type { FinderIntent } from '@/features/directory/types';

/**
 * Homepage and mega-nav intents. Each href is a real route: the assessment
 * with a preselected intent, a catalogue filter, or a coming-soon service.
 */
export const FINDER_INTENTS: readonly FinderIntent[] = [
  {
    id: 'start_company',
    label: { en: 'Start a company', bn: 'কোম্পানি শুরু করুন' },
    href: '/start?intent=local_company',
  },
  {
    id: 'get_licence',
    label: { en: 'Get a licence', bn: 'লাইসেন্স নিন' },
    href: '/services?category=licences',
  },
  {
    id: 'register_tax',
    label: { en: 'Register tax/VAT', bn: 'কর/ভ্যাট নিবন্ধন' },
    href: '/services?category=tax-vat',
  },
  {
    id: 'import_export',
    label: { en: 'Import or export', bn: 'আমদানি বা রপ্তানি' },
    href: '/start?intent=import_export',
  },
  {
    id: 'manage_existing',
    label: { en: 'Manage an existing company', bn: 'চলমান কোম্পানি পরিচালনা' },
    href: '/start?intent=existing_company',
  },
  {
    id: 'hire_foreign',
    label: { en: 'Hire foreign staff', bn: 'বিদেশি কর্মী নিয়োগ' },
    href: '/foreign-founders',
  },
  {
    id: 'protect_brand',
    label: { en: 'Protect a brand', bn: 'ব্র্যান্ড সুরক্ষা' },
    href: '/services/trademark-search-application',
  },
  {
    id: 'procurement',
    label: { en: 'Prepare for government procurement', bn: 'সরকারি ক্রয়ের প্রস্তুতি' },
    href: '/services/egp-registration-readiness',
  },
  {
    id: 'annual_compliance',
    label: { en: 'Maintain annual compliance', bn: 'বার্ষিক কমপ্লায়েন্স' },
    href: '/services?category=compliance',
  },
  {
    id: 'expand_international',
    label: { en: 'Expand internationally', bn: 'আন্তর্জাতিক সম্প্রসারণ' },
    href: '/international',
  },
];
