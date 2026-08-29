import { expect, test } from '@playwright/test';

/**
 * The Bangladesh-first application flow: one location question, then either
 * the operating-market branch or the short international branch. Both must
 * reach a submitted application with a reference — no dead ends.
 *
 * No Supabase is configured in the test environment, so neither the draft
 * nor the submitted application is persisted — which is exactly the degraded
 * mode the flow has to survive.
 */
async function answer(
  page: import('@playwright/test').Page,
  // Some Playwright actions resolve to a value (selectOption returns the chosen
  // values), so this is deliberately not Promise<void>.
  action: () => Promise<unknown>,
) {
  // Each step swaps the input out for the next question's. Without waiting
  // for the step to actually advance, the next `action()` can run against the
  // control that is about to be replaced and the answer is lost. Progress is
  // reported per stage, so the progressbar often does NOT move between
  // consecutive questions — the hidden questionKey input is the reliable
  // signal: it changes on every step and disappears at review.
  const keyInput = page.locator('input[name="questionKey"]');
  // count() does not auto-wait, so the read is instant even once the input is
  // gone (review and the confirmation have no question form at all). The read
  // itself must ALSO be bounded: the input can be removed between count()
  // and inputValue() when the last answer swaps the form for the review
  // screen, and with no actionTimeout configured inputValue() would then
  // auto-wait forever — toPass cannot retry an attempt that never returns,
  // so the walk hung on its final step until the test budget died.
  const readKey = async () => {
    if ((await keyInput.count()) === 0) return null;
    try {
      return await keyInput.inputValue({ timeout: 1_000 });
    } catch {
      return null; // removed mid-read: the form is gone, same as count() === 0
    }
  };
  const before = await readKey();
  await action();
  await page.getByRole('button', { name: /^Continue$/ }).click();
  await expect(async () => {
    expect(await readKey()).not.toBe(before);
  }).toPass();
}

async function pick(page: import('@playwright/test').Page, name: string) {
  await answer(page, async () => {
    await page.getByRole('radio', { name, exact: true }).click();
  });
}

/** The shared contact + consent close of every branch. */
async function completeContactStage(page: import('@playwright/test').Page) {
  await expect(page.getByText('Your full name')).toBeVisible();
  await answer(page, async () => page.getByRole('textbox').fill('Test Founder (sample)'));
  await answer(page, async () => page.getByRole('textbox').fill('founder@example.com'));
  await answer(page, async () => Promise.resolve()); // phone is optional
  await answer(page, async () => page.getByRole('checkbox').check());
}

