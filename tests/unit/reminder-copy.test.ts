import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import en from '@/i18n/messages/en.json';
import bn from '@/i18n/messages/bn.json';

/**
 * The reminder notification title is an ICU plural rendered at dispatch time,
 * in both locales, and stored on the notification row. A malformed pattern
 * would surface only inside the cron run, where nobody is watching — so the
 * catalogue is exercised here instead.
 */

const LOCALES: ReadonlyArray<[string, typeof en]> = [
  ['en', en],
  ['bn', bn as typeof en],
];

describe('reminder notification title', () => {
  it.each(LOCALES)('renders a valid plural in %s', (locale, messages) => {
    const t = createTranslator({
      locale,
      messages,
      namespace: 'workspace.compliance.reminder',
    });

    for (const count of [1, 2, 5]) {
      const rendered = t('title', { count });
      expect(rendered.length).toBeGreaterThan(0);
      // An unparsed pattern would leak the ICU syntax into the notification.
      expect(rendered).not.toContain('plural');
    }

    // Proves the plural actually selects rather than returning one fixed arm.
    expect(t('title', { count: 1 })).not.toBe(t('title', { count: 5 }));
  });
});
