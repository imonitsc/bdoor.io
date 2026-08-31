import { expect, test } from '@playwright/test';

/**
 * The /ask application experience: viewport fit, the greeting fast path (the
 * one full streaming round-trip that works with no gateway credential),
 * suggestions, follow-ups, actions and the retry state.
 */

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
] as const;

test.describe('viewport fit', () => {
  for (const viewport of VIEWPORTS) {
    test(`the complete initial experience fits at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/en/ask');

      // Heading, composer, suggestions and status line — all without scrolling.
      const heading = page.getByRole('heading', { level: 1 });
      const input = page.locator('#ask-bdoor-input');
      await expect(heading).toBeVisible();
      await expect(input).toBeVisible();

      for (const locator of [
        heading,
        input,
        page.getByRole('button', { name: 'Start a business' }),
      ]) {
        const box = await locator.boundingBox();
        expect(box, 'element has a box').not.toBeNull();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
      }

      // The shell itself never scrolls; only the conversation region may.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('the greeting fast path', () => {
  test('answers "hi" with a real streamed reply, instantly and without the model', async ({
    page,
  }) => {
    await page.goto('/en/ask');
    await page.locator('#ask-bdoor-input').fill('hi');
    await page.keyboard.press('Enter');

    // No retrieval, no gateway: the reply must land essentially immediately
    // even in this credential-less environment.
    await expect(page.getByText(/Hello! Ask me about starting, running/)).toBeVisible({
      timeout: 5_000,
    });

    // A finished answer carries its actions and follow-ups.
    await expect(page.getByRole('button', { name: 'Copy answer' })).toBeVisible();
    await expect(page.getByText('Ask next')).toBeVisible();

    // The composer is now pinned at the bottom and still usable.
    const input = page.locator('#ask-bdoor-input');
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    const viewport = page.viewportSize();
    expect(box!.y + box!.height).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);
  });

  test('answers in Bangla on the Bangla page', async ({ page }) => {
    await page.goto('/bn/ask');
    await page.locator('#ask-bdoor-input').fill('হাই');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/হ্যালো! বাংলাদেশে ব্যবসা শুরু/)).toBeVisible({ timeout: 5_000 });
  });

  test('a follow-up suggestion sends as the next question', async ({ page }) => {
    await page.goto('/en/ask');
    await page.locator('#ask-bdoor-input').fill('hi');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Ask next')).toBeVisible({ timeout: 5_000 });

    const followUp = page
      .getByRole('log')
      .getByRole('button', { name: /register a company|licences|file every year/i })
      .first();
    const label = (await followUp.textContent()) ?? '';
    await followUp.click();

    // The follow-up becomes the customer's own next message.
    await expect(page.locator('[data-role="user"]').last()).toContainText(label.slice(0, 20));
  });
});

test.describe('send is acknowledged instantly', () => {
  test('the user message and first stage appear before the server responds at all', async ({
    page,
  }) => {
    await page.goto('/en/ask');

    // Hold the chat response for 3 seconds. Nothing the interface shows in
    // that window can have come from the server — which is the requirement:
    // send feedback never waits on retrieval, persistence or the model.
    await page.route('**/api/ai/chat', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });

    const input = page.locator('#ask-bdoor-input');
    await input.fill('How do I register a company in Bangladesh?');
    const before = Date.now();
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-role="user"]').last()).toContainText('register a company', {
      timeout: 1_000,
    });
    await expect(page.getByText('Understanding your question')).toBeVisible({ timeout: 1_000 });
    expect(Date.now() - before).toBeLessThan(2_500);
  });
});

test.describe('conversation behaviour', () => {
  test('a suggestion submits and the transcript announces politely', async ({ page }) => {
    await page.goto('/en/ask');
    await page.getByRole('button', { name: 'Understand tax and VAT', exact: true }).click();

    const log = page.getByRole('log');
    await expect(log).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('[data-role="user"]')).toContainText('Understand tax and VAT');
  });

  test('the composer stays keyboard-first: Enter sends, the input keeps its label', async ({
    page,
  }) => {
    await page.goto('/en/ask');
    const input = page.locator('#ask-bdoor-input');
    await expect(input).toHaveAccessibleName(/question|প্রশ্ন/i);
    await input.fill('hello');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-role="user"]').last()).toContainText('hello');
  });

  test('a failed answer offers a retry that resends the question', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/en/ask');
    await page.locator('#ask-bdoor-input').fill('How much is a trade licence in Dhaka?');
    await page.keyboard.press('Enter');

    // No gateway credential: the model call fails, and the customer gets an
    // honest failure with a working retry.
    await expect(page.getByRole('button', { name: 'Try again' }).first()).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole('button', { name: 'Try again' }).first().click();
    await expect(
      page.getByText(
        /Understanding your question|Checking current official sources|Preparing your answer/,
      ),
    ).toBeVisible({ timeout: 10_000 });
  });
});
