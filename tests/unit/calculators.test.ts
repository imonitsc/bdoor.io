import { describe, expect, it } from 'vitest';

import { BANGLADESH_PACKAGES } from '@/content/packages/catalog';
import { defineCalculator } from '@/features/calculators/framework';
import { packageEstimate } from '@/features/calculators/package-estimate';

/**
 * Deterministic calculators (BI-OS §4.5): versioned, sourced, and incapable
 * of inventing a figure — the fixtures below are the framework's teeth.
 */

describe('the calculator framework', () => {
  it('refuses a definition without sources, a version or dated review', () => {
    const base = {
      id: 'probe',
      version: '2026-08-31.1',
      effectiveFrom: '2026-08-31',
      sources: [{ title: 'x', lastReviewed: '2026-08-31' }],
      compute: () => 0,
    };

    expect(() => defineCalculator({ ...base, sources: [] })).toThrow(/source/);
    expect(() => defineCalculator({ ...base, version: 'v1' })).toThrow(/version/);
    expect(() =>
      defineCalculator({ ...base, sources: [{ title: 'x', lastReviewed: 'recently' }] }),
    ).toThrow(/review date/);
    expect(() => defineCalculator({ ...base, id: 'Not A Slug' })).toThrow(/kebab-case/);
  });

  it('freezes a definition so a figure cannot drift without a version bump', () => {
    expect(Object.isFrozen(packageEstimate)).toBe(true);
    expect(packageEstimate.version).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(packageEstimate.sources[0]?.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('the package estimate calculator', () => {
  it('totals the published bdoor fee and nothing else for Limited Company', () => {
    const estimate = packageEstimate.compute({ slug: 'limited-company' });
    expect(estimate).not.toBeNull();
    // BDT 24,900, in minor units, from the published catalog — a fixture that
    // fails when the price changes without this calculator's version moving.
    expect(estimate?.bdoorFeeMinor).toBe(2_490_000);
    expect(estimate?.currency).toBe('BDT');
  });

  it('never folds an unverified figure into a total', () => {
    for (const pkg of BANGLADESH_PACKAGES) {
      const estimate = packageEstimate.compute({ slug: pkg.slug });
      if (!estimate) continue;
      const lineTotal = estimate.lines.reduce((sum, line) => sum + line.amountMinor, 0);
      // The two totals partition the verified lines exactly; unpriced
      // components appear by name and contribute zero.
      expect(estimate.bdoorFeeMinor + estimate.reviewedPassThroughMinor, pkg.slug).toBe(lineTotal);
      for (const line of estimate.lines) {
        expect(line.amountMinor, pkg.slug).toBeGreaterThan(0);
      }
    }
  });

  it('returns null rather than guessing for an unknown or unpublished package', () => {
    expect(packageEstimate.compute({ slug: 'does-not-exist' })).toBeNull();
  });
});
