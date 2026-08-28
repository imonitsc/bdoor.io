import { expect, test } from '@playwright/test';

/**
 * The guided questionnaire.
 *
 * No Supabase is configured in the test environment, so the draft is not
 * persisted — which is exactly the degraded mode the flow has to survive. The
 * branching, validation and recommendation must all still work.
 */
async function answer(
  page: import('@playwright/test').Page,
  // Some Playwright actions resolve to a value (selectOption returns the chosen
  // values), so this is deliberately not Promise<void>.
  action: () => Promise<unknown>,
) {
  // Each step swaps the input out for the next question's. Without waiting for
  // the progress indicator to move, the next `action()` can run against the
  // control that is about to be replaced and the answer is lost.
  const progress = page.getByRole('progressbar');
  const before = await progress.getAttribute('aria-valuenow');
  await action();
  await page.getByRole('button', { name: /^Continue$/ }).click();
  await expect(progress).not.toHaveAttribute('aria-valuenow', before ?? '');
}

async function startBangladeshAssessment(
  page: import('@playwright/test').Page,
) {
  await answer(page, async () => {
    await page.getByRole('radio', { name: 'Start a business in Bangladesh' }).click();
  });
}

test.describe('questionnaire', () => {
  test('branches on the answers given', async ({ page }) => {
    await page.goto('/en/start');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Start your business');

    await expect(page.getByText('Where do you want help?')).toBeVisible();
    await startBangladeshAssessment(page);

    // Founder inside Bangladesh.
    await expect(page.getByText('Where are you based right now?')).toBeVisible();
    await answer(page, async () => {
      await page.getByRole('radio', { name: 'In Bangladesh' }).click();
    });

    // Nationality follows; residence must NOT be asked of a local founder.
    await expect(page.getByText('What is your nationality?')).toBeVisible();
    await answer(page, async () => {
      await page.getByRole('combobox').selectOption('BD');
    });

    await expect(page.getByText('What will the business actually do?')).toBeVisible();
    await expect(page.getByText('Which country do you currently live in?')).toHaveCount(0);
  });

  test('asks a foreign founder the questions a local founder is spared', async ({ page }) => {
    await page.goto('/en/start');
    await startBangladeshAssessment(page);

    await answer(page, async () => {
      await page.getByRole('radio', { name: 'Outside Bangladesh' }).click();
    });

    await expect(page.getByText('What is your nationality?')).toBeVisible();
    await answer(page, async () => {
      await page.getByRole('combobox').selectOption('GB');
    });

    // Residence is only asked of founders outside Bangladesh.
    await expect(page.getByText('Which country do you currently live in?')).toBeVisible();
  });

  test('validates before it advances', async ({ page }) => {
    await page.goto('/en/start');
    await startBangladeshAssessment(page);
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
      page.getByText('This routes you to the right package', { exact: false }),
    ).toBeVisible();
  });

  test('reaches a preliminary recommendation and labels it as preliminary', async ({ page }) => {
    await page.goto('/en/start');
    await startBangladeshAssessment(page);

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

    // Review step, then generate.
    await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible();
    await page.getByRole('button', { name: 'See my preliminary recommendation' }).click();

    await expect(
      page.getByRole('heading', { name: 'Your preliminary recommendation' }),
    ).toBeVisible();
    await expect(page.getByText('Preliminary — subject to review')).toBeVisible();
    await expect(
      page.getByText('This is a preliminary, software-generated suggestion', { exact: false }),
    ).toBeVisible();
    await expect(page.getByText('Sole proprietorship', { exact: true })).toBeVisible();
    await expect(page.locator('a[href$="/services/trade-licence"]')).toBeVisible();
  });

  test('sends a foreign founder to manual review', async ({ page }) => {
    await page.goto('/en/start');
    await startBangladeshAssessment(page);

    await answer(page, async () => page.getByRole('radio', { name: 'Outside Bangladesh' }).click());
    await answer(page, async () => page.getByRole('combobox').selectOption('GB'));
    await answer(page, async () => page.getByRole('combobox').selectOption('GB')); // residence
    await answer(page, async () =>
      page.getByRole('textbox').fill('Import cotton fabric and sell to local garment factories.'),
    );
    await answer(page, async () => page.getByRole('textbox').fill('Chattogram'));
    await answer(page, async () =>
      page.getByRole('radio', { name: 'Private limited company' }).click(),
    );
    await answer(page, async () => page.getByRole('spinbutton').fill('2')); // owners
    await answer(page, async () => page.getByRole('spinbutton').fill('2')); // directors
    await answer(page, async () => page.getByRole('radio', { name: 'Yes', exact: true }).click()); // foreign owners
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click()); // entity owner
    await answer(page, async () => page.getByRole('spinbutton').fill('100')); // foreign %
    await answer(page, async () => page.getByRole('radio', { name: 'Yes', exact: true }).click()); // remit capital
    await answer(page, async () => page.getByRole('radio', { name: 'Yes', exact: true }).click()); // will work
    await answer(page, async () => page.getByRole('radio', { name: 'Both' }).click()); // import/export
    await answer(page, async () => page.getByRole('radio', { name: 'Yes', exact: true }).click()); // employees
    await answer(page, async () => page.getByRole('radio', { name: 'No', exact: true }).click()); // regulated
    await answer(page, async () => page.getByRole('radio', { name: 'Yes', exact: true }).click()); // address
    await answer(page, async () =>
      page.getByRole('radio', { name: 'As soon as possible' }).click(),
    );

    await page.getByRole('button', { name: 'See my preliminary recommendation' }).click();

    await expect(
      page.getByRole('heading', { name: 'This case needs manual review' }),
    ).toBeVisible();
    await expect(page.getByText('There is foreign ownership', { exact: false })).toBeVisible();
    await expect(
      page.locator('a[href$="/services/foreign-ownership-eligibility-review"]'),
    ).toBeVisible();
  });

  test('warns that capital never comes to BDoor', async ({ page }) => {
    await page.goto('/en/start');
    await startBangladeshAssessment(page);
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
    await startBangladeshAssessment(page);
    await answer(page, async () => page.getByRole('radio', { name: 'In Bangladesh' }).click());
    await expect(page.getByText('What is your nationality?')).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByText('Where are you based right now?')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'In Bangladesh' })).toBeChecked();
  });
});
