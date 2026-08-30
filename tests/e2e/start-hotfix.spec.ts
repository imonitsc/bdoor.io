import { expect, test, type Page } from '@playwright/test';

/**
 * Production hotfix regression suite (29 Aug 2026).
 *
 * The reported launch blocker: a stale device draft for one country silently
 * beat an explicit ?country=/?package= link, and Continue waited on network
 * persistence. These tests pin the fixed precedence, the immediacy contract,
 * the truthful save control, the focused /start layout, and the rule that a
 * missing owner asset hides instead of rendering "Missing asset" text.
 */

const LOCAL_DRAFT_KEY = 'bdoor_intake_draft';

/** Seeds this device's saved draft exactly as the questionnaire writes it. */
function seedDraft(page: Page, answers: Record<string, unknown>) {
  return page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key!, value!);
    },
    [LOCAL_DRAFT_KEY, JSON.stringify({ answers, savedAt: Date.now() })],
  );
}

const STALE_US_DRAFT = {
  market_scope: 'outside',
  target_country: 'usa',
  objective: 'new',
};

test.describe('URL parameters beat a stale stored draft (hotfix §2)', () => {
  const COUNTRIES: Array<[slug: string, name: string]> = [
    ['uk', 'United Kingdom'],
    ['uae', 'United Arab Emirates'],
    ['saudi-arabia', 'Saudi Arabia'],
    ['qatar', 'Qatar'],
    ['singapore', 'Singapore'],
  ];

  test('every international ?country= overrides a saved United States draft', async ({ page }) => {
    await seedDraft(page, STALE_US_DRAFT);
    for (const [slug, name] of COUNTRIES) {
      await page.goto(`/en/start?country=${slug}`);
      await expect(page.getByText(`Starting in ${name}`), slug).toBeVisible();
      await expect(page.getByText('Starting in United States')).toHaveCount(0);
    }
  });

  test('every package link overrides the stale route and lands on Bangladesh', async ({ page }) => {
    await seedDraft(page, STALE_US_DRAFT);
    for (const slug of ['solo-start', 'limited-company', 'complete-launch']) {
      await page.goto(`/en/start?package=${slug}`);
      await expect(page.getByText('Starting in Bangladesh'), slug).toBeVisible();
      await expect(page.getByText(`Selected package: ${slug}`), slug).toBeVisible();
      await expect(page.getByText('Starting in United States')).toHaveCount(0);
      // The link answered scope, country and stage, so the flow opens on the
      // first real Bangladesh question — not on the stale international route.
      await expect(page.getByText('Where are you based right now?'), slug).toBeVisible();
    }
  });

  test('an international country plus a Bangladesh package redirects to the canonical package URL', async ({
    page,
  }) => {
    await page.goto('/en/start?country=uk&package=solo-start');
    await expect(page).toHaveURL(/\/en\/start\?package=solo-start$/);
    await expect(page.getByText('Starting in Bangladesh')).toBeVisible();
    await expect(page.getByText('Selected package: solo-start')).toBeVisible();
  });

  test('the override holds in Bangla too', async ({ page }) => {
    await seedDraft(page, STALE_US_DRAFT);
    await page.goto('/bn/start?country=uk');
    await expect(page.getByText('যুক্তরাজ্য-এ শুরু করছেন')).toBeVisible();
  });
});

test.describe('resume choice (hotfix §2 step 3)', () => {
  const BD_PARTIAL_DRAFT = {
    market_scope: 'bangladesh',
    target_country: 'bangladesh',
    objective: 'new',
  };

  test('a bare /start with a saved draft offers resume or start-new', async ({ page }) => {
    await seedDraft(page, BD_PARTIAL_DRAFT);
    await page.goto('/en/start');

    await expect(page.getByText('You have a saved application')).toBeVisible();
    await page.getByRole('button', { name: 'Resume saved application' }).click();
    // The draft answered the first three questions; resuming continues.
    await expect(page.getByText('Where are you based right now?')).toBeVisible();
  });

  test('start-new clears the saved draft after the visitor confirms', async ({ page }) => {
    await seedDraft(page, BD_PARTIAL_DRAFT);
    await page.goto('/en/start');

    await page.getByRole('button', { name: 'Start a new application' }).click();
    await expect(page.getByText('Where do you want to start or manage a business?')).toBeVisible();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), LOCAL_DRAFT_KEY)).toBe(
      null,
    );
  });

  test('a URL seed skips the resume prompt — the link already chose', async ({ page }) => {
    await seedDraft(page, BD_PARTIAL_DRAFT);
    await page.goto('/en/start?country=singapore');
    await expect(page.getByText('You have a saved application')).toHaveCount(0);
    await expect(page.getByText('Starting in Singapore')).toBeVisible();
  });
});

