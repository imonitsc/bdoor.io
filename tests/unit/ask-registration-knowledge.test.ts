import { describe, expect, it } from 'vitest';

import { BD_REGISTRATION_KNOWLEDGE } from '@/content/bd/registration-knowledge';
import { seedSources } from '@/features/ai/knowledge-seed';
import { buildSystemPrompt, PROMPT_VERSION } from '@/features/ai/system-prompt';

/**
 * The Bangladesh registration knowledge: what the corpus must contain for
 * "How do I register a company in Bangladesh?" to be answerable with official
 * citations, and the discipline every entry must keep.
 */

const CURRENCY_FIGURE = /(?:BDT|USD|Tk\.?|[$£৳])\s?[\d,]/;
const FORBIDDEN_COPY = /guaranteed|instant approval|official partner|government authori[sz]ed/i;

describe('the Bangladesh registration knowledge entries', () => {
  it('cover every element the registration answer must provide', () => {
    const corpus = BD_REGISTRATION_KNOWLEDGE.map((entry) => entry.body.en).join('\n');
    for (const required of [
      /private limited company/i, // suitable entity type
      /one person company/i,
      /name clearance/i,
      /registered office/i, // shareholder/director/office information
      /shareholder/i,
      /director/i,
      /Memorandum of Association/,
      /Articles of Association/,
      /Form IX/,
      /Form XII/,
      /Certificate of Incorporation/, // certificate + sequence
      /fee schedule/i, // dated fee explanation, no figures
      /trade licence/i,
      /e-TIN/i,
      /BIN/, // VAT/BIN
      /bank account/i,
      /encashment certificate/i, // foreign share capital route
    ]) {
      expect(corpus).toMatch(required);
    }
  });

  it('give every government reference an authority tier, institution and official URL', () => {
    for (const entry of BD_REGISTRATION_KNOWLEDGE) {
      if (entry.sourceType !== 'government_reference') continue;
      expect(entry.authorityTier, entry.slug).toBeGreaterThanOrEqual(1);
      expect(entry.authorityTier, entry.slug).toBeLessThanOrEqual(6);
      expect(entry.issuingInstitution, entry.slug).toBeTruthy();
      // Official domains: *.gov.bd, plus Bangladesh Bank's bb.org.bd.
      expect(entry.sourceUrl, entry.slug).toMatch(/^https?:\/\/[^/]*(gov\.bd|bb\.org\.bd)/);
    }
  });

  it('never state a currency figure — fees point at the official schedule instead', () => {
    for (const entry of BD_REGISTRATION_KNOWLEDGE) {
      expect(entry.body.en, entry.slug).not.toMatch(CURRENCY_FIGURE);
      expect(entry.body.bn, entry.slug).not.toMatch(CURRENCY_FIGURE);
    }
  });

  it('keep the copy rules: no guarantees, no claimed affiliation', () => {
    for (const entry of BD_REGISTRATION_KNOWLEDGE) {
      expect(entry.body.en, entry.slug).not.toMatch(FORBIDDEN_COPY);
      expect(entry.title.en, entry.slug).not.toMatch(FORBIDDEN_COPY);
    }
  });

  it('ship both languages for every entry, as separate non-empty bodies', () => {
    for (const entry of BD_REGISTRATION_KNOWLEDGE) {
      expect(entry.body.en.length, entry.slug).toBeGreaterThan(200);
      expect(entry.body.bn.length, entry.slug).toBeGreaterThan(200);
      expect(entry.body.en, entry.slug).not.toBe(entry.body.bn);
    }
  });

  it('flow into the import seed with authority metadata and unique slugs', () => {
    const sources = seedSources();
    const slugs = sources.map((source) => source.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const guide = sources.find((source) => source.slug === 'bd-company-registration-guide-en');
    expect(guide).toBeDefined();
    expect(guide?.country).toBe('bd');

    const rjsc = sources.find((source) => source.slug === 'bd-rjsc-incorporation-en');
    expect(rjsc?.sourceType).toBe('government_reference');
    expect(rjsc?.authorityTier).toBe(3);
    expect(rjsc?.issuingInstitution).toContain('RJSC');

    // Both locales for every bd entry.
    for (const entry of BD_REGISTRATION_KNOWLEDGE) {
      expect(slugs).toContain(`${entry.slug}-en`);
      expect(slugs).toContain(`${entry.slug}-bn`);
    }
  });
});

describe('the answer contract for regulatory questions', () => {
  it('orders the official process before bdoor pricing and forbids false unavailability', () => {
    const prompt = buildSystemPrompt({ locale: 'en', country: 'bd', context: 'x', structured: '' });
    expect(prompt).toContain('explain the official process first');
    expect(prompt).toContain("bdoor's own commercial offer");
    expect(prompt).toContain('Never say the information is unavailable');
    expect(PROMPT_VERSION).toBe('2026-08-31.2');
  });
});
