import * as React from 'react';
import { cn } from '@/lib/utils/cn';

const controlBase = [
  'w-full rounded-[var(--radius-control)] border border-border-strong bg-surface',
  'px-3 text-sm text-ink placeholder:text-muted',
  'transition-colors focus-visible:border-primary focus-visible:outline-2',
  'focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus)]',
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-70',
  'aria-[invalid=true]:border-danger',
].join(' ');

export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return <input type={type} className={cn(controlBase, 'h-11', className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      rows={rows}
      className={cn(controlBase, 'py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
}

export function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select className={cn(controlBase, 'h-11 pe-8', className)} {...props}>
      {children}
    </select>
  );
}

export { controlBase };
