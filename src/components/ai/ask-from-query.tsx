'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { AskBdoorPanel } from './ask-bdoor-panel';

/**
 * The /ask page's client entry: reads `?q=` (the homepage composer and the
 * starter chips arrive with one) and seeds the panel with it, which sends it
 * on mount. Reading the query on the client, behind Suspense, keeps /ask
 * statically rendered — the shell paints from the CDN and the question fires
 * the moment hydration lands, instead of every visit paying a server render.
 */

function PanelWithQuery({ locale }: { locale: 'en' | 'bn' }) {
  const q = useSearchParams().get('q')?.trim().slice(0, 2_000) ?? '';
  return (
    <AskBdoorPanel locale={locale} variant="page" autoFocus initialQuestion={q || undefined} />
  );
}

export function AskFromQuery({ locale }: { locale: 'en' | 'bn' }) {
  return (
    // The fallback is the same panel without the seed: visually identical
    // during prerender, replaced at hydration before anything is typed.
    <Suspense fallback={<AskBdoorPanel locale={locale} variant="page" autoFocus />}>
      <PanelWithQuery locale={locale} />
    </Suspense>
  );
}
