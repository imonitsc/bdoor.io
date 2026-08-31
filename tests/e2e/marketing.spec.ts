import { expect, test } from '@playwright/test';

/**
 * Public site journeys.
 *
 * These run against a production build with no Supabase configured, which is
 * deliberate: the marketing site must work from the bundled catalog snapshot,
 * so a misconfigured deployment shows real content rather than a blank page.
 */
test.describe('marketing site', () => {
  test('sends a bare visit to a locale', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/(en|bn)$/);
  });

  test('shows the hero and the independence disclosure', async ({ page }) => {
    await page.goto('/en');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Bangladesh business intelligence, from first question to next action.',
    );
    await expect(page.getByRole('link', { name: 'Start now' }).first()).toBeVisible();
    await expect(
      page.getByText('bdoor is not a government authority or law firm', { exact: false }),
    ).toBeVisible();
    // Operating entity is disclosed in the footer © line only — not the hero.
    await expect(page.locator('main').getByText('bdoor compliance ltd')).toHaveCount(0);
    await expect(
      page.locator('footer').getByText('bdoor compliance ltd', { exact: false }),
    ).toBeVisible();
  });

  test('the hero shows the founder photograph, uncropped', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('#international')).toHaveCount(0);
    // The workspace preview left the homepage (owner request, 31 Aug 2026).
    await expect(page.getByText('Product preview — sample data')).toHaveCount(0);

    const hero = page.locator('img[src*="bdoor-homepage-hero-large"]');
    await expect(hero).toHaveCount(1);
    await expect(hero).toBeVisible();

    // `contain`, not `cover`: the subject reaches every edge of the artboard,
    // so a crop cuts the raised hand, the laptop or the interface cards.
    await expect(hero).toHaveCSS('object-fit', 'contain');
    await expect(hero).toHaveAttribute('src', /_next\/image/);
    expect(await hero.getAttribute('loading')).not.toBe('lazy');

    // Markup-only assertions pass against a 404, so require a real decode.
    const decoded = await hero.evaluate(
      (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
    );
    expect(decoded, 'the hero photograph did not decode').toBe(true);
  });

  test('the H1 is fully visible and the hero CTA precedes the image on a phone', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    const h1Box = await h1.boundingBox();
    const header = await page.locator('header').first().boundingBox();
    expect(h1Box).not.toBeNull();
    expect(h1Box!.y, 'the H1 sits under the header').toBeGreaterThanOrEqual(
      header ? header.y + header.height : 0,
    );

    const main = page.locator('main');
    const cta = await main.getByTestId('home-hero-start').boundingBox();
    const imageSlot = await main
      .locator('img[src*="bdoor-homepage-hero-large"]')
      .first()
      .boundingBox();
    expect(cta).not.toBeNull();
    expect(imageSlot).not.toBeNull();
    expect(cta!.y).toBeLessThan(imageSlot!.y);
    expect(cta!.height).toBeGreaterThanOrEqual(44);
  });

  test('renders no raw translation-key path on the key pages', async ({ page }) => {
    // next-intl renders a missing message lookup as the key path itself
    // ("home.process.steps.one.title"). That shipped once, on /how-it-works,
    // because nothing asserted its absence; this sweep does, in both locales.
    const RAW_KEY =
      /\b(?:home|nav|start|packages|products|countries|international|contact|footer|legal|pricingPage|howItWorksPage|admin)\.[A-Za-z_]+(?:\.[A-Za-z_]+)+\b/;
    const paths = [
      '',
      '/how-it-works',
      '/countries',
      '/countries/qatar',
      '/pricing',
      '/contact',
      '/products/start',
      '/products/comply',
    ];

    for (const locale of ['en', 'bn'] as const) {
      for (const path of paths) {
        await page.goto(`/${locale}${path}`);
        const text = await page.locator('body').innerText();
        expect(text, `raw translation key rendered on /${locale}${path}`).not.toMatch(RAW_KEY);
      }
    }
  });

  test('how-it-works shows the four operational steps, not key paths', async ({ page }) => {
    await page.goto('/en/how-it-works');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const body = await page.locator('main').innerText();
    expect(body).toMatch(/quote|assessment|specialist|compliance/i);
    expect(body).not.toMatch(/\bhome\.process\./);
  });

  test('never promises approval', async ({ page }) => {
    await page.goto('/en');
    const body = (await page.locator('body').innerText()).toLowerCase();

    expect(body).not.toContain('guaranteed approval');
    expect(body).not.toContain('instant approval');
    expect(body).not.toContain('government authorized');
  });

  test('the two real product pages resolve and stay honest', async ({ page }) => {
    // Only genuinely operating products get a page (BI-OS §5.1): Start and
    // Comply. Books/Address/Connect must 404 — an unbuilt product presented
    // as available is the failure this test exists to prevent.
    for (const [path, claim] of [
      ['/en/products/start', /does not submit applications to any authority automatically/i],
      ['/en/products/comply', /not an official government good-standing status/i],
    ] as const) {
      const response = await page.goto(path);
      expect(response?.ok(), path).toBe(true);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(claim)).toBeVisible();
      const body = (await page.locator('body').innerText()).toLowerCase();
      // 'guaranteed approval', not bare 'guaranteed': the footer's honest
      // disclosure legitimately says approval is NOT guaranteed.
      expect(body, path).not.toMatch(/autopilot|guaranteed approval|coming soon/);
    }

    for (const missing of ['/en/products/books', '/en/products/address', '/en/products/connect']) {
      const response = await page.goto(missing);
      expect(response?.status(), missing).toBe(404);
    }
  });

  test('every header link resolves', async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    await page.goto('/en');
    const links = await page
      .locator('header nav a')
      .evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href')).filter(Boolean),
      );

    // Two links since the header slimmed to Start + Ask bdoor AI (31 Aug 2026).
    expect(links.length).toBeGreaterThan(1);
    for (const href of links) {
      const response = await page.request.get(new URL(href!, baseURL).toString());
      expect(response.status(), `${href} returned ${response.status()}`).toBeLessThan(400);
    }
  });

  test('every footer link resolves', async ({ page, baseURL }) => {
    // Footer grew with industries and international routes; each hit runs the
    // auth proxy against a closed Supabase port in this suite (~3s each).
    test.setTimeout(180_000);
    await page.goto('/en');
    const links = await page
      .locator('footer a[href^="/"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href')).filter(Boolean),
      );

    for (const href of [...new Set(links)]) {
      const response = await page.request.get(new URL(href!, baseURL).toString());
      expect(response.status(), `${href} returned ${response.status()}`).toBeLessThan(400);
    }
  });

  test('filters the service catalogue', async ({ page }) => {
    await page.goto('/en/services');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Services');

    const all = await page.locator('main ul li article').count();
    expect(all).toBeGreaterThan(3);

    await page.getByRole('link', { name: 'Company formation' }).first().click();
    await expect(page).toHaveURL(/category=company-formation/);
    expect(await page.locator('main ul li article').count()).toBeLessThan(all);
  });

  test('a service page separates what is and is not included, and dates its estimate', async ({
    page,
  }) => {
    await page.goto('/en/services/private-limited-company-incorporation');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Private limited company incorporation',
    );
    await expect(page.getByRole('heading', { name: 'What is included' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What is not included' })).toBeVisible();
    await expect(page.getByText('Time estimate reviewed')).toBeVisible();
    await expect(
      page.getByText('bdoor is not affiliated with this authority', { exact: false }),
    ).toBeVisible();
  });

  test('does not publish a government fee without a verified figure', async ({ page }) => {
    await page.goto('/en/services/private-limited-company-incorporation');
    const feeRow = page.getByRole('row', { name: /RJSC registration fees/ });
    await expect(feeRow).toContainText('Quoted after assessment');
  });

  test('does not list coming-soon services on the services index', async ({ page }) => {
    await page.goto('/en/services');
    await expect(page.getByText('Coming soon')).toHaveCount(0);
  });

  test('marks a coming-soon service detail as not open when reached directly', async ({ page }) => {
    await page.goto('/en/services/travel-agency-registration');
    // Detail may still exist for deep links; the public index must not promote it.
    const body = await page.locator('main').innerText();
    expect(body.toLowerCase()).toMatch(/coming soon|not open|enquiry|assessment/);
  });

  test('legal pages are published: substantive, versioned, no draft banner', async ({ page }) => {
    for (const slug of [
      'terms',
      'privacy',
      'refund-policy',
      'aml-kyc-policy',
      'legal-disclaimer',
      'cookie-policy',
      'complaints',
      'acceptable-use',
      'provider-disclosure',
      'electronic-consent',
    ]) {
      await page.goto(`/en/${slug}`);
      await expect(
        page.getByText('Working draft'),
        `${slug} still shows a draft banner`,
      ).toHaveCount(0);
      await expect(page.getByText('Version 1.0'), `${slug} missing its version`).toBeVisible();
      const body = await page.locator('main').innerText();
      expect(body.length, `${slug} body too short`).toBeGreaterThan(400);
      const robots = page.locator('meta[name="robots"]');
      if ((await robots.count()) > 0) {
        await expect(robots, `${slug} must be indexable`).not.toHaveAttribute('content', /noindex/);
      }
    }

    await page.goto('/en/legal');
    await expect(page.getByRole('heading', { name: 'Legal policies' })).toBeVisible();
    await expect(
      page.locator('main').getByRole('link', { name: 'Terms of Service' }),
    ).toBeVisible();
  });
});

