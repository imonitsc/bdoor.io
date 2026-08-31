'use client';

import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * Loader: the truthful stage indicator.
 *
 * Renders the label the server just reported — understanding, checking
 * sources, preparing — and nothing speculative. The server writes each stage
 * only when that work actually begins, so this component never has to guess.
 */
export function Loader({ label, className }: { label: string; className?: string }) {
  return (
    <p className={cn('text-muted flex items-center gap-2 text-sm', className)} role="status">
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}
