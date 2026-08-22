import { useTranslations } from 'next-intl';

/** First focusable element on every page. Visible only when focused. */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  const t = useTranslations('common');
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-[var(--radius-control)] bg-surface-inverse px-4 py-2 text-sm font-medium text-ink-inverse focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
    >
      {t('skipToContent')}
    </a>
  );
}
