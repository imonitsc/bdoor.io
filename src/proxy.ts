import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Next.js 16 replaces `middleware.ts` with `proxy.ts`.
 *
 * Order matters here. next-intl decides the locale and may issue a redirect or
 * rewrite; only once we have a concrete response do we refresh the Supabase
 * session and copy its cookies across. Doing it the other way round loses the
 * refreshed auth cookie on any request next-intl redirects.
 */
const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_SEGMENTS = ['/app', '/partner', '/admin'];

function isProtected(pathname: string): boolean {
  // Strip the locale prefix: /en/app/... -> /app/...
  const withoutLocale = pathname.replace(/^\/(en|bn)(?=\/|$)/, '') || '/';
  return PROTECTED_SEGMENTS.some(
    (segment) => withoutLocale === segment || withoutLocale.startsWith(`${segment}/`),
  );
}

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // A redirect from next-intl (locale negotiation) short-circuits: there is no
  // page to protect yet, and the redirect target will come back through here.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const { response: authResponse, userId } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  if (!userId && isProtected(pathname)) {
    const locale = pathname.match(/^\/(en|bn)(?=\/|$)/)?.[1] ?? routing.defaultLocale;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;

    const redirect = NextResponse.redirect(loginUrl);
    for (const cookie of authResponse.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  // Merge: keep next-intl's rewrite/headers, carry the refreshed auth cookies.
  for (const cookie of authResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie);
  }
  for (const [key, value] of authResponse.headers) {
    if (
      key.toLowerCase().startsWith('cache-control') ||
      key.toLowerCase() === 'expires' ||
      key.toLowerCase() === 'pragma'
    ) {
      intlResponse.headers.set(key, value);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    // Everything except static assets, image optimisation and file requests.
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|brand/|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
  ],
};
