import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * `PLAYWRIGHT_CHROMIUM_PATH` lets a CI image that already ships a Chromium build
 * point Playwright at it instead of downloading a second copy. Leave it unset
 * locally and Playwright uses its own managed browser.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm run build && pnpm run start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: {
          // The suite walks the questionnaire end to end several times from one
          // address, which is exactly the shape the limiter is there to stop.
          RATE_LIMIT_DISABLED: 'true',
          // E2E runs without Supabase credentials; the app degrades gracefully
          // and the boot-time completeness check would otherwise refuse to start.
          STRICT_ENV: 'false',
          // Synthetic, and deliberately unreachable. Nothing here talks to a
          // real project, so the marketing pages still prove they render from
          // the bundled catalogue snapshot without a working database — which
          // is the point of running this way.
          //
          // What they add is a Supabase client that can be constructed at all.
          // Without them, submitting a form threw at construction, so the auth
          // journeys could not be exercised — which is how an illegal export in
          // a 'use server' file reached production and broke signing up.
          //
          // This costs wall-clock: the proxy now runs the full session refresh
          // on every request instead of returning early, and the suite goes
          // from about 1.1 minutes to 3.7. Measured both ways, and measured
          // again with a closed local port instead of an unresolvable host —
          // the cost is the refresh path, not DNS, so the cheaper-looking URL
          // buys nothing. Worth paying: without it no form can be submitted in
          // this suite at all, and that blind spot is exactly what let a broken
          // signup reach production.
          NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e_placeholder',
        },
      },
});
