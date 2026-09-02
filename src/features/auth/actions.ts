'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { hashIdentifier } from '@/lib/utils/hash';
import { RateLimitError } from '@/lib/permissions/errors';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { claimDraftForUser } from '@/features/intake/session';
import { POLICY_VERSIONS, recordPolicyConsent } from '@/features/legal/consent';
import { absoluteUrl } from '@/lib/site';
import {
  magicLinkSchema,
  magicSignUpSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './schema';
import { authMode, modeAllows, type AuthAction } from './mode';

export type AuthState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
  /**
   * The address a confirmation was sent to, echoed back so the "check your
   * email" screen can name it. Only ever the address the caller just typed.
   */
  email?: string;
};

async function clientKey(email?: string): Promise<string> {
  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
  return hashIdentifier(email ? `${ip}:${email}` : ip);
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}

/**
 * Refuse an action the configured mode does not accept.
 *
 * A Server Action is a callable endpoint, so removing the password form from
 * the page does not remove `signIn` from the deployment. Every action starts
 * here — the mode is enforced on the server and the UI only decides what to
 * draw (CLAUDE.md security rule 1).
 */
function wrongMode(action: AuthAction): AuthState | null {
  if (modeAllows(authMode(), action)) return null;
  logger.warn('auth.action_wrong_mode', { action });
  return { status: 'error', message: 'generic' };
}

/**
 * Sign in.
 *
 * The error message is deliberately identical for "no such account" and "wrong
 * password" so the form cannot be used to enumerate registered addresses.
 */
export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const refused = wrongMode('signIn');
  if (refused) return refused;

  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  try {
    await enforceRateLimit('auth.sign_in', await clientKey(parsed.data.email));
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    if (error?.code === 'email_not_confirmed') {
      return { status: 'error', message: 'emailNotConfirmed' };
    }
    return { status: 'error', message: 'invalidCredentials' };
  }

  await resetRateLimit('auth.sign_in', await clientKey(parsed.data.email));
  await claimDraftForUser(data.user.id);
  await recordAudit({ action: 'auth.sign_in', targetType: 'user', targetId: data.user.id });

  const next = String(formData.get('next') ?? '');
  const locale = await getLocale();
  redirect(safeNextPath(next, `/${locale}/app`));
}

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const refused = wrongMode('signUp');
  if (refused) return refused;

  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    acceptTerms: formData.get('acceptTerms') === 'on',
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  try {
    await enforceRateLimit('auth.sign_up', await clientKey());
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const locale = await getLocale();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: absoluteUrl(`/api/auth/confirm?next=/${locale}/app/onboarding`),
      // Stored on the auth user for convenience only. It is NEVER read for an
      // authorization decision — roles live in platform_roles and
      // organization_memberships.
      data: { full_name: parsed.data.fullName, preferred_locale: locale },
    },
  });

  if (error) {
    if (error.code === 'weak_password') return { status: 'error', message: 'weakPassword' };
    if (error.code === 'over_email_send_rate_limit') {
      return { status: 'error', message: 'rateLimited' };
    }
    logger.warn('auth.sign_up_failed', { code: error.code });
    // Do not distinguish "already registered": that leaks who has an account.
    // The same screen and the same address come back either way.
    return { status: 'success', message: 'checkEmail', email: parsed.data.email };
  }

  if (data.user) {
    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        preferred_locale: locale === 'bn' ? 'bn' : 'en',
      },
      { onConflict: 'id' },
    );
    await claimDraftForUser(data.user.id);
    // The checkbox covered both documents; record each with the exact version
    // that was live on the page the user accepted.
    const consentLocale = locale === 'bn' ? ('bn' as const) : ('en' as const);
    await recordPolicyConsent({
      consentType: 'terms_of_service',
      policyVersion: POLICY_VERSIONS.terms,
      method: 'signup_checkbox',
      userId: data.user.id,
      locale: consentLocale,
    });
    await recordPolicyConsent({
      consentType: 'privacy_policy',
      policyVersion: POLICY_VERSIONS.privacy,
      method: 'signup_checkbox',
      userId: data.user.id,
      locale: consentLocale,
    });
  }

  return { status: 'success', message: 'checkEmail', email: parsed.data.email };
}

/**
 * Magic-link sign-in.
 *
 * A one-time link instead of a password. Three things make it safe to offer
 * alongside the password form rather than in place of it:
 *
 *  - **It never creates an account.** `shouldCreateUser: false` is the whole
 *    reason this is not simply "sign in or sign up". Signup is the only path
 *    that records the terms and privacy consent versions the legal suite
 *    depends on; an account minted by clicking a link would exist with no
 *    consent record at all.
 *  - **It does not weaken MFA.** The link produces an aal1 session exactly as
 *    a password does, and `requireSession` derives the MFA requirement from
 *    the session's real assurance level, not from how it was created — so a
 *    staff or partner account still has to clear its second factor.
 *  - **It answers identically either way.** An unregistered address gets the
 *    same screen as a registered one, so this cannot be used to enumerate who
 *    has an account — the same rule the sign-in and reset flows already keep.
 */
