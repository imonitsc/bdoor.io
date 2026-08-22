'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { signOutOtherSessions, type AuthState } from '@/features/auth/actions';

const INITIAL: AuthState = { status: 'idle' };

export function SignOutOtherSessions() {
  const t = useTranslations('workspace.security');
  const tErrors = useTranslations('auth.errors');
  const [state, action, pending] = useActionState(signOutOtherSessions, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.status !== 'idle' && state.message ? (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'} live="polite">
          {tErrors(state.message)}
        </Alert>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending} className="w-fit">
        <LogOut className="size-4" aria-hidden="true" />
        {t('signOutOthers')}
      </Button>
    </form>
  );
}
