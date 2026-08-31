'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { UIMessage } from 'ai';

import {
  Actions,
  CopyAction,
  FeedbackActions,
  RegenerateAction,
} from '@/components/ai-elements/actions';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import {
  BdoorAiAvatar,
  Message,
  MessageContent,
  MessageMarkdown,
} from '@/components/ai-elements/message';
import { Loader } from '@/components/ai-elements/loader';
import { PromptInput, type PromptInputStatus } from '@/components/ai-elements/prompt-input';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';
import {
  messageCitations,
  messageText,
  useAskChat,
  type AnswerMeta,
  type Citation,
  type Stage,
} from './use-ask-chat';

/**
 * The Ask bdoor AI conversation surface.
 *
 * One implementation for both placements — the full-page app at /ask and the
 * homepage drawer — so the disclosure, the citations and the escalation path
 * cannot drift apart between them. The page variant is an application shell:
 * a centred prompt while the thread is empty, a bottom-pinned composer once
 * it is not; the streaming answer, its sources and its actions are the
 * interface, not decoration.
 */

const QUICK_SUGGESTIONS = ['start', 'licences', 'tax', 'compliance'] as const;

function citationMeta(citation: Citation, t: ReturnType<typeof useTranslations<'ask'>>): string[] {
  const meta: string[] = [];
  if (citation.institution) meta.push(citation.institution);
  if (citation.referenceNumber) meta.push(citation.referenceNumber);
  if (citation.sectionRef) meta.push(citation.sectionRef);
  if (citation.page) meta.push(t('page', { page: citation.page }));
  if (citation.effectiveFrom) meta.push(t('effectiveFrom', { date: citation.effectiveFrom }));
  if (citation.lastReviewed) meta.push(t('reviewed', { date: citation.lastReviewed }));
  return meta;
}

