import { describe, expect, it } from 'vitest';
import { COUNTRY_GUIDES, countryGuideBySlug } from '@/content/countries/guides';
import { INTERNATIONAL_OFFERS } from '@/content/packages/catalog';

/**
 * The guides are educational and register-interest-safe: complete for every
 * international country, bilingual, and free of the two things that may not
 * appear before a route is approved — currency figures and internal status
 * words. Figures live in the catalog's internal components and the source
 * ledger only.
 */

const FORBIDDEN = [
  /\bdraft\b/i,
  /pending review/i,
  /coming soon/i,
  /খসড়া/,
  /\bopen now\b/i,
  /available today/i,
  /guarante/i,
  // Currency figures: a digit next to a currency marker.
  /(?:USD|BDT|GBP|AED|SAR|QAR|SGD|S\$|[$£৳])\s?\d/,
  /\d\s?(?:USD|BDT|GBP|AED|SAR|QAR|SGD)/,
];

function assertSafe(text: string, where: string) {
  for (const pattern of FORBIDDEN) {
    expect(text, `${where}: ${pattern}`).not.toMatch(pattern);
  }
}

describe('country guides', () => {
  it('covers every international country in the catalog', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      const guide = countryGuideBySlug(offer.countrySlug);
      expect(guide, offer.countrySlug).toBeDefined();
      expect(guide!.requirements.length, offer.countrySlug).toBeGreaterThan(0);
      expect(guide!.documents.length, offer.countrySlug).toBeGreaterThan(0);
      expect(guide!.obligations.length, offer.countrySlug).toBeGreaterThan(0);
      expect(guide!.faq.length, offer.countrySlug).toBeGreaterThan(0);
      expect(guide!.reviewedAt, offer.countrySlug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('is bilingual and free of figures, guarantees and internal words', () => {
    for (const guide of COUNTRY_GUIDES) {
      const texts = [
        ...guide.requirements,
        ...guide.documents,
        ...guide.obligations,
        ...guide.faq.flatMap((f) => [f.q, f.a]),
      ];
      for (const text of texts) {
        expect(text.en.trim().length, guide.countrySlug).toBeGreaterThan(0);
        expect(text.bn.trim().length, guide.countrySlug).toBeGreaterThan(0);
        assertSafe(text.en, `${guide.countrySlug} (en)`);
        assertSafe(text.bn, `${guide.countrySlug} (bn)`);
      }
    }
  });
});
