import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { safeNextPath } from '@/lib/auth/safe-next';
import { confirmType } from '@/lib/auth/confirm-type';

/**
 * Email confirmation, magic-link and password-recovery callback.
 *
 * Supabase sends the user here with a one-time token hash. We exchange it for a
 * session and then redirect to an internal path only — `next` is validated by
 * `safeNextPath` so this endpoint can never be used as an open redirect.
 *
 * `type` is validated by `confirmType` rather than cast: it arrives from the
 * query string, and handing an unverified string to `verifyOtp` would let the
 * caller choose which verification path runs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = confirmType(searchParams.get('type'));
  const next = safeNextPath(searchParams.get('next'), '/en/app');

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/en/login?error=invalid_link', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    logger.warn('auth.confirm_failed', { code: error.code, type });
    return NextResponse.redirect(new URL('/en/login?error=expired_link', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
