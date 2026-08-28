import { describe, expect, it } from 'vitest';
import { mergeServices, TAXONOMY_SERVICES } from '@/content/directory/taxonomy';
import { publicEvidenceClaims, EVIDENCE_CLAIMS } from '@/content/directory/evidence';
import { publicSocialProfiles, SOCIAL_PROFILES } from '@/content/directory/social-profiles';
import { COUNTRIES } from '@/content/directory/countries';
import { LAUNCH_GATES, p0GatesOpen } from '@/content/launch/gates';
import {
  itemisedPublicTotals,
  type Service,
  type ServiceFeeComponent,
} from '@/features/catalog/types';
import { SNAPSHOT_SERVICES } from '@/content/catalog-snapshot';

function fee(overrides: Partial<ServiceFeeComponent>): ServiceFeeComponent {
  return {
    category: 'platform_service_fee',
    label: { en: 'Fee', bn: 'ফি' },
    payee: 'bdoor',
    amountBdt: 25_000_00,
    isEstimate: false,
    isRefundable: false,
    taxTreatment: 'exclusive',
    reviewedAt: '2026-01-15',
    ...overrides,
  };
}

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 's1',
    slug: 'example',
    categorySlug: 'company-formation',
    name: { en: 'Example', bn: 'উদাহরণ' },
    summary: { en: 'Summary', bn: 'সারসংক্ষেপ' },
    whoFor: null,
    included: { en: [], bn: [] },
    notIncluded: { en: [], bn: [] },
    eligibility: null,
    authorityName: null,
    startingFeeBdt: 25_000_00,
    estimatedDaysMin: null,
    estimatedDaysMax: null,
    timeReviewedAt: null,
    requiresPartner: false,
    isRegulated: false,
    status: 'published',
    sortOrder: 1,
    requirements: [],
    milestones: [],
    feeComponents: [],
    ...overrides,
  };
}

describe('evidence register', () => {
  it('publishes only verified public claims', () => {
    const published = publicEvidenceClaims();
    expect(published.length).toBeGreaterThan(0);
    expect(published.every((row) => row.public && row.status === 'verified')).toBe(true);
    expect(EVIDENCE_CLAIMS.some((row) => row.status === 'draft')).toBe(true);
    expect(published.some((row) => row.id === 'EVD-OPERATOR-ENTITY')).toBe(false);
  });

  it('keeps every social profile off the public site until verified and active', () => {
    expect(publicSocialProfiles()).toEqual([]);
    expect(SOCIAL_PROFILES.every((row) => row.status !== 'active' || !row.verified)).toBe(true);
  });
});

describe('directory taxonomy', () => {
  it('merges coming-soon services without duplicating published slugs', () => {
    const merged = mergeServices(SNAPSHOT_SERVICES);
    const slugs = merged.map((row) => row.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(TAXONOMY_SERVICES.length).toBeGreaterThan(10);
    const extra = TAXONOMY_SERVICES.filter(
      (row) => !SNAPSHOT_SERVICES.some((existing) => existing.slug === row.slug),
    );
    expect(merged).toHaveLength(SNAPSHOT_SERVICES.length + extra.length);
  });

  it('treats only Bangladesh as an active country', () => {
    const active = COUNTRIES.filter((row) => row.operationalStatus === 'active');
    expect(active).toHaveLength(1);
    expect(active[0]?.code).toBe('BD');
    expect(COUNTRIES.filter((row) => row.operationalStatus === 'coming_soon').length).toBe(4);
  });
});

describe('itemised public totals', () => {
  it('returns a number only when every line is displayable', () => {
    const complete = itemisedPublicTotals(
      service({
        feeComponents: [
          fee({ category: 'platform_service_fee', amountBdt: 25_000_00 }),
          fee({
            category: 'government_fee_estimate',
            amountBdt: 1_000_00,
            payee: 'government_authority',
            reviewedAt: '2026-01-15',
          }),
        ],
      }),
    );
    expect(complete.complete).toBe(true);
    expect(complete.totalBdt).toBe(26_000_00);
  });

  it('does not invent a total when a government line is unverified', () => {
    const incomplete = itemisedPublicTotals(
      service({
        feeComponents: [
          fee({ category: 'platform_service_fee', amountBdt: 25_000_00 }),
          fee({
            category: 'government_fee_estimate',
            amountBdt: 8_000_00,
            payee: 'government_authority',
            reviewedAt: null,
          }),
        ],
      }),
    );
    expect(incomplete.complete).toBe(false);
    expect(incomplete.totalBdt).toBeNull();
    expect(incomplete.lines[1]?.amountBdt).toBeNull();
  });
});

describe('launch gates', () => {
  it('keeps commercial launch blocked while any P0 gate is open', () => {
    expect(LAUNCH_GATES).toHaveLength(6);
    expect(p0GatesOpen()).toBe(true);
    expect(LAUNCH_GATES.filter((gate) => gate.status === 'closed')).toHaveLength(0);
  });
});
