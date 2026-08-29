import 'server-only';

export { approxBdtMinorFromUsdMinor, approxUsdMinorFromBdtMinor } from './convert';

/**
 * The USD/BDT reference rate for approximate public display.
 *
 * Provider model: this is the `manual` provider — an owner-reviewed rate
 * entered through the environment, with the review date beside it. It is
 * deliberately the default and the only provider until a daily-refresh
 * source is contracted; a live provider implements this same
 * `usdBdtSnapshot()` shape (rate, reviewed/retrieved timestamp, provider
 * id) and replaces the environment read, changing no call site.
 *
 * Absent configuration disables second-currency display entirely — no rate
 * is ever invented, and the research snapshot in docs/COUNTRY_SOURCES.md
 * is never hard-coded here. An invalid value is a configuration error and
 * throws, like the launch gates, rather than silently converting at a
 * wrong rate.
 */
export type UsdBdtSnapshot = {
  /** BDT per 1 USD. */
  rate: number;
  /** ISO date the owner reviewed the rate. */
  reviewedAt: string;
  provider: 'manual';
};

export function usdBdtSnapshot(): UsdBdtSnapshot | null {
  const raw = process.env.FX_USD_BDT_RATE;
  if (raw === undefined || raw === '') return null;

  const rate = Number(raw);
  const reviewedAt = process.env.FX_USD_BDT_REVIEWED_AT ?? '';
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`FX_USD_BDT_RATE=${JSON.stringify(raw)} is not a positive number`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt)) {
    throw new Error(
      'FX_USD_BDT_REVIEWED_AT must be the ISO date (YYYY-MM-DD) the rate was reviewed',
    );
  }
  return { rate, reviewedAt, provider: 'manual' };
}
