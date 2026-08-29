/**
 * The one place brand and legal-entity naming lives.
 *
 * The public brand is lowercase `bdoor` — matching the supplied logo, whose
 * wordmark is lowercase — and the contracting entity is `bdoor compliance
 * ltd`. Public copy, metadata and structured data take the brand name;
 * anything that identifies who a customer contracts with, or who controls
 * their data, takes the legal name. Neither is ever spelt "BDoor" in
 * customer-facing text; a unit test enforces that in both dictionaries.
 *
 * No office address on purpose: the owner has expressly asked that none be
 * displayed. Do not add one here or anywhere else.
 */
export const COMPANY = {
  /** Public brand, always lowercase. */
  brand: 'bdoor',
  /** Contracting entity / data controller. */
  legalName: 'bdoor compliance ltd',
  domain: 'bdoor.io',
  email: 'hello@bdoor.io',
} as const;
