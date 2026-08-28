import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/** True only when both public Supabase variables carry a real value. */
function supabaseIsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}

/**
 * Refreshes the Supabase session on every matched request and returns the
 * response whose cookies must be preserved.
 *
 * `getClaims()` verifies the JWT signature against the project's published
 * keys. `getSession()` does not, and must never be trusted on the server.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
}> {
  // Without credentials there is no session to refresh, so report the caller as
  // signed out rather than throwing. This runs on EVERY request, so the throw
  // it replaces took down the marketing pages too — which the README promises
  // work with no database — and it is what made the E2E suite time out waiting
  // for a server that could never answer.
  //
  // Failing open is not a risk here: `userId` is null, so `proxy.ts` redirects
  // every protected route to login, and RLS refuses an unauthenticated read
  // regardless. Nor can this mask a misconfigured production deployment —
  // `productionEnvProblems()` refuses the boot outright when these are missing,
  // unless STRICT_ENV=false says the environment is deliberately credential-free.
  if (!supabaseIsConfigured()) {
    return { response: NextResponse.next({ request }), userId: null };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
          // Cache headers supplied by the library stop a CDN caching a response
          // that carries someone's session.
          for (const [key, value] of Object.entries(headers)) {
            supabaseResponse.headers.set(key, value);
          }
        },
      },
    },
  );

  // Nothing may run between createServerClient and getClaims.
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;

  return { response: supabaseResponse, userId };
}
