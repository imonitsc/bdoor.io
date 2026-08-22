import type { MetadataRoute } from 'next';
import { absoluteUrl, PRIVATE_PATH_PREFIXES } from '@/lib/site';
import { locales } from '@/i18n/routing';

export default function robots(): MetadataRoute.Robots {
  // Block the private areas under every locale prefix and unprefixed.
  const disallow = [
    ...PRIVATE_PATH_PREFIXES.map((prefix) => `${prefix}/`),
    ...locales.flatMap((locale) => PRIVATE_PATH_PREFIXES.map((prefix) => `/${locale}${prefix}/`)),
    '/api/',
  ];

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
