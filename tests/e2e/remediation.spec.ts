import { expect, test } from '@playwright/test';

/**
 * The remediation brief's own acceptance checks: no internal language on any
 * public sales page, one commercial source of truth visible on homepage and
 * pricing alike, truthful international routes, and an intentionally
 * composed page at every required viewport.
 */

const SALES_PAGES = [
  '/en',
  '/bn',
  '/en/pricing',
  '/en/international',
  '/en/international/united-states',
  '/en/international/united-kingdom',
  '/en/international/uae',
  '/en/international/singapore',
  '/en/partners',
  '/en/about',
];

/**
 * Internal-status language that must never reach a customer. Checked against
 * the rendered text, not the HTML: the localisation payload legitimately
 * contains workspace strings (a case's "Draft" status) that no public page
 * displays.
 */
const FORBIDDEN = [
  /\bdraft\b/i,
  /pending review/i,
  /awaiting professional review/i,
  /checkout stays disabled/i,
  /খসড়া/,
];

test.describe('no internal language on sales pages', () => {
  for (const path of SALES_PAGES) {
    test(`${path} shows no internal status words`, async ({ page }) => {
      await page.goto(path);
      const body = await page.locator('body').innerText();
      for (const pattern of FORBIDDEN) {
        expect(body, `${path} renders ${pattern}`).not.toMatch(pattern);
      }
      // The public brand is never title-case.
      expect(body).not.toContain('BDoor');
    });
  }
});

test.describe('one commercial source of truth', () => {
  test('homepage and pricing page show identical package labels', async ({ page }) => {
    const packages = [
      ['Solo Start', 'BDT 9,900 + official fees'],
      ['Limited Company', 'BDT 24,900 + RJSC fees'],
      ['Complete Launch', 'BDT 39,900 + official and third-party fees'],
    ] as const;

    for (const path of ['/en', '/en/pricing']) {
      await page.goto(path);
      for (const [name, label] of packages) {
        await expect(
          page.getByRole('heading', { name, exact: true }),
          `${name} missing on ${path}`,
        ).toBeVisible();
        await expect(page.getByText(label).first(), `${label} missing on ${path}`).toBeVisible();
      }
    }
  });

  test('the existing-business tab carries the other three packages', async ({ page }) => {
    await page.goto('/en/pricing');
    await page.getByRole('tab', { name: 'Existing business' }).click();
    await expect(page.getByRole('heading', { name: 'Compliance Check' })).toBeVisible();
    await expect(page.getByText('BDT 14,900', { exact: true })).toBeVisible();
    await expect(
      page.getByText('BDT 49,900/year + official, audit and specialist fees'),
    ).toBeVisible();
    await expect(page.getByText('From BDT 11,900/month')).toBeVisible();
  });

  test('the old 25,000 incorporation price is gone from public pages', async ({ page }) => {
    for (const path of [
      '/en',
      '/en/pricing',
      '/en/services/private-limited-company-incorporation',
    ]) {
      await page.goto(path);
      const body = await page.locator('body').innerText();
      expect(body, `${path} still shows BDT 25,000`).not.toMatch(/25,000|২৫,০০০/);
    }
  });
});

test.describe('international truthfulness', () => {
  test('every homepage country card links to its own route, without a price', async ({ page }) => {
    await page.goto('/en');

    const expected: Array<[string, string]> = [
      ['United States', '/en/international/united-states'],
      ['United Kingdom', '/en/international/united-kingdom'],
      ['United Arab Emirates', '/en/international/uae'],
      ['Singapore', '/en/international/singapore'],
    ];

    for (const [name, href] of expected) {
      // Scoped to main: the footer lists the same destinations.
      const link = page.locator('main').getByRole('link', { name, exact: true });
      await expect(link).toHaveAttribute('href', href);
    }

    // Register interest, and no currency figure anywhere near the cards.
    await expect(page.getByText('Register interest').first()).toBeVisible();
    const section = page.getByRole('heading', { name: 'Expanding beyond Bangladesh?' });
    await expect(section).toBeVisible();
    const cardsText = await page.locator('section', { has: section }).first().innerText();
    expect(cardsText).not.toMatch(/USD|GBP|AED|SGD|\$|£/);
  });

  test('a country page registers interest and publishes no price', async ({ page }) => {
    await page.goto('/en/international/united-states');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('United States');
    await expect(page.getByText('No price is published for this route yet')).toBeVisible();
    await expect(
      page.locator('main').getByRole('link', { name: /Register interest/ }),
    ).toHaveAttribute('href', /\/en\/contact\?interest=united-states/);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/USD\s?\d|\$\d/);
  });
});

test.describe('responsive composition', () => {
  const VIEWPORTS = [
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ] as const;

  for (const [width, height] of VIEWPORTS) {
    test(`no horizontal overflow at ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      for (const path of ['/en', '/en/pricing', '/en/international/united-states']) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('the desktop nav appears at xl and the drawer below it', async ({ page }) => {
    await page.goto('/en');

    // 1280px: four primary groups visible, menu button absent.
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link', { name: 'Bangladesh' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'International' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Packages' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Resources' })).toBeVisible();
    expect(await nav.first().getByRole('link').count()).toBe(4);
    await expect(page.locator('button[aria-controls="mobile-navigation"]')).toBeHidden();

    // 1024px (below xl): the bar hides, the drawer carries everything.
    await page.setViewportSize({ width: 1024, height: 768 });
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const drawer = page.locator('#mobile-navigation');
    await expect(drawer.getByRole('link', { name: 'Bangladesh' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Partners' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Contact' })).toBeVisible();
  });
});
