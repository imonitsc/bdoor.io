'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils/cn';

export function Progress({
  value,
  max = 100,
  label,
  className,
  tone = 'primary',
}: {
  value: number;
  max?: number;
  /** Required for a meaningful accessible name; rendered visually hidden if not shown. */
  label: string;
  className?: string;
  tone?: 'primary' | 'accent';
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const pct = max === 0 ? 0 : (clamped / max) * 100;

  return (
    <ProgressPrimitive.Root
      value={clamped}
      max={max}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-sunken', className)}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          tone === 'accent' ? 'bg-accent' : 'bg-primary',
        )}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
