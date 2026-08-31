'use client';

import { cn } from '@/lib/utils/cn';

/** Suggestions: short tappable questions, in the empty state and after answers. */

export function Suggestions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-wrap justify-center gap-2', className)} {...props} />;
}

export function Suggestion({
  suggestion,
  onClick,
  className,
  ...props
}: Omit<React.ComponentProps<'button'>, 'onClick'> & {
  suggestion: string;
  onClick: (suggestion: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(suggestion)}
      className={cn(
        'border-border bg-surface text-ink hover:border-primary hover:bg-primary-soft rounded-full border px-3.5 py-2 text-sm transition-colors',
        className,
      )}
      {...props}
    >
      {suggestion}
    </button>
  );
}
