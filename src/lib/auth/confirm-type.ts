import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * The verification types `/api/auth/confirm` will act on.
 *
 * `type` arrives in the query string, so it is checked against this list rather
 * than cast: handing an unverified string to `verifyOtp` would let the caller
 * choose which verification path runs. `magiclink` is here because a
 * passwordless sign-in link lands on the same callback, and `signup` because
 * Supabase sends the confirm-signup template — not the magic-link one — when
 * `signInWithOtp` creates the user. `phone_change` and the SMS types are not,
 * because bdoor sends no SMS.
 */
export const CONFIRM_TYPES = [
  'email',
  'signup',
  'magiclink',
  'recovery',
  'invite',
  'email_change',
] as const satisfies readonly EmailOtpType[];

export type ConfirmType = (typeof CONFIRM_TYPES)[number];

export function confirmType(value: string | null | undefined): ConfirmType | null {
  return (CONFIRM_TYPES as readonly string[]).includes(value ?? '') ? (value as ConfirmType) : null;
}
