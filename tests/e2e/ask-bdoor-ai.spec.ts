import { expect, test } from '@playwright/test';

/**
 * Ask bdoor AI, end to end.
 *
 * The suite runs with the feature switched on and no AI Gateway credential, so
 * every model call fails. That is deliberate: the interface, the copy, the
 * disclosure and the escalation path all have to be right, and the failure
 * path is the one a customer meets during a real outage — the one nobody
 * tests, and the one where "no silent fallback" has to actually hold.
 */

const HEADING = 'Ask bdoor AI';

test.describe('the homepage entry', () => {
  test('offers a real input under the hero, not a floating character', async ({ page }) => {
    await page.goto('/en');

    const entry = page.getByRole('heading', { name: HEADING, exact: true });
    await expect(entry).toBeVisible();

    await expect(
      page.getByText('Get clear answers about starting and running a business in Bangladesh', {
        exact: false,
      }),
    ).toBeVisible();

    // The hero is still the hero.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Start and run your business in Bangladesh',
    );

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

  test('closes on escape and returns focus to the page', async ({ page }) => {
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

test.describe('the /ask page', () => {
  test('is a permanent, indexable address with a language selector', async ({ page }) => {
    const response = await page.goto('/en/ask');
    expect(response?.ok()).toBe(true);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(HEADING);
    // Visible on the page, not only in the footer: someone arriving from an
    // English search result needs to switch before they type.
    await expect(page.locator('main').getByRole('button', { name: /language/i })).toBeVisible();
    await expect(
      page.getByText('Cannot see your documents, case or payment details', { exact: false }),
    ).toBeVisible();
  });

  test('states the AI disclosure beside the input on every surface', async ({ page }) => {
    await page.goto('/en/ask');
    await expect(
      page.getByText('AI-generated information from bdoor', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('not legal, tax or immigration advice', { exact: false }),
    ).toBeVisible();
  });

  test('offers five starting questions', async ({ page }) => {
    await page.goto('/en/ask');
    for (const question of [
      /How do I register a company in Bangladesh/,
      /Which licences does my business need/,
      /Can a foreigner own a Bangladesh company/,
      /What does bdoor charge, and what are the government fees/,
      /What do I have to file every year after registering/,
    ]) {
      await expect(page.getByRole('button', { name: question })).toBeVisible();
    }
  });

  test('serves Bangla when the locale is bn', async ({ page }) => {
    await page.goto('/bn/ask');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ask bdoor AI');
    await expect(page.getByPlaceholder('কোম্পানি নিবন্ধন')).toBeVisible();
    await expect(page.getByText('AI-নির্মিত তথ্য', { exact: false })).toBeVisible();
  });
});

test.describe('when the model cannot be reached', () => {
  test('says so and offers a specialist, rather than answering anyway', async ({ page }) => {
    // The pipeline's own ceiling is LIMITS.requestTimeoutMs (45s): in an
    // environment where the gateway connection hangs rather than refusing,
    // the error frame legitimately arrives only when that abort fires. The
    // assertion window must cover the pipeline's budget, not race it.
    test.setTimeout(120_000);
    await page.goto('/en/ask');

    await page.getByRole('button', { name: /How do I register a company in Bangladesh/ }).click();

    // No credential in this environment, so the Gateway call fails. The
    // customer must be told — never handed a plausible answer from somewhere
    // else that they have no way of recognising as such.
    const log = page.getByRole('log');
    await expect(
      log.getByText(/temporarily unavailable|Something went wrong|took too long/i),
    ).toBeVisible({ timeout: 60_000 });

    await expect(log.getByRole('link', { name: 'Talk to a specialist' })).toBeVisible();
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
    await page.getByRole('button', { name: /Can a foreigner own a Bangladesh company/ }).click();
    await expect(
      page.getByRole('log').getByRole('link', { name: 'Talk to a specialist' }),
    ).toBeVisible({
      timeout: 30_000,
    });

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

  test('declines an out-of-scope question without calling the model', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: {
        message: 'write me a poem about the moon',
        locale: 'en',
        country: 'bd',
        anonymousSessionId: 'e2e-session-5678',
      },
    });

    expect(response.ok()).toBe(true);
    const body = (await response.json()) as { error: string; message: string };
    expect(body.error).toBe('out_of_scope');
    expect(body.message).toMatch(/company registration|licences/i);
  });
});
