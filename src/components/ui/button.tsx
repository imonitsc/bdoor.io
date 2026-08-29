import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
    'rounded-[var(--radius-control)] transition-colors duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
    'disabled:pointer-events-none disabled:opacity-55',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        // The signature-gradient action. bg-primary stays underneath as the
        // paint-order fallback; hover lifts with a cobalt-tinted shadow and a
        // slight brightness shift (the gradient itself never changes), and
        // active presses back down for tactile feedback. Trailing arrow
        // icons nudge forward with the hover.
        primary: [
          'gradient-primary bg-primary text-on-primary shadow-xs',
          'transition-all duration-200 ease-out',
          'hover:-translate-y-0.5 hover:shadow-primary hover:brightness-110',
          'active:translate-y-0 active:scale-[0.98] active:brightness-100',
          '[&_svg:last-child]:transition-transform [&_svg:last-child]:duration-200',
          'hover:[&_svg:last-child]:translate-x-0.5',
        ].join(' '),
        secondary:
          'bg-surface text-ink border border-border-strong hover:bg-surface-sunken active:bg-surface-sunken shadow-xs transition-all duration-200 hover:border-[color:var(--bd-cobalt-200)] hover:shadow-sm',
        ghost: 'bg-transparent text-ink hover:bg-surface-sunken',
        subtle:
          'bg-primary-soft text-info hover:bg-[color-mix(in_srgb,var(--color-primary-soft)_80%,var(--color-primary)_20%)]',
        danger:
          'bg-danger text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_85%,black)] shadow-xs',
        inverse:
          'bg-surface text-ink hover:bg-[color-mix(in_srgb,white_90%,var(--color-primary))] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]',
        link: 'bg-transparent text-primary underline underline-offset-4 hover:text-primary-hover',
      },
      size: {
        // Minimum 44px tall targets on the sizes used for real actions.
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        md: 'h-11 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-5',
        inline: 'h-auto p-0 text-inherit',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}

export { buttonVariants };
