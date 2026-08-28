import { expect, test } from '@playwright/test';

/**
 * The authentication forms, actually submitted.
 *
 * Every other suite loads these pages with a GET, and `/en/signup` is
 * prerendered — so a GET serves static HTML and never loads the Server Action
 * module behind it. That is how an illegal export in a `'use server'` file
 * (`export { IDLE as initialAuthState }`) survived build, typecheck, CI and
 * Playwright, and broke signing up in production with "Something went wrong".
 *
 * These run with no real Supabase, as the rest of the e2e suite does. The
 * action reaches the network, fails, and returns the same "check your email"
 * screen it returns for an address that is already registered — deliberately,
 * so the form never reveals who has an account. That makes the outcome
 * deterministic here without a database.
 */
test.describe('signing up', () => {
  test('submits and reaches the confirmation screen, not the error boundary', async ({ page }) => {
    await page.goto('/en/signup');

    await page.fill('input[name="fullName"]', 'Test Person');
    await page.fill('input[name="email"]', 'e2e-signup@example.test');
    await page.fill('input[name="password"]', 'a-long-enough-password');
    await page.fill('input[name="confirmPassword"]', 'a-long-enough-password');

    // Radix renders a button[role=checkbox] plus a hidden input for the form
    // post, so the accessible role is the handle — and it is what a person
    // actually clicks.
    const consent = page.getByRole('checkbox');
    await consent.check();
    await expect(consent).toBeChecked();

    await page.getByRole('button', { name: /create|sign up/i }).click();

    await expect(page.getByText('Confirm your email')).toBeVisible();
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });

  test('names the address the confirmation was sent to', async ({ page }) => {
    await page.goto('/en/signup');

    await page.fill('input[name="fullName"]', 'Test Person');
    await page.fill('input[name="email"]', 'named-address@example.test');
    await page.fill('input[name="password"]', 'a-long-enough-password');
    await page.fill('input[name="confirmPassword"]', 'a-long-enough-password');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /create|sign up/i }).click();

    // It used to interpolate a translation key that does not exist, so this
    // read "we sent a confirmation link to common.email".
    await expect(page.getByText('named-address@example.test')).toBeVisible();
    await expect(page.getByText('common.email')).toHaveCount(0);
  });

  test('rejects a mismatched password without leaving the form', async ({ page }) => {
    await page.goto('/en/signup');

    await page.fill('input[name="fullName"]', 'Test Person');
    await page.fill('input[name="email"]', 'mismatch@example.test');
    await page.fill('input[name="password"]', 'a-long-enough-password');
    await page.fill('input[name="confirmPassword"]', 'a-different-password');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /create|sign up/i }).click();

    await expect(page.getByText('Confirm your email')).toHaveCount(0);
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });
});

test.describe('signing in', () => {
  test('submits without hitting the error boundary', async ({ page }) => {
    await page.goto('/en/login');

    await page.fill('input[name="email"]', 'e2e-login@example.test');
    await page.fill('input[name="password"]', 'a-long-enough-password');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // The credentials are wrong and there is no database; what matters is that
    // the action module loads and the page handles it.
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    await expect(page).toHaveURL(/\/en\/login/);
  });
});
