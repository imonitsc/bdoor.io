import {
  featuredOfferForCountry,
  homepageInternationalOffers,
  INTERNATIONAL_OFFERS,
} from '@/content/packages/catalog';
import type { InternationalOffer } from '@/features/packages/types';

/**
 * The six international countries as the public site presents them. Derived
 * from the commercial catalog so a status change there is the only edit —
 * the overview page, the country pages, the homepage cards and the footer all
 * read this shape.
 *
 * Multiple formation routes may share a country (e.g. Wyoming / Delaware /
 * Florida). Country listings use the featured offer; country pages load every
 * route via `offersForCountry`.
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
  /** Featured Solo Start starting price (65/35 master, 28 Aug 2026). */
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

/** One entry per international country, using the featured formation route. */
export function internationalCountries(): InternationalCountry[] {
  const seen = new Set<string>();
  const countries: InternationalCountry[] = [];
  for (const offer of INTERNATIONAL_OFFERS) {
    if (seen.has(offer.countrySlug)) continue;
    seen.add(offer.countrySlug);
    const featured = featuredOfferForCountry(offer.countrySlug) ?? offer;
    countries.push({
      slug: featured.countrySlug,
      code: featured.countryCode,
      name: COUNTRY_NAMES[featured.countryCode] ?? {
        en: featured.countryCode,
        bn: featured.countryCode,
      },
      offer: featured,
    });
  }
  return countries;
}

/** Four homepage cards — USA, UK, UAE, Singapore only (master §8). */
export function homepageCountries(): InternationalCountry[] {
  return homepageInternationalOffers().map((offer) => ({
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
