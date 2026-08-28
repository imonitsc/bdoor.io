/**
 * International country framework.
 *
 * Countries other than Bangladesh stay inactive until a verified provider and
 * operating process exist. Do not present them as available on marketing pages.
 */

export type CountryStatus = 'active' | 'pilot' | 'coming_soon' | 'inactive';

export type CountryConfig = {
  code: string;
  slug: string;
  name: { en: string; bn: string };
  status: CountryStatus;
  flagship: boolean;
  summary: { en: string; bn: string };
  entities: string[];
  currency: string;
  /** Official sources must be filled before status can move past coming_soon. */
  sourcesReviewedAt: string | null;
};

export const COUNTRIES: readonly CountryConfig[] = [
  {
    code: 'BD',
    slug: 'bangladesh',
    name: { en: 'Bangladesh', bn: 'বাংলাদেশ' },
    status: 'active',
    flagship: true,
    summary: {
      en: 'Company formation, licences, tax coordination and ongoing compliance through one secure workspace.',
      bn: 'একটি সুরক্ষিত ওয়ার্কস্পেসের মাধ্যমে কোম্পানি গঠন, লাইসেন্স, কর সমন্বয় ও চলমান কমপ্লায়েন্স।',
    },
    entities: [
      'private_limited',
      'opc',
      'public_limited',
      'sole_proprietorship',
      'partnership',
      'foreign_owned',
      'branch',
      'liaison',
    ],
    currency: 'BDT',
    sourcesReviewedAt: null,
  },
  {
    code: 'US',
    slug: 'united-states',
    name: { en: 'United States', bn: 'যুক্তরাষ্ট্র' },
    status: 'coming_soon',
    flagship: false,
    summary: {
      en: 'LLC and C-Corp routes through verified country specialists — not yet available.',
      bn: 'যাচাইকৃত দেশ বিশেষজ্ঞের মাধ্যমে এলএলসি ও সি-কর্প — এখনো উপলব্ধ নয়।',
    },
    entities: ['llc', 'c_corp'],
    currency: 'USD',
    sourcesReviewedAt: null,
  },
  {
    code: 'GB',
    slug: 'united-kingdom',
    name: { en: 'United Kingdom', bn: 'যুক্তরাজ্য' },
    status: 'coming_soon',
    flagship: false,
    summary: {
      en: 'Private limited company and Companies House coordination — not yet available.',
      bn: 'প্রাইভেট লিমিটেড কোম্পানি ও কোম্পানিজ হাউস সমন্বয় — এখনো উপলব্ধ নয়।',
    },
    entities: ['private_limited'],
    currency: 'GBP',
    sourcesReviewedAt: null,
  },
  {
    code: 'AE',
    slug: 'united-arab-emirates',
    name: { en: 'United Arab Emirates', bn: 'সংযুক্ত আরব আমিরাত' },
    status: 'coming_soon',
    flagship: false,
    summary: {
      en: 'Supported free-zone and mainland options after provider verification — not yet available.',
      bn: 'প্রদানকারী যাচাইয়ের পর ফ্রি-জোন ও মেইনল্যান্ড বিকল্প — এখনো উপলব্ধ নয়।',
    },
    entities: ['free_zone', 'mainland'],
    currency: 'AED',
    sourcesReviewedAt: null,
  },
  {
    code: 'SG',
    slug: 'singapore',
    name: { en: 'Singapore', bn: 'সিঙ্গাপুর' },
    status: 'coming_soon',
    flagship: false,
    summary: {
      en: 'Pte Ltd and ACRA coordination through verified specialists — not yet available.',
      bn: 'যাচাইকৃত বিশেষজ্ঞের মাধ্যমে প্রাইভেট লিমিটেড ও এসিআরএ সমন্বয় — এখনো উপলব্ধ নয়।',
    },
    entities: ['pte_ltd'],
    currency: 'SGD',
    sourcesReviewedAt: null,
  },
] as const;

export function publicCountries(): CountryConfig[] {
  return COUNTRIES.filter((c) => c.status === 'active' || c.status === 'coming_soon');
}

export function flagshipCountry(): CountryConfig {
  return COUNTRIES.find((c) => c.flagship)!;
}
