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

  test('shows the hero, operator disclosure and the independence disclosure', async ({ page }) => {
    await page.goto('/en');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Start and run your business in Bangladesh',
    );
    await expect(page.getByText('Operated by bdoor compliance ltd')).toBeVisible();
    await expect(page.getByText('Transparent itemised quotes')).toBeVisible();
    await expect(
      page.getByText('bdoor is not a government authority or law firm', { exact: false }),
    ).toBeVisible();
  });

  test('never promises approval', async ({ page }) => {
    await page.goto('/en');
    const body = (await page.locator('body').innerText()).toLowerCase();

    expect(body).not.toContain('guaranteed approval');
    expect(body).not.toContain('instant approval');
    expect(body).not.toContain('government authorized');
  });

  test('every header link resolves', async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    await page.goto('/en');
    const links = await page
      .locator('header nav a')
      .evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href')).filter(Boolean),
      );

    expect(links.length).toBeGreaterThan(3);
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
    await expect(feeRow).toContainText('Quoted after review');
  });

  test('marks a coming-soon service as not open', async ({ page }) => {
    await page.goto('/en/services/travel-agency-registration');
    await expect(page.getByText('Coming soon').first()).toBeVisible();
    await expect(page.getByText('not open for new cases yet', { exact: false })).toBeVisible();
  });

  test('legal pages carry the pre-launch notice while drafts are unapproved', async ({ page }) => {
    for (const slug of [
      'terms',
      'privacy',
      'refund-policy',
      'aml-kyc-policy',
      'legal-disclaimer',
    ]) {
      await page.goto(`/en/${slug}`);
      await expect(
        page.getByText('Under professional review', { exact: true }),
        `${slug} is missing the pre-launch notice`,
      ).toBeVisible();
      // The notice is honest about the consequences…
      await expect(
        page.getByText('Payments and identity-document collection are not yet enabled'),
      ).toBeVisible();
      // …and the unapproved draft text must NOT be published as if final.
      const body = (await page.locator('body').innerText()).toLowerCase();
      expect(body, `${slug} still renders draft legal sections`).not.toContain('governing law');
      // Draft legal pages are not indexable.
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    }
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
    expect(sitemap).not.toContain('/app');
    expect(sitemap).not.toContain('/admin');
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
