import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { isPubliclyVisible } from '@/features/catalog/types';

/**
 * CLAUDE.md §8.3: a public service door is either an open application or
 * published information. It is never an interest form.
 *
 * The rule had been enforced in one place and drifted in three. The services
 * index filtered `coming_soon` out; the detail route still served those
 * services with a "Coming soon" badge and a Notify me button, and the
 * foreign-founders page listed by category without checking status at all. So
 * these tests pin the predicate and then check that no surface can render the
 * door again.
 */

type Status = Parameters<typeof isPubliclyVisible>[0]['status'];

/**
 * Derived from the enum rather than hand-listed: a new publication status has
 * to be named here, which is the moment to decide whether it may face the
 * public. Hand-listing let a wrong guess compile away silently.
 */
const NOT_PUBLIC = ['draft', 'coming_soon', 'retired'] as const satisfies readonly Exclude<
  Status,
  'published'
>[];

describe('isPubliclyVisible', () => {
  it('admits published services', () => {
    expect(isPubliclyVisible({ status: 'published' })).toBe(true);
  });

  it('refuses everything else', () => {
    for (const status of NOT_PUBLIC) {
      expect(isPubliclyVisible({ status }), status).toBe(false);
    }
  });
});

describe('no public surface renders an interest-only door', () => {
  // The whole marketing tree, so a new page inherits the rule by failing here
  // rather than by shipping a Notify me button nobody noticed.
  const SURFACES = [
    'src/app/[locale]/(marketing)/services/page.tsx',
    'src/app/[locale]/(marketing)/services/[slug]/page.tsx',
    'src/app/[locale]/(marketing)/foreign-founders/page.tsx',
    'src/components/marketing/service-card.tsx',
    'src/app/sitemap.ts',
  ];

  it('never renders a coming-soon badge or a Notify me action', () => {
    for (const file of SURFACES) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} renders notifyMe`).not.toMatch(/notifyMe/);
      expect(source, `${file} renders comingSoon`).not.toMatch(/comingSoon/i);
    }
  });

  it('gates every list and route on the shared predicate', () => {
    // Open-coding the status comparison is how the four surfaces drifted apart
    // in the first place.
    for (const file of SURFACES) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} does not use isPubliclyVisible`).toMatch(/isPubliclyVisible/);
      expect(source, `${file} open-codes the status check`).not.toMatch(
        /status === '(published|coming_soon)'/,
      );
    }
  });
});
