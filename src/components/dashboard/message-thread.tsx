'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/choice';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { useAnnounce } from '@/components/ui/announcer';
import { sendMessage, type MessageState } from '@/features/messaging/actions';
import { cn } from '@/lib/utils/cn';

const INITIAL: MessageState = { status: 'idle' };

export type MessageView = {
  id: string;
  body: string;
  authorKind: string;
  authorName: string | null;
  isInternal: boolean;
  createdAt: string;
};

export function MessageThread({
  threadId,
  subject,
  messages,
  canPostInternal = false,
  currentUserId,
}: {
  threadId: string;
  subject: string;
  messages: MessageView[];
  canPostInternal?: boolean;
  currentUserId: string;
}) {
  const t = useTranslations('workspace.messages');
  const tErrors = useTranslations('messaging.errors');
  const format = useFormatter();
  const announce = useAnnounce();
  const [state, action, pending] = useActionState(sendMessage, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
      announce(t('send'));
    } else if (state.status === 'error' && state.message) {
      announce(tErrors(state.message), true);
    }
  }, [state, announce, t, tErrors]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-ink">{subject}</h2>

      <ol className="flex flex-col gap-3">
        {messages.map((message) => {
          const mine = message.authorKind === 'customer' && currentUserId;
          return (
            <li
              key={message.id}
              className={cn(
                'rounded-[var(--radius-card)] border p-4',
                message.isInternal
                  ? 'border-warning/30 bg-warning-soft'
                  : mine
                    ? 'border-border bg-primary-soft'
                    : 'border-border bg-surface',
              )}
            >
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-medium text-ink">{message.authorName ?? message.authorKind}</span>
                <time dateTime={message.createdAt}>
                  {format.dateTime(new Date(message.createdAt), 'withTime')}
                </time>
                {message.isInternal ? <Badge tone="warning">{t('internalOnly')}</Badge> : null}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.body}</p>
            </li>
          );
        })}
      </ol>

      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <input type="hidden" name="threadId" value={threadId} />

        {state.status === 'error' && state.message ? (
          <Alert tone="danger" live="assertive">
            {tErrors(state.message)}
          </Alert>
        ) : null}

        <Field>
          <FieldLabel className="sr-only">{t('compose')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Textarea name="body" rows={3} placeholder={t('placeholder')} required maxLength={20000} />
          </FieldControl>
        </Field>

        {canPostInternal ? (
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <Checkbox name="internal" />
            {t('internalOnly')}
          </label>
        ) : null}

        <Button type="submit" disabled={pending} className="w-fit">
          {t('send')}
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}
