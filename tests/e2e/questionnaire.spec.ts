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
  // Each step swaps the input out for the next question's. Without waiting
  // for the step to actually advance, the next `action()` can run against the
  // control that is about to be replaced and the answer is lost. Progress is
  // now reported per stage, so the progressbar often does NOT move between
  // consecutive questions — the hidden questionKey input is the reliable
  // signal: it changes on every step and disappears at review.
  const keyInput = page.locator('input[name="questionKey"]');
  // count() does not auto-wait, so the read is instant even once the input is
  // gone (review and recommendation have no question form at all).
  const readKey = async () => ((await keyInput.count()) === 0 ? null : await keyInput.inputValue());
  const before = await readKey();
  await action();
  await page.getByRole('button', { name: /^Continue$/ }).click();
  await expect(async () => {
    expect(await readKey()).not.toBe(before);
  }).toPass();
}

async function startBangladeshAssessment(page: import('@playwright/test').Page) {
  await answer(page, async () => {
    await page.getByRole('radio', { name: 'Start a business in Bangladesh' }).click();
  });
}

test.describe('questionnaire', () => {
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

    await expect(page.getByText('Stage 1 of 5', { exact: false })).toBeVisible();
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
    await answer(page, async () => {
      await page.getByRole('radio', { name: 'Start a business in Bangladesh' }).click();
    });
    await record();
    await answer(page, async () => {
      await page.getByRole('radio', { name: 'In Bangladesh' }).click();
    });
    await record();
    await answer(page, async () => {
      await page.getByRole('combobox').selectOption('BD');
    });
    await record();

    // The denominator never changes, and the stage number never decreases —
    // the two properties the old "Step 1 of 16 → Step 3 of 15" model broke.
    expect([...totals]).toEqual(['5']);
    for (let i = 1; i < seen.length; i += 1) {
      expect(seen[i]!, `stage decreased at step ${i}`).toBeGreaterThanOrEqual(seen[i - 1]!);
    }
    await expect(progress).toBeVisible();
  });

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
    // A full walk is ~14 server-action round trips, and in the DB-less test
    // environment each one also waits out failing Supabase fetches. test.slow()
    // (3× = 180s) has proven borderline — walks were observed reaching review
    // correctly at just over the budget — so the budget is explicit.
    test.setTimeout(420_000);
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
    // A full walk is ~14 server-action round trips, and in the DB-less test
    // environment each one also waits out failing Supabase fetches. test.slow()
    // (3× = 180s) has proven borderline — walks were observed reaching review
    // correctly at just over the budget — so the budget is explicit.
    test.setTimeout(420_000);
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
