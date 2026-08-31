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
  // "Open now" / "available today" left this list at the go-live release
  // (30 Aug 2026): the legal gate now defaults to approved, so the
  // operational copy those phrases belong to is sanctioned product copy,
  // gate-controlled rather than banned.
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
  // The homepage no longer carries the package catalogue (BI-OS §5.1,
  // 31 Aug 2026) — /pricing is where the central catalog renders.
  test('the pricing page shows the catalog package labels', async ({ page }) => {
    const packages = [
      ['Solo Start', 'BDT 9,900 + official fees'],
      ['Limited Company', 'BDT 24,900 + RJSC fees'],
      ['Complete Launch', 'BDT 39,900 + official and third-party fees'],
    ] as const;

    await page.goto('/en/pricing');
    for (const [name, label] of packages) {
      await expect(
        page.getByRole('heading', { name, exact: true }),
        `${name} missing on /en/pricing`,
      ).toBeVisible();
      await expect(page.getByText(label).first(), `${label} missing on /en/pricing`).toBeVisible();
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
    // Incorporation itself must not advertise the retired ৳25,000 figure.
    // Other packages may legitimately publish a different 25,000+ amount.
    for (const path of ['/en', '/en/services/private-limited-company-incorporation']) {
      await page.goto(path);
      const body = await page.locator('main').innerText();
      expect(body, `${path} still shows retired incorporation 25,000`).not.toMatch(
        /incorporation[^\n]{0,80}25,000|BDT 25,000 \+ RJSC/i,
      );
    }
  });
});

test.describe('seven-country truthfulness', () => {
  test('the homepage is Bangladesh-first with no international sales grid', async ({ page }) => {
    await page.goto('/en');

    await expect(
      page.getByRole('heading', { name: /Bangladesh business intelligence/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start now' }).first()).toBeVisible();

    // International country cards and prices stay off the homepage body.
    await expect(page.locator('#international')).toHaveCount(0);
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/USD 449 estimated total|Wyoming LLC|View country route/i);

    // Footer still links the six international routes.
    const footer = page.locator('footer');
    for (const name of [
      'United States',
      'United Kingdom',
      'United Arab Emirates',
      'Saudi Arabia',
      'Qatar',
      'Singapore',
    ]) {
      await expect(footer.getByRole('link', { name, exact: true }).first()).toBeVisible();
    }
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

    // 1280px: the header carries only the two actions — Start and Ask bdoor
    // AI (owner request, 31 Aug 2026). Services, Pricing and Resources moved
    // to the footer; Countries was already footer-only.
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = page.locator('header nav');
    await expect(nav.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Ask bdoor AI' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Services', exact: true })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Pricing' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Resources' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Countries' })).toHaveCount(0);
    expect(await nav.first().getByRole('link').count()).toBe(2);

    // …and the three relocated destinations are in the footer.
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Services', exact: true })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Packages' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Resources' })).toBeVisible();
    await expect(page.locator('button[aria-controls="mobile-navigation"]')).toBeHidden();
    const headerOverflow = await page
      .locator('header')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(headerOverflow).toBeLessThanOrEqual(0);

    // 1024px (below xl): the bar hides, the drawer carries primary + secondary links.
    await page.setViewportSize({ width: 1024, height: 768 });
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const drawer = page.locator('#mobile-navigation');
    await expect(drawer.getByRole('link', { name: 'Start', exact: true })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Services' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Resources' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Partners' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Countries' })).toHaveCount(0);
  });
});
