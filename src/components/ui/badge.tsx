import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-sunken text-ink',
        info: 'border-[color-mix(in_srgb,var(--color-info)_25%,transparent)] bg-info-soft text-info',
        success:
          'border-[color-mix(in_srgb,var(--color-success)_25%,transparent)] bg-success-soft text-success',
        warning:
          'border-[color-mix(in_srgb,var(--color-warning)_25%,transparent)] bg-warning-soft text-warning',
        danger:
          'border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] bg-danger-soft text-danger',
        accent:
          'border-[color-mix(in_srgb,var(--color-accent)_25%,transparent)] bg-accent-soft text-accent-strong',
        inverse: 'border-border-inverse bg-surface-inverse-soft text-ink-inverse',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Rendered before the label. Status is never communicated by colour alone. */
  icon?: React.ReactNode;
}

export function Badge({ className, tone, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}

export { badgeVariants };
