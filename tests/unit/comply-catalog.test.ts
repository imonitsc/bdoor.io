import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { publishedPackages, activePackageVersion } from '@/content/packages/catalog';

/**
 * Two price sources must agree by test, not by coincidence (ROADMAP P0):
 * the TS catalogue prints the labels customers see, and `subscription_plans`
 * is the contractual row a subscription bills against. A drift between them
 * is a customer being charged something other than the published figure.
 */

const MIGRATION = readFileSync(
  join(__dirname, '../../supabase/migrations/20260101002600_analytics_metrics_subscriptions.sql'),
  'utf8',
);

function seededPlan(code: string): { billingPeriod: string; amountMinor: number } {
  // Matches the seed tuple: ('code', version, (select …), 'Name', 'নাম', 'period', amount)
  const pattern = new RegExp(`\\('${code}',[\\s\\S]*?'(month|year)',\\s*([0-9_]+)\\)`);
  const match = MIGRATION.match(pattern);
  if (!match) throw new Error(`no subscription_plans seed found for ${code}`);
  return { billingPeriod: match[1]!, amountMinor: Number(match[2]!.replaceAll('_', '')) };
}

describe('comply catalogue ↔ subscription plans parity', () => {
  const recurring = publishedPackages('existing_business').filter(
    (pkg) => activePackageVersion(pkg)?.billingPeriod,
  );

  it('exactly the two approved recurring packages carry a billingPeriod', () => {
    expect(recurring.map((pkg) => pkg.slug).sort()).toEqual([
      'annual-compliance',
      'managed-finance-compliance',
    ]);
  });

  it.each([['annual-compliance'], ['managed-finance-compliance']])(
    '%s: cadence and bdoor fee match the seeded plan row',
    (slug) => {
      const pkg = recurring.find((entry) => entry.slug === slug)!;
      const version = activePackageVersion(pkg)!;
      const seeded = seededPlan(slug);

      expect(version.billingPeriod).toBe(seeded.billingPeriod);

      const bdoorFee = version.feeComponents.find(
        (component) => component.layer === 'platform_service_fee',
      );
      expect(bdoorFee?.amountMinor).toBe(seeded.amountMinor);
      expect(bdoorFee?.currency).toBe('BDT');
      // The published label prints the same figure and cadence the plan bills.
      const major = (seeded.amountMinor / 100).toLocaleString('en-US');
      expect(version.publicLabel.en).toContain(major);
      expect(version.publicLabel.en).toContain(`/${seeded.billingPeriod}`);
    },
  );

  it('no one-off package carries a billingPeriod', () => {
    for (const segment of ['new_business', 'existing_business'] as const) {
      for (const pkg of publishedPackages(segment)) {
        const version = activePackageVersion(pkg);
        if (!version?.billingPeriod) continue;
        expect(['annual-compliance', 'managed-finance-compliance']).toContain(pkg.slug);
      }
    }
  });
});
