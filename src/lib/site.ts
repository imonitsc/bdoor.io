import type { Locale } from '@/i18n/routing';

export const SITE = {
  name: 'bdoor',
  domain: 'bdoor.io',
  /**
   * The single legally-required disclosure. Rendered in the footer, on quotes,
   * at checkout and on every partner/legal surface. Change it in one place.
   */
  disclosureKey: 'brand.disclosure',
  contactEmail: 'hello@bdoor.io',
} as const;

/**
 * The origin Vercel injects for the deployment that is actually serving the
 * request: the stable production domain in production, the deployment's own
 * URL in a preview. Keeping those apart matters because `absoluteUrl()` builds
 * auth-confirmation, payment-return and invitation links — a preview that
 * handed out production links would bounce the user to the wrong deployment.
 */
function vercelOrigin(): string | undefined {
  const host =
    process.env.VERCEL_ENV === 'production'
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : process.env.VERCEL_URL;

  return host?.trim() ? `https://${host.trim()}` : undefined;
}

/**
 * Absolute origin, no trailing slash.
 *
 * Blank is treated as absent. An environment variable declared with an empty
 * value — which is what an empty field in the Vercel dashboard produces — is a
 * defined empty string, so it slips past `??` and reaches `new URL('')`. That
 * throws `ERR_INVALID_URL` inside `generateMetadata`, which fails prerendering
 * and takes the whole build down; it cost three red deploys before anyone
 * looked at the build log. Use `||` here, not `??`.
 */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    vercelOrigin() ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
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
