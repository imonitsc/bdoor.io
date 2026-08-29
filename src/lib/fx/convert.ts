/**
 * Display-currency conversion (master instructions §10).
 *
 * These helpers produce APPROXIMATE second-currency figures for public
 * comparison only. Nothing here touches a ledger: original amounts and
 * currencies are stored untouched, invoices are computed at exact
 * precision by the quote engine, and a settled transaction is never
 * recalculated. Rounding follows the spec: public BDT equivalents round to
 * the nearest BDT 100, public USD equivalents to the nearest whole dollar.
 */

/** Approximate whole-dollar equivalent (in minor units) of a BDT amount. */
export function approxUsdMinorFromBdtMinor(bdtMinor: number, rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error(`invalid USD/BDT rate: ${rate}`);
  return Math.round(bdtMinor / 100 / rate) * 100;
}

/** Approximate BDT equivalent (in minor units) of a USD amount, to BDT 100. */
export function approxBdtMinorFromUsdMinor(usdMinor: number, rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error(`invalid USD/BDT rate: ${rate}`);
  return Math.round(((usdMinor / 100) * rate) / 100) * 100 * 100;
}
