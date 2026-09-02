import { serverEnv } from '@/lib/env';

/**
 * Which credentials the product accepts.
 *
 * `password` is the shipped default: a password form with magic link offered
 * beside it. `passwordless` drops passwords from sign-in and signup entirely,
 * and both run on one-time email links.
 *
 * The switch is an environment variable rather than a code path chosen at
 * build time, so turning passwordless off again is a configuration change and
 * not a deploy — which matters because passwordless makes every sign-in depend
 * on Supabase Auth email delivery.
 */
export type AuthMode = 'password' | 'passwordless';

export type AuthAction =
  | 'signIn'
  | 'signUp'
  | 'requestPasswordReset'
  | 'updatePassword'
  | 'requestMagicLink'
  | 'requestSignUpLink';

/**
 * What each mode accepts.
 *
 * A Server Action is a callable endpoint, not a button: hiding the password
 * form does not stop a caller posting to `signIn`. Each action checks this
 * table before doing anything, so the mode is enforced on the server and the
 * UI only decides what to draw.
 *
 * `requestMagicLink` appears in both because password mode offers a link
 * alongside the password — passwordless mode removes the alternative, not
 * the link.
 */
const ALLOWED: Record<AuthMode, readonly AuthAction[]> = {
  password: ['signIn', 'signUp', 'requestPasswordReset', 'updatePassword', 'requestMagicLink'],
  passwordless: ['requestMagicLink', 'requestSignUpLink'],
};

export function modeAllows(mode: AuthMode, action: AuthAction): boolean {
  return ALLOWED[mode].includes(action);
}

export function authMode(): AuthMode {
  return serverEnv().AUTH_PASSWORDLESS ? 'passwordless' : 'password';
}
