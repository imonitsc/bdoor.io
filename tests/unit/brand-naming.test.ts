import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMPANY } from '@/content/company';

/**
 * The public brand is lowercase `bdoor`; the contracting entity is
 * `bdoor compliance ltd`. The site used to mix `BDoor` into titles, legal
 * text and metadata while the logo said `bdoor`, so this pins every content
 * source that reaches a customer. Code identifiers (component names, type
 * names) are not customer-visible and are not covered.
 */
const CONTENT_SOURCES = [
  'src/i18n/messages/en.json',
  'src/i18n/messages/bn.json',
  'src/content/legal/documents.ts',
  'src/content/catalog-snapshot.ts',
  'src/content/rules-snapshot.ts',
  'src/content/packages/catalog.ts',
  'src/features/intake/guide.ts',
  'src/lib/site.ts',
  'src/app/manifest.ts',
];

describe('brand naming', () => {
  it('company constants are the approved names', () => {
    expect(COMPANY.brand).toBe('bdoor');
    expect(COMPANY.legalName).toBe('bdoor compliance ltd');
  });

  for (const source of CONTENT_SOURCES) {
    it(`${source} never spells the brand "BDoor"`, () => {
      const text = readFileSync(source, 'utf8');
      const offending = text
        .split('\n')
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => line.includes('BDoor'));
      expect(
        offending.map(({ i, line }) => `${i + 1}: ${line.trim()}`),
        'title-case brand in a customer-visible content source',
      ).toEqual([]);
    });
  }

  it('the terms name the contracting entity', () => {
    const text = readFileSync('src/content/legal/documents.ts', 'utf8');
    expect(text).toContain('bdoor compliance ltd');
  });
});
