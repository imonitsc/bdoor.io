'use client';

import { useTranslations } from 'next-intl';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

/**
 * Loading state for the workspace only.
 *
 * There is deliberately no `loading.tsx` at the `[locale]` root: a Suspense
 * boundary that high forces the response to start streaming, which flushes a
 * 200 before `notFound()` can set the status — turning every 404 on the public
 * site into a soft 404. The workspace is noindex, so streaming here is free.
 *
 * It is a Client Component for the same reason as `not-found.tsx`: it receives
 * no params, so a server-side translation lookup would read request headers.
 */
export default function Loading() {
  const t = useTranslations('a11y');

  return (
    <div className="flex flex-col gap-6" role="status" aria-label={t('loadingRegion')}>
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <SkeletonText lines={2} className="max-w-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