function AssistantTurn({
  message,
  meta,
  isLast,
  streaming,
  stage,
  onRate,
  onRegenerate,
  onFollowUp,
}: {
  message: UIMessage;
  meta: AnswerMeta | null;
  isLast: boolean;
  streaming: boolean;
  stage: Stage | null;
  onRate: (messageId: string, rating: 1 | -1) => void;
  onRegenerate: () => void;
  onFollowUp: (question: string) => void;
}) {
  const t = useTranslations('ask');
  const text = messageText(message);
  const citations = messageCitations(message);
  const failed = Boolean(meta?.failure) && meta?.failure !== 'out_of_scope';

  return (
    <Message from="assistant">
      <BdoorAiAvatar />
      <MessageContent from="assistant">
        {text ? (
          <MessageMarkdown>{text}</MessageMarkdown>
        ) : streaming ? (
          <Loader label={t(`stages.${stage ?? 'understanding'}`)} />
        ) : meta?.failureMessage ? (
          <p>{meta.failureMessage}</p>
        ) : null}

        {citations.length ? (
          <Sources>
            <SourcesTrigger count={citations.length} label={t('sources')} />
            <SourcesContent>
              {citations.map((citation) => (
                <Source
                  key={citation.index}
                  index={citation.index}
                  title={citation.title}
                  href={citation.url}
                  meta={citationMeta(citation, t)}
                />
              ))}
            </SourcesContent>
          </Sources>
        ) : null}

        {!streaming ? (
          <>
            <Actions>
              {text ? <CopyAction text={text} label={t('copy')} copiedLabel={t('copied')} /> : null}
              {isLast ? <RegenerateAction label={t('regenerate')} onClick={onRegenerate} /> : null}
              {meta?.messageId && !failed ? (
                <FeedbackActions
                  upLabel={t('feedbackUp')}
                  downLabel={t('feedbackDown')}
                  thanksLabel={t('feedbackThanks')}
                  onRate={(rating) => {
                    if (meta.messageId) onRate(meta.messageId, rating);
                  }}
                />
              ) : null}
            </Actions>

            {/* Conversion and escalation. "Start this process" appears only
                when bdoor's /start journey genuinely covers the topic; the
                specialist path is always there, prominent on any failure. */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {meta?.startProcess ? (
                <Button asChild size="sm" variant="primary">
                  <Link href={MARKETING_ROUTES.start}>
                    {t('startProcess')}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant={failed || !text ? 'primary' : 'subtle'}>
                <Link href={MARKETING_ROUTES.contact}>{t('talkToSpecialist')}</Link>
              </Button>
            </div>

            {isLast && meta?.followUps.length ? (
              <div className="mt-3">
                <p className="text-muted mb-1.5 text-xs font-medium">{t('followUps')}</p>
                <Suggestions className="justify-start">
                  {meta.followUps.map((question) => (
                    <Suggestion key={question} suggestion={question} onClick={onFollowUp} />
                  ))}
                </Suggestions>
              </div>
            ) : null}
          </>
        ) : null}
      </MessageContent>
    </Message>
  );
}

/** The animated bdoor mark with its AI badge — motion, not decoration heavy. */
function AiMark() {
  return (
    <div className="relative inline-flex" aria-hidden="true">
      <span className="bg-primary-soft absolute inset-0 animate-ping rounded-[var(--radius-panel)] opacity-60 motion-reduce:hidden" />
      <span className="gradient-primary bg-primary text-on-primary relative inline-flex size-14 items-center justify-center rounded-[var(--radius-panel)] text-2xl font-semibold">
        b
      </span>
      <span className="bg-ink text-surface absolute -right-2 -bottom-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
        AI
      </span>
    </div>
  );
}

export function AskBdoorPanel({
  locale,
  country = 'bd',
  className,
  autoFocus = false,
  initialQuestion,
  variant = 'drawer',
}: {
  locale: 'en' | 'bn';
  country?: string;
  className?: string;
  autoFocus?: boolean;
  initialQuestion?: string;
  variant?: 'page' | 'drawer';
}) {
  const t = useTranslations('ask');
  const { messages, status, error, stage, stalled, ask, retry, stop, metaByMessage, forget, rate } =
    useAskChat({ locale, country });
  const [draft, setDraft] = useState('');
  const sentInitial = useRef(false);

  useEffect(() => {
    if (initialQuestion && !sentInitial.current) {
      sentInitial.current = true;
      ask(initialQuestion);
    }
  }, [initialQuestion, ask]);

  const submit = (question: string) => {
    setDraft('');
    ask(question);
  };

  const empty = messages.length === 0;
  const streaming = status === 'submitted' || status === 'streaming';
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id ?? null;

  // A refusal the transport surfaced as an HTTP error still carries copy the
  // server wrote in the customer's language; fall back to the generic line.
  const errorCopy = (() => {
    if (!error) return null;
    try {
      const parsed = JSON.parse(error.message) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      /* not JSON */
    }
    return t('errors.unknown');
  })();

  const composer = (
    <div className="w-full">
      {stalled && streaming ? (
        <div
          role="status"
          className="border-warning/40 bg-surface text-ink mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-sm"
        >
          <span>{t('stalled')}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => stop()}>
              {t('stop')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                stop();
                retry();
              }}
            >
              {t('retry')}
            </Button>
          </div>
        </div>
      ) : null}

      {errorCopy ? (
        <div
          role="alert"
          className="border-danger/40 bg-surface text-ink mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-sm"
        >
          <span>{errorCopy}</span>
          <Button size="sm" variant="primary" onClick={() => retry()}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      <PromptInput
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        onStop={stop}
        status={status as PromptInputStatus}
        placeholder={t('placeholder')}
        inputLabel={t('inputLabel')}
        submitLabel={t('submit')}
        stopLabel={t('stop')}
        voiceLabel={t('voiceInput')}
        voiceStopLabel={t('voiceStop')}
        locale={locale}
        autoFocus={autoFocus}
      />

      {/* Privacy and the professional-services limitation, one short line;
          the full detail is one tap away. */}
      <p className="text-muted mt-2 text-center text-xs leading-relaxed">
        {t('legalLine')}{' '}
        <Link href={MARKETING_ROUTES.privacy} className="underline underline-offset-2">
          {t('privacyLink')}
        </Link>
        {' · '}
        <Link href={MARKETING_ROUTES.legalDisclaimer} className="underline underline-offset-2">
          {t('disclaimerLink')}
        </Link>
        {!empty ? (
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
    </div>
  );

  if (empty) {
    return (
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col items-center justify-center px-4',
          variant === 'page' ? 'py-6' : 'py-4',
          className,
        )}
      >
        <div className="w-full max-w-2xl text-center">
          <AiMark />
          {variant === 'page' ? (
            <h1 className="text-ink mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('appHeading')}
            </h1>
          ) : (
            <p className="text-ink mt-4 text-xl font-semibold tracking-tight">{t('appHeading')}</p>
          )}
          <p className="text-muted mt-1.5 text-sm sm:text-base">{t('appSupport')}</p>

          <div className="mt-5">{composer}</div>

          <Suggestions className="mt-4">
            {QUICK_SUGGESTIONS.map((key) => (
              <Suggestion key={key} suggestion={t(`quick.${key}`)} onClick={submit} />
            ))}
          </Suggestions>

          <p className="text-muted mt-4 flex items-center justify-center gap-1.5 text-xs">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {t('statusLine')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <Conversation>
        <ConversationContent>
          {messages.map((message, index) =>
            message.role === 'user' ? (
              <Message key={message.id} from="user">
                <MessageContent from="user">{messageText(message)}</MessageContent>
              </Message>
            ) : (
              <AssistantTurn
                key={message.id}
                message={message}
                meta={metaByMessage[message.id] ?? null}
                isLast={message.id === lastAssistantId}
                streaming={streaming && index === messages.length - 1}
                stage={stage}
                onRate={(messageId, rating) => void rate(messageId, rating)}
                onRegenerate={retry}
                onFollowUp={submit}
              />
            ),
          )}
          {/* The turn the server is still working on, before its message
              exists: show the truthful stage immediately. */}
          {streaming && messages.at(-1)?.role === 'user' ? (
            <Message from="assistant">
              <BdoorAiAvatar />
              <MessageContent from="assistant">
                <Loader label={t(`stages.${stage ?? 'understanding'}`)} />
              </MessageContent>
            </Message>
          ) : null}
        </ConversationContent>
      </Conversation>

      <div
        className={cn(
          'mx-auto w-full max-w-3xl px-4 pt-2',
          variant === 'page' ? 'pb-[max(env(safe-area-inset-bottom),0.75rem)]' : 'pb-2',
        )}
      >
        {composer}
      </div>
    </div>
  );
}
