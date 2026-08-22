'use client';

import { useTranslations } from 'next-intl';
import { Compass } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { MARKETING_ROUTES } from '@/lib/navigation';

/**
 * Client Component for the same reason as `loading.tsx`: `not-found.tsx`
 * receives no `params`, so a server-side translation lookup here would read
 * request headers and force every route under `[locale]` to render dynamically.
 */
export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <span
        className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-muted"
        aria-hidden="true"
      >
        <Compass className="size-6" />
      </span>
      <h1 className="text-3xl leading-tight text-ink md:text-4xl">{t('notFoundTitle')}</h1>
      <p className="max-w-md text-base leading-relaxed text-muted">{t('notFoundBody')}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={MARKETING_ROUTES.home}>{t('notFoundHome')}</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href={MARKETING_ROUTES.services}>{t('notFoundServices')}</Link>
        </Button>
      </div>
    </div>
  );
}
