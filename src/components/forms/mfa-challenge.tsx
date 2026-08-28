'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { challengeMfa, type MfaState } from '@/features/auth/mfa-actions';

const INITIAL: MfaState = { status: 'idle' };

/**
 * Presents an already-enrolled second factor.
 *
 * Distinct from MfaSetup, which enrols one. A signed-in user who has a verified
 * factor but has not presented it this session is at aal1 and cannot reach a
 * workspace that requires aal2 — enrolment is not the thing they need, and
 * offering it would only invite them to replace a factor that works.
 */
export function MfaChallenge({ next }: { next: string }) {
  const t = useTranslations('auth.mfa');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const [state, action, pending] = useActionState(challengeMfa, INITIAL);

  useEffect(() => {
    if (state.status === 'success') {
      // The session is aal2 now, but the cookie the server rendered this page
      // with was not. refresh() re-runs the layout checks against the new one.
      router.replace(next);
      router.refresh();
    }
  }, [state.status, next, router]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.status === 'error' && state.message ? (
        <Alert tone="danger" live="assertive">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <Field>
        <FieldLabel htmlFor="code">{t('codeLabel')}</FieldLabel>
        <FieldControl>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
          />
        </FieldControl>
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {t('challengeCta')}
      </Button>
    </form>
  );
}
