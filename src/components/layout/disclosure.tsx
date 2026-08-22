import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * The independence disclosure.
 *
 * Rendered in the footer, on every quote, at checkout and on partner/legal
 * surfaces. It exists once so the wording cannot drift between places.
 */
export function IndependenceDisclosure({
  variant = 'block',
  className,
}: {
  variant?: 'block' | 'inline' | 'inverse';
  className?: string;
}) {
  const t = useTranslations('brand');

  if (variant === 'inline') {
    return <p className={cn('text-muted text-xs leading-relaxed', className)}>{t('disclosure')}</p>;
  }

  return (
    <div
      className={cn(
        'flex gap-3 rounded-[var(--radius-card)] border p-4',
        variant === 'inverse'
          ? 'border-border-inverse bg-surface-inverse-soft'
          : 'border-border bg-surface-sunken',
        className,
      )}
    >
      <Info
        className={cn(
          'mt-0.5 size-4 shrink-0',
          variant === 'inverse' ? 'text-muted-inverse' : 'text-muted',
        )}
        aria-hidden="true"
      />
      <p
        className={cn(
          'text-xs leading-relaxed',
          variant === 'inverse' ? 'text-muted-inverse' : 'text-muted',
        )}
      >
        {t('disclosure')}
      </p>
    </div>
  );
}
