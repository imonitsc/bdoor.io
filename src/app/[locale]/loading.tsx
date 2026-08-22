'use client';

import { useTranslations } from 'next-intl';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

/**
 * This is a Client Component on purpose.
 *
 * `loading.tsx` never receives `params`, so it cannot call `setRequestLocale`.
 * Calling a server-side next-intl API here would make next-intl fall back to
 * reading request headers to work out the locale, and that single header read
 * opts every route under `[locale]` into dynamic rendering. Reading messages
 * from the client provider keeps the whole marketing site statically
 * renderable.
 */
export default function Loading() {
  const t = useTranslations('a11y');

  return (
    <div className="container-page py-16" role="status" aria-label={t('loadingRegion')}>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-2/3 max-w-lg" />
        <SkeletonText lines={3} className="max-w-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    </div>
  );
}
