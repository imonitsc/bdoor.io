import { expect, test, type Page } from '@playwright/test';

/**
 * The provider application journey (portals spec §7).
 *
 * The e2e environment runs without Supabase on purpose, so the walk exercises
 * the degraded path end to end: the form warns that nothing persists, every
 * step validates client- and server-side through the shared schemas, and the
 * final submission reports honestly that it could not be stored instead of
 * fabricating a reference. The stored path is covered by the integration
 * suite against real Postgres.
 */

async function fillField(page: Page, key: string, value: string) {
  await page.locator(`#pa-${key}`).fill(value);
}

test.describe('provider application journey', () => {
  test('the partners page routes applicants to /partners/apply and keeps the enquiry route', async ({
    page,
  }) => {
    await page.goto('/en/partners');
    const apply = page.getByRole('link', { name: 'Apply to join' });
    await expect(apply).toBeVisible();
    await expect(apply).toHaveAttribute('href', '/en/partners/apply');
    await expect(page.getByRole('link', { name: 'Ask a question first' })).toHaveAttribute(
      'href',
      /\/en\/contact\?topic=partner$/,
    );
  });

  test('walks all six steps with validation and reports the degraded outcome honestly', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/en/partners/apply');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Apply to join the provider network',
    );
    // No database in e2e: the form must say so up front.
    await expect(page.getByText('nothing you enter here will be saved')).toBeVisible();

    // Step 1 refuses to advance while the required identity fields are empty.
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Please complete this field.').first()).toBeVisible();
    await expect(page.locator('form[data-step="firm"]')).toBeVisible();

    await fillField(page, 'legal_name', 'Meghna Legal Associates (sample)');
    await page.locator('#pa-firm_category').selectOption('law_firm');
    await fillField(page, 'registered_address', '12 Sample Road, Dhaka 1207');
    await fillField(page, 'contact_name', 'Test Partner (sample)');
    await fillField(page, 'contact_email', 'partner@example.com');
    await fillField(page, 'signatory_name', 'Test Partner (sample)');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: ownership + declarations must be literal ticks.
    await expect(page.locator('form[data-step="ownership"]')).toBeVisible();
    await fillField(page, 'owners_text', 'Test Partner (sample) — managing partner — 100%');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('This declaration is required to continue.').first()).toBeVisible();
    await page.locator('#pa-sanctions_declaration').check();
    await page.locator('#pa-integrity_declaration').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: professional standing.
    await expect(page.locator('form[data-step="standing"]')).toBeVisible();
    await fillField(page, 'regulator_name', 'Bangladesh Bar Council (sample)');
    await fillField(page, 'licence_no', 'BBC-0000 (sample)');
    await page.locator('#pa-disciplinary_declaration').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: at least one category and one jurisdiction.
    await expect(page.locator('form[data-step="services"]')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Law firm' }).check();
    await page.getByRole('checkbox', { name: 'Bangladesh' }).check();
    await page
      .locator('#pa-services_note')
      .fill('Incorporation paperwork and constitutional document drafting.');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 5: operational controls.
    await expect(page.locator('form[data-step="controls"]')).toBeVisible();
    await page
      .locator('#pa-conflict_process_note')
      .fill('Central register checked before any engagement is accepted.');
    await page
      .locator('#pa-complaint_process_note')
      .fill('Written complaints acknowledged in two business days.');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 6: declarations, then submission. Without a database the submit
    // must fail honestly rather than invent a reference.
    await expect(page.locator('form[data-step="declarations"]')).toBeVisible();
    await page.locator('#pa-accuracy_confirmed').check();
    await page.locator('#pa-authority_confirmed').check();
    await page.locator('#pa-terms_accepted').check();
    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page.getByText('We could not save your application just now.')).toBeVisible();
    await expect(page.getByTestId('provider-apply-received')).toHaveCount(0);
  });

  test('renders the Bangla application', async ({ page }) => {
    await page.goto('/bn/partners/apply');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'প্রোভাইডার নেটওয়ার্কে যোগ দিতে আবেদন করুন',
    );
    await expect(page.getByText('ধাপ 1/6', { exact: false })).toBeVisible();
  });

  test('holds its layout at phone and desktop widths', async ({ page }) => {
    for (const width of [375, 1440] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/en/partners/apply');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
});
