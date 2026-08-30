import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  APPLICATION_JURISDICTIONS,
  APPLICATION_STEPS,
  FIRM_CATEGORIES,
  PROVIDER_APPLICATION_TRANSITIONS,
  STEP_SCHEMAS,
  canTransitionApplication,
  commaToList,
  linesToList,
  newProviderApplicationReference,
  type ProviderApplicationStatus,
} from '@/features/partners/application';

/**
 * Provider application model. The important property is that the TypeScript
 * transition map and the database trigger cannot drift: this suite parses the
 * migration's condition block and compares pair-for-pair, the same guard the
 * case state machine has.
 */

describe('transition map mirrors the database trigger', () => {
  it('declares exactly the pairs the migration allows', () => {
    const sql = readFileSync('supabase/migrations/20260101002300_provider_network.sql', 'utf8');
    const block = /if not \(([\s\S]*?)\) then\s*raise exception 'invalid provider application/.exec(
      sql,
    );
    expect(block).not.toBeNull();

    const fromSql = new Set<string>();
    const pair = /old\.status = '(\w+)'\s*and new\.status in \(([^)]+)\)/g;
    for (const match of block![1]!.matchAll(pair)) {
      for (const target of match[2]!.matchAll(/'(\w+)'/g)) {
        fromSql.add(`${match[1]}->${target[1]}`);
      }
    }

    const fromTs = new Set<string>();
    for (const [from, targets] of Object.entries(PROVIDER_APPLICATION_TRANSITIONS)) {
      for (const to of targets) fromTs.add(`${from}->${to}`);
    }

    expect([...fromTs].sort()).toEqual([...fromSql].sort());
    expect(fromSql.size).toBeGreaterThan(10);
  });

  it('spot-checks the journeys that matter', () => {
    expect(canTransitionApplication('draft', 'submitted')).toBe(true);
    expect(canTransitionApplication('submitted', 'under_review')).toBe(true);
    expect(canTransitionApplication('needs_information', 'submitted')).toBe(true);
    expect(canTransitionApplication('verification_in_progress', 'approved')).toBe(true);
    // No review shortcut, no resurrection, no self-service approval.
    expect(canTransitionApplication('submitted', 'approved')).toBe(false);
    expect(canTransitionApplication('draft', 'approved')).toBe(false);
    expect(canTransitionApplication('rejected', 'approved')).toBe(false);
    expect(canTransitionApplication('withdrawn', 'submitted')).toBe(false);
  });

  it('covers every status exactly once as a key', () => {
    const statuses: ProviderApplicationStatus[] = [
      'draft',
      'submitted',
      'under_review',
      'needs_information',
      'verification_in_progress',
      'approved',
      'rejected',
      'withdrawn',
      'suspended',
      'offboarded',
    ];
    expect(Object.keys(PROVIDER_APPLICATION_TRANSITIONS).sort()).toEqual([...statuses].sort());
  });
});

describe('application reference', () => {
  it('is PP-<year>-<6 digits> and random rather than sequential', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const reference = newProviderApplicationReference(new Date('2026-08-30T00:00:00Z'));
      expect(reference).toMatch(/^PP-2026-\d{6}$/);
      seen.add(reference);
    }
    expect(seen.size).toBeGreaterThan(40);
  });
});

describe('step schemas', () => {
  const validFirm = {
    legal_name: 'Meghna Legal (sample)',
    firm_category: 'law_firm',
    registered_address: '12 Sample Road, Dhaka',
    contact_name: 'A Rahman (sample)',
    contact_email: 'Meghna@Example.test',
    signatory_name: 'A Rahman (sample)',
  };

  it('requires the firm identity core and lowercases the email', () => {
    const parsed = STEP_SCHEMAS.firm.safeParse(validFirm);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.contact_email).toBe('meghna@example.test');

    const missing = STEP_SCHEMAS.firm.safeParse({ ...validFirm, legal_name: '' });
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.issues[0]!.message).toBe('requiredText');
  });

  it('treats declarations as literal true, never a coerced string', () => {
    const ok = STEP_SCHEMAS.ownership.safeParse({
      owners_text: 'A Rahman — partner — 60%',
      sanctions_declaration: true,
      integrity_declaration: true,
    });
    expect(ok.success).toBe(true);

    for (const dishonest of [false, 'true', 1, undefined]) {
      const bad = STEP_SCHEMAS.ownership.safeParse({
        owners_text: 'A Rahman — partner — 60%',
        sanctions_declaration: dishonest,
        integrity_declaration: true,
      });
      expect(bad.success, String(dishonest)).toBe(false);
    }
  });

  it('requires at least one category and jurisdiction, all from the allow-lists', () => {
    const ok = STEP_SCHEMAS.services.safeParse({
      requested_categories: ['law_firm'],
      jurisdictions: ['bangladesh'],
      services_note: 'Incorporation paperwork and legal drafting.',
    });
    expect(ok.success).toBe(true);

    expect(
      STEP_SCHEMAS.services.safeParse({
        requested_categories: [],
        jurisdictions: ['bangladesh'],
        services_note: 'x'.repeat(20),
      }).success,
    ).toBe(false);
    expect(
      STEP_SCHEMAS.services.safeParse({
        requested_categories: ['law_firm'],
        jurisdictions: ['mars'],
        services_note: 'x'.repeat(20),
      }).success,
    ).toBe(false);
  });

  it('keeps six steps ending in declarations', () => {
    expect(APPLICATION_STEPS).toEqual([
      'firm',
      'ownership',
      'standing',
      'services',
      'controls',
      'declarations',
    ]);
    expect(FIRM_CATEGORIES.length).toBe(16);
    expect(APPLICATION_JURISDICTIONS.length).toBe(7);
  });
});

describe('list parsing', () => {
  it('splits lines, trims, drops blanks and bounds the count', () => {
    expect(linesToList(' a \n\n b \n c ')).toEqual(['a', 'b', 'c']);
    expect(linesToList(Array.from({ length: 60 }, (_, i) => `o${i}`).join('\n'))).toHaveLength(40);
  });

  it('splits comma lists the same way', () => {
    expect(commaToList(' Bangla , English ,, ')).toEqual(['Bangla', 'English']);
    expect(commaToList(undefined)).toEqual([]);
  });
});
