import { describe, expect, it } from 'vitest';
import {
  applySeed,
  firstUnansweredIndex,
  resolveInitialAnswers,
  type PartialAnswers,
} from '@/features/intake/questions';
import { presetFromParams } from '@/features/intake/preset';

/**
 * Production hotfix §2: the start state is resolved with one precedence —
 * valid URL parameters, then this device's draft, then the stored server
 * draft, then empty. The regression being pinned down: a customer who once
 * drafted a United States application, then followed ?country=uk, saw
 * "Starting in United States".
 */
const US_DRAFT: PartialAnswers = {
  market_scope: 'outside',
  target_country: 'usa',
  objective: 'new',
  need_visa: true,
  need_banking: true,
  full_name: 'Sample Founder (sample)',
  email: 'founder@example.com',
};

const INTERNATIONAL_SEEDS = ['uk', 'uae', 'saudi_arabia', 'qatar', 'singapore'] as const;

describe('applySeed', () => {
  it('lets each international URL seed beat a stored United States draft', () => {
    for (const country of INTERNATIONAL_SEEDS) {
      const merged = applySeed(US_DRAFT, { market_scope: 'outside', target_country: country });
      expect(merged.target_country, country).toBe(country);
      expect(merged.market_scope).toBe('outside');
    }
  });

  it('clears answers the new routing makes inapplicable, and only those', () => {
    const merged = applySeed(US_DRAFT, {
      market_scope: 'bangladesh',
      target_country: 'bangladesh',
      objective: 'new',
    });
    expect(merged.target_country).toBe('bangladesh');
    // International-only operations questions stop applying under the
    // Bangladesh route and must not survive as stale state…
    expect(merged.need_visa).toBeUndefined();
    expect(merged.need_banking).toBeUndefined();
    // …while the contact answers apply on every route and are kept.
    expect(merged.full_name).toBe('Sample Founder (sample)');
    expect(merged.email).toBe('founder@example.com');
  });

  it('returns the base untouched when there is nothing to seed', () => {
    expect(applySeed(US_DRAFT, {})).toEqual(US_DRAFT);
  });

  it('ignores seed keys that are not canonical question keys', () => {
    const hostile = { __proto__: { hacked: true }, not_a_question: 'x' } as PartialAnswers;
    expect(applySeed({}, hostile)).toEqual({});
    expect(({} as Record<string, unknown>).hacked).toBeUndefined();
  });
});

describe('resolveInitialAnswers', () => {
  it('prefers the URL seed over both drafts', () => {
    const resolved = resolveInitialAnswers(
      US_DRAFT,
      { market_scope: 'outside', target_country: 'singapore' },
      { market_scope: 'outside', target_country: 'uk' },
    );
    expect(resolved.target_country).toBe('uk');
  });

  it('prefers this device’s draft over the stored server draft', () => {
    const resolved = resolveInitialAnswers(
      US_DRAFT,
      { market_scope: 'outside', target_country: 'qatar' },
      {},
    );
    expect(resolved.target_country).toBe('qatar');
  });

  it('falls back to the stored draft only when no seed exists, then to empty', () => {
    expect(resolveInitialAnswers(US_DRAFT, {}, {}).target_country).toBe('usa');
    expect(resolveInitialAnswers({}, {}, {})).toEqual({});
  });

  it('drops non-canonical keys from an untrusted device draft', () => {
    const resolved = resolveInitialAnswers(
      {},
      { legacy_key: 'stale', target_country: 'uk', market_scope: 'outside' } as PartialAnswers,
      {},
    );
    expect(resolved).toEqual({ market_scope: 'outside', target_country: 'uk' });
  });
});

describe('presetFromParams', () => {
  it('seeds an international country and records the validated source path', () => {
    const preset = presetFromParams({ country: 'uk' });
    expect(preset.answers).toEqual({ market_scope: 'outside', target_country: 'uk' });
    expect(preset.sourcePath).toBe('/start?country=uk');
    expect(preset.redirectTo).toBeUndefined();
  });

  it('round-trips hyphenated slugs', () => {
    const preset = presetFromParams({ country: 'saudi-arabia' });
    expect(preset.answers.target_country).toBe('saudi_arabia');
    expect(preset.sourcePath).toBe('/start?country=saudi-arabia');
  });

  it('maps each production package to Bangladesh plus its business stage', () => {
    const expected: Record<string, 'new' | 'existing'> = {
      'solo-start': 'new',
      'limited-company': 'new',
      'complete-launch': 'new',
      'compliance-check': 'existing',
      'annual-compliance': 'existing',
      'managed-finance-compliance': 'existing',
    };
    for (const [slug, objective] of Object.entries(expected)) {
      const preset = presetFromParams({ package: slug });
      expect(preset.packageSlug, slug).toBe(slug);
      expect(preset.answers.market_scope, slug).toBe('bangladesh');
      expect(preset.answers.target_country, slug).toBe('bangladesh');
      expect(preset.answers.objective, slug).toBe(objective);
      expect(preset.sourcePath, slug).toBe(`/start?package=${slug}`);
    }
  });

  it('redirects an international country + Bangladesh package to the canonical package URL', () => {
    for (const country of ['uk', 'uae', 'usa', 'qatar']) {
      const preset = presetFromParams({ country, package: 'solo-start' });
      expect(preset.redirectTo, country).toBe('/start?package=solo-start');
      expect(preset.answers, country).toEqual({});
      expect(preset.sourcePath, country).toBeUndefined();
    }
  });

  it('does not redirect when the country is Bangladesh itself', () => {
    const preset = presetFromParams({ country: 'bangladesh', package: 'limited-company' });
    expect(preset.redirectTo).toBeUndefined();
    expect(preset.answers.target_country).toBe('bangladesh');
    expect(preset.packageSlug).toBe('limited-company');
  });

  it('drops unknown countries, packages and objectives instead of echoing them', () => {
    const preset = presetFromParams({
      country: 'mars',
      package: 'mega-deal',
      objective: 'world-domination',
    });
    expect(preset.answers).toEqual({});
    expect(preset.packageSlug).toBeUndefined();
    expect(preset.sourcePath).toBeUndefined();
    expect(preset.redirectTo).toBeUndefined();
  });

  it('discards an objective the Bangladesh route does not offer', () => {
    const preset = presetFromParams({ country: 'bangladesh', objective: 'expand' });
    expect(preset.answers.objective).toBeUndefined();
    expect(preset.answers.target_country).toBe('bangladesh');
  });

  it('advances a package link past the questions the link already answered', () => {
    const preset = presetFromParams({ package: 'solo-start' });
    const index = firstUnansweredIndex(applySeed({}, preset.answers));
    expect(index).toBeGreaterThan(0);
  });
});
