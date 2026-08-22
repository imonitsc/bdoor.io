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
        'border-border-strong bg-surface flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <span
          className="bg-surface-sunken text-muted flex size-11 items-center justify-center rounded-full"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <p className="text-ink text-base font-medium">{title}</p>
      {description ? <p className="text-muted max-w-prose text-sm">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
