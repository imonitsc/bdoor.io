'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';

/**
 * The client half of Ask bdoor AI, on the AI SDK's UI-message stream.
 *
 * It speaks to `/api/ai/chat` and nothing else. There is no model name, no
 * gateway URL and no key anywhere on this side of the wire — the browser
 * posts a question and reads a message stream back.
 *
 * The server's wire contract (see `src/features/ai/chat.ts`):
 *   data-stage      transient — the truthful pipeline stage now running
 *   data-citations  the sources the answer is grounded in
 *   data-failure    a handled failure with localized copy
 *   data-final      conversation id, stored message id, follow-ups, CTA flags
 */

export type Citation = {
  index: number;
  sourceId: string | null;
  title: string;
  url: string | null;
  lastReviewed: string | null;
  institution?: string | null;
  referenceNumber?: string | null;
  sectionRef?: string | null;
  page?: number | null;
  effectiveFrom?: string | null;
  ruleId?: string | null;
};

export type Stage = 'understanding' | 'sources' | 'answering';

export type AnswerMeta = {
  messageId: string | null;
  followUps: string[];
  startProcess: boolean;
  /** The Comply exit: present when the answer cited a recurring rule. */
  complyTrack: { ruleId: string; title: string } | null;
  failure?: string;
  failureMessage?: string;
};

const SESSION_KEY = 'bdoor.ai.session';

/**
 * A random id identifying this browser's chat thread. Stored in
 * sessionStorage, not localStorage: it should not outlive the tab, and it is
 * never joined to a customer record. A browser that blocks storage still
 * works — it just starts a new thread on every question.
 */
function anonymousSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID().replace(/-/g, '');
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID().replace(/-/g, '');
  }
}

/** Concatenated text of a UI message. */
export function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/** Citations attached to a UI message via its data part, if any. */
export function messageCitations(message: UIMessage): Citation[] {
  for (const part of message.parts) {
    if (part.type === 'data-citations') {
      const data = part.data as { citations?: Citation[] } | undefined;
      return data?.citations ?? [];
    }
  }
  return [];
}

/** No first event for this long after submit = offer the retry state. */
const STALL_MS = 8_000;

type Options = { locale: 'en' | 'bn'; country: string };

export function useAskChat({ locale, country }: Options) {
  // Read and written only inside event handlers; the transport's
  // request-builder never touches it directly — the thread id travels as a
  // per-request body option instead, which keeps the React compiler happy
  // and the closure free of render-time ref reads.
  const conversationRef = useRef<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [stalled, setStalled] = useState(false);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Per-assistant-message metadata. The server mints the UI message id on the
  // stream's `start` frame and names it in every metadata part, so this is a
  // plain keyed state lookup — no refs, no guessing which message a part
  // belongs to.
  const [metaByMessage, setMetaByMessage] = useState<Record<string, AnswerMeta>>({});

  const clearStall = useCallback(() => {
    if (stallTimer.current) clearTimeout(stallTimer.current);
    stallTimer.current = null;
    setStalled(false);
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        // The server's contract is one question plus its thread context — the
        // history the model sees is loaded server-side from the redacted
        // store, so the browser sends only the newest question.
        prepareSendMessagesRequest: ({ messages, body }) => {
          const lastUser = [...messages].reverse().find((message) => message.role === 'user');
          return {
            body: {
              message: lastUser ? messageText(lastUser) : '',
              locale,
              country,
              anonymousSessionId: anonymousSessionId(),
              // conversationId arrives from the caller at send time.
              ...(body ?? {}),
            },
          };
        },
      }),
    [country, locale],
  );

  const chat = useChat({
    transport,
    onData: (part) => {
      clearStall();
      if (part.type === 'data-stage') {
        setStage((part.data as { stage: Stage }).stage);
        return;
      }
      if (part.type === 'data-final') {
        const data = part.data as {
          uiMessageId: string;
          conversationId: string | null;
          messageId: string | null;
          followUps: string[];
          startProcess: boolean;
          complyTrack?: { ruleId: string; title: string } | null;
        };
        conversationRef.current = data.conversationId ?? conversationRef.current;
        setMetaByMessage((previous) => ({
          ...previous,
          [data.uiMessageId]: {
            ...previous[data.uiMessageId],
            messageId: data.messageId,
            followUps: data.followUps,
            startProcess: data.startProcess,
            complyTrack: data.complyTrack ?? null,
          },
        }));
      } else if (part.type === 'data-failure') {
        const data = part.data as { uiMessageId: string; failure: string; message: string };
        setMetaByMessage((previous) => ({
          ...previous,
          [data.uiMessageId]: {
            messageId: previous[data.uiMessageId]?.messageId ?? null,
            followUps: previous[data.uiMessageId]?.followUps ?? [],
            startProcess: previous[data.uiMessageId]?.startProcess ?? false,
            complyTrack: previous[data.uiMessageId]?.complyTrack ?? null,
            failure: data.failure,
            failureMessage: data.message,
          },
        }));
      }
    },
    onFinish: () => {
      setStage(null);
      clearStall();
    },
    onError: () => {
      setStage(null);
      clearStall();
    },
  });

  useEffect(() => () => clearStall(), [clearStall]);

  const ask = useCallback(
    (question: string) => {
      const text = question.trim();
      if (!text) return;
      clearStall();
      setStalled(false);
      stallTimer.current = setTimeout(() => setStalled(true), STALL_MS);
      void chat.sendMessage({ text }, { body: { conversationId: conversationRef.current } });
    },
    [chat, clearStall],
  );

  const retry = useCallback(() => {
    clearStall();
    stallTimer.current = setTimeout(() => setStalled(true), STALL_MS);
    void chat.regenerate({ body: { conversationId: conversationRef.current } });
  }, [chat, clearStall]);

  const resetThread = useCallback(() => {
    chat.stop();
    chat.setMessages([]);
    setMetaByMessage({});
    conversationRef.current = null;
    setStage(null);
    clearStall();
  }, [chat, clearStall]);

  /** Customer-initiated deletion; the transcript clears locally either way. */
  const forget = useCallback(async () => {
    const id = conversationRef.current;
    resetThread();
    if (!id) return;
    await fetch('/api/ai/conversation', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id, anonymousSessionId: anonymousSessionId() }),
    }).catch(() => undefined);
  }, [resetThread]);

  const rate = useCallback(async (messageId: string, rating: 1 | -1) => {
    if (!conversationRef.current) return;
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, conversationId: conversationRef.current, rating }),
    }).catch(() => undefined);
  }, []);

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    stage,
    stalled,
    ask,
    retry,
    stop: chat.stop,
    metaByMessage,
    resetThread,
    forget,
    rate,
  };
}
