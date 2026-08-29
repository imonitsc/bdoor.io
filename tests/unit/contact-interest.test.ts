import { describe, expect, it } from 'vitest';
import { resolveContactInterest } from '@/features/contact/interest';

/**
 * Lead attribution resolves only against the commercial catalog: a CTA slug
 * becomes a structured interest, anything else becomes a plain enquiry, and
 * nothing from the query string is ever stored verbatim.
 */
describe('resolveContactInterest', () => {
  it('resolves each international country to its route and the foreign topic', () => {
    for (const [slug, name] of [
      ['usa', 'United States'],
      ['uk', 'United Kingdom'],
      ['uae', 'United Arab Emirates'],
      ['saudi-arabia', 'Saudi Arabia'],
      ['qatar', 'Qatar'],
      ['singapore', 'Singapore'],
    ] as const) {
      const interest = resolveContactInterest(slug);
      expect(interest?.countryName.en, slug).toBe(name);
      expect(interest?.topic, slug).toBe('foreign');
      expect(interest?.routeSlug, slug).toBeDefined();
    }
  });

  it('resolves bangladesh with an optional package', () => {
    expect(resolveContactInterest('bangladesh')).toMatchObject({
      countrySlug: 'bangladesh',
      topic: 'startBusiness',
    });
    expect(resolveContactInterest('bangladesh', 'limited-company')?.routeName?.en).toBe(
      'Limited Company',
    );
    // An unknown package degrades to a plain country interest, never an error.
    expect(resolveContactInterest('bangladesh', 'no-such-package')?.routeSlug).toBeUndefined();
  });

  it('rejects unknown and malformed values entirely', () => {
    for (const value of ['mars', 'USA', 'united-states', '', ' ', 'a'.repeat(80), '<script>']) {
      expect(resolveContactInterest(value), JSON.stringify(value)).toBeNull();
    }
    expect(resolveContactInterest(undefined)).toBeNull();
  });

  it('drops a package that does not belong to the named country', () => {
    const interest = resolveContactInterest('qatar', 'usa-wyoming-llc');
    expect(interest?.countrySlug).toBe('qatar');
    expect(interest?.routeSlug).toBeUndefined();
  });
});
