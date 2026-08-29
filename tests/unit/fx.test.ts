import { afterEach, describe, expect, it, vi } from 'vitest';
import { approxBdtMinorFromUsdMinor, approxUsdMinorFromBdtMinor } from '@/lib/fx/convert';
import { usdBdtSnapshot } from '@/lib/fx';

/**
 * Display conversion only: approximate public figures with the spec's
 * rounding (nearest whole USD; nearest BDT 100), and a manual reviewed-rate
 * source that never invents a rate and never accepts an unreviewed one.
 */
describe('display conversion rounding', () => {
  it('rounds USD equivalents to the nearest whole dollar', () => {
    // BDT 24,900 at 123.0707 ≈ USD 202.32 → USD 202.
    expect(approxUsdMinorFromBdtMinor(24_900_00, 123.0707)).toBe(202_00);
    // BDT 9,900 ≈ USD 80.44 → USD 80.
    expect(approxUsdMinorFromBdtMinor(9_900_00, 123.0707)).toBe(80_00);
  });

  it('rounds BDT equivalents to the nearest BDT 100', () => {
    // USD 499 at 123.0707 ≈ BDT 61,412 → BDT 61,400.
    expect(approxBdtMinorFromUsdMinor(499_00, 123.0707)).toBe(61_400_00);
    // USD 10,900 ≈ BDT 1,341,470 → BDT 1,341,500.
    expect(approxBdtMinorFromUsdMinor(10_900_00, 123.0707)).toBe(1_341_500_00);
  });

  it('refuses a nonsensical rate rather than converting at it', () => {
    for (const rate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => approxUsdMinorFromBdtMinor(1000, rate)).toThrow();
      expect(() => approxBdtMinorFromUsdMinor(1000, rate)).toThrow();
    }
  });
});

describe('manual rate snapshot', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is absent when unconfigured — no rate is ever invented', () => {
    vi.stubEnv('FX_USD_BDT_RATE', '');
    expect(usdBdtSnapshot()).toBeNull();
  });

  it('returns the reviewed rate with its review date', () => {
    vi.stubEnv('FX_USD_BDT_RATE', '123.07');
    vi.stubEnv('FX_USD_BDT_REVIEWED_AT', '2026-08-29');
    expect(usdBdtSnapshot()).toEqual({
      rate: 123.07,
      reviewedAt: '2026-08-29',
      provider: 'manual',
    });
  });

  it('treats an invalid rate or missing review date as a configuration error', () => {
    vi.stubEnv('FX_USD_BDT_RATE', 'not-a-number');
    expect(() => usdBdtSnapshot()).toThrow();

    vi.stubEnv('FX_USD_BDT_RATE', '123.07');
    vi.stubEnv('FX_USD_BDT_REVIEWED_AT', '');
    expect(() => usdBdtSnapshot()).toThrow();
  });
});
