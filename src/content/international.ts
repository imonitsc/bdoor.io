import { INTERNATIONAL_OFFERS } from '@/content/packages/catalog';
import type { InternationalOffer } from '@/features/packages/types';

/**
 * The four international countries as the public site presents them. Derived
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
  SG: { en: 'Singapore', bn: 'সিঙ্গাপুর' },
};

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
