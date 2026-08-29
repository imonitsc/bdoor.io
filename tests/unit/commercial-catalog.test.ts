import { describe, expect, it } from 'vitest';
import {
  BANGLADESH_PACKAGES,
  INTERNATIONAL_OFFERS,
  STANDALONE_SERVICES,
  activePackageVersion,
} from '@/content/packages/catalog';
import { SNAPSHOT_SERVICES } from '@/content/catalog-snapshot';
import { computeLayerTotals } from '@/features/packages/pricing';

/**
 * Schema-level validation of the commercial source of truth. These rules are
 * about honesty, not formatting: internal words must not be publishable, a
 * price may only exist where it has been approved, and the figures the owner
 * signed off cannot drift without failing a build.
 */

/**
 * Words that mark internal state. If one of these appears in a public string
 * the configuration is wrong, whatever the page around it does.
 */
const FORBIDDEN_PUBLIC = [/\bdraft\b/i, /pending review/i, /coming soon/i, /খসড়া/];

function assertPublishable(text: string, where: string) {
  for (const pattern of FORBIDDEN_PUBLIC) {
    expect(text, `${where} contains internal language (${pattern})`).not.toMatch(pattern);
  }
}

describe('Bangladesh packages', () => {
  it('carries exactly the owner-approved baseline figures', () => {
    const byBdoorFee = Object.fromEntries(
      BANGLADESH_PACKAGES.map((pkg) => {
        const version = activePackageVersion(pkg)!;
        return [pkg.slug, computeLayerTotals(version.feeComponents).bdoorMinor];
      }),
    );

    // §5 of the remediation brief: do not alter without recorded owner
    // approval. If a price change is intentional, update this table in the
    // same commit and say so in its message.
    expect(byBdoorFee).toEqual({
      'solo-start': 9_900_00,
      'limited-company': 24_900_00,
      'complete-launch': 39_900_00,
      'compliance-check': 14_900_00,
      'annual-compliance': 49_900_00,
      'managed-finance-compliance': 11_900_00,
    });
  });

  it('every published version declares how its price is to be read', () => {
    for (const pkg of BANGLADESH_PACKAGES) {
      const version = activePackageVersion(pkg)!;
      expect(version.priceType, pkg.slug).toBeDefined();
      if (version.priceType === 'fixed' || version.priceType === 'from') {
        expect(version.publicLabel.en, pkg.slug).toMatch(/\d/);
      }
    }
  });

  it('publishes only BDT fees for Bangladesh packages', () => {
    for (const pkg of BANGLADESH_PACKAGES) {
      const version = activePackageVersion(pkg)!;
      for (const component of version.feeComponents) {
        expect(component.currency, `${pkg.slug} ${component.layer}`).toBe('BDT');
      }
    }
  });

  it('has no internal language in any public string', () => {
    for (const pkg of BANGLADESH_PACKAGES) {
      const version = activePackageVersion(pkg)!;
      for (const locale of ['en', 'bn'] as const) {
        assertPublishable(version.publicLabel[locale], `${pkg.slug} publicLabel.${locale}`);
        assertPublishable(version.summary[locale], `${pkg.slug} summary.${locale}`);
        for (const item of [...version.inclusions, ...version.exclusions, ...version.limits]) {
          assertPublishable(item[locale], `${pkg.slug} list item (${locale})`);
        }
      }
    }
  });
});

describe('international offers', () => {
  it('never publishes a price without price approval', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      if (!offer.priceApproved) {
        expect(
          offer.publicLabel,
          `${offer.slug} has a public label without approval`,
        ).toBeUndefined();
        // Summaries must not smuggle a figure in either.
        expect(offer.summary.en, offer.slug).not.toMatch(/\d{2,}/);
      }
    }
  });

  it('never enables checkout without provider and price approval', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      if (offer.checkoutEnabled) {
        expect(offer.providerApproved, offer.slug).toBe(true);
        expect(offer.priceApproved, offer.slug).toBe(true);
        expect(offer.publicStatus, offer.slug).toBe('available');
      }
    }
  });

  it('routes every offer to its own country page', () => {
    const slugs = INTERNATIONAL_OFFERS.map((o) => o.countrySlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z][a-z-]+$/);
  });

  it('keeps internal status words out of every public string', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      for (const locale of ['en', 'bn'] as const) {
        assertPublishable(offer.summary[locale], `${offer.slug} summary.${locale}`);
        assertPublishable(offer.route[locale], `${offer.slug} route.${locale}`);
        for (const disclosure of offer.disclosures) {
          assertPublishable(disclosure[locale], `${offer.slug} disclosure (${locale})`);
        }
        if (offer.publicLabel) {
          assertPublishable(offer.publicLabel[locale], `${offer.slug} label (${locale})`);
        }
      }
    }
  });
});

describe('standalone services', () => {
  it('carries the owner-approved figures', () => {
    expect(Object.fromEntries(STANDALONE_SERVICES.map((s) => [s.slug, s.bdoorFeeBdt]))).toEqual({
      'etin-assistance': 4000,
      'bin-vat-assistance': 6000,
      'trade-licence-coordination': 8000,
    });
  });
});

describe('cross-source consistency', () => {
  it('the incorporation service price matches the Limited Company package', () => {
    // This is the 24,900-vs-25,000 contradiction pinned for good: the older
    // per-service catalogue must quote the same bdoor fee as the package
    // sheet for the same work.
    const service = SNAPSHOT_SERVICES.find(
      (s) => s.slug === 'private-limited-company-incorporation',
    );
    expect(service).toBeDefined();
    const pkg = BANGLADESH_PACKAGES.find((p) => p.slug === 'limited-company')!;
    const bdoorMinor = computeLayerTotals(activePackageVersion(pkg)!.feeComponents).bdoorMinor;
    expect(service!.startingFeeBdt! * 100).toBe(bdoorMinor);
  });
});
