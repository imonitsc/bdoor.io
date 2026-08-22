import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale, localeTags } from './routing';

export default getRequestConfig(async ({ locale: explicitLocale, requestLocale }) => {
  // Only fall back to `requestLocale` when no explicit locale was given.
  // Awaiting it unconditionally reads request headers, which opts every page
  // that calls `getTranslations({ locale })` from `generateMetadata` into
  // dynamic rendering — including the whole marketing site.
  const requested = explicitLocale ?? (await requestLocale);
  const locale = isLocale(requested) ? requested : defaultLocale;

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'Asia/Dhaka',
    formats: {
      dateTime: {
        short: { day: 'numeric', month: 'short', year: 'numeric' },
        long: { day: 'numeric', month: 'long', year: 'numeric' },
        withTime: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
      },
      number: {
        bdt: { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 },
        usd: { style: 'currency', currency: 'USD', maximumFractionDigits: 2 },
      },
    },
    // `localeTags` gives Intl the region so Bangla numerals/dates format for BD.
    onError(error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n:${localeTags[locale]}]`, error.message);
      }
    },
  };
});
