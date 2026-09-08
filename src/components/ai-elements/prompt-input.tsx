'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowUp, Mic, MicOff, Square } from 'lucide-react';

import {
  appendTranscript,
  finalTranscript,
  voiceErrorKey,
  type SpeechResultEvent,
  type VoiceErrorKey,
} from '@/features/ai/voice-input';
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
  /** Off by default, which ends recognition at the first pause. */
  continuous: boolean;
  start: () => void;
  stop: () => void;
  /** Stops without delivering pending results; reports the `aborted` code. */
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
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
  voiceErrorLabels,
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
  /** One line per failure the browser can report. */
  voiceErrorLabels: Record<VoiceErrorKey, string>;
  locale: 'en' | 'bn';
  autoFocus?: boolean;
  className?: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recognizer = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<VoiceErrorKey | null>(null);
  // Speech arrives asynchronously, long after the render that started it. A
  // ref is what lets the handler append to the CURRENT text instead of to a
  // snapshot taken when the microphone opened.
  const latestValue = useRef(value);
  useEffect(() => {
    latestValue.current = value;
  }, [value]);
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
    // Sending the question ends the dictation of it; otherwise the microphone
    // stays open and the next phrase lands in an already-sent box.
    if (listening) stopListening();
    onSubmit(text);
  };

  // A live microphone must not outlive the composer.
  useEffect(() => {
    return () => {
      recognizer.current?.abort();
      recognizer.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    recognizer.current?.stop();
  }, []);

  const toggleVoice = () => {
    if (listening) {
      stopListening();
      return;
    }
    const Recognition = speechRecognition();
    if (!Recognition) return;

    const instance = new Recognition();
    instance.lang = locale === 'bn' ? 'bn-BD' : 'en-US';
    instance.interimResults = false;
    // Without this, recognition ends at the first pause and a dictated
    // sentence stops halfway through.
    instance.continuous = true;

    instance.onresult = (event) => {
      const transcript = finalTranscript(event);
      if (transcript) onChange(appendTranscript(latestValue.current, transcript));
    };
    instance.onend = () => setListening(false);
    instance.onerror = (event) => {
      setListening(false);
      setVoiceError(voiceErrorKey(event.error));
    };

    recognizer.current = instance;
    setVoiceError(null);
    setListening(true);
    instance.start();
  };

  return (
    <form
      className={cn(
        'border-border-strong bg-surface focus-within:border-primary flex flex-wrap items-end gap-1.5 rounded-[var(--radius-panel)] border p-2 shadow-sm transition-colors',
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

      {/* Why nothing happened. Previously every failure — a denied
          permission, a muted device, being offline — looked identical to a
          button that did nothing. */}
      {voiceError ? (
        <p role="status" className="text-danger w-full px-2 pb-1 text-xs">
          {voiceErrorLabels[voiceError]}
        </p>
      ) : null}
    </form>
  );
}
