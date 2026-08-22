import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-muted" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="max-w-prose text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
