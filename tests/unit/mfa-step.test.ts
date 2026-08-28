import { describe, expect, it } from 'vitest';
import { mfaStep } from '@/lib/permissions/roles';

/**
 * MFA is mandatory for every platform role and for both partner roles, so the
 * question this answers is a security control, not a UX detail: has a second
 * factor actually been presented on this request?
 */
describe('mfaStep', () => {
  describe('an account that must have MFA', () => {
    it('is satisfied once a factor has been presented', () => {
      expect(mfaStep(true, 'aal2', 'aal2')).toBe('satisfied');
    });

    it('sends an enrolled user to the challenge', () => {
      // A verified factor exists (nextLevel), but this session is still aal1.
      expect(mfaStep(true, 'aal1', 'aal2')).toBe('challenge');
    });

    it('sends a user with no factor at all to enrolment', () => {
      // The regression this pins down. Supabase reports nextLevel === 'aal1'
      // when nothing is enrolled, so a gate reading nextLevel would treat the
      // account with no second factor as having nothing outstanding — letting
      // in exactly the accounts the requirement exists to stop.
      expect(mfaStep(true, 'aal1', 'aal1')).toBe('enroll');
    });

    it('treats an unknown level as no evidence', () => {
      // getAuthenticatorAssuranceLevel returns nulls when there is no session
      // to read. Absent must never read as satisfied.
      expect(mfaStep(true, null, null)).toBe('enroll');
    });
  });

  describe('an account that does not need MFA', () => {
    it('is satisfied without a factor', () => {
      expect(mfaStep(false, 'aal1', 'aal1')).toBe('satisfied');
    });

    it('is satisfied when it has one anyway', () => {
      expect(mfaStep(false, 'aal2', 'aal2')).toBe('satisfied');
    });

    it('is not held at a challenge it was never required to pass', () => {
      expect(mfaStep(false, 'aal1', 'aal2')).toBe('satisfied');
    });
  });

  it('never reports satisfied for a required account below aal2', () => {
    const levels: Array<'aal1' | 'aal2' | null> = ['aal1', 'aal2', null];
    for (const current of levels) {
      for (const next of levels) {
        const step = mfaStep(true, current, next);
        if (current !== 'aal2') {
          expect(step, `current=${current} next=${next}`).not.toBe('satisfied');
        }
      }
    }
  });
});
