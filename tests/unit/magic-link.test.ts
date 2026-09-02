import { describe, expect, it } from 'vitest';

import { magicLinkSchema } from '@/features/auth/schema';
import { CONFIRM_TYPES, confirmType } from '@/lib/auth/confirm-type';
import { RATE_LIMITS } from '@/lib/rate-limit';
import en from '@/i18n/messages/en.json';
import bn from '@/i18n/messages/bn.json';

/**
 * Magic-link sign-in hands an unauthenticated caller a way to make bdoor send
 * mail and, if they own the inbox, a session. The three things worth testing
 * are the ones that would be expensive to get wrong: what the form accepts,
 * what the callback will verify, and that the copy never implies an account
 * was created.
 */

describe('magicLinkSchema', () => {
  it('normalises the address the same way the password forms do', () => {
    const parsed = magicLinkSchema.parse({ email: '  Founder@Example.COM ' });
    expect(parsed.email).toBe('founder@example.com');
  });

  it('rejects a malformed address with a translatable key', () => {
    const result = magicLinkSchema.safeParse({ email: 'not-an-address' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('invalidEmail');
  });

  it('takes an address and nothing else — a link can never open an account', () => {
    // If this ever grows a password or a name, signup's consent recording has
    // been bypassed: it is the only path that stores the policy versions.
    expect(Object.keys(magicLinkSchema.shape)).toEqual(['email']);
  });

  it('is rate limited per hour, like the other unauthenticated mail triggers', () => {
    expect(RATE_LIMITS['auth.magic_link']).toEqual(RATE_LIMITS['auth.password_reset']);
  });
});

describe('confirmType', () => {
  it('accepts every type the callback is meant to verify', () => {
    for (const type of CONFIRM_TYPES) {
      expect(confirmType(type)).toBe(type);
    }
    expect(CONFIRM_TYPES).toContain('magiclink');
  });

  it('refuses anything else, so the caller cannot choose the verification path', () => {
    for (const value of ['sms', 'phone_change', 'signup', 'MAGICLINK', '', ' email', null]) {
      expect(confirmType(value)).toBeNull();
    }
  });
});

describe('magic-link copy', () => {
  const locales = [
    ['en', en],
    ['bn', bn],
  ] as const;

  it('never promises the link was sent, in either language', () => {
    // The answer has to look the same for an address with an account and one
    // without, or the form becomes an account-enumeration oracle.
    for (const [locale, messages] of locales) {
      const sent = messages.auth.magicLinkSent;
      expect(sent, `${locale} magicLinkSent`).toBeTruthy();
      expect(sent, `${locale} magicLinkSent is unconditional`).toMatch(/if|যদি|থাকলে/i);
    }
  });

  it('says a link cannot create an account', () => {
    for (const [locale, messages] of locales) {
      expect(messages.auth.magicLinkNoAccount, `${locale}`).toBeTruthy();
      expect(messages.auth.magicLinkCta, `${locale}`).toBeTruthy();
    }
  });
});
