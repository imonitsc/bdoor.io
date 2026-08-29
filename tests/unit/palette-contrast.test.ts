import { describe, expect, it } from 'vitest';
import { BRAND, GRADIENT, GRADIENT_INVERSE, TEXT_SAFE, contrastRatio } from '@/lib/brand/palette';

/**
 * The brief mandates both an exact palette (§5.2) and WCAG 2.2 AA (§24), and
 * those two demands are in tension: three of the seven brand colours cannot
 * carry text at their published values. This pins where each one may be used,
 * so a future "let's make that button turquoise" fails here rather than in an
 * audit.
 */
const AA_TEXT = 4.5;
const AA_LARGE_AND_UI = 3;

describe('brand palette contrast', () => {
  it('keeps the published brand values exactly', () => {
    // Nothing below may "fix" a brand colour by nudging it.
    expect(BRAND).toEqual({
      cobalt: '#164EEB',
      vermilion: '#FF2630',
      turquoise: '#13B8AE',
      marigold: '#FFBE2E',
      midnight: '#081633',
      cloud: '#F2F5F8',
      white: '#FFFFFF',
    });
  });

  describe('pairings the product actually uses for text', () => {
    it.each([
      ['white on cobalt', BRAND.white, BRAND.cobalt],
      ['cobalt on white', BRAND.cobalt, BRAND.white],
      ['cobalt on cloud', BRAND.cobalt, BRAND.cloud],
      ['white on midnight', BRAND.white, BRAND.midnight],
      ['midnight on white', BRAND.midnight, BRAND.white],
      ['midnight on cloud', BRAND.midnight, BRAND.cloud],
      ['midnight on marigold', BRAND.midnight, BRAND.marigold],
      ['text-safe turquoise on white', TEXT_SAFE.turquoise, BRAND.white],
      ['text-safe vermilion on white', TEXT_SAFE.vermilion, BRAND.white],
      ['text-safe marigold on white', TEXT_SAFE.marigold, BRAND.white],
      ['text-safe turquoise on cloud', TEXT_SAFE.turquoise, BRAND.cloud],
      ['text-safe vermilion on cloud', TEXT_SAFE.vermilion, BRAND.cloud],
      ['text-safe marigold on cloud', TEXT_SAFE.marigold, BRAND.cloud],
    ])('%s reaches AA for normal text', (_name, fg, bg) => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe('accents that must never carry body text', () => {
    it('records that turquoise fails even the 3:1 UI threshold on white', () => {
      // Not an aspiration to fix — it is why TEXT_SAFE.turquoise exists.
      expect(contrastRatio(BRAND.turquoise, BRAND.white)).toBeLessThan(AA_LARGE_AND_UI);
    });

    it('records that vermilion is large-text and UI only', () => {
      const ratio = contrastRatio(BRAND.vermilion, BRAND.white);
      expect(ratio).toBeGreaterThanOrEqual(AA_LARGE_AND_UI);
      expect(ratio).toBeLessThan(AA_TEXT);
    });

    it('records that white on marigold is unusable', () => {
      expect(contrastRatio(BRAND.white, BRAND.marigold)).toBeLessThan(AA_LARGE_AND_UI);
    });
  });

  it('gives every text-safe variant AA on every light surface, not just white', () => {
    // Cloud is the page canvas and the darkest light surface, so it is the one
    // that binds. An earlier version of this test measured only against white:
    // it passed while the rendered page sat at 4.16:1, and the axe suite caught
    // what this had missed.
    for (const [name, hex] of Object.entries(TEXT_SAFE)) {
      expect(contrastRatio(hex, BRAND.white), `${name} on white`).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(hex, BRAND.cloud), `${name} on cloud`).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  describe('the signature gradient', () => {
    it('keeps a white button label AA at the gradient’s lightest point', () => {
      // A gradient button's text sits on every colour between the stops; the
      // lighter stop is the one that binds. The design system's suggested
      // endpoint (#4D7CFF) failed this at 3.72:1 and was rejected.
      expect(contrastRatio(BRAND.white, GRADIENT.to)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(BRAND.white, GRADIENT.from)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it('keeps gradient display text readable on both light surfaces', () => {
      for (const stop of [GRADIENT.from, GRADIENT.to]) {
        expect(contrastRatio(stop, BRAND.white)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrastRatio(stop, BRAND.cloud)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    });

    it('keeps the inverse gradient readable on midnight at both stops', () => {
      // Used for the hero's highlighted phrase — display size, but both stops
      // clear even the normal-text threshold, so size never becomes a caveat.
      for (const stop of [GRADIENT_INVERSE.from, GRADIENT_INVERSE.to]) {
        expect(contrastRatio(stop, BRAND.midnight)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    });
  });

  it('computes a known ratio correctly', () => {
    // Black on white is 21:1 exactly; a sanity check on the formula itself.
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });
});
