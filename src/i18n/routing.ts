import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'bn'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, { native: string; english: string; dir: 'ltr' }> = {
  en: { native: 'English', english: 'English', dir: 'ltr' },
  bn: { native: 'বাংলা', english: 'Bangla', dir: 'ltr' },
};

/** BCP-47 tags used for `hreflang`, `Intl` formatting and the `<html lang>` attribute. */
export const localeTags: Record<Locale, string> = {
  en: 'en',
  bn: 'bn-BD',
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
  localeCookie: {
    name: 'BDOOR_LOCALE',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  },
});

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
