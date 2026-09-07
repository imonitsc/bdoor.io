import { describe, expect, it } from 'vitest';

import { REGISTRY_SEED } from '@/features/ai/registry/registry-seed';
import { TOPICS } from '@/features/ai/registry/taxonomy';
import { authoritiesFor, genericQuery } from '@/features/ai/research/search-query';

/**
 * §6.7 step 1: "Search a generic legal question, never the customer's dossier."
 *
 * The interesting cases are not the well-formed ones. They are the questions a
 * real customer types — with their company, their address, their money and
 * their identity numbers in them — because those are what a leak would consist
 * of. `redactSensitive` catches none of the first three, which is why the
 * builder emits fixed vocabulary instead of cleaning the input.
 */

/** Dossier details a customer plausibly types, none matched by any redaction rule. */
const DOSSIER = [
  'Rahman Textiles Ltd',
  'Kamrul Hasan',
  '14 Gulshan Avenue',
  'Dhaka 1212',
  '4.2 crore',
  'BDT 8,50,000',
  'last March',
  'our German supplier',
  'Chattogram warehouse',
];

describe('genericQuery', () => {
  it('builds a query from a recognised question', () => {
    const query = genericQuery('How do I register a company in Bangladesh?');

    expect(query).not.toBeNull();
    expect(query?.topics).toContain('formation_structure');
    expect(query?.text).toContain('formation structure');
    expect(query?.text).toContain('Bangladesh');
  });

  it('returns null when no topic is recognised, rather than searching the raw words', () => {
    // With no topic there is nothing generic to search for. The only remaining
    // query would be the customer's own sentence, so the safe answer is none.
    expect(genericQuery('what do you think about my situation')).toBeNull();
  });

  it.each(DOSSIER)('never carries %s into the outgoing query', (detail) => {
    const query = genericQuery(
      `I run ${detail} and need to know about trade licence renewal and VAT registration`,
    );

    expect(query).not.toBeNull();
    expect(query?.text).not.toContain(detail);
  });

  it('carries no identifier a customer pastes in', () => {
    const query = genericQuery(
      'my NID is 1990123456789 and passport BX1234567, do I need a trade licence?',
    );

    expect(query?.text).not.toMatch(/1990123456789|BX1234567/);
  });

  it('emits only vocabulary, so an unseen word cannot originate in the question', () => {
    // The strongest form of the guarantee: every word of the output must also
    // appear in the output of a DIFFERENT question on the same topics. Text
    // that varied with the customer's phrasing would fail this.
    const a = genericQuery('how do I register a company?');
    const b = genericQuery(
      'Kamrul at Rahman Textiles wants to incorporate a company, budget 4.2 crore',
    );

    expect(a?.text).toBe(b?.text);
  });

  it('produces the same query every time, so traces stay comparable', () => {
    const first = genericQuery('trade licence renewal');
    const second = genericQuery('trade licence renewal');

    expect(first?.text).toBe(second?.text);
  });

  it('names the jurisdiction it was asked about', () => {
    // Typed as TargetCountry, not string: the jurisdiction is the one other
    // value that reaches the outgoing text, so a caller must not be able to
    // put arbitrary characters there. The seven operating countries are the
    // whole domain, and the compiler is what enforces it.
    const query = genericQuery('how do I incorporate a company', 'singapore');

    expect(query?.jurisdiction).toBe('singapore');
    expect(query?.text).toContain('singapore');
  });

  it('spells a multi-word jurisdiction readably', () => {
    expect(genericQuery('how do I incorporate a company', 'saudi_arabia')?.text).toContain(
      'saudi arabia',
    );
  });
});

describe('authoritiesFor', () => {
  it('orders by authority, most authoritative first', () => {
    const named = authoritiesFor(['formation_structure']);

    expect(named.length).toBeGreaterThan(0);
    // The reviewed registry name, unedited — parenthetical and all.
    expect(named[0]).toBe('Bangladesh Government Press (Bangladesh Gazette)');
  });

  it('caps the list so the query stays a query', () => {
    expect(authoritiesFor(['formation_structure', 'tax_vat', 'governance_rjsc'])).toHaveLength(3);
  });

  it('names no secondary source — one cannot support a claim anyway', () => {
    // §6.2: a secondary source never establishes a duty, rate, fee or deadline,
    // so steering the search at one would be searching for unusable evidence.
    // Asserting the count would not show this; asserting the tier does.
    const named = authoritiesFor([...TOPICS]);
    const tiers = named.map(
      (name) => REGISTRY_SEED.find((entry) => entry.institution === name)?.authorityTier,
    );

    expect(tiers.length).toBeGreaterThan(0);
    for (const tier of tiers) {
      expect(tier).toBeDefined();
      expect(tier).toBeLessThanOrEqual(5);
    }
  });

  it('returns nothing for no topics', () => {
    expect(authoritiesFor([])).toEqual([]);
  });
});
