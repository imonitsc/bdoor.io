'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Route-level error boundary.
 *
 * The customer sees a generic message plus a correlation id. The underlying
 * error text is deliberately not rendered: it can contain query fragments or
 * identifiers, and it is already on the server logs against the same digest.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  const tCommon = useTranslations('common');

  useEffect(() => {
    // Server-side logging already captured this; this is the browser half.
    console.error('[bdoor] render error', { digest: error.digest });
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <span
        className="bg-danger-soft text-danger flex size-12 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="text-ink text-3xl leading-tight md:text-4xl">{t('genericTitle')}</h1>
      <p className="text-muted max-w-md text-base leading-relaxed">{t('genericBody')}</p>
      {error.digest ? (
        <p className="bg-surface-sunken text-muted rounded-[var(--radius-control)] px-3 py-1.5 font-mono text-xs">
          {t('reference')}: {error.digest}
        </p>
      ) : null}
      <Button size="lg" onClick={reset}>
        {tCommon('retry')}
      </Button>
    </div>
  );
}
