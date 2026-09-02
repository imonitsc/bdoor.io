import { expect, test } from '@playwright/test';

/**
 * The AUTH_PASSWORDLESS shape.
 *
 * The mode is chosen server-side, so this file needs a server started with the
 * flag on and is skipped otherwise: `pnpm run test:e2e:passwordless`. The
 * default suite keeps covering the password shape, which is what production
 * serves while the flag is off.
 */
test.skip(
  process.env.AUTH_PASSWORDLESS !== 'true',
  'requires a server started with AUTH_PASSWORDLESS=true',
);

test.describe('passwordless sign-in', () => {
  test('offers only the link, and never asks for a password', async ({ page }) => {
    await page.goto('/en/login');

    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.getByText(/forgot your password/i)).toHaveCount(0);

    await page.locator('input[name="email"]').fill('e2e-passwordless@example.test');
    await page.getByRole('button', { name: /link/i }).click();

    await expect(page.getByText(/if an account exists/i)).toBeVisible();
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });

  test('sends the password routes back to sign-in', async ({ page }) => {
    for (const path of ['/en/forgot-password', '/en/reset-password']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/en\/login/);
    }
  });
});

test.describe('passwordless signup', () => {
  test('refuses to send a link until consent is given', async ({ page }) => {
    await page.goto('/en/signup');

    await expect(page.locator('input[type="password"]')).toHaveCount(0);

    await page.locator('input[name="fullName"]').fill('Sample Founder');
    await page.locator('input[name="email"]').fill('e2e-passwordless-signup@example.test');

    // The consent control is a custom checkbox, not a native input, so the
    // browser does NOT block this submit — the Zod schema on the server does.
    // That is the guarantee worth asserting: an account may never begin from a
    // request that did not carry consent, however the page behaves.
    await page.getByRole('button', { name: /link/i }).click();

    await expect(page.getByText(/accept the terms/i).last()).toBeVisible();
    await expect(page.getByText(/check .* for a link/i)).toHaveCount(0);
  });

  test('sends the link once consent is given', async ({ page }) => {
    await page.goto('/en/signup');

    await page.getByRole('checkbox').check();
    await page.locator('input[name="fullName"]').fill('Sample Founder');
    await page.locator('input[name="email"]').fill('e2e-passwordless-signup@example.test');
    await page.getByRole('button', { name: /link/i }).click();

    await expect(page.getByText(/check .* for a link/i)).toBeVisible();
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });
});
