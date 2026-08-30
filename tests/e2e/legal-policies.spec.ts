import { expect, test, type Page } from '@playwright/test';

/**
 * The complete published legal-policy suite (version 1.0, effective
 * 30 Aug 2026): all ten documents, in both locales, must be substantive
 * customer-facing text with no draft banner and no launch warning.
 *
 * The failure modes this suite pins down were live on production at some
 * point: empty documents (a heading over nothing), internal drafting notes
 * printed as policy text, literal "---" separators — and now, after the
 * go-live release, any lingering "Working draft" posture.
 */

const VERSION = 'Version 1.0';

const POLICIES: ReadonlyArray<{ slug: string; en: string; bn: string }> = [
  { slug: 'terms', en: 'Terms of Service', bn: 'সেবার শর্তাবলি' },
  { slug: 'privacy', en: 'Privacy Policy', bn: 'গোপনীয়তা নীতি' },
  { slug: 'refund-policy', en: 'Refund and Cancellation Policy', bn: 'ফেরত ও বাতিলকরণ নীতি' },
  { slug: 'aml-kyc-policy', en: 'AML, KYC and Sanctions Policy', bn: 'AML, KYC ও নিষেধাজ্ঞা নীতি' },
  { slug: 'cookie-policy', en: 'Cookie Policy', bn: 'কুকি নীতি' },
  {
    slug: 'legal-disclaimer',
    en: 'Legal and Professional Services Disclaimer',
    bn: 'আইনি ও পেশাগত সেবা সংক্রান্ত দাবিত্যাগ',
  },
  { slug: 'complaints', en: 'Complaints Policy', bn: 'অভিযোগ নীতি' },
  { slug: 'acceptable-use', en: 'Acceptable Use Policy', bn: 'গ্রহণযোগ্য ব্যবহার নীতি' },
  {
    slug: 'provider-disclosure',
    en: 'Third-Party Professional and Provider Disclosure',
    bn: 'তৃতীয় পক্ষের পেশাজীবী ও প্রদানকারী প্রকাশ',
  },
  {
    slug: 'electronic-consent',
    en: 'Electronic Communications and Consent Policy',
    bn: 'ইলেকট্রনিক যোগাযোগ ও সম্মতি নীতি',
  },
];

/** Wording that must never reach a customer-facing policy page. */
const INTERNAL_LANGUAGE = /\bcursor\b|\bclaude\b|\btodo\b|\bfixme\b|\bplaceholder\b|\blorem\b/i;

async function auditPolicyPage(page: Page, locale: 'en' | 'bn', policy: (typeof POLICIES)[number]) {
  const label = `${locale}/${policy.slug}`;

  const response = await page.goto(`/${locale}/${policy.slug}`);
  expect(response?.status(), `${label} status`).toBe(200);

  // One unique, correctly localised h1.
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1, label).toHaveCount(1);
  await expect(h1, label).toHaveText(policy[locale]);

  // The version stamp customers accept against, with its effective date.
  await expect(page.getByText(VERSION), label).toBeVisible();

  // Published: no draft banner in either locale. The Bangla route still
  // carries the honest translation-review notice (its body is English).
  await expect(page.getByText('Working draft — professional approval required'), label).toHaveCount(
    0,
  );
  await expect(page.getByText('কার্যকরী খসড়া — পেশাদার অনুমোদন প্রয়োজন'), label).toHaveCount(0);
  if (locale === 'bn') {
    await expect(page.getByText('বাংলা অনুবাদ পর্যালোচনাধীন'), label).toBeVisible();
  }

  // Table of contents: every entry must point at an existing section, and no
  // section may be blank under its heading.
  const tocLinks = page.locator('nav a[href^="#"]');
  const tocCount = await tocLinks.count();
  expect(tocCount, `${label} has an empty table of contents`).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < tocCount; i += 1) {
    const href = await tocLinks.nth(i).getAttribute('href');
    const section = page.locator(`section[id="${href!.slice(1)}"]`);
    await expect(section, `${label} ToC target ${href}`).toHaveCount(1);
    const text = (await section.innerText()).trim();
    const heading = (await section.locator('h2').first().innerText()).trim();
    expect(
      text.replace(heading, '').trim().length,
      `${label} section ${href} is blank`,
    ).toBeGreaterThan(80);
  }

  const body = await page.locator('main').innerText();
  expect(body.length, `${label} body too short`).toBeGreaterThan(1500);
  expect(body, `${label} contains internal development language`).not.toMatch(INTERNAL_LANGUAGE);
  // The content pack's horizontal rules must never render as literal dashes.
  expect(body, `${label} renders a literal ---`).not.toMatch(/^---$/m);

  // Published policies are indexable and carry a canonical URL.
  const robots = page.locator('meta[name="robots"]');
  if ((await robots.count()) > 0) {
    await expect(robots, label).not.toHaveAttribute('content', /noindex/);
  }
  await expect(page.locator('link[rel="canonical"]'), label).toHaveAttribute(
    'href',
    new RegExp(`/${locale}/${policy.slug}$`),
  );
}

test.describe('legal policy suite', () => {
  test('all ten English policy routes are complete', async ({ page }) => {
    test.setTimeout(240_000);
    for (const policy of POLICIES) {
      await auditPolicyPage(page, 'en', policy);
    }
  });

  test('all ten Bangla policy routes are complete', async ({ page }) => {
    test.setTimeout(240_000);
    for (const policy of POLICIES) {
      await auditPolicyPage(page, 'bn', policy);
    }
  });

  test('the ten titles are unique in each locale', () => {
    for (const locale of ['en', 'bn'] as const) {
      const titles = POLICIES.map((p) => p[locale]);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  test('the legal index and footer link every policy', async ({ page }) => {
    await page.goto('/en/legal');
    await expect(page.getByRole('heading', { level: 1, name: 'Legal policies' })).toBeVisible();
    const main = page.locator('main');
    for (const policy of POLICIES) {
      await expect(main.getByRole('link', { name: policy.en }), policy.slug).toBeVisible();
    }
    await expect(main.getByText(VERSION).first()).toBeVisible();

    // The marketing footer reaches all ten from any content page.
    const footer = page.locator('footer');
    for (const policy of POLICIES) {
      await expect(
        footer.getByRole('link', { name: policy.en, exact: true }),
        `footer link ${policy.slug}`,
      ).toBeVisible();
    }
  });

  test('Bangla pages render in the Hind Siliguri typeface', async ({ page }) => {
    await page.goto('/bn/terms');
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(family).toContain('Hind Siliguri');

    // English pages keep the Latin brand face as their first choice.
    await page.goto('/en/terms');
    const enFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(enFamily).not.toContain('Hind Siliguri');
  });

  test('policy pages hold their layout at phone and desktop widths', async ({ page }) => {
    for (const [width, height] of [
      [375, 800],
      [1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      for (const path of ['/en/terms', '/en/privacy', '/bn/legal-disclaimer']) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });
});
