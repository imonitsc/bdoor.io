import { describe, expect, it } from 'vitest';
import {
  BANGLADESH_PACKAGES,
  INTERNATIONAL_OFFERS,
  STANDALONE_SERVICES,
  activePackageVersion,
  featuredOfferForCountry,
} from '@/content/packages/catalog';
import { SNAPSHOT_SERVICES } from '@/content/catalog-snapshot';
import { SELLABLE_AVAILABILITY } from '@/features/packages/types';
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
  it('carries exactly the owner-published featured starting prices', () => {
    // 65/35 Cursor master (28 Aug 2026 §7): native-currency totals that match
    // fee layers. Featured slug per country is what country cards show.
    const featured = Object.fromEntries(
      ['usa', 'uk', 'uae', 'singapore', 'saudi-arabia', 'qatar'].map((slug) => {
        const offer = featuredOfferForCountry(slug)!;
        return [slug, offer.publicLabel?.en];
      }),
    );
    expect(featured).toEqual({
      usa: 'USD 449 estimated total',
      uk: 'GBP 349 estimated total',
      uae: 'From AED 9,375',
      singapore: 'From S$1,500',
      'saudi-arabia': 'Professional setup from $4,900',
      qatar: 'First-year QFC estimate from $10,900',
    });
  });

  it('publishes the approved USA / UAE / Singapore route matrix', () => {
    expect(INTERNATIONAL_OFFERS.filter((o) => o.countrySlug === 'usa').map((o) => o.slug)).toEqual([
      'usa-wyoming-llc',
      'usa-delaware-llc',
      'usa-florida-llc',
    ]);
    expect(INTERNATIONAL_OFFERS.filter((o) => o.countrySlug === 'uae').map((o) => o.slug)).toEqual([
      'uae-sharjah-no-visa',
      'uae-dubai-route',
    ]);
    expect(
      INTERNATIONAL_OFFERS.filter((o) => o.countrySlug === 'singapore').map((o) => o.slug),
    ).toEqual(['singapore-resident-director', 'singapore-foreign-founder']);
  });

  it('a published price always travels with approval and its qualifier', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      if (offer.publicLabel) {
        expect(offer.priceApproved, `${offer.slug} label without approval`).toBe(true);
        expect(offer.publicQualifier, `${offer.slug} label without qualifier`).toBeDefined();
        expect(offer.publicQualifier!.en.length, offer.slug).toBeGreaterThan(10);
        expect(offer.publicQualifier!.bn.length, offer.slug).toBeGreaterThan(10);
      }
      if (!offer.priceApproved) {
        expect(offer.publicLabel, `${offer.slug} label without approval`).toBeUndefined();
      }
    }
  });

  it('runs every route as a managed application with checkout off', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      expect(offer.mode, offer.slug).toBe('managed_application');
      expect(offer.publicStatus, offer.slug).toBe('applications_open');
      // A starting estimate is not a checkout total: payment stays off until
      // provider, legal, payment and document-security readiness are approved.
      expect(offer.checkoutEnabled, offer.slug).toBe(false);
    }
  });

  it('never enables checkout without provider approval and full availability', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      if (offer.checkoutEnabled) {
        expect(offer.providerApproved, offer.slug).toBe(true);
        expect(offer.priceApproved, offer.slug).toBe(true);
        expect(offer.availability, offer.slug).toBe('available_online');
        expect(offer.mode, offer.slug).toBe('online_checkout');
      }
    }
  });

  it('routes every offer to a valid country page slug', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      expect(offer.countrySlug).toMatch(/^[a-z][a-z-]+$/);
    }
  });

  it('covers exactly the six international countries of the seven-country spec', () => {
    const countries = [...new Set(INTERNATIONAL_OFFERS.map((o) => o.countrySlug))].sort();
    expect(countries).toEqual(['qatar', 'saudi-arabia', 'singapore', 'uae', 'uk', 'usa']);
  });

  it('never claims openness outside the sellable availability states', () => {
    for (const offer of INTERNATIONAL_OFFERS) {
      if (!SELLABLE_AVAILABILITY.includes(offer.availability)) {
        expect(offer.publicStatus, offer.slug).not.toBe('available');
        expect(offer.publicStatus, offer.slug).not.toBe('applications_open');
        expect(offer.checkoutEnabled, offer.slug).toBe(false);
      }
      if (offer.checkoutEnabled) {
        // Checkout is the top of the ladder: a signed partner AND a pilot.
        expect(offer.availability, offer.slug).toBe('available_online');
      }
    }
  });

  it('keeps Saudi Arabia and Qatar eligibility-led', () => {
    for (const slug of ['saudi-arabia', 'qatar']) {
      const offer = INTERNATIONAL_OFFERS.find((o) => o.countrySlug === slug)!;
      expect(offer.eligibilityLed, slug).toBe(true);
    }
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
  it('carries the owner-approved figures from the 65/35 master', () => {
    expect(
      Object.fromEntries(
        STANDALONE_SERVICES.filter((s) => s.bdoorFeeBdt != null).map((s) => [
          s.slug,
          s.bdoorFeeBdt,
        ]),
      ),
    ).toEqual({
      'etin-assistance': 4000,
      'bin-vat-assistance': 6000,
      'trade-licence-coordination': 8000,
      'commercial-irc-coordination': 15000,
      'erc-coordination': 15000,
      'rjsc-annual-return': 12000,
      'bida-project-registration': 25000,
      'foreign-owned-private-company': 69900,
    });
    const branch = STANDALONE_SERVICES.find((s) => s.slug === 'branch-liaison-representative');
    expect(branch?.bdoorFeeBdt).toBeNull();
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
