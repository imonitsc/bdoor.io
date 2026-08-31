'use client';

import { BookOpenText, ChevronDown, ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * Sources: the citations under an answer.
 *
 * Collapsed to a one-line trigger by default so long source lists never bury
 * the conversation; open, each source shows its institution, reference,
 * provision, page and dates, with the official URL clickable.
 */

export function Sources({ className, ...props }: React.ComponentProps<'details'>) {
  return (
    <details
      className={cn('border-border group mt-3 rounded-[var(--radius-control)] border', className)}
      {...props}
    />
  );
}

export function SourcesTrigger({
  count,
  label,
  className,
}: {
  count: number;
  label: string;
  className?: string;
}) {
  return (
    <summary
      className={cn(
        'text-muted hover:text-ink flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium select-none [&::-webkit-details-marker]:hidden',
        className,
      )}
    >
      <BookOpenText className="size-3.5" aria-hidden="true" />
      {label} ({count})
      <ChevronDown
        className="ms-auto size-3.5 transition-transform group-open:rotate-180"
        aria-hidden="true"
      />
    </summary>
  );
}

export function SourcesContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('border-border space-y-1.5 border-t px-3 py-2', className)} {...props} />;
}

export function Source({
  index,
  title,
  href,
  meta,
  className,
}: {
  index: number;
  title: string;
  href: string | null;
  meta: string[];
  className?: string;
}) {
  return (
    <li className={cn('text-xs leading-relaxed', className)}>
      <span className="text-muted tabular-nums">[{index}]</span>{' '}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-primary-hover underline underline-offset-2"
        >
          {title}
          <ExternalLink className="ms-0.5 inline size-3" aria-hidden="true" />
        </a>
      ) : (
        <span className="text-ink">{title}</span>
      )}
      {meta.length ? <span className="text-muted"> · {meta.join(' · ')}</span> : null}
    </li>
  );
}
