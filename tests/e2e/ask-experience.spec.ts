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
    // The retry must actually resend the question. The stage indicator can
    // flash sub-paint in this credential-less environment and the first
    // failure's copy is already on screen, so neither is trustworthy — the
    // second POST to the chat endpoint is.
    const resent = page.waitForRequest(
      (request) => request.url().includes('/api/ai/chat') && request.method() === 'POST',
      { timeout: 10_000 },
    );
    await page.getByRole('button', { name: 'Try again' }).first().click();
    await resent;
  });
});

/**
 * §7.3: "Send button and Enter key produce the same request exactly once."
 *
 * Both halves of that sentence are load-bearing and neither was covered. A
 * second request is not a cosmetic bug: it is a second retrieval, a second
 * model call and a second answer billed and written to the ledger, from a
 * customer who pressed a key twice because the first press looked slow.
 *
 * Every case here holds the response open, so the assertions run inside the
 * window where a double fire is actually possible. Counting real requests is
 * the only honest way to test "exactly once" — a visible transcript can hide
 * a duplicate that reached the server.
 */
test.describe('one send is one request', () => {
  /** Count POSTs to the chat route, and hold each one open for `holdMs`. */
  async function countChatRequests(page: import('@playwright/test').Page, holdMs = 2_000) {
    const bodies: string[] = [];
    await page.route('**/api/ai/chat', async (route) => {
      bodies.push(route.request().postData() ?? '');
      await new Promise((resolve) => setTimeout(resolve, holdMs));
      await route.continue();
    });
    return bodies;
  }

  test('pressing Enter twice while the first answer is in flight sends once', async ({ page }) => {
    await page.goto('/en/ask');
    const bodies = await countChatRequests(page);

    const arrived = page.waitForRequest('**/api/ai/chat');
    await page.locator('#ask-bdoor-input').fill('hi');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    // The transcript shows the question optimistically, before the fetch, so
    // waiting on it proves nothing about the network. Wait for the real
    // request, then keep watching inside the held window where a duplicate
    // would land.
    await arrived;
    await page.waitForTimeout(1_500);
    expect(bodies).toHaveLength(1);
    await expect(page.locator('[data-role="user"]')).toHaveCount(1);
  });

  test('double-clicking Send sends once', async ({ page }) => {
    await page.goto('/en/ask');
    const bodies = await countChatRequests(page);

    const arrived = page.waitForRequest('**/api/ai/chat');
    await page.locator('#ask-bdoor-input').fill('hi');
    await page.getByRole('button', { name: 'Send' }).dblclick();

    await arrived;
    await page.waitForTimeout(1_500);
    expect(bodies).toHaveLength(1);
    await expect(page.locator('[data-role="user"]')).toHaveCount(1);
  });

  test('the Send button and Enter produce the same request', async ({ page }) => {
    // Parity is the other half of the requirement: two entry points, one
    // behaviour. A button that posted a differently shaped body would answer
    // the same question through a different path.
    await page.goto('/en/ask');
    const viaEnter = await countChatRequests(page, 200);
    const enterArrived = page.waitForRequest('**/api/ai/chat');
    await page.locator('#ask-bdoor-input').fill('hi');
    await page.keyboard.press('Enter');
    await enterArrived;

    await page.goto('/en/ask');
    const viaButton = await countChatRequests(page, 200);
    const clickArrived = page.waitForRequest('**/api/ai/chat');
    await page.locator('#ask-bdoor-input').fill('hi');
    await page.getByRole('button', { name: 'Send' }).click();
    await clickArrived;

    expect(viaEnter).toHaveLength(1);
    expect(viaButton).toHaveLength(1);

    // Ids are minted per request, so compare everything else.
    const shape = (body: string) => {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      return JSON.stringify(parsed, (key, value) => (key === 'id' ? '<id>' : value));
    };
    expect(shape(viaButton[0]!)).toBe(shape(viaEnter[0]!));
  });

  test('Shift+Enter writes a newline instead of sending', async ({ page }) => {
    await page.goto('/en/ask');
    const bodies = await countChatRequests(page, 200);

    const input = page.locator('#ask-bdoor-input');
    await input.fill('hi');
    await input.press('Shift+Enter');

    await expect(input).toHaveValue('hi\n');
    // Give a wrongly-sent request time to appear before calling it absent.
    await page.waitForTimeout(1_000);
    expect(bodies).toHaveLength(0);
  });
});
