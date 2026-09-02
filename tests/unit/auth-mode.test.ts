import { describe, expect, it } from 'vitest';

import { modeAllows, type AuthAction, type AuthMode } from '@/features/auth/mode';
import { magicSignUpSchema } from '@/features/auth/schema';
import en from '@/i18n/messages/en.json';
import bn from '@/i18n/messages/bn.json';

/**
 * Passwordless mode removes a credential from the product, so the tests worth
 * writing are the ones about what the server still accepts — not what the page
 * draws. A Server Action stays callable after its form is gone.
 */

const MODES: AuthMode[] = ['password', 'passwordless'];
const ALL: AuthAction[] = [
  'signIn',
  'signUp',
  'requestPasswordReset',
  'updatePassword',
  'requestMagicLink',
  'requestSignUpLink',
];

describe('modeAllows', () => {
  it('refuses every password action once passwordless is on', () => {
    for (const action of ['signIn', 'signUp', 'requestPasswordReset', 'updatePassword'] as const) {
      expect(modeAllows('passwordless', action), action).toBe(false);
    }
  });

  it('refuses the signup link while passwords are still in use', () => {
    // Two ways to open an account would mean two consent stories. Only one
    // mode may create accounts at a time.
    expect(modeAllows('password', 'requestSignUpLink')).toBe(false);
    expect(modeAllows('passwordless', 'requestSignUpLink')).toBe(true);
  });

  it('keeps sign-in links working in both modes', () => {
    // Password mode offers a link beside the password; passwordless removes
    // the alternative, not the link.
    for (const mode of MODES) expect(modeAllows(mode, 'requestMagicLink'), mode).toBe(true);
  });

  it('leaves exactly one way to sign in and one way to sign up, per mode', () => {
    const signIn = { password: 'signIn', passwordless: 'requestMagicLink' } as const;
    const signUp = { password: 'signUp', passwordless: 'requestSignUpLink' } as const;

    for (const mode of MODES) {
      expect(modeAllows(mode, signIn[mode]), `${mode} sign-in`).toBe(true);
      expect(modeAllows(mode, signUp[mode]), `${mode} sign-up`).toBe(true);
    }
  });

  it('never allows an action outside its own list', () => {
    for (const mode of MODES) {
      for (const action of ALL) {
        // Nothing is allowed by accident: every true here is one of the pairs
        // asserted above plus requestMagicLink.
        if (!modeAllows(mode, action)) continue;
        expect(
          [
            'requestMagicLink',
            ...(mode === 'password'
              ? ['signIn', 'signUp', 'requestPasswordReset', 'updatePassword']
              : ['requestSignUpLink']),
          ],
          `${mode}/${action}`,
        ).toContain(action);
      }
    }
  });
});

describe('magicSignUpSchema', () => {
  it('still demands consent — an account may only begin from a form that asked', () => {
    const result = magicSignUpSchema.safeParse({
      fullName: 'Sample Founder',
      email: 'founder@example.com',
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('termsRequired');
  });

  it('takes a name, an address and the checkbox, and no credential', () => {
    expect(Object.keys(magicSignUpSchema.shape).sort()).toEqual([
      'acceptTerms',
      'email',
      'fullName',
    ]);
  });

  it('normalises the address the same way every other auth form does', () => {
    const parsed = magicSignUpSchema.parse({
      fullName: '  Sample Founder ',
      email: ' Founder@Example.COM ',
      acceptTerms: true,
    });
    expect(parsed).toEqual({
      fullName: 'Sample Founder',
      email: 'founder@example.com',
      acceptTerms: true,
    });
  });
});

describe('passwordless copy', () => {
  it('tells the caller the account is created when the link is opened', () => {
    for (const [locale, messages] of [
      ['en', en],
      ['bn', bn],
    ] as const) {
      expect(messages.auth.signUpLinkSent, locale).toContain('{email}');
      expect(messages.auth.signUpLinkCta, locale).toBeTruthy();
      expect(messages.auth.signInPasswordlessSubtitle, locale).toBeTruthy();
      expect(messages.auth.signUpPasswordlessSubtitle, locale).toBeTruthy();
    }
  });
});