test.describe('language', () => {
  test('switches to Bangla and keeps the current page', async ({ page }) => {
    await page.goto('/en/pricing');

    // The switcher appears in both the header and the footer; use the header.
    // Below `lg` the header's copy lives inside the collapsed menu, so open it
    // first — on a narrow viewport that is the path a visitor actually takes.
    const menuToggle = page.locator('button[aria-controls="mobile-navigation"]');
    if (await menuToggle.isVisible()) await menuToggle.click();

    await page
      .locator('header')
      .getByRole('button', { name: /Choose language|ভাষা/ })
      .click();
    await page.getByRole('menuitem', { name: 'বাংলা' }).click();

    await expect(page).toHaveURL(/\/bn\/pricing$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn-BD');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('প্যাকেজ ও মূল্য');
  });

  test('serves Bangla content, not English with a Bangla URL', async ({ page }) => {
    await page.goto('/bn');
    const body = await page.locator('main').innerText();
    // A meaningful share of the page must be Bengali script.
    const bengali = body.match(/[ঀ-৿]/g)?.length ?? 0;
    expect(bengali).toBeGreaterThan(200);
  });

  test('declares alternate language URLs', async ({ page }) => {
    await page.goto('/en/services');
    const alternates = await page
      .locator('link[rel="alternate"]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('hreflang')));

    expect(alternates).toContain('en');
    expect(alternates).toContain('bn-BD');
  });
});

test.describe('privacy of the private areas', () => {
  test('sends an anonymous visitor from the workspace to sign in', async ({ page }) => {
    await page.goto('/en/app');
    await expect(page).toHaveURL(/\/en\/login\?next=/);
  });

  test('does the same for the partner and admin areas', async ({ page }) => {
    for (const path of ['/en/partner', '/en/admin']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/en\/login\?next=/);
    }
  });

  test('renders the supplied wordmark rather than typed text', async ({ page }) => {
    await page.goto('/en');

    // The brand guide forbids recreating the wordmark in a font, and this
    // component used to do exactly that — it set the text "BDoor" in the UI
    // typeface. The header must reference the outlined production SVG from
    // bdoor_branding/01_Logos/SVG/.
    const logo = page.locator('header img[src*="bdoor-primary-horizontal"]').first();
    await expect(logo).toBeVisible();

    // Width and height are always set, so the header reserves the box and the
    // logo cannot shift the page as it loads.
    await expect(logo).toHaveAttribute('width', /\d+/);
    await expect(logo).toHaveAttribute('height', /\d+/);
  });

  test('blocks the private areas in robots.txt', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /app/');
    expect(robots).toContain('Disallow: /partner/');
    expect(robots).toContain('Disallow: /admin/');
  });

  test('lists only public pages in the sitemap', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/en/services');
    // Segment match: /partners/apply is public and contains the letters
    // "/app"; the private workspace is the /app *segment*.
    expect(sitemap).not.toMatch(/\/app(?:[/<?"]|$)/m);
    expect(sitemap).not.toContain('/admin');
    expect(sitemap).not.toContain('/partner/');
  });

  test('sets the security headers', async ({ request }) => {
    const response = await request.get('/en');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers()['permissions-policy']).toContain('camera=()');
  });

  test('returns a helpful 404', async ({ page }) => {
    const response = await page.goto('/en/no-such-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('could not find');
  });
});
