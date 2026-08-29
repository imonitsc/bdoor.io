import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Section({
  className,
  tone = 'canvas',
  as: Comp = 'section',
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  tone?: 'canvas' | 'surface' | 'inverse' | 'sunken';
  as?: React.ElementType;
}) {
  return (
    <Comp
      className={cn(
        'py-16 md:py-20 lg:py-24',
        tone === 'surface' && 'bg-surface',
        tone === 'sunken' && 'bg-surface-sunken',
        tone === 'inverse' && 'bg-surface-inverse text-ink-inverse',
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'start',
  inverse = false,
  as: Heading = 'h2',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: 'start' | 'center';
  inverse?: boolean;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex max-w-2xl flex-col gap-3',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        /*
          The section-label system: every section opens with the same pill —
          pulsing dot, mono uppercase, tinted border — so scrolling has a
          visible rhythm and the label reads as a designed element rather
          than stray text. The dot is decorative; the pulse dies under
          prefers-reduced-motion via the global kill-switch.
        */
        <p
          className={cn(
            'inline-flex w-fit items-center gap-2.5 rounded-[var(--radius-pill)] border px-4 py-1.5',
            'font-mono text-xs tracking-[0.15em] uppercase',
            inverse
              ? 'border-[color:var(--bd-turquoise-500)]/35 bg-white/5 text-[color:var(--bd-turquoise-500)]'
              : 'bg-primary-soft text-info border-[color:var(--bd-cobalt-200)]',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'animate-pulse-dot size-1.5 rounded-full',
              inverse ? 'bg-[color:var(--bd-turquoise-500)]' : 'bg-primary',
            )}
          />
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={cn(
          'text-3xl leading-tight md:text-4xl',
          inverse ? 'text-ink-inverse' : 'text-ink',
        )}
      >
        {title}
      </Heading>
      {body ? (
        <div
          className={cn('text-base leading-relaxed', inverse ? 'text-muted-inverse' : 'text-muted')}
        >
          {body}
        </div>
      ) : null}
    </div>
  );
}
