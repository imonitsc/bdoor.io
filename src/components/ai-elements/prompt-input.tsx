'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowUp, Mic, MicOff, Square } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * PromptInput: the composer.
 *
 * A textarea that grows to six rows, submits on Enter (Shift+Enter for a new
 * line), swaps its send button for a stop control while a response streams,
 * and offers voice input only where the browser actually provides speech
 * recognition — the button simply does not render elsewhere.
 */

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function speechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type PromptInputStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export function PromptInput({
  value,
  onChange,
  onSubmit,
  onStop,
  status,
  placeholder,
  inputLabel,
  submitLabel,
  stopLabel,
  voiceLabel,
  voiceStopLabel,
  locale,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onStop?: () => void;
  status: PromptInputStatus;
  placeholder: string;
  inputLabel: string;
  submitLabel: string;
  stopLabel: string;
  voiceLabel: string;
  voiceStopLabel: string;
  locale: 'en' | 'bn';
  autoFocus?: boolean;
  className?: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recognizer = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  // Server renders no mic; the browser reveals one only where speech
  // recognition genuinely exists. useSyncExternalStore keeps hydration clean.
  const voiceAvailable = useSyncExternalStore(
    () => () => {},
    () => speechRecognition() !== null,
    () => false,
  );

  // Grow with content, capped; the cap keeps the transcript visible on phones.
  const resize = useCallback(() => {
    const node = textarea.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, []);
  useEffect(resize, [resize, value]);

  const busy = status === 'submitted' || status === 'streaming';

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSubmit(text);
  };

  const toggleVoice = () => {
    if (listening) {
      recognizer.current?.stop();
      return;
    }
    const Recognition = speechRecognition();
    if (!Recognition) return;
    const instance = new Recognition();
    instance.lang = locale === 'bn' ? 'bn-BD' : 'en-US';
    instance.interimResults = false;
    instance.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, i) => {
        const alternative = event.results[i]?.[0];
        return alternative?.transcript ?? '';
      })
        .join(' ')
        .trim();
      if (transcript) onChange(value ? `${value} ${transcript}` : transcript);
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => setListening(false);
    recognizer.current = instance;
    setListening(true);
    instance.start();
  };

  return (
    <form
      className={cn(
        'border-border-strong bg-surface focus-within:border-primary flex items-end gap-1.5 rounded-[var(--radius-panel)] border p-2 shadow-sm transition-colors',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label htmlFor="ask-bdoor-input" className="sr-only">
        {inputLabel}
      </label>
      <textarea
        id="ask-bdoor-input"
        ref={textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        maxLength={2000}
        rows={1}
        autoComplete="off"
        autoFocus={autoFocus}
        enterKeyHint="send"
        className="text-ink placeholder:text-muted max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none sm:text-sm"
      />

      {voiceAvailable ? (
        <button
          type="button"
          onClick={toggleVoice}
          aria-label={listening ? voiceStopLabel : voiceLabel}
          aria-pressed={listening}
          className={cn(
            'inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors',
            listening
              ? 'bg-danger text-white'
              : 'text-muted hover:bg-surface-sunken hover:text-ink',
          )}
        >
          {listening ? (
            <MicOff className="size-4" aria-hidden="true" />
          ) : (
            <Mic className="size-4" aria-hidden="true" />
          )}
        </button>
      ) : null}

      {busy && onStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label={stopLabel}
          className="bg-surface-sunken text-ink hover:bg-border inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors"
        >
          <Square className="size-3.5" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={busy || value.trim().length === 0}
          aria-label={submitLabel}
          className="gradient-primary bg-primary text-on-primary inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
