import { describe, expect, it } from 'vitest';
import en from '@/i18n/messages/en.json';
import bn from '@/i18n/messages/bn.json';

type Messages = Record<string, unknown>;

function flatten(source: Messages, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of flatten(value as Messages, path)) out.set(k, v);
    } else {
      out.set(path, String(value));
    }
  }
  return out;
}

const english = flatten(en as Messages);
const bangla = flatten(bn as Messages);

describe('translation catalogues', () => {
  it('has no key present in one language and missing in the other', () => {
    const missingInBangla = [...english.keys()].filter((key) => !bangla.has(key));
    const extraInBangla = [...bangla.keys()].filter((key) => !english.has(key));

    expect(missingInBangla).toEqual([]);
    expect(extraInBangla).toEqual([]);
  });

  it('uses the same interpolation placeholders in both languages', () => {
    // ICU argument names only: `{name}` and `{name, plural, ...}`. The literal
    // text inside a plural branch is not a placeholder.
    const placeholders = (value: string) =>
      [...value.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((m) => m[1]!).sort();

    for (const [key, value] of english) {
      expect(placeholders(bangla.get(key)!), `placeholders differ for ${key}`).toEqual(
        placeholders(value),
      );
    }
  });

  it('has no empty strings', () => {
    for (const [key, value] of english) expect(value.trim(), `${key} is empty`).not.toBe('');
    for (const [key, value] of bangla) expect(value.trim(), `${key} is empty`).not.toBe('');
  });

  it('actually translates the Bangla catalogue rather than copying English', () => {
    // Brand names, emails and shared identifiers are legitimately identical, so
    // this checks the proportion rather than demanding every string differ.
    const comparable = [...english].filter(
      ([key, value]) =>
        !key.startsWith('brand.name') &&
        !key.startsWith('footer.email') &&
        value.length > 12 &&
        /[a-z]{4}/i.test(value),
    );
    const identical = comparable.filter(([key, value]) => bangla.get(key) === value);

    expect(identical.length / comparable.length).toBeLessThan(0.05);
  });

  it('never promises approval anywhere in the customer-facing copy', () => {
    const forbidden = [
      /\bguaranteed approval\b/i,
      /\bwe guarantee\b/i,
      /\binstant approval\b/i,
      /\bgovernment authorized\b/i,
      /\bgovernment authorised\b/i,
    ];

    for (const [key, value] of english) {
      for (const pattern of forbidden) {
        expect(pattern.test(value), `${key} contains a forbidden claim: ${value}`).toBe(false);
      }
    }
  });
});
