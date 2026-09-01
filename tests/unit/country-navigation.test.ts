import { describe, expect, it } from 'vitest';

import {
  allCountrySlugs,
  BANGLADESH_COUNTRY,
  countryFooterLinks,
  countrySitemapEntries,
  internationalCountries,
} from '@/content/international';
import { SITEMAP_ROUTES } from '@/lib/navigation';

/**
 * ROADMAP P5: a new country is a data task. The footer and sitemap derive
 * their country entries from the catalog; this file is the tripwire that
 * keeps anyone from hardcoding a country back into navigation — the exact
 * drift that made a seventh country a multi-file edit.
 */

describe('country navigation derives from the catalog', () => {
  it('the sitemap covers Bangladesh and every international country, nothing else', () => {
    const paths = countrySitemapEntries().map((entry) => entry.path);
    expect(paths).toEqual([
      `/countries/${BANGLADESH_COUNTRY.slug}`,
      ...internationalCountries().map((country) => `/countries/${country.slug}`),
    ]);
    // Every slug the routing layer knows appears exactly once.
    expect(new Set(paths).size).toBe(allCountrySlugs().length);
  });

  it('no country child path is hardcoded in SITEMAP_ROUTES', () => {
    const hardcoded = SITEMAP_ROUTES.filter((route) => route.path.startsWith('/countries/'));
    expect(hardcoded).toEqual([]);
  });

  it('the footer lists every international country under its published name', () => {
    const links = countryFooterLinks();
    expect(links.map((link) => link.href)).toEqual(
      internationalCountries().map((country) => `/countries/${country.slug}`),
    );
    // The names the e2e footer audit pins, held here at unit speed.
    expect(links.map((link) => link.name.en)).toEqual([
      'United States',
      'United Kingdom',
      'United Arab Emirates',
      'Singapore',
      'Saudi Arabia',
      'Qatar',
    ]);
    for (const link of links) {
      expect(link.name.bn.length).toBeGreaterThan(0);
    }
  });
});
