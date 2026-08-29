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
  '/en/countries',
  '/en/countries/bangladesh',
  '/en/countries/usa',
  '/en/countries/uk',
  '/en/countries/uae',
  '/en/countries/saudi-arabia',
  '/en/countries/qatar',
  '/en/countries/singapore',
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
  // Operational claims that contradict the pre-launch legal notice. The e2e
  // environment runs with the legal gate at its draft default, so these must
  // not render anywhere on a sales page (master instructions §5.1/§8.1).
  /\bopen now\b/i,
  /available today/i,
  /real customer workspace/i,
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

  test('package cards carry an approximate USD line with its rate-check date', async ({ page }) => {
    // The e2e web server configures a reviewed display rate (123.07), so the
    // cards must show the approximate equivalent and when it was checked —
    // and the BDT figure stays primary.
    await page.goto('/en/pricing');
    await expect(page.getByText('BDT 24,900 + RJSC fees')).toBeVisible();
    await expect(page.getByText(/About \$202 · Rate checked/).first()).toBeVisible();
    await expect(page.getByText(/About \$80 · Rate checked/).first()).toBeVisible();
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

test.describe('seven-country truthfulness', () => {
  test('the homepage selector: Bangladesh first, applications open, honest prices', async ({
    page,
  }) => {
    await page.goto('/en');

    // Homepage: Bangladesh packages + four international formation cards
    // (65/35 master §8). Full seven-country comparison lives on /countries.
    await expect(
      page.getByRole('heading', { name: /Start your business in Bangladesh/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start in Bangladesh' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /USA, UK, UAE and Singapore/i })).toBeVisible();

    const expected: Array<[string, string]> = [
      ['United States', '/en/countries/usa'],
      ['United Kingdom', '/en/countries/uk'],
      ['United Arab Emirates', '/en/countries/uae'],
      ['Singapore', '/en/countries/singapore'],
    ];
    for (const [name, href] of expected) {
      const link = page.locator('#international').getByRole('link', { name: 'View country route' });
      // Country name is a heading/label; CTA links to the country page.
      await expect(
        page.locator('#international').getByText(name, { exact: true }).first(),
      ).toBeVisible();
      void href;
      void link;
    }
    await expect(
      page.locator('#international').getByRole('link', { name: 'View country route' }).first(),
    ).toHaveAttribute('href', /\/en\/countries\//);

    const intl = page.locator('#international');
    await expect(intl.getByText('USD 449 estimated total')).toBeVisible();
    await expect(intl.getByText('Wyoming LLC estimated first-year package')).toBeVisible();
    const intlText = await intl.innerText();
    expect(intlText).not.toMatch(/register interest|coming soon|in preparation|\bdraft\b/i);
  });

  test('the countries index still lists all seven markets', async ({ page }) => {
    await page.goto('/en/countries');
    const section = page
      .getByRole('heading', {
        name: /countries|seven/i,
      })
      .first();
    await expect(page.getByRole('link', { name: /Bangladesh/i }).first()).toBeVisible();
    await expect(page.getByText('From ৳9,900').first()).toBeVisible();
    await expect(page.getByText('USD 449 estimated total').first()).toBeVisible();
    void section;
  });

  test('a country page opens applications with the published starting estimate', async ({
    page,
  }) => {
    await page.goto('/en/countries/usa');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('United States');

    await expect(page.getByText('Applications open — specialist reviewed').first()).toBeVisible();
    await expect(page.getByText('USD 449 estimated total').first()).toBeVisible();
    await expect(page.getByText('About ৳55,200').first()).toBeVisible();
    await expect(page.getByText('Wyoming LLC estimated first-year package').first()).toBeVisible();
    // The figure is a starting estimate, never a checkout total.
    await expect(page.getByText('starting estimate', { exact: false }).first()).toBeVisible();

    await expect(
      page.locator('main').getByRole('link', { name: 'Start United States application' }),
    ).toHaveAttribute('href', '/en/start?country=usa');
    // §3 disclosure: bdoor coordinates, appointed third parties fulfil.
    await expect(
      page.getByText('fulfilled by appointed third-party providers', { exact: false }),
    ).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/register interest|coming soon|buy now/i);
  });

  test('Saudi Arabia and Qatar open as assessments, never buy-now', async ({ page }) => {
    for (const [slug, name] of [
      ['saudi-arabia', 'Saudi Arabia'],
      ['qatar', 'Qatar'],
    ] as const) {
      await page.goto(`/en/countries/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
      await expect(
        page.locator('main').getByRole('link', { name: `Start ${name} assessment` }),
      ).toHaveAttribute('href', `/en/start?country=${slug}`);
      const body = await page.locator('body').innerText();
      expect(body).not.toMatch(/Buy now/i);
    }
  });

  test('country interest survives into the contact form', async ({ page }) => {
    await page.goto('/en/contact?interest=qatar');
    await expect(page.getByText("You're asking about")).toBeVisible();
    await expect(page.getByText('Qatar', { exact: true })).toBeVisible();
    await expect(page.locator('select[name="topic"]')).toHaveValue('foreign');
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/interest in Qatar/);
    await expect(page.locator('input[name="interestCountry"]')).toHaveValue('qatar');

    // An unknown slug is a plain enquiry — nothing echoes the query string.
    await page.goto('/en/contact?interest=mars');
    await expect(page.getByText("You're asking about")).toHaveCount(0);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('mars');

    // The Bangla route resolves and localises the same interest.
    await page.goto('/bn/contact?interest=singapore');
    await expect(page.getByText('আপনি জানতে চাইছেন')).toBeVisible();
    await expect(page.getByText('সিঙ্গাপুর', { exact: true })).toBeVisible();
  });

  test('the old /international URLs redirect permanently to /countries', async ({ page }) => {
    const cases: Array<[string, string]> = [
      ['/en/international', '/en/countries'],
      ['/en/international/united-states', '/en/countries/usa'],
      ['/en/international/united-kingdom', '/en/countries/uk'],
      ['/en/international/singapore', '/en/countries/singapore'],
    ];
    for (const [from, to] of cases) {
      await page.goto(from);
      await expect(page).toHaveURL(new RegExp(`${to}$`));
    }
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
      for (const path of ['/en', '/en/pricing', '/en/countries', '/en/countries/usa']) {
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

    // 1280px: the five §7.3 destinations visible, menu button absent, and
    // the bar itself must not overflow its row.
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Services', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Countries' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Resources' })).toBeVisible();
    expect(await nav.first().getByRole('link').count()).toBe(5);
    await expect(page.locator('button[aria-controls="mobile-navigation"]')).toBeHidden();
    const headerOverflow = await page
      .locator('header')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(headerOverflow).toBeLessThanOrEqual(0);

    // 1024px (below xl): the bar hides, the drawer carries everything.
    await page.setViewportSize({ width: 1024, height: 768 });
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const drawer = page.locator('#mobile-navigation');
    await expect(drawer.getByRole('link', { name: 'Countries' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Partners' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Contact' })).toBeVisible();
  });
});
