import { describe, expect, it } from 'vitest';
import { createTranslator } from 'next-intl';
import en from '@/i18n/messages/en.json';
import bn from '@/i18n/messages/bn.json';

describe('reminder notification title', () => {
  it.each([
    ['en', en],
    ['bn', bn],
  ])('renders a valid plural in %s', (locale, messages) => {
    const t = createTranslator({
      locale,
      messages: messages as never,
      namespace: 'workspace.compliance.reminder',
    });
    for (const count of [1, 2, 5]) {
      const rendered = t('title', { count });
      expect(rendered.length).toBeGreaterThan(0);
      expect(rendered).not.toContain('plural');
    }
    expect(t('title', { count: 1 })).not.toBe(t('title', { count: 5 }));
  });
});
