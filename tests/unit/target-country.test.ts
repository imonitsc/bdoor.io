import { describe, expect, it } from 'vitest';
import {
  BD_OBJECTIVES,
  BUSINESS_LOCATIONS,
  FORMATION_TYPES,
  INTERNATIONAL_TARGETS,
  SUPPORT_OPTIONS,
  TARGET_COUNTRIES,
  applicableQuestions,
  objectiveForFormationType,
  stageProgress,
  targetCountryFromSlug,
  targetCountrySlug,
  validateAnswer,
} from '@/features/intake/questions';
import { hardManualReviewReasons } from '@/features/intake/rules';
import { newApplicationReference } from '@/features/intake/application';

/**
 * The Bangladesh-first opening of the application: one location question
 * (Bangladesh / outside), then either the operating-market set or the short
 * international set (country, formation type, support). An international
 * case must never bypass manual review — a specialist reviews every such
 * case before a provider is appointed.
 */
describe('the branching opening', () => {
  it('asks where first, and only that', () => {
    const keys = applicableQuestions({}).map((q) => q.key);
    expect(keys[0]).toBe('business_location');
    expect([...BUSINESS_LOCATIONS]).toEqual(['bangladesh', 'outside']);
  });

  it('Bangladesh asks new-or-existing next; outside asks the country', () => {
    const bd = applicableQuestions({ business_location: 'bangladesh' }).map((q) => q.key);
    expect(bd[1]).toBe('objective');
    expect(bd).not.toContain('target_country');

    const abroad = applicableQuestions({ business_location: 'outside' }).map((q) => q.key);
    expect(abroad[1]).toBe('target_country');
    expect(abroad).not.toContain('objective');
  });

  it('offers exactly new and existing for Bangladesh', () => {
    expect([...BD_OBJECTIVES]).toEqual(['new', 'existing']);
  });

  it('offers exactly the six international countries, never Bangladesh', () => {
    expect([...INTERNATIONAL_TARGETS].sort()).toEqual([
      'qatar',
      'saudi_arabia',
      'singapore',
      'uae',
      'uk',
      'usa',
    ]);
    // The full enum keeps bangladesh for stored data and the admin queue.
    expect(TARGET_COUNTRIES).toContain('bangladesh');
  });

  it('round-trips between answer keys and /countries slugs', () => {
    for (const country of TARGET_COUNTRIES) {
      expect(targetCountryFromSlug(targetCountrySlug(country))).toBe(country);
    }
    expect(targetCountrySlug('saudi_arabia')).toBe('saudi-arabia');
    expect(targetCountryFromSlug('mars')).toBeUndefined();
    expect(targetCountryFromSlug('')).toBeUndefined();
  });

  it('stays in the about_you stage, so stage progress does not jump', () => {
    expect(stageProgress({}, 0)).toMatchObject({ current: 1, stage: 'about_you' });
  });
});

describe('the international branch', () => {
  it('asks formation type and required support, then stays short', () => {
    const abroad = applicableQuestions({ business_location: 'outside', target_country: 'usa' }).map(
      (q) => q.key,
    );

    for (const key of ['formation_type', 'support_needed', 'activity', 'start_window', 'notes']) {
      expect(abroad, key).toContain(key);
    }
    // The operating-market set stays on the Bangladesh branch; the appointed
    // provider confirms the rest per case.
    for (const key of ['location', 'structure', 'owner_count', 'regulated_activity']) {
      expect(abroad, key).not.toContain(key);
    }
  });

  it('requires at least one kind of support', () => {
    expect(validateAnswer('support_needed', []).success).toBe(false);
    expect(validateAnswer('support_needed', ['formation']).success).toBe(true);
    expect([...SUPPORT_OPTIONS]).toContain('visa_residency');
    expect([...SUPPORT_OPTIONS]).toContain('banking');
  });

  it('maps every formation type onto a stored objective', () => {
    expect([...FORMATION_TYPES]).toEqual(['new_company', 'branch_or_subsidiary', 'not_sure']);
    expect(objectiveForFormationType('new_company')).toBe('new');
    expect(objectiveForFormationType('branch_or_subsidiary')).toBe('expand');
    expect(objectiveForFormationType('not_sure')).toBe('unsure');
  });

  it('never lets an international case skip manual review', () => {
    expect(hardManualReviewReasons({ business_location: 'outside' })).toContain(
      'international_formation',
    );
    expect(hardManualReviewReasons({ business_location: 'bangladesh' })).not.toContain(
      'international_formation',
    );
    expect(hardManualReviewReasons({ formation_type: 'not_sure' })).toContain('scope_unclear');
  });

  it('both branches end with the same contact stage and never ask for a document', () => {
    const bd = applicableQuestions({ business_location: 'bangladesh', objective: 'new' }).map(
      (q) => q.key,
    );
    const abroad = applicableQuestions({
      business_location: 'outside',
      target_country: 'qatar',
    }).map((q) => q.key);
    for (const keys of [bd, abroad]) {
      expect(keys.slice(-4)).toEqual(['full_name', 'email', 'phone', 'consent']);
    }
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
