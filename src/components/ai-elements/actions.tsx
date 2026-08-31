'use client';

import { useState } from 'react';
import { Check, Copy, RefreshCcw, ThumbsDown, ThumbsUp } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/** Actions: the small controls under a finished answer. */

export function Actions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mt-2 flex flex-wrap items-center gap-1', className)} {...props} />;
}

export function Action({
  label,
  onClick,
  pressed,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        'text-muted hover:bg-surface-sunken hover:text-ink inline-flex size-8 items-center justify-center rounded-[var(--radius-control)] transition-colors',
        pressed && 'text-primary',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CopyAction({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Action
      label={copied ? copiedLabel : label}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2_000);
        });
      }}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </Action>
  );
}

export function RegenerateAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Action label={label} onClick={onClick}>
      <RefreshCcw className="size-3.5" aria-hidden="true" />
    </Action>
  );
}

export function FeedbackActions({
  upLabel,
  downLabel,
  thanksLabel,
  onRate,
}: {
  upLabel: string;
  downLabel: string;
  thanksLabel: string;
  onRate: (rating: 1 | -1) => void;
}) {
  const [rated, setRated] = useState<1 | -1 | null>(null);
  if (rated) return <span className="text-muted px-1 text-xs">{thanksLabel}</span>;
  return (
    <>
      <Action
        label={upLabel}
        onClick={() => {
          setRated(1);
          onRate(1);
        }}
      >
        <ThumbsUp className="size-3.5" aria-hidden="true" />
      </Action>
      <Action
        label={downLabel}
        onClick={() => {
          setRated(-1);
          onRate(-1);
        }}
      >
        <ThumbsDown className="size-3.5" aria-hidden="true" />
      </Action>
    </>
  );
}
