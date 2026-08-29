import { INTERNATIONAL_OFFERS } from '@/content/packages/catalog';
import type { InternationalOffer } from '@/features/packages/types';

/**
 * The six international countries as the public site presents them. Derived
 * from the commercial catalog so a status change there is the only edit —
 * the overview page, the country pages, the homepage cards and the footer all
 * read this shape.
 *
 * What is deliberately absent: prices, timelines, government fees and legal
 * or tax claims. None of those may be published for a route that has no
 * approved provider and price sheet (see docs/INTERNATIONAL_LAUNCH_MATRIX.md),
 * and guessing them is worse than omitting them.
 */
export type InternationalCountry = {
  slug: string;
  code: string;
  name: { en: string; bn: string };
  offer: InternationalOffer;
};

const COUNTRY_NAMES: Record<string, { en: string; bn: string }> = {
  US: { en: 'United States', bn: 'যুক্তরাষ্ট্র' },
  GB: { en: 'United Kingdom', bn: 'যুক্তরাজ্য' },
  AE: { en: 'United Arab Emirates', bn: 'সংযুক্ত আরব আমিরাত' },
  SA: { en: 'Saudi Arabia', bn: 'সৌদি আরব' },
  QA: { en: 'Qatar', bn: 'কাতার' },
  SG: { en: 'Singapore', bn: 'সিঙ্গাপুর' },
};

/**
 * Bangladesh on the countries index. It is not an `InternationalOffer` —
 * it is the operating market with its own packages — but the countries page
 * needs its slug and name from the same place as everything else.
 */
export const BANGLADESH_COUNTRY = {
  slug: 'bangladesh',
  code: 'BD',
  name: { en: 'Bangladesh', bn: 'বাংলাদেশ' },
  /** The owner-published featured starting price (29 Aug 2026 table). */
  featured: {
    label: { en: 'From ৳9,900', bn: '৳৯,৯০০ থেকে' },
    alt: { en: 'About $80', bn: 'আনুমানিক $৮০' },
    qualifier: { en: 'bdoor fee; official costs separate', bn: 'bdoor ফি; সরকারি খরচ আলাদা' },
  },
} as const;

/** Every public country slug, Bangladesh first — the /countries page tree. */
export function allCountrySlugs(): string[] {
  return [BANGLADESH_COUNTRY.slug, ...internationalCountries().map((c) => c.slug)];
}

export function internationalCountries(): InternationalCountry[] {
  return INTERNATIONAL_OFFERS.map((offer) => ({
    slug: offer.countrySlug,
    code: offer.countryCode,
    name: COUNTRY_NAMES[offer.countryCode] ?? { en: offer.countryCode, bn: offer.countryCode },
    offer,
  }));
}

export function internationalCountryBySlug(slug: string): InternationalCountry | undefined {
  return internationalCountries().find((country) => country.slug === slug);
}

/** Non-null localisation for the required `{ en, bn }` pairs used here. */
export function pickText(value: { en: string; bn: string }, locale: 'en' | 'bn'): string {
  return locale === 'bn' ? value.bn : value.en;
}
