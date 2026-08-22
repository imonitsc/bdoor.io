'use client';

import { useTransition } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Languages } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { localeLabels, locales, type Locale } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

/**
 * Switching language keeps you on the same page with the same query and route
 * params, so a half-finished questionnaire step is not lost.
 */
export function LocaleSwitcher({ inverse = false }: { inverse?: boolean }) {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- pathname is a valid route with its current params
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('languageLabel')}
        disabled={isPending}
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
          inverse
            ? 'text-ink-inverse hover:bg-surface-inverse-soft'
            : 'text-ink hover:bg-surface-sunken',
          isPending && 'opacity-60',
        )}
      >
        <Languages className="size-4" aria-hidden="true" />
        <span>{localeLabels[locale].native}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => change(option)}
            lang={option === 'bn' ? 'bn-BD' : 'en'}
          >
            <Check
              className={cn('size-4', option === locale ? 'opacity-100' : 'opacity-0')}
              aria-hidden="true"
            />
            <span>{localeLabels[option].native}</span>
            {option === locale ? <span className="sr-only">({t('languageLabel')})</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
