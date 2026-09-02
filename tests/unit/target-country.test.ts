import { describe, expect, it } from 'vitest';
import {
  OBJECTIVES,
  TARGET_COUNTRIES,
  applicableQuestions,
  pruneInapplicable,
  stageProgress,
  targetCountryFromSlug,
  targetCountrySlug,
  validateAnswer,
} from '@/features/intake/questions';
import { hardManualReviewReasons } from '@/features/intake/rules';
import { newApplicationReference } from '@/features/intake/application';

/**
 * Opening of the application (production-fix 29 Aug 2026):
 * market_scope first, then country/objective when the scope still needs them.
 * An international target must never bypass manual review.
 */
describe('target_country', () => {
  it('follows market_scope when the visitor has not chosen a scope yet', () => {
    const keys = applicableQuestions({}).map((q) => q.key);
    expect(keys[0]).toBe('market_scope');
    expect(keys[1]).toBe('target_country');
    expect(keys[2]).toBe('objective');
  });

  it('is never asked on the Bangladesh path, yet the implied answer survives pruning', () => {
    const answers = {
      market_scope: 'bangladesh',
      target_country: 'bangladesh',
      objective: 'new',
    } as const;
    const keys = applicableQuestions(answers).map((q) => q.key);
    expect(keys[0]).toBe('market_scope');
    // Not applicable: Back from the next question must land on market_scope,
    // never on a country picker the founder was never shown.
    expect(keys).not.toContain('target_country');
    // …but pruning re-derives the implied answer, so the branch model holds.
    expect(pruneInapplicable({ ...answers }).target_country).toBe('bangladesh');
    // And a stale foreign country under a Bangladesh scope is corrected.
    expect(
      pruneInapplicable({ market_scope: 'bangladesh', target_country: 'usa' }).target_country,
    ).toBe('bangladesh');
  });

  it('offers exactly the seven countries, Bangladesh first, with no "unsure"', () => {
    expect(TARGET_COUNTRIES[0]).toBe('bangladesh');
    expect([...TARGET_COUNTRIES].sort()).toEqual([
      'bangladesh',
      'qatar',
      'saudi_arabia',
      'singapore',
      'uae',
      'uk',
      'usa',
    ]);
  });

  it('accepts each country and rejects anything else', () => {
    for (const country of TARGET_COUNTRIES) {
      expect(validateAnswer('target_country', country).success).toBe(true);
    }
    const invalid = validateAnswer('target_country', 'mars');
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error).toBe('requiredChoice');
  });

  it('round-trips between answer keys and /countries slugs', () => {
    for (const country of TARGET_COUNTRIES) {
      expect(targetCountryFromSlug(targetCountrySlug(country))).toBe(country);
    }
    expect(targetCountrySlug('saudi_arabia')).toBe('saudi-arabia');
    expect(targetCountryFromSlug('mars')).toBeUndefined();
    expect(targetCountryFromSlug('')).toBeUndefined();
  });

  it('shares the first stage with the market question, so progress does not jump', () => {
    // The property is that both opening screens sit in stage one, not what
    // that stage is called. They moved from `about_you` to `market` because
    // neither asks anything about the person.
    expect(stageProgress({}, 0)).toMatchObject({ current: 1, stage: 'market' });
    expect(stageProgress({ market_scope: 'outside' }, 1)).toMatchObject({
      current: 1,
      stage: 'market',
    });
  });

  it('never lets an international target skip manual review', () => {
    for (const country of TARGET_COUNTRIES) {
      const reasons = hardManualReviewReasons({ target_country: country });
      if (country === 'bangladesh') {
        expect(reasons).not.toContain('international_formation');
      } else {
        expect(reasons, country).toContain('international_formation');
      }
    }
  });

  it('asks the international subset abroad and the operating-market set at home', () => {
    const home = applicableQuestions({ target_country: 'bangladesh', objective: 'new' }).map(
      (q) => q.key,
    );
    const abroad = applicableQuestions({ target_country: 'usa', objective: 'new' }).map(
      (q) => q.key,
    );

    for (const key of ['need_visa', 'need_banking', 'notes', 'residence'] as const) {
      expect(abroad, key).toContain(key);
      if (key !== 'residence') expect(home, key).not.toContain(key);
    }
    for (const key of ['location', 'structure', 'import_export', 'regulated_activity'] as const) {
      expect(home, key).toContain(key);
      expect(abroad, key).not.toContain(key);
    }
    // Both branches end with the same contact stage, and no branch asks for
    // an identity document — none exists in the question set at all.
    for (const keys of [home, abroad]) {
      expect(keys.slice(-4)).toEqual(['full_name', 'email', 'phone', 'consent']);
    }
  });

  it('exposes every objective and requires one', () => {
    expect([...OBJECTIVES]).toEqual(['new', 'existing', 'expand', 'unsure']);
    expect(validateAnswer('objective', 'expand').success).toBe(true);
    expect(validateAnswer('objective', '').success).toBe(false);
  });
});

describe('contact stage validation', () => {
  it('requires a plausible email and translates the failure', () => {
    expect(validateAnswer('email', 'founder@example.com').success).toBe(true);
    const invalid = validateAnswer('email', 'not-an-email');
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error).toBe('invalidEmail');
  });

  it('requires explicit consent', () => {
    expect(validateAnswer('consent', true).success).toBe(true);
    for (const value of [false, undefined, 'true']) {
      const result = validateAnswer('consent', value);
      expect(result.success, String(value)).toBe(false);
      if (!result.success) expect(result.error).toBe('consentRequired');
    }
  });

  it('keeps phone and notes optional', () => {
    expect(validateAnswer('phone', '').success).toBe(true);
    expect(validateAnswer('notes', '').success).toBe(true);
  });
});

describe('application reference', () => {
  it('is BD-<year>-<6 digits> and random rather than sequential', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const reference = newApplicationReference(new Date('2026-08-29T00:00:00Z'));
      expect(reference).toMatch(/^BD-2026-\d{6}$/);
      seen.add(reference);
    }
    // Randomness can only be smoke-tested: a sequential counter would draw
    // 50 ascending values, so insertion order matching sorted order fails.
    expect(seen.size).toBeGreaterThan(40);
    expect([...seen]).not.toEqual([...seen].sort());
  });
});
