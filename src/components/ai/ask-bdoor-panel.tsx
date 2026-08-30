'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ExternalLink, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';
import { useAskBdoor, type ChatMessage } from './use-ask-bdoor';

/**
 * The conversation surface, used identically by the homepage drawer, the
 * mobile full-screen sheet and the permanent /ask page. One implementation, so
 * the disclosure, the citations and the escalation path cannot drift apart
 * between them.
 */

const SUGGESTIONS = ['one', 'two', 'three', 'four', 'five'] as const;

function Citations({ message }: { message: ChatMessage }) {
  const t = useTranslations('ask');
  if (!message.citations?.length || message.streaming) return null;

  return (
    <div className="border-border mt-3 border-t pt-3">
      <p className="text-muted text-xs font-medium">{t('sources')}</p>
      <ul className="mt-1.5 space-y-1">
        {message.citations.map((citation) => (
          <li key={citation.index} className="text-xs leading-relaxed">
            <span className="text-muted tabular-nums">[{citation.index}]</span>{' '}
            {citation.url ? (
              <Link
                href={citation.url}
                className="text-primary hover:text-primary-hover underline underline-offset-2"
              >
                {citation.title}
                <ExternalLink className="ms-0.5 inline size-3" aria-hidden="true" />
              </Link>
            ) : (
              <span className="text-ink">{citation.title}</span>
            )}
            {citation.lastReviewed ? (
              <span className="text-muted">
                {' '}
                · {t('reviewed', { date: citation.lastReviewed })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feedback({ message, onRate }: { message: ChatMessage; onRate: (rating: 1 | -1) => void }) {
  const t = useTranslations('ask');
  const [rated, setRated] = useState<1 | -1 | null>(null);

  if (message.streaming || message.failure || !message.storedId) return null;

  if (rated) return <p className="text-muted mt-2 text-xs">{t('feedbackThanks')}</p>;

  return (
    <div className="mt-2 flex items-center gap-1">
      <span className="text-muted text-xs">{t('feedbackPrompt')}</span>
      {([1, -1] as const).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => {
            setRated(rating);
            onRate(rating);
          }}
          aria-label={rating === 1 ? t('feedbackUp') : t('feedbackDown')}
          className="text-muted hover:bg-surface-sunken hover:text-ink inline-flex size-7 items-center justify-center rounded-[var(--radius-control)] transition-colors"
        >
          {rating === 1 ? (
            <ThumbsUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ThumbsDown className="size-3.5" aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );
}

export function AskBdoorPanel({
  locale,
  country = 'bd',
  className,
  autoFocus = false,
  initialQuestion,
}: {
  locale: 'en' | 'bn';
  country?: string;
  className?: string;
  autoFocus?: boolean;
  initialQuestion?: string;
}) {
  const t = useTranslations('ask');
  const { messages, pending, send, rate, forget } = useAskBdoor({
    locale,
    country,
    genericError: t('errors.unknown'),
  });
  const [draft, setDraft] = useState('');
  const listEnd = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (initialQuestion && !sentInitial.current) {
      sentInitial.current = true;
      void send(initialQuestion);
    }
  }, [initialQuestion, send]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages]);

  const submit = (question: string) => {
    setDraft('');
    void send(question);
  };

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto px-1" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="py-2">
            <p className="text-muted text-sm">{t('emptyBody')}</p>
            <ul className="mt-3 space-y-2">
              {SUGGESTIONS.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => submit(t(`suggestions.${key}`))}
                    className="border-border bg-surface hover:border-primary hover:bg-primary-soft text-ink w-full rounded-[var(--radius-control)] border px-3 py-2.5 text-start text-sm transition-colors"
                  >
                    {t(`suggestions.${key}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="space-y-4 py-2">
            {messages.map((message) => (
              <li key={message.id}>
                {message.role === 'user' ? (
                  <p className="bg-primary-soft text-ink ms-auto w-fit max-w-[85%] rounded-[var(--radius-panel)] px-3.5 py-2 text-sm">
                    {message.content}
                  </p>
                ) : (
                  <div className="border-border bg-surface rounded-[var(--radius-panel)] border p-3.5">
                    {message.content ? (
                      <div className="text-ink space-y-2 text-sm leading-relaxed">
                        {message.content.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="whitespace-pre-wrap">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted flex items-center gap-2 text-sm">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        {t('thinking')}
                      </p>
                    )}

                    <Citations message={message} />
                    <Feedback
                      message={message}
                      onRate={(rating) => {
                        if (message.storedId) void rate(message.storedId, rating);
                      }}
                    />

                    {/* Every answer offers the human path. A refusal offers it
                        more prominently, because a refusal is the moment the
                        customer most needs somewhere else to go. */}
                    {!message.streaming ? (
                      <div className="border-border mt-3 flex flex-wrap gap-2 border-t pt-3">
                        <Button asChild size="sm" variant={message.failure ? 'primary' : 'subtle'}>
                          <Link href={MARKETING_ROUTES.contact}>{t('talkToSpecialist')}</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={MARKETING_ROUTES.start}>
                            {t('startApplication')}
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div ref={listEnd} />
      </div>

      <form
        className="border-border mt-3 border-t pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <label htmlFor="ask-bdoor-input" className="sr-only">
          {t('inputLabel')}
        </label>
        <div className="flex gap-2">
          <input
            id="ask-bdoor-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('placeholder')}
            maxLength={2000}
            autoComplete="off"
            autoFocus={autoFocus}
            className="border-border bg-surface text-ink placeholder:text-muted h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          />
          <Button type="submit" disabled={pending || draft.trim().length === 0}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : t('submit')}
          </Button>
        </div>
        {/* The AI disclosure sits under the input on every surface, not in a
            collapsed panel: it is a statement about every answer above it. */}
        <p className="text-muted mt-2 text-xs leading-relaxed">
          {t('disclosure')}{' '}
          <Link href={MARKETING_ROUTES.privacy} className="underline underline-offset-2">
            {t('privacyLink')}
          </Link>
          {messages.length > 0 ? (
            <>
              {' · '}
              <button
                type="button"
                onClick={() => void forget()}
                className="underline underline-offset-2"
              >
                {t('deleteConversation')}
              </button>
            </>
          ) : null}
        </p>
      </form>
    </div>
  );
}
