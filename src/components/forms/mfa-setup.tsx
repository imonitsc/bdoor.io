'use client';

import { useActionState, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  removeMfaFactor,
  startMfaEnrollment,
  verifyMfaEnrollment,
  type MfaState,
} from '@/features/auth/mfa-actions';

const INITIAL: MfaState = { status: 'idle' };

/**
 * TOTP enrolment.
 *
 * The QR code arrives from Supabase as an SVG data URL, so it is rendered
 * through <img src> rather than injected as markup — nothing here goes near
 * dangerouslySetInnerHTML.
 */
export function MfaSetup({
  enrolled,
  factorId,
  required,
}: {
  enrolled: boolean;
  factorId: string | null;
  required: boolean;
}) {
  const t = useTranslations('auth.mfa');
  const tErrors = useTranslations('auth.errors');
  const [state, setState] = useState<MfaState>(INITIAL);
  const [starting, startTransition] = useTransition();
  const [verifyState, verifyAction, verifying] = useActionState(verifyMfaEnrollment, INITIAL);
  const [removeState, removeAction, removing] = useActionState(removeMfaFactor, INITIAL);

  const active = verifyState.status === 'success' ? verifyState : state;

  if (enrolled && removeState.status !== 'success') {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm text-ink">
          <Badge tone="success" icon={<ShieldCheck className="size-3" />}>
            {t('enabled')}
          </Badge>
        </p>
        {removeState.status === 'error' && removeState.message ? (
          <Alert tone="danger" live="assertive">
            {tErrors(removeState.message)}
          </Alert>
        ) : null}
        {required ? (
          <p className="text-sm text-muted">{t('requiredForRole')}</p>
        ) : factorId ? (
          <form action={removeAction}>
            <input type="hidden" name="factorId" value={factorId} />
            <Button type="submit" variant="secondary" size="sm" disabled={removing}>
              <ShieldOff className="size-4" aria-hidden="true" />
              {t('removeCta')}
            </Button>
          </form>
        ) : null}
      </div>
    );
  }

  if (verifyState.status === 'success') {
    return (
      <Alert tone="success" live="polite">
        {tErrors('mfaEnabled')}
      </Alert>
    );
  }

  if (active.status === 'enrolling' && active.enrollment) {
    return (
      <form action={verifyAction} className="flex flex-col gap-4">
        <input type="hidden" name="factorId" value={active.enrollment.factorId} />

        <p className="text-sm leading-relaxed text-muted">{t('scanInstruction')}</p>

        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the auth provider, not a remote asset */}
        <img
          src={active.enrollment.qrCodeSvg}
          alt={t('scanInstruction')}
          width={200}
          height={200}
          className="rounded-[var(--radius-card)] border border-border bg-white p-2"
        />

        <details className="text-sm">
          <summary className="cursor-pointer text-primary">{t('manualKey')}</summary>
          <code className="mt-2 block break-all rounded-[var(--radius-control)] bg-surface-sunken p-3 font-mono text-xs text-ink">
            {active.enrollment.secret}
          </code>
        </details>

        {verifyState.status === 'error' && verifyState.message ? (
          <Alert tone="danger" live="assertive">
            {tErrors(verifyState.message)}
          </Alert>
        ) : null}

        <Field>
          <FieldLabel required>{t('codeLabel')}</FieldLabel>
          <FieldDescription>{t('challengeBody')}</FieldDescription>
          <FieldControl>
            <Input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              className="max-w-40 font-mono tracking-[0.3em]"
            />
          </FieldControl>
        </Field>

        <Button type="submit" disabled={verifying} className="w-fit">
          {t('verifyCta')}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-muted">{t('subtitle')}</p>
      {required ? <Alert tone="warning">{t('requiredForRole')}</Alert> : null}
      {state.status === 'error' && state.message ? (
        <Alert tone="danger" live="assertive">
          {tErrors(state.message)}
        </Alert>
      ) : null}
      <Button
        type="button"
        disabled={starting}
        className="w-fit"
        onClick={() => startTransition(async () => setState(await startMfaEnrollment()))}
      >
        <KeyRound className="size-4" aria-hidden="true" />
        {t('enrollCta')}
      </Button>
    </div>
  );
}
