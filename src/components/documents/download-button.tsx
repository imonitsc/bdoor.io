'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnnounce } from '@/components/ui/announcer';
import { createDownloadUrl } from '@/features/documents/actions';

/**
 * Fetches a signed URL on demand rather than rendering one into the page.
 *
 * A URL baked into HTML would sit in the browser cache, the back button and
 * any shared screenshot for its whole lifetime. Requesting it at click time
 * keeps the five-minute window meaningful and produces one access-log row per
 * actual access.
 */
export function DownloadButton({
  documentId,
  action = 'download',
  label,
}: {
  documentId: string;
  action?: 'download' | 'preview';
  label?: string;
}) {
  const t = useTranslations('common');
  const tErrors = useTranslations('documents.errors');
  const announce = useAnnounce();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    startTransition(async () => {
      const result = await createDownloadUrl(documentId, action);
      if (!result.ok) {
        setError(result.reason);
        announce(tErrors(result.reason), true);
        return;
      }
      window.open(result.url, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button variant="secondary" size="sm" onClick={open} disabled={pending}>
        {action === 'download' ? (
          <Download className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
        {label ?? (action === 'download' ? t('download') : t('view'))}
      </Button>
      {error ? <span className="text-xs font-medium text-danger">{tErrors(error)}</span> : null}
    </span>
  );
}
