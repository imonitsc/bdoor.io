'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import {
  extractRulesFromDocument,
  publishRegistryDocument,
  resolveChangeAlert,
  retireRegistryDocument,
  runRetrievalTest,
  seedSourceRegistry,
  setRuleFeeVerified,
  transitionRegistryDocument,
  transitionStructuredRule,
  updateRegistrySource,
  type RetrievalTestResult,
} from '@/features/admin/ai-registry-actions';
import type { DocumentLifecycle } from '@/features/ai/registry/documents';
import type { RuleStatus } from '@/features/ai/registry/rules';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';

/**
 * Controls for the knowledge registry screens. Same principle as the
 * knowledge-source controls: only the moves the workflow allows are rendered,
 * and the server refuses everything anyway.
 */

type Result = { ok: boolean; error?: string; detail?: string };

function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const run = (task: () => Promise<Result>) =>
    startTransition(async () => {
      setError(null);
      const result = await task();
      if (!result.ok) setError(result.error ?? 'failed');
      else if (result.detail) setDetail(result.detail);
    });
  return { pending, error, detail, run };
}

function Status({ pending, error }: { pending: boolean; error: string | null }) {
  return (
    <>
      {pending ? <Loader2 className="text-muted size-4 animate-spin" aria-hidden="true" /> : null}
      {error ? (
        <span className="text-danger text-xs" role="status">
          {error}
        </span>
      ) : null}
    </>
  );
}

export function RegistrySeedButton() {
  const t = useTranslations('admin.aiRegistry');
  const { pending, error, detail, run } = useAction();
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" disabled={pending} onClick={() => run(seedSourceRegistry)}>
        {t('seed')}
      </Button>
      {detail ? <span className="text-muted text-xs">{t('seeded', { detail })}</span> : null}
      <Status pending={pending} error={error} />
    </div>
  );
}

export function RegistryToggle({ sourceId, enabled }: { sourceId: string; enabled: boolean }) {
  const t = useTranslations('admin.aiRegistry');
  const { pending, error, run } = useAction();
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant={enabled ? 'subtle' : 'secondary'}
        disabled={pending}
        onClick={() =>
          run(() => updateRegistrySource({ registrySourceId: sourceId, enabled: !enabled }))
        }
      >
        {enabled ? t('disable') : t('enable')}
      </Button>
      <Status pending={pending} error={error} />
    </div>
  );
}

/** Legal document moves, given its current lifecycle. Publication and
 * retirement go through their dedicated actions with their extra effects. */
const DOCUMENT_NEXT: Partial<Record<DocumentLifecycle, DocumentLifecycle[]>> = {
  extracted: ['review_required', 'withdrawn'],
  review_required: ['approved', 'withdrawn'],
  approved: ['review_required', 'withdrawn'],
};

export function DocumentControls({
  documentId,
  lifecycle,
}: {
  documentId: string;
  lifecycle: DocumentLifecycle;
}) {
  const t = useTranslations('admin.aiRegistry');
  const { pending, error, run } = useAction();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(DOCUMENT_NEXT[lifecycle] ?? []).map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === 'withdrawn' ? 'danger' : 'secondary'}
          disabled={pending}
          onClick={() => run(() => transitionRegistryDocument({ documentId, lifecycle: next }))}
        >
          {t(`lifecycleActions.${next}`)}
        </Button>
      ))}

      {lifecycle === 'approved' ? (
        <Button
          size="sm"
          variant="primary"
          disabled={pending}
          onClick={() => run(() => publishRegistryDocument(documentId))}
        >
          {t('lifecycleActions.published')}
        </Button>
      ) : null}

      {lifecycle === 'published' ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => retireRegistryDocument({ documentId, mode: 'superseded' }))}
          >
            {t('lifecycleActions.superseded')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => run(() => retireRegistryDocument({ documentId, mode: 'withdrawn' }))}
          >
            {t('lifecycleActions.withdrawn')}
          </Button>
        </>
      ) : null}

      {['review_required', 'approved', 'published'].includes(lifecycle) ? (
        <Button
          size="sm"
          variant="subtle"
          disabled={pending}
          onClick={() => run(() => extractRulesFromDocument(documentId))}
        >
          {t('extractRules')}
        </Button>
      ) : null}

      <Status pending={pending} error={error} />
    </div>
  );
}

