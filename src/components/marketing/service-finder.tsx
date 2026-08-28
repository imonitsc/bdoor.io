'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { FINDER_INTENTS } from '@/content/directory/finder-intents';
import { pickLocalized } from '@/features/directory/types';
import type { Locale } from '@/features/catalog/types';

export function ServiceFinder({ locale }: { locale: Locale }) {
  const t = useTranslations('home.finder');

  return (
    <nav aria-label={t('title')}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FINDER_INTENTS.map((intent) => (
          <li key={intent.id}>
            <Link
              href={intent.href}
              className="border-border bg-surface hover:border-primary flex min-h-[3.25rem] items-center justify-between gap-3 rounded-[var(--radius-card)] border px-4 py-3 text-sm font-medium transition-colors duration-150 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              <span className="text-ink">{pickLocalized(intent.label, locale)}</span>
              <ArrowRight className="text-muted size-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
