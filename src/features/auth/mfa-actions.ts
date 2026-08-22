'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { hashIdentifier } from '@/lib/utils/hash';
import { RateLimitError } from '@/lib/permissions/errors';
import { recordAudit } from '@/lib/audit';
import { mfaCodeSchema } from './schema';

export type MfaEnrollment = {
  factorId: string;
  qrCodeSvg: string;
  secret: string;
};

export type MfaState = {
  status: 'idle' | 'enrolling' | 'error' | 'success';
  enrollment?: MfaEnrollment;
  message?: string;
};

async function key(): Promise<string> {
  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
  return hashIdentifier(ip);
}

/**
 * Starts TOTP enrolment.
 *
 * The QR code and secret are returned to the browser for display only; they are
 * never stored by us. Supabase holds the factor in an unverified state until
 * `verifyMfaEnrollment` succeeds.
 */
export async function startMfaEnrollment(): Promise<MfaState> {
  const supabase = await createClient();

  // Clean up any half-finished attempt so a user is not stuck behind an
  // unverified factor from a previous try.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const factor of existing?.all ?? []) {
    if (factor.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `BDoor ${new Date().toISOString().slice(0, 10)}`,
  });

  if (error || !data) {
    return { status: 'error', message: 'generic' };
  }

  return {
    status: 'enrolling',
    enrollment: {
      factorId: data.id,
      qrCodeSvg: data.totp.qr_code,
      secret: data.totp.secret,
    },
  };
}

export async function verifyMfaEnrollment(
  previous: MfaState,
  formData: FormData,
): Promise<MfaState> {
  const factorId = String(formData.get('factorId') ?? '');
  const parsed = mfaCodeSchema.safeParse({ code: formData.get('code') });

  if (!factorId || !parsed.success) {
    return { ...previous, status: 'error', message: 'invalidCode' };
  }

  try {
    await enforceRateLimit('auth.mfa_verify', await key());
  } catch (error) {
    if (error instanceof RateLimitError)
      return { ...previous, status: 'error', message: 'rateLimited' };
    throw error;
  }

  const supabase = await createClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError || !challenge) {
    return { ...previous, status: 'error', message: 'generic' };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });

  if (error) {
    return { ...previous, status: 'error', message: 'invalidCode' };
  }

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;

  if (userId) {
    await supabase
      .from('user_security_settings')
      .upsert(
        { user_id: userId, mfa_enrolled_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    await recordAudit({ action: 'auth.mfa_enrolled', targetType: 'user', targetId: userId });
  }

  return { status: 'success', message: 'mfaEnabled' };
}

/** Second-factor challenge at sign-in time. */
export async function challengeMfa(_previous: MfaState, formData: FormData): Promise<MfaState> {
  const parsed = mfaCodeSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) return { status: 'error', message: 'invalidCode' };

  try {
    await enforceRateLimit('auth.mfa_verify', await key());
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.find((f) => f.status === 'verified');
  if (!factor) return { status: 'error', message: 'generic' };

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  if (challengeError || !challenge) return { status: 'error', message: 'generic' };

  const { error } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code: parsed.data.code,
  });

  if (error) return { status: 'error', message: 'invalidCode' };
  return { status: 'success', message: 'mfaVerified' };
}

export async function removeMfaFactor(_previous: MfaState, formData: FormData): Promise<MfaState> {
  const factorId = String(formData.get('factorId') ?? '');
  if (!factorId) return { status: 'error', message: 'generic' };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;

  // A role that requires MFA cannot remove its only factor.
  if (userId) {
    const { data: roles } = await supabase
      .from('platform_roles')
      .select('role')
      .eq('user_id', userId);
    if ((roles ?? []).length > 0) {
      return { status: 'error', message: 'mfaRequiredForRole' };
    }
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { status: 'error', message: 'generic' };

  if (userId) {
    await supabase
      .from('user_security_settings')
      .upsert({ user_id: userId, mfa_enrolled_at: null }, { onConflict: 'user_id' });
    await recordAudit({ action: 'auth.mfa_removed', targetType: 'user', targetId: userId });
  }

  return { status: 'success', message: 'mfaRemoved' };
}