test.describe('application flow', () => {
  test('progress is stage-based and never jumps unpredictably', async ({ page }) => {
    await page.goto('/en/start');

    const progress = page.getByRole('progressbar');
    // The announcer mirrors the label into a live region, so scope to the
    // visible paragraph rather than any text node.
    const stageText = () =>
      page
        .locator('p', { hasText: /^Stage \d of \d/ })
        .first()
        .textContent();

    await expect(page.locator('p', { hasText: /^Stage 1 of 6/ })).toBeVisible();
    const totals = new Set<string>();
    const seen: number[] = [];

    const record = async () => {
      const text = (await stageText()) ?? '';
      const match = text.match(/^Stage (\d) of (\d)/);
      expect(match, `unparseable stage label: ${text}`).not.toBeNull();
      seen.push(Number(match![1]));
      totals.add(match![2]!);
    };

    await record();
    await pick(page, 'Bangladesh');
    await record();
    await pick(page, 'Start a new business');
    await record();
    await answer(page, async () => {
      await page.getByRole('radio', { name: 'In Bangladesh' }).click();
    });
    await record();

    // The denominator never changes, and the stage number never decreases —
    // the two properties the old "Step 1 of 16 → Step 3 of 15" model broke.
    expect([...totals]).toEqual(['6']);
    for (let i = 1; i < seen.length; i += 1) {
      expect(seen[i]!, `stage decreased at step ${i}`).toBeGreaterThanOrEqual(seen[i - 1]!);
    }
    await expect(progress).toBeVisible();
  });

  test('opens with the location question and branches to Bangladesh', async ({ page }) => {
    await page.goto('/en/start');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Start your business');

    await expect(page.getByText('Where do you want to start or manage a business?')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Bangladesh', exact: true })).toBeVisible();
    await expect(
      page.getByRole('radio', { name: 'Outside Bangladesh', exact: true }),
    ).toBeVisible();
    await pick(page, 'Bangladesh');

    // Bangladesh: new or existing, then the operating-market questions.
    await expect(page.getByText('What do you want to do in Bangladesh?')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Start a new business' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Manage an existing business' })).toBeVisible();
    await pick(page, 'Start a new business');

    await expect(page.getByText('Where are you based right now?')).toBeVisible();
    await answer(page, async () => {
      await page.getByRole('radio', { name: 'In Bangladesh' }).click();
    });
    await expect(page.getByText('What is your nationality?')).toBeVisible();
  });

  test('branches to the six international countries', async ({ page }) => {
    await page.goto('/en/start');
    await pick(page, 'Outside Bangladesh');

    await expect(page.getByText('Which country?')).toBeVisible();
    for (const name of [
      'United States',
      'United Kingdom',
      'United Arab Emirates',
      'Saudi Arabia',
      'Qatar',
      'Singapore',
    ]) {
      await expect(page.getByRole('radio', { name, exact: true })).toBeVisible();
    }
    // Bangladesh was answered one question earlier; it is not re-offered.
    await expect(page.getByRole('radio', { name: 'Bangladesh', exact: true })).toHaveCount(0);

    await pick(page, 'United States');
    await expect(page.getByText('What do you want to set up?')).toBeVisible();
  });

  test('preselects a validated ?country= and lands on the branch', async ({ page }) => {
    // An international slug answers the location AND the country question.
    await page.goto('/en/start?country=usa');
    await expect(page.getByText('What do you want to set up?')).toBeVisible();

    // Bangladesh with an objective lands on the first operating question.
    await page.goto('/en/start?country=bangladesh&objective=new');
    await expect(page.getByText('Where are you based right now?')).toBeVisible();
  });

  test('ignores an invalid ?country= parameter', async ({ page }) => {
    await page.goto('/en/start?country=mars&objective=teleport');
    await expect(page.getByText('Where do you want to start or manage a business?')).toBeVisible();
  });

  test('validates before it advances', async ({ page }) => {
    await page.goto('/en/start?country=bangladesh&objective=new');
    await answer(page, async () => {
      await page.getByRole('radio', { name: 'In Bangladesh' }).click();
    });
    await answer(page, async () => {
      await page.getByRole('combobox').selectOption('BD');
    });

    // A one-word activity is rejected by the shared schema.
    await expect(page.getByText('What will the business actually do?')).toBeVisible();
    await page.getByRole('textbox').fill('shop');
    await page.getByRole('button', { name: /^Continue$/ }).click();

    await expect(page.getByText('Please give us a little more detail.')).toBeVisible();
    await expect(page.getByText('What will the business actually do?')).toBeVisible();
  });

  test('shows the "why we ask" explanation on sensitive questions', async ({ page }) => {
    await page.goto('/en/start');
    await page.getByRole('button', { name: 'Why we ask' }).click();
    await expect(
      page.getByText('This routes you to the right question set', { exact: false }),
    ).toBeVisible();
  });

  test('submits a Bangladesh application and shows the preliminary recommendation', async ({
    page,
  }) => {
    // A full walk is ~18 server-action round trips; the budget is explicit
    // and generous so genuine slowness never masquerades as the readKey
    // race documented in answer().
    test.setTimeout(420_000);
    await page.goto('/en/start');
    await pick(page, 'Bangladesh');
    await pick(page, 'Start a new business');

    await answer(page, async () => page.getByRole('radio', { name: 'In Bangladesh' }).click());
    await answer(page, async () => page.getByRole('combobox').selectOption('BD'));
    await answer(page, async () =>
      page.getByRole('textbox').fill('Sell handmade leather bags from a shop in Dhaka.'),
    );
    await answer(page, async () => page.getByRole('textbox').fill('Dhaka'));
    await answer(page, async () =>
      page.getByRole('radio', { name: 'Sole proprietorship' }).click(),
    );
    await answer(page, async () => page.getByRole('spinbutton').fill('1'));
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click()); // foreign owners
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click()); // entity owner
    await answer(page, async () => page.getByRole('radio', { name: 'Neither' }).click()); // import/export
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click()); // employees
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click()); // regulated
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click()); // address
    await answer(page, async () =>
      page.getByRole('radio', { name: 'As soon as possible' }).click(),
    );
    await completeContactStage(page);

    // Review, then submit — the CTA is an application, not a checkout.
    await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible();
    await page.getByRole('button', { name: 'Submit application' }).click();

    await expect(page.getByRole('heading', { name: 'Application received' })).toBeVisible();
    await expect(page.getByText(/^BD-\d{4}-\d{6}$/)).toBeVisible();

    // Bangladesh keeps its preliminary guidance, beneath the confirmation.
    await expect(
      page.getByRole('heading', { name: 'Your preliminary recommendation' }),
    ).toBeVisible();
    await expect(page.getByText('Preliminary — subject to review')).toBeVisible();
    await expect(page.getByText('Sole proprietorship', { exact: true })).toBeVisible();
    await expect(page.locator('a[href$="/services/trade-licence"]')).toBeVisible();
  });

  test('submits an international application without a Bangladesh recommendation', async ({
    page,
  }) => {
    test.setTimeout(420_000);
    await page.goto('/en/start');
    await pick(page, 'Outside Bangladesh');
    await pick(page, 'United States');
    await pick(page, 'A new company');
    await answer(page, async () => {
      // Required support is a multi-select; at least one must be chosen.
      await page.getByRole('checkbox', { name: 'Company formation' }).check();
      await page.getByRole('checkbox', { name: 'Business bank account' }).check();
    });
    await answer(page, async () =>
      page.getByRole('textbox').fill('Sell software subscriptions to customers in the USA.'),
    );
    await answer(page, async () =>
      page.getByRole('radio', { name: 'As soon as possible' }).click(),
    );
    await answer(page, async () => Promise.resolve()); // notes are optional
    await completeContactStage(page);

    await page.getByRole('button', { name: 'Submit application' }).click();

    await expect(page.getByRole('heading', { name: 'Application received' })).toBeVisible();
    await expect(page.getByText(/^BD-\d{4}-\d{6}$/)).toBeVisible();
    await expect(page.getByText('United States', { exact: false }).first()).toBeVisible();
    // The Bangladesh rules engine must not run for an international case.
    await expect(
      page.getByRole('heading', { name: 'Your preliminary recommendation' }),
    ).toHaveCount(0);
    await expect(page.getByText('No payment has been taken', { exact: false })).toBeVisible();
  });

  test('requires at least one kind of support on the international branch', async ({ page }) => {
    await page.goto('/en/start?country=qatar');
    await pick(page, 'A new company');

    await expect(page.getByText('What support will you need?')).toBeVisible();
    await page.getByRole('button', { name: /^Continue$/ }).click();
    await expect(page.getByText('Choose one option to continue.')).toBeVisible();
    await expect(page.getByText('What support will you need?')).toBeVisible();
  });

  test('requires consent before an application can be submitted', async ({ page }) => {
    test.setTimeout(420_000);
    await page.goto('/en/start?country=usa');

    await pick(page, 'A new company');
    await answer(page, async () => {
      await page.getByRole('checkbox', { name: 'Company formation' }).check();
    });
    await answer(page, async () =>
      page.getByRole('textbox').fill('Open an online store serving customers in the USA.'),
    );
    await answer(page, async () =>
      page.getByRole('radio', { name: 'As soon as possible' }).click(),
    );
    await answer(page, async () => Promise.resolve()); // notes
    await answer(page, async () => page.getByRole('textbox').fill('Test Founder (sample)'));
    await answer(page, async () => page.getByRole('textbox').fill('founder@example.com'));
    await answer(page, async () => Promise.resolve()); // phone

    // Submitting the consent step unchecked must not advance.
    await expect(page.getByRole('checkbox')).toBeVisible();
    await page.getByRole('button', { name: /^Continue$/ }).click();
    await expect(
      page.getByText('Please tick the consent box to submit your application.'),
    ).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
  });

  test('warns that capital never comes to BDoor', async ({ page }) => {
    test.setTimeout(420_000);
    await page.goto('/en/start?country=bangladesh&objective=new');
    await answer(page, async () => page.getByRole('radio', { name: 'Outside Bangladesh' }).click());
    await answer(page, async () => page.getByRole('combobox').selectOption('SG'));
    await answer(page, async () => page.getByRole('combobox').selectOption('SG'));
    await answer(page, async () =>
      page.getByRole('textbox').fill('Provide software consulting services to local banks.'),
    );
    await answer(page, async () => page.getByRole('textbox').fill('Dhaka'));
    await answer(page, async () =>
      page.getByRole('radio', { name: 'Private limited company' }).click(),
    );
    await answer(page, async () => page.getByRole('spinbutton').fill('2'));
    await answer(page, async () => page.getByRole('spinbutton').fill('2'));
    await answer(page, async () => page.getByRole('radio', { name: 'Yes', exact: true }).click());
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click());
    await answer(page, async () => page.getByRole('spinbutton').fill('60'));

    await expect(
      page.getByText('Investment or share capital is never paid to BDoor', { exact: false }),
    ).toBeVisible();
  });

  test('can step back and change an answer', async ({ page }) => {
    await page.goto('/en/start');
    await pick(page, 'Bangladesh');
    await pick(page, 'Start a new business');
    await answer(page, async () => page.getByRole('radio', { name: 'In Bangladesh' }).click());
    await expect(page.getByText('What is your nationality?')).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText('Where are you based right now?')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'In Bangladesh' })).toBeChecked();
  });
});
