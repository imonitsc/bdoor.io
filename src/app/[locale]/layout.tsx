import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Geist_Mono, Manrope, Noto_Sans_Bengali } from 'next/font/google';
import { routing, localeTags, type Locale } from '@/i18n/routing';
import { AnnouncerProvider } from '@/components/ui/announcer';
import { siteUrl, localizedUrl } from '@/lib/site';
import '@/styles/globals.css';

// Manrope for Latin content, per the redesign brief §5.3. The weights are the
// ones the brief names: 700 display, 600 headings and controls, 400/500 body.
// next/font self-hosts and subsets it, so there is no request to Google at
// runtime and no layout shift from a late webfont.
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans-brand',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-noto-bengali',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#0A1020',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: 'brand' });
  const home = await getTranslations({ locale, namespace: 'home.hero' });

  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${t('name')} — ${t('tagline')}`,
      template: `%s · ${t('name')}`,
    },
    description: home('support'),
    applicationName: t('name'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/'),
      languages: {
        en: localizedUrl('en', '/'),
        'bn-BD': localizedUrl('bn', '/'),
        'x-default': localizedUrl('en', '/'),
      },
    },
    openGraph: {
      type: 'website',
      siteName: t('name'),
      title: `${t('name')} — ${t('tagline')}`,
      description: home('support'),
      url: localizedUrl(locale as Locale, '/'),
      locale: localeTags[locale as Locale],
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: t('name') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('name')} — ${t('tagline')}`,
      description: home('support'),
      images: ['/opengraph-image'],
    },
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/apple-icon' }],
    },
    manifest: '/manifest.webmanifest',
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={localeTags[locale as Locale]}
      dir="ltr"
      className={`${manrope.variable} ${geistMono.variable} ${notoBengali.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-canvas text-ink min-h-dvh antialiased">
        <NextIntlClientProvider messages={messages}>
          <AnnouncerProvider>{children}</AnnouncerProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
