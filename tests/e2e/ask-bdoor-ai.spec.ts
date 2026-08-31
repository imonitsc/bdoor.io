import { expect, test } from '@playwright/test';

/**
 * Ask bdoor AI, end to end.
 *
 * The suite runs with the feature switched on and no AI Gateway credential,
 * so every model call fails. That is deliberate: the interface, the copy, the
 * truthful stages and the escalation path all have to be right, and the
 * failure path is the one a customer meets during a real outage — the one
 * nobody tests, and the one where "no silent fallback" has to actually hold.
 *
 * The greeting fast path is the exception: it never calls the model, so it
 * exercises the full streaming transport for real even in this environment.
 */

const HEADING = 'Ask bdoor AI';

test.describe('the homepage entry', () => {
  test('offers a real input under the hero, not a floating character', async ({ page }) => {
    await page.goto('/en');

    const entry = page.getByRole('heading', { name: HEADING, exact: true });
    await expect(entry).toBeVisible();

    // The hero is still the hero, and its secondary action carries the spark.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Start and run your business in Bangladesh',
    );
    await expect(page.getByTestId('home-hero-ask').locator('svg').first()).toBeVisible();

    const input = page.getByPlaceholder('Ask about company registration, licences, tax or pricing');
    await expect(input.first()).toBeVisible();
  });

  test('opens the conversation with the question already asked', async ({ page }) => {
    await page.goto('/en');

    const input = page
      .getByPlaceholder('Ask about company registration, licences, tax or pricing')
      .first();
    await input.fill('How do I register a private limited company?');
    await page.getByRole('button', { name: HEADING, exact: true }).click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('How do I register a private limited company?')).toBeVisible();
  });

  test('closes on escape', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('button', { name: /How do I register a company in Bangladesh/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('is reachable from the header navigation and the hero', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByTestId('home-hero-ask')).toHaveAttribute('href', '/en/ask');

    // Below xl the header bar collapses into the drawer, which renders its
    // links only once opened — open it before looking for the nav entry.
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    if (await toggle.isVisible()) {
      await toggle.click();
    }
    await expect(
      page.locator('header').getByRole('link', { name: 'Ask bdoor AI' }).first(),
    ).toHaveAttribute('href', '/en/ask');
  });
});

test.describe('the /ask application shell', () => {
  test('is a permanent, indexable address with a compact header and no footer', async ({
    page,
  }) => {
    const response = await page.goto('/en/ask');
    expect(response?.ok()).toBe(true);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'What do you want to start or solve?',
    );
    // The bdoor header stays, compact; the marketing footer does not follow
    // the customer into the application.
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    // The language selector is in the shell: someone arriving from an English
    // search result switches before they type.
    await expect(page.getByRole('banner').getByRole('button', { name: /language/i })).toBeVisible();
  });

  test('keeps the disclosure to one honest line with the full detail linked', async ({ page }) => {
    await page.goto('/en/ask');
    await expect(page.getByText('General information, not professional advice.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Service limits' })).toBeVisible();
    await expect(
      page.getByText('AI answers with current official sources', { exact: false }),
    ).toBeVisible();
  });

  test('offers the four quick suggestions', async ({ page }) => {
    await page.goto('/en/ask');
    for (const suggestion of [
      'Start a business',
      'Find required licences',
      'Understand tax and VAT',
      'Check annual compliance',
    ]) {
      await expect(page.getByRole('button', { name: suggestion, exact: true })).toBeVisible();
    }
  });

  test('serves Bangla when the locale is bn', async ({ page }) => {
    await page.goto('/bn/ask');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'আপনি কী শুরু করতে বা সমাধান করতে চান?',
    );
    await expect(page.getByPlaceholder('কোম্পানি নিবন্ধন')).toBeVisible();
  });
});

test.describe('when the model cannot be reached', () => {
  test('shows truthful stages, then says so and offers a specialist', async ({ page }) => {
    // The pipeline's own ceiling is LIMITS.requestTimeoutMs (45s): in an
    // environment where the gateway connection hangs rather than refusing,
    // the failure legitimately arrives only when that abort fires.
    test.setTimeout(120_000);
    await page.goto('/en/ask');

    await page.getByRole('button', { name: 'Start a business', exact: true }).click();

    // The truthful stage indicator appears while the pipeline works…
    await expect(
      page.getByText(/Understanding your question|Checking current official sources|Preparing your answer/),
    ).toBeVisible({ timeout: 10_000 });

    // …and the failure is told to the customer — never a silent substitute.
    const log = page.getByRole('log');
    await expect(
      log.getByText(/temporarily unavailable|Something went wrong|took too long/i).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(log.getByRole('link', { name: 'Talk to a specialist' }).first()).toBeVisible();
  });

  test('never leaks a credential, model route or internal error to the browser', async ({
    page,
  }) => {
    const bodies: string[] = [];
    page.on('response', async (response) => {
      if (!response.url().includes('/api/ai/')) return;
      bodies.push(await response.text().catch(() => ''));
    });

    await page.goto('/en/ask');
    await page.getByRole('button', { name: 'Find required licences', exact: true }).click();
    await expect(
      page.getByRole('log').getByRole('link', { name: 'Talk to a specialist' }).first(),
    ).toBeVisible({ timeout: 60_000 });

    const all = bodies.join('\n');
    for (const secret of ['AI_GATEWAY', 'sk-', 'service_role', 'SUPABASE_SECRET', 'Bearer ']) {
      expect(all, secret).not.toContain(secret);
    }
    // The page source must not name the model either — the browser has no
    // business knowing which route served it.
    expect(await page.content()).not.toContain('anthropic/claude');
  });
});

test.describe('rejected input', () => {
  test('refuses an over-long question at the endpoint', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        message: 'a'.repeat(5_000),
        locale: 'en',
        country: 'bd',
        anonymousSessionId: 'e2e-session-1234',
      },
    });
    expect(response.status()).toBe(400);
  });

  test('refuses a request with no session identity', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: { message: 'How do I register a company?', locale: 'en', country: 'bd' },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'session_required' });
  });

  test('declines an out-of-scope question in the stream, without calling the model', async ({
    request,
  }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        message: 'write me a poem about the moon',
        locale: 'en',
        country: 'bd',
        anonymousSessionId: 'e2e-session-5678',
      },
    });

    expect(response.ok()).toBe(true);
    const body = await response.text();
    // The decline arrives as stream content: a data-failure part naming the
    // reason plus the bilingual refusal copy.
    expect(body).toContain('out_of_scope');
    expect(body).toMatch(/company registration|licences/i);
  });
});
