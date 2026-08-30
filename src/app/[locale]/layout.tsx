import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Geist_Mono, Hind_Siliguri, Manrope } from 'next/font/google';
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

// Hind Siliguri for Bangla content (owner request, 30 Aug 2026) — the same
// family the banglawebfonts CDN serves, but self-hosted through next/font so
// Bangla pages make no third-party request and get no late-font layout shift.
const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  variable: '--font-hind-siliguri',
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
      // No explicit image: src/app/opengraph-image.png is a file-convention
      // asset, so Next emits og:image, its dimensions and the absolute URL
      // itself. Naming a path by hand pinned the old generated route
      // (/opengraph-image), which stopped existing when the generated image was
      // replaced by the supplied brand asset — a hardcoded URL cannot follow the
      // content hash Next appends.
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('name')} — ${t('tagline')}`,
      description: home('support'),
      // As above: the file convention supplies the Twitter image too.
    },
    // No `icons` block. Naming any icon by hand replaces the whole set, which
    // silently dropped the apple-touch-icon. src/app/{icon.svg,favicon.ico,
    // apple-icon.png} are file-convention assets and Next emits all three with
    // the content hashes that let them be cached hard.
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
      className={`${manrope.variable} ${geistMono.variable} ${hindSiliguri.variable}`}
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
