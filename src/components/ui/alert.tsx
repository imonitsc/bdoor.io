import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, Info, Lock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const alertVariants = cva('flex gap-3 rounded-[var(--radius-card)] border p-4 text-sm', {
  variants: {
    tone: {
      info: 'border-[color-mix(in_srgb,var(--color-info)_22%,transparent)] bg-info-soft text-ink',
      success:
        'border-[color-mix(in_srgb,var(--color-success)_22%,transparent)] bg-success-soft text-ink',
      warning:
        'border-[color-mix(in_srgb,var(--color-warning)_28%,transparent)] bg-warning-soft text-ink',
      danger:
        'border-[color-mix(in_srgb,var(--color-danger)_22%,transparent)] bg-danger-soft text-ink',
      neutral: 'border-border bg-surface-sunken text-ink',
      restricted: 'border-border-strong bg-surface-sunken text-ink',
    },
  },
  defaultVariants: { tone: 'info' },
});

const toneIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: ShieldAlert,
  neutral: Info,
  restricted: Lock,
} as const;

const toneColor = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-muted',
  restricted: 'text-ink',
} as const;

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  /** Assertive for validation failures; polite (default) for everything else. */
  live?: 'off' | 'polite' | 'assertive';
  icon?: React.ReactNode;
}

export function Alert({
  className,
  tone = 'info',
  title,
  children,
  live,
  icon,
  ...props
}: AlertProps) {
  const key = tone ?? 'info';
  const Icon = toneIcon[key];
  return (
    <div
      role={live === 'assertive' ? 'alert' : 'note'}
      {...(live && live !== 'off' ? { 'aria-live': live } : {})}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <span className={cn('mt-0.5 shrink-0', toneColor[key])} aria-hidden="true">
        {icon ?? <Icon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className="text-ink font-semibold">{title}</p> : null}
        {children ? <div className="text-ink/85 leading-relaxed">{children}</div> : null}
      </div>
    </div>
  );
}
