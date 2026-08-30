'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import {
  importKnowledgeSeed,
  indexKnowledgeSource,
  transitionKnowledgeSource,
} from '@/features/admin/ai-knowledge-actions';
import type { SourceStatus } from '@/features/ai/knowledge';
import { Button } from '@/components/ui/button';

/**
 * The buttons that move a source through Draft → Review → Approved →
 * Published → Indexed.
 *
 * Only the transitions the workflow allows are rendered, so an illegal move is
 * not something a reviewer can attempt and be refused — it is something they
 * never see. The server refuses it anyway; this just keeps the screen honest.
 */

const NEXT: Record<SourceStatus, SourceStatus[]> = {
  draft: ['in_review', 'withdrawn'],
  in_review: ['approved', 'draft', 'withdrawn'],
  approved: ['published', 'in_review', 'withdrawn'],
  published: ['withdrawn'],
  withdrawn: ['draft'],
};

export function AiSourceControls({
  sourceId,
  status,
  indexed,
}: {
  sourceId: string;
  status: SourceStatus;
  indexed: boolean;
}) {
  const t = useTranslations('admin.ai');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (task: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await task();
      if (!result.ok) setError(result.error ?? 'failed');
    });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {NEXT[status].map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === 'published' ? 'primary' : next === 'withdrawn' ? 'danger' : 'secondary'}
          disabled={pending}
          onClick={() => run(() => transitionKnowledgeSource({ sourceId, status: next }))}
        >
          {t(`transitions.${next}`)}
        </Button>
      ))}

      {status === 'published' ? (
        <Button
          size="sm"
          variant="subtle"
          disabled={pending}
          onClick={() => run(() => indexKnowledgeSource(sourceId))}
        >
          {indexed ? t('reindex') : t('index')}
        </Button>
      ) : null}

      {pending ? <Loader2 className="text-muted size-4 animate-spin" aria-hidden="true" /> : null}
      {error ? (
        <span className="text-danger text-xs" role="status">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function AiImportButton() {
  const t = useTranslations('admin.ai');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await importKnowledgeSeed();
            setMessage(result.ok ? t('importDone', { detail: result.detail ?? '' }) : t('failed'));
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {t('import')}
      </Button>
      {message ? (
        <span className="text-muted text-xs" role="status">
          {message}
        </span>
      ) : null}
    </div>
  );
}
