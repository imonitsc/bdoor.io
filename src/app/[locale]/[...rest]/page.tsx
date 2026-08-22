import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

/**
 * Catch-all for unmatched paths inside a locale.
 *
 * Without this, an unknown URL under `/en` falls through to Next's built-in
 * 404 page, which is unstyled, English-only and outside the locale layout.
 * Calling notFound() here renders `[locale]/not-found.tsx` instead, so a
 * mistyped Bangla URL gets a Bangla 404.
 */
export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