export async function requestMagicLink(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const refused = wrongMode('requestMagicLink');
  if (refused) return refused;

  const parsed = magicLinkSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  try {
    await enforceRateLimit('auth.magic_link', await clientKey(parsed.data.email));
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const locale = await getLocale();
  const next = safeNextPath(String(formData.get('next') ?? ''), `/${locale}/app`);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: absoluteUrl(`/api/auth/confirm?next=${encodeURIComponent(next)}`),
    },
  });

  if (error) {
    // Logged without the address, and never surfaced: "no such user" and
    // "provider refused" must look the same to the caller.
    logger.warn('auth.magic_link_failed', { code: error.code ?? null });
  }

  return { status: 'success', message: 'magicLinkSent', email: parsed.data.email };
}

/**
 * Passwordless signup.
 *
 * The one path in the product that may create an account, and the reason the
 * sign-in link sets `shouldCreateUser: false`. The terms checkbox is required
 * by the schema, so an account can only ever begin from a form that asked for
 * consent.
 *
 * Consent is recorded when the link is opened, not here, and this is the part
 * worth understanding: `consent_records` is append-only and keyed on a user
 * id, and with a one-time link no user exists yet. So the accepted-terms fact
 * travels in `options.data`, which Supabase applies only when it creates the
 * user, and `/api/auth/confirm` writes the two rows once the account exists.
 * The policy VERSIONS are never taken from that metadata — the server reads
 * them from POLICY_VERSIONS at the moment it writes, so a forged metadata
 * value cannot invent a version that was never shown.
 */
export async function requestSignUpLink(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const refused = wrongMode('requestSignUpLink');
  if (refused) return refused;

  const parsed = magicSignUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    acceptTerms: formData.get('acceptTerms') === 'on',
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  try {
    await enforceRateLimit('auth.sign_up', await clientKey());
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const locale = await getLocale();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: absoluteUrl(`/api/auth/confirm?next=/${locale}/app/onboarding`),
      // Applied by Supabase only when it creates the user. Never read for an
      // authorization decision — roles live in platform_roles and
      // organization_memberships (CLAUDE.md security rule 2).
      data: {
        full_name: parsed.data.fullName,
        preferred_locale: locale,
        signup_consent: true,
      },
    },
  });

  if (error) {
    if (error.code === 'over_email_send_rate_limit') {
      return { status: 'error', message: 'rateLimited' };
    }
    logger.warn('auth.sign_up_link_failed', { code: error.code ?? null });
  }

  // Registered already or not, the same screen comes back: this must not
  // become a way to find out who has an account.
  return { status: 'success', message: 'checkEmail', email: parsed.data.email };
}

export async function requestPasswordReset(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const refused = wrongMode('requestPasswordReset');
  if (refused) return refused;

  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  try {
    await enforceRateLimit('auth.password_reset', await clientKey(parsed.data.email));
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: absoluteUrl(`/api/auth/confirm?next=/${locale}/reset-password`),
  });

  // Always the same answer, whether or not an account exists.
  return { status: 'success', message: 'resetSent' };
}

export async function updatePassword(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const refused = wrongMode('updatePassword');
  if (refused) return refused;

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { status: 'error', message: 'generic' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === 'weak_password') return { status: 'error', message: 'weakPassword' };
    return { status: 'error', message: 'generic' };
  }

  await supabase
    .from('user_security_settings')
    .upsert(
      { user_id: claims.claims.sub as string, last_password_change: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

  await recordAudit({
    action: 'auth.password_changed',
    targetType: 'user',
    targetId: claims.claims.sub as string,
  });

  const locale = await getLocale();
  redirect(`/${locale}/app/security?updated=password`);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  await recordAudit({
    action: 'auth.sign_out',
    targetType: 'user',
    targetId: (claims?.claims?.sub as string | undefined) ?? null,
  });

  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect(`/${locale}`);
}

/** Ends every other session. Used from the Security page. */
export async function signOutOtherSessions(): Promise<AuthState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { status: 'error', message: 'generic' };

  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'auth.sessions_revoked',
    targetType: 'user',
    targetId: claims.claims.sub as string,
    metadata: { scope: 'others' },
  });

  return { status: 'success', message: 'sessionsRevoked' };
}
