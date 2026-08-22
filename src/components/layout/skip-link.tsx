import { useTranslations } from 'next-intl';

/** First focusable element on every page. Visible only when focused. */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  const t = useTranslations('common');
  return (
    <a
      href={`#${targetId}`}
      className="bg-surface-inverse text-ink-inverse sr-only rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]"
    >
      {t('skipToContent')}
    </a>
  );
}
