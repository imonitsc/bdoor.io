/**
 * The shared sector vocabulary (ROADMAP P3) — the tokens on which a
 * company's sector and a rule's sector scope are allowed to meet. The
 * database enforces the same list on both sides
 * (supabase/migrations/20260101003600_entity_import.sql;
 * tests/unit/sector-vocabulary.test.ts fails if the two drift), because the
 * engine excludes silently on a sector mismatch: an out-of-vocabulary
 * spelling would invisibly suppress a real obligation.
 *
 * "Unsure" is deliberately NOT a token: it maps to NULL, and a
 * sector-scoped rule against an unknown sector surfaces "may apply —
 * confirm" rather than deciding either way.
 */
export const SECTORS = [
  'agriculture',
  'construction_real_estate',
  'education',
  'financial_services',
  'food_beverage',
  'garments_textiles',
  'healthcare_pharma',
  'it_software',
  'logistics_transport',
  'manufacturing',
  'media_telecom',
  'tourism_hospitality',
  'trading_retail',
  'other',
] as const;

export type Sector = (typeof SECTORS)[number];
