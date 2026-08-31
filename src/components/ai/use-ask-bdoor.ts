'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * The client half of Ask bdoor AI.
 *
 * It speaks to `/api/ai/chat` and nothing else. There is no model name, no
 * gateway URL and no key anywhere on this side of the wire — the browser posts
 * a question and reads a stream of text back, which is the whole reason the
 * credential can be OIDC and server-only.
 */

export type Citation = {
  index: number;
  sourceId: string | null;
  title: string;
  url: string | null;
  lastReviewed: string | null;
  /** Official-source detail; null for bdoor-authored content. */
  institution?: string | null;
  referenceNumber?: string | null;
  sectionRef?: string | null;
  page?: number | null;
  effectiveFrom?: string | null;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  /** Set when this answer ended in a handled failure rather than a completion. */
  failure?: string;
  /** The stored row this answer became; feedback attaches to it. */
  storedId?: string;
  streaming?: boolean;
};

const SESSION_KEY = 'bdoor.ai.session';

/**
 * A random id identifying this browser's chat thread. Stored in
 * sessionStorage, not localStorage: it should not outlive the tab, and it is
 * never joined to a customer record. A browser that blocks storage still works
 * — it just starts a new thread on every question.
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

type Options = { locale: 'en' | 'bn'; country: string; genericError: string };

export function useAskBdoor({ locale, country, genericError }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const conversationId = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    conversationId.current = null;
    setMessages([]);
    setPending(false);
  }, []);

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || pending) return;

      // A previous request still in flight is cancelled rather than raced: two
      // streams writing into the same transcript is worse than a lost answer.
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;

      const answerId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: text },
        { id: answerId, role: 'assistant', content: '', streaming: true },
      ]);
      setPending(true);

      const patch = (update: Partial<ChatMessage>) =>
        setMessages((prev) =>
          prev.map((message) => (message.id === answerId ? { ...message, ...update } : message)),
        );

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            conversationId: conversationId.current,
            locale,
            country,
            anonymousSessionId: anonymousSessionId(),
          }),
        });

        // A non-streaming response is a refusal: rate limit, budget, outage or
        // an out-of-scope decline. All of them carry copy written on the
        // server, in the customer's language.
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('text/event-stream')) {
          const body = (await response.json().catch(() => null)) as {
            message?: string;
            error?: string;
          } | null;
          patch({
            content: body?.message ?? genericError,
            failure: body?.error ?? 'unknown',
            streaming: false,
          });
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          patch({ content: genericError, failure: 'unknown', streaming: false });
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let answer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line; a partial frame stays in
          // the buffer until the rest of it arrives.
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const raw of frames) {
            const event = /^event: (.+)$/m.exec(raw)?.[1];
            const dataLine = /^data: (.+)$/m.exec(raw)?.[1];
            if (!event || !dataLine) continue;

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(dataLine) as Record<string, unknown>;
            } catch {
              continue;
            }

            if (event === 'meta') {
              conversationId.current = (data.conversationId as string) ?? null;
              patch({ citations: (data.citations as Citation[]) ?? [] });
            } else if (event === 'text') {
              answer += (data.delta as string) ?? '';
              patch({ content: answer });
            } else if (event === 'error') {
              const failure = (data.failure as string) ?? 'unknown';
              const copy = (data.message as string) ?? genericError;
              // Append rather than replace when the answer had already begun:
              // deleting text the customer has read looks like a bug, and the
              // half-answer may still have been useful.
              answer = answer ? `${answer}\n\n${copy}` : copy;
              patch({ failure, content: answer });
            } else if (event === 'done') {
              patch({ streaming: false, storedId: (data.messageId as string) ?? undefined });
            }
          }
        }

        patch({ streaming: false });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        patch({ content: genericError, failure: 'unknown', streaming: false });
      } finally {
        setPending(false);
        abort.current = null;
      }
    },
    [country, genericError, locale, pending],
  );

  /**
   * Delete this conversation, at the customer's request.
   *
   * The transcript is cleared locally either way: refusing to clear the screen
   * because the server call failed would leave the customer looking at the
   * thing they just asked to remove. The retention sweep is the backstop.
   */
  const forget = useCallback(async () => {
    const id = conversationId.current;
    setMessages([]);
    conversationId.current = null;
    if (!id) return;

    await fetch('/api/ai/conversation', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id, anonymousSessionId: anonymousSessionId() }),
    }).catch(() => undefined);
  }, []);

  const rate = useCallback(async (messageId: string, rating: 1 | -1) => {
    if (!conversationId.current) return;
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, conversationId: conversationId.current, rating }),
    }).catch(() => undefined);
  }, []);

  return { messages, pending, send, reset, rate, forget, conversationId };
}
