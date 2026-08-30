'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  approveProviderApplication,
  beginProviderVerification,
  rejectProviderApplication,
  requestProviderInformation,
  startProviderReview,
} from '@/features/admin/provider-applications';

/**
 * Review controls for one provider application. Which buttons appear is
 * decided by the current status; the server actions re-validate both the
 * capability (partner.verify, step-up) and the transition, so these are
 * conveniences, not the authorisation.
 */
export function ProviderApplicationReview({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const t = useTranslations('admin.providerApplications');
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMessage('');
        router.refresh();
      } else {
        setError(result.error ?? 'unavailable');
      }
    });
  }

  const needsMessage = status === 'under_review' || status === 'verification_in_progress';

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert tone="danger" title={t(`actionErrors.${error}`)} /> : null}

      {needsMessage ? (
        <div>
          <label htmlFor="review-message" className="text-ink block text-sm font-medium">
            {t('messageLabel')}
          </label>
          <textarea
            id="review-message"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="border-border-strong bg-surface text-ink mt-1.5 w-full rounded-[var(--radius-control)] border px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {status === 'submitted' ? (
          <Button disabled={pending} onClick={() => run(() => startProviderReview(applicationId))}>
            {t('startReview')}
          </Button>
        ) : null}

        {status === 'under_review' ? (
          <>
            <Button
              disabled={pending}
              onClick={() => run(() => beginProviderVerification(applicationId))}
            >
              {t('beginVerification')}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => requestProviderInformation(applicationId, message))}
            >
              {t('requestInformation')}
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => run(() => rejectProviderApplication(applicationId, message))}
            >
              {t('reject')}
            </Button>
          </>
        ) : null}

        {status === 'verification_in_progress' ? (
          <>
            <Button
              disabled={pending}
              onClick={() => run(() => approveProviderApplication(applicationId))}
            >
              {t('approve')}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => requestProviderInformation(applicationId, message))}
            >
              {t('requestInformation')}
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => run(() => rejectProviderApplication(applicationId, message))}
            >
              {t('reject')}
            </Button>
          </>
        ) : null}
      </div>

      {status === 'verification_in_progress' ? (
        <p className="text-muted text-sm leading-relaxed">{t('approveNote')}</p>
      ) : null}
    </div>
  );
}