test.describe('Continue and Back never wait on persistence (hotfix §3)', () => {
  // Answered through nationality with the email already known, so advancing
  // the next step fires the real background save this suite slows down.
  const DRAFT_WITH_EMAIL = {
    market_scope: 'bangladesh',
    target_country: 'bangladesh',
    objective: 'new',
    founder_location: 'bangladesh',
    nationality: 'BD',
    email: 'founder@example.com',
  };

  async function resumeAtCategory(page: Page) {
    await page.goto('/en/start');
    await page.getByRole('button', { name: 'Resume saved application' }).click();
    await expect(page.locator('form[data-question-key="business_category"]')).toBeVisible();
    await page.getByLabel('Search categories').fill('IT services');
    await page.getByRole('radio', { name: 'IT services and support', exact: true }).check();
  }

  test('Continue advances within the immediacy budget while every save takes 5s', async ({
    page,
  }) => {
    await seedDraft(page, DRAFT_WITH_EMAIL);
    // Server Actions are POSTs to the page URL; page loads stay fast.
    await page.route('**/*', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      await route.continue();
    });

    await resumeAtCategory(page);
    await page.getByRole('button', { name: /^Continue$/ }).click();
    // The screen must change client-side, long before the 5s save settles.
    await expect(page.locator('form[data-question-key="location"]')).toBeVisible({
      timeout: 2_000,
    });

    // Back is pure client state — the same budget applies.
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('form[data-question-key="business_category"]')).toBeVisible({
      timeout: 2_000,
    });
  });

  test('a failed background save neither blocks nor lies about being saved', async ({ page }) => {
    await seedDraft(page, DRAFT_WITH_EMAIL);
    await page.route('**/*', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.abort();
    });

    await resumeAtCategory(page);
    await page.getByRole('button', { name: /^Continue$/ }).click();
    await expect(page.locator('form[data-question-key="location"]')).toBeVisible({
      timeout: 2_000,
    });
    // The status falls back to the truthful device-only wording; it must not
    // stay stuck on "Saving…" and must not claim an account draft exists.
    await expect(page.getByText('Draft saved on this device')).toBeVisible();
    await expect(page.getByText('Saving…')).toHaveCount(0);
    await expect(page.getByText('Draft saved', { exact: true })).toHaveCount(0);
  });
});

test.describe('Save & exit (hotfix P1)', () => {
  test('is a real keyboard-operable control that saves locally and goes home', async ({ page }) => {
    await page.goto('/en/start?country=bangladesh&objective=new');
    await expect(page.getByText('Where are you based right now?')).toBeVisible();

    const saveAndExit = page.getByRole('link', { name: 'Save & exit' });
    // Hydration can replace the node between focus() and the assertion, so
    // retry the pair until focus sticks on the live element.
    await expect(async () => {
      await saveAndExit.focus();
      await expect(saveAndExit).toBeFocused({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/en$/);
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), LOCAL_DRAFT_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).answers.target_country).toBe('bangladesh');
  });

  test('never implies a cloud save before an account exists', async ({ page }) => {
    await page.goto('/en/start?country=bangladesh&objective=new');
    await expect(page.getByText('Draft saved on this device')).toBeVisible();
    await expect(page.getByText('Save on this device and exit')).toHaveCount(0);
  });
});

test.describe('focused application layout (hotfix P1)', () => {
  test('/start carries a slim header and a three-link footer', async ({ page }) => {
    await page.goto('/en/start');

    // Slim header: brand home link and the language switch — no marketing nav.
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'bdoor' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Services' })).toHaveCount(0);
    await expect(header.getByRole('link', { name: 'Pricing' })).toHaveCount(0);

    // Focused footer: help plus the two policies an applicant might need.
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Need help? Contact us' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    expect(await footer.getByRole('link').count()).toBe(3);

    // The marketing footer's country directory must not follow the form.
    await expect(footer.getByRole('link', { name: 'United States' })).toHaveCount(0);
    await expect(footer.getByRole('link', { name: 'All countries' })).toHaveCount(0);
  });
});

test.describe('assets and founder section (hotfix P1)', () => {
  test('no page ever shows "Missing asset" placeholder text', async ({ page }) => {
    for (const path of ['/en', '/en/services', '/en/about', '/bn']) {
      await page.goto(path);
      await expect(page.getByText('Missing asset', { exact: false }), path).toHaveCount(0);
    }
  });

  test('the About page introduces the founder with only the approved facts', async ({ page }) => {
    await page.goto('/en/about');
    await expect(page.getByRole('heading', { name: 'Imon Ibraheem' })).toBeVisible();
    await expect(page.getByText('Founder', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Imon founded bdoor to make business formation', { exact: false }),
    ).toBeVisible();

    await page.goto('/bn/about');
    await expect(page.getByRole('heading', { name: 'Imon Ibraheem' })).toBeVisible();
    await expect(page.getByText('প্রতিষ্ঠাতা', { exact: true })).toBeVisible();
  });

  test('the homepage process section reads as three concise steps', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { name: 'Assessment' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Itemised quote' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeVisible();
  });
});

test.describe('responsive composition (hotfix §8)', () => {
  const WIDTHS = [375, 768, 1024, 1363, 1440] as const;

  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px on / and /start`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/en', '/en/start', '/bn', '/bn/start']) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});