const RULE_NEXT: Partial<Record<RuleStatus, RuleStatus[]>> = {
  draft: ['in_review', 'withdrawn'],
  in_review: ['approved', 'draft', 'withdrawn'],
  approved: ['published', 'in_review', 'withdrawn'],
  published: ['superseded', 'withdrawn'],
};

export function RuleControls({
  ruleId,
  status,
  hasFee,
  feeVerified,
}: {
  ruleId: string;
  status: RuleStatus;
  hasFee: boolean;
  feeVerified: boolean;
}) {
  const t = useTranslations('admin.aiRegistry');
  const { pending, error, run } = useAction();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(RULE_NEXT[status] ?? []).map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === 'published' ? 'primary' : next === 'withdrawn' ? 'danger' : 'secondary'}
          disabled={pending}
          onClick={() => run(() => transitionStructuredRule({ ruleId, status: next }))}
        >
          {t(`ruleActions.${next}`)}
        </Button>
      ))}
      {hasFee ? (
        <Button
          size="sm"
          variant={feeVerified ? 'subtle' : 'secondary'}
          disabled={pending}
          onClick={() => run(() => setRuleFeeVerified({ ruleId, verified: !feeVerified }))}
        >
          {feeVerified ? t('unverifyFee') : t('verifyFee')}
        </Button>
      ) : null}
      <Status pending={pending} error={error} />
    </div>
  );
}

export function AlertResolveButton({ alertId }: { alertId: string }) {
  const t = useTranslations('admin.aiRegistry');
  const { pending, error, run } = useAction();
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="subtle"
        disabled={pending}
        onClick={() => run(() => resolveChangeAlert(alertId))}
      >
        {t('resolveAlert')}
      </Button>
      <Status pending={pending} error={error} />
    </div>
  );
}

/**
 * Retrieval testing console: shows exactly what the model would be handed for
 * a question — chunks, structured records, citations — without calling it.
 */
export function RetrievalConsole() {
  const t = useTranslations('admin.aiRegistry');
  const [question, setQuestion] = useState('');
  const [locale, setLocale] = useState<'en' | 'bn'>('en');
  const [pending, startTransition] = useTransition();
  const [output, setOutput] = useState<RetrievalTestResult | null>(null);

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setOutput(await runRetrievalTest({ question, locale, country: 'bd' }));
          });
        }}
      >
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={2}
          placeholder={t('consolePlaceholder')}
          aria-label={t('consolePlaceholder')}
        />
        <div className="flex items-center gap-2">
          {(['en', 'bn'] as const).map((code) => (
            <Button
              key={code}
              type="button"
              size="sm"
              variant={locale === code ? 'primary' : 'secondary'}
              onClick={() => setLocale(code)}
            >
              {code === 'en' ? 'English' : 'বাংলা'}
            </Button>
          ))}
          <Button type="submit" disabled={pending || question.trim().length < 3}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {t('runTest')}
          </Button>
        </div>
      </form>

      {output ? (
        output.ok ? (
          <div className="space-y-3">
            {output.result.empty ? (
              <p className="text-warning text-sm">{t('consoleEmpty')}</p>
            ) : null}
            <div>
              <p className="text-muted text-xs font-medium uppercase">{t('consoleCitations')}</p>
              <ul className="mt-1 space-y-1 text-sm">
                {output.result.citations.map((citation) => (
                  <li key={citation.index}>
                    [{citation.index}] {citation.title}
                    {citation.institution ? ` · ${citation.institution}` : ''}
                    {citation.sectionRef ? ` · ${citation.sectionRef}` : ''}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase">{t('consoleContext')}</p>
              <pre className="bg-surface-sunken text-ink mt-1 max-h-96 overflow-auto rounded-[var(--radius-control)] p-3 text-xs whitespace-pre-wrap">
                {[output.result.structured, output.result.context].filter(Boolean).join('\n\n') ||
                  t('consoleNothing')}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-danger text-sm" role="status">
            {output.error}
          </p>
        )
      ) : null}
    </div>
  );
}
