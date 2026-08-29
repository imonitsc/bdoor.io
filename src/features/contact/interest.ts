import { BANGLADESH_COUNTRY, internationalCountryBySlug } from '@/content/international';
import { packageBySlug } from '@/content/packages/catalog';

/**
 * Country/package interest carried into the contact form by validated query
 * parameters (`?interest=usa`, `?interest=uk&package=uk-non-resident-ltd`).
 * Every value is resolved against the commercial catalog — an arbitrary
 * string never reaches the page, the form or the database. The same resolver
 * runs in the page (to show the visitor what they are asking about) and in
 * the server action (so the stored lead cannot disagree with what was
 * shown).
 */
export type ContactInterest = {
  countrySlug: string;
  countryName: { en: string; bn: string };
  /** The catalog identity of the route or package, when one was named. */
  routeSlug?: string;
  routeName?: { en: string; bn: string };
  /** The contact topic this interest most closely matches. */
  topic: 'startBusiness' | 'foreign';
};

export function resolveContactInterest(
  interest: string | undefined,
  packageSlug?: string,
): ContactInterest | null {
  if (!interest || !/^[a-z][a-z-]{0,63}$/.test(interest)) return null;

  if (interest === BANGLADESH_COUNTRY.slug) {
    const pkg = packageSlug ? packageBySlug(packageSlug) : undefined;
    return {
      countrySlug: BANGLADESH_COUNTRY.slug,
      countryName: BANGLADESH_COUNTRY.name,
      routeSlug: pkg?.slug,
      routeName: pkg?.name,
      topic: 'startBusiness',
    };
  }

  const country = internationalCountryBySlug(interest);
  if (!country) return null;

  // International routes have exactly one offer per country today; a package
  // parameter is honoured only when it names that offer.
  const offer = country.offer;
  const routeMatches = packageSlug === undefined || packageSlug === offer.slug;

  return {
    countrySlug: country.slug,
    countryName: country.name,
    routeSlug: routeMatches ? offer.slug : undefined,
    routeName: routeMatches ? offer.route : undefined,
    topic: 'foreign',
  };
}
