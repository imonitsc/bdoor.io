import type { CountryRecord } from '@/features/directory/types';

/**
 * Jurisdictions bdoor may one day serve. Only Bangladesh is operationally
 * active. The others exist so the public site can explain the route without
 * pretending a provider is ready.
 */
export const COUNTRIES: readonly CountryRecord[] = [
  {
    code: 'BD',
    slug: 'bangladesh',
    name: { en: 'Bangladesh', bn: 'বাংলাদেশ' },
    summary: {
      en: 'Company formation, licences, tax coordination and ongoing compliance — the flagship product.',
      bn: 'কোম্পানি গঠন, লাইসেন্স, কর সমন্বয় ও চলমান কমপ্লায়েন্স — মূল পণ্য।',
    },
    operationalStatus: 'active',
    isFlagship: true,
    sortOrder: 10,
  },
  {
    code: 'US',
    slug: 'united-states',
    name: { en: 'United States', bn: 'যুক্তরাষ্ট্র' },
    summary: {
      en: 'LLC and C-Corp routes through a verified country specialist, when that specialist is contracted.',
      bn: 'যাচাইকৃত দেশ বিশেষজ্ঞের মাধ্যমে এলএলসি ও সি-কর্প — সেই বিশেষজ্ঞ চুক্তিবদ্ধ হলে।',
    },
    operationalStatus: 'coming_soon',
    isFlagship: false,
    sortOrder: 20,
  },
  {
    code: 'GB',
    slug: 'united-kingdom',
    name: { en: 'United Kingdom', bn: 'যুক্তরাজ্য' },
    summary: {
      en: 'Private limited company coordination through a verified UK specialist, when contracted.',
      bn: 'যাচাইকৃত যুক্তরাজ্য বিশেষজ্ঞের মাধ্যমে প্রাইভেট লিমিটেড কোম্পানি — চুক্তি হলে।',
    },
    operationalStatus: 'coming_soon',
    isFlagship: false,
    sortOrder: 30,
  },
  {
    code: 'AE',
    slug: 'united-arab-emirates',
    name: { en: 'United Arab Emirates', bn: 'সংযুক্ত আরব আমিরাত' },
    summary: {
      en: 'Free-zone and mainland options through a verified UAE specialist, when contracted.',
      bn: 'যাচাইকৃত ইউএই বিশেষজ্ঞের মাধ্যমে ফ্রি-জোন ও মেইনল্যান্ড বিকল্প — চুক্তি হলে।',
    },
    operationalStatus: 'coming_soon',
    isFlagship: false,
    sortOrder: 40,
  },
  {
    code: 'SG',
    slug: 'singapore',
    name: { en: 'Singapore', bn: 'সিঙ্গাপুর' },
    summary: {
      en: 'Pte Ltd coordination through a verified Singapore specialist, when contracted.',
      bn: 'যাচাইকৃত সিঙ্গাপুর বিশেষজ্ঞের মাধ্যমে প্রাইভেট লিমিটেড — চুক্তি হলে।',
    },
    operationalStatus: 'coming_soon',
    isFlagship: false,
    sortOrder: 50,
  },
];
