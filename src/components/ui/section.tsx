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
        <p
          className={cn(
            'text-xs font-semibold tracking-[0.12em] uppercase',
            inverse ? 'text-[color:var(--bd-teal-500)]' : 'text-accent-strong',
          )}
        >
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
