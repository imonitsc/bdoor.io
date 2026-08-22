import type { Locale } from '@/i18n/routing';

export const SITE = {
  name: 'BDoor',
  domain: 'bdoor.io',
  /**
   * The single legally-required disclosure. Rendered in the footer, on quotes,
   * at checkout and on every partner/legal surface. Change it in one place.
   */
  disclosureKey: 'brand.disclosure',
  contactEmail: 'hello@bdoor.io',
} as const;

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export function localizedUrl(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return absoluteUrl(`/${locale}${clean}`);
}

/** Routes that must never be indexed. */
export const PRIVATE_PATH_PREFIXES = ['/app', '/partner', '/admin', '/auth'] as const;
