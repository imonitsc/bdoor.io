import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { absoluteUrl, localizedUrl, siteUrl } from '@/lib/site';

const KEYS = [
  'NEXT_PUBLIC_SITE_URL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
] as const;

/**
 * `siteUrl()` reads `process.env` on every call, so each case sets the exact
 * environment it means to describe and nothing else leaks between them.
 */
let saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of KEYS) {
    const value = saved[k];
    if (value === undefined) delete process.env[k];
    else process.env[k] = value;
  }
});

describe('siteUrl', () => {
  it('uses the configured origin and drops a trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://bdoor.io/';
    expect(siteUrl()).toBe('https://bdoor.io');
  });

  it('treats a declared-but-blank variable as absent', () => {
    // An empty field in the Vercel dashboard is a defined empty string. It used
    // to slip past `??` and reach `new URL('')`, which failed the build.
    process.env.NEXT_PUBLIC_SITE_URL = '';
    expect(siteUrl()).toBe('http://localhost:3000');

    process.env.NEXT_PUBLIC_SITE_URL = '   ';
    expect(siteUrl()).toBe('http://localhost:3000');
  });

  it('always returns something `new URL()` accepts', () => {
    for (const value of ['', '   ', 'https://bdoor.io', undefined]) {
      if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = value;

      expect(() => new URL(siteUrl())).not.toThrow();
    }
  });

  it('falls back to the stable production domain in production', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'bdoor.io';
    process.env.VERCEL_URL = 'bdoor-abc123-mik-partners.vercel.app';

    expect(siteUrl()).toBe('https://bdoor.io');
  });

  it('falls back to the deployment’s own URL in a preview', () => {
    // A preview must not hand out production auth or payment return links.
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'bdoor.io';
    process.env.VERCEL_URL = 'bdoor-abc123-mik-partners.vercel.app';

    expect(siteUrl()).toBe('https://bdoor-abc123-mik-partners.vercel.app');
  });

  it('prefers the configured origin over anything Vercel injects', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://bdoor.io';
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'bdoor-io.vercel.app';

    expect(siteUrl()).toBe('https://bdoor.io');
  });
});

describe('derived URLs', () => {
  it('builds absolute and localised URLs without a doubled slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://bdoor.io/';

    expect(absoluteUrl('/sitemap.xml')).toBe('https://bdoor.io/sitemap.xml');
    expect(absoluteUrl('sitemap.xml')).toBe('https://bdoor.io/sitemap.xml');
    expect(localizedUrl('en', '/')).toBe('https://bdoor.io/en');
    expect(localizedUrl('bn', '/pricing')).toBe('https://bdoor.io/bn/pricing');
  });
});
