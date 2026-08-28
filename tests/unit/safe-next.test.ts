import { describe, expect, it } from 'vitest';
import { safeNextPath } from '@/lib/auth/safe-next';

const FALLBACK = '/en/app';

describe('safeNextPath', () => {
  it('keeps a site-relative path', () => {
    expect(safeNextPath('/en/admin', FALLBACK)).toBe('/en/admin');
    expect(safeNextPath('/bn/app/cases?open=1', FALLBACK)).toBe('/bn/app/cases?open=1');
  });

  it('falls back when there is nothing to use', () => {
    for (const value of [null, undefined, '']) {
      expect(safeNextPath(value, FALLBACK)).toBe(FALLBACK);
    }
  });

  it('refuses an absolute URL', () => {
    for (const value of [
      'https://evil.example',
      'http://evil.example',
      'javascript:alert(1)',
      'data:text/html,x',
      'evil.example',
    ]) {
      expect(safeNextPath(value, FALLBACK), value).toBe(FALLBACK);
    }
  });

  it('refuses a protocol-relative URL', () => {
    // "//evil.example" inherits the current scheme and goes to another host,
    // while still starting with a slash.
    expect(safeNextPath('//evil.example', FALLBACK)).toBe(FALLBACK);
    expect(safeNextPath('///evil.example', FALLBACK)).toBe(FALLBACK);
  });

  it('refuses a backslash anywhere', () => {
    // Browsers have historically normalised backslash to forward slash, so
    // these navigate off-site while passing a naive startsWith('/') check.
    for (const value of ['/\\evil.example', '/\\/evil.example', '/en/app\\..\\..']) {
      expect(safeNextPath(value, FALLBACK), value).toBe(FALLBACK);
    }
  });

  it('never returns anything that is not a path on this site', () => {
    const hostile = [
      '//evil.example',
      '/\\evil.example',
      'https://evil.example',
      '\\\\evil.example',
      ' /en/app',
      '',
    ];
    for (const value of hostile) {
      const result = safeNextPath(value, FALLBACK);
      expect(result.startsWith('/'), value).toBe(true);
      expect(result.startsWith('//'), value).toBe(false);
      expect(result.includes('\\'), value).toBe(false);
    }
  });
});
