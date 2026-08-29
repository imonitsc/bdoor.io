import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility checks on the routes a visitor actually has to get through.
 *
 * WCAG 2.2 AA is the target. Automated testing cannot prove conformance, but a
 * clean axe run on these pages rules out the whole class of defects it can see.
 */
const PAGES = [
  { name: 'homepage', path: '/en' },
  { name: 'homepage (Bangla)', path: '/bn' },
  { name: 'services index', path: '/en/services' },
  { name: 'service detail', path: '/en/services/private-limited-company-incorporation' },
  { name: 'pricing', path: '/en/pricing' },
  { name: 'countries overview', path: '/en/countries' },
  { name: 'bangladesh country page', path: '/en/countries/bangladesh' },
  { name: 'international country', path: '/en/countries/usa' },
  { name: 'partners', path: '/en/partners' },
  { name: 'questionnaire', path: '/en/start' },
  { name: 'sign in', path: '/en/login' },
  { name: 'sign up', path: '/en/signup' },
  { name: 'contact', path: '/en/contact' },
  { name: 'terms', path: '/en/terms' },
];

for (const target of PAGES) {
  test(`${target.name} has no detectable accessibility violations`, async ({ page }) => {
    await page.goto(target.path);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    ).toEqual([]);
  });
}

test.describe('keyboard and focus', () => {
  test('the first tab stop is a working skip link', async ({ page }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toHaveText(/Skip to main content/);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });

  test('the mobile menu is reachable and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/en');

    // Located by `aria-controls`, not by name: the accessible name flips to
    // "Close menu" once the panel is open, which is the behaviour under test.
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    await expect(toggle).toHaveAccessibleName('Open menu');

    await toggle.click();
    await expect(page.locator('#mobile-navigation')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAccessibleName('Close menu');

    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-navigation')).toHaveCount(0);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('every page has exactly one h1', async ({ page }) => {
    for (const target of PAGES) {
      await page.goto(target.path);
      expect(await page.locator('h1').count(), `${target.name}`).toBe(1);
    }
  });

  test('does not scroll horizontally at any target width', async ({ page }) => {
    for (const width of [375, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/en', '/en/services', '/en/pricing', '/en/start']) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });
});
