-- ---------------------------------------------------------------------------
-- Import an existing entity from what it already has (ROADMAP P3).
--
-- The identifier columns (registration_no, etin, bin) have existed on
-- companies since the first schema; P3's import entry finally collects them.
-- What was missing for rule matching is SECTOR — and sector matching has a
-- sharp edge: the P1 engine treats a sector MISMATCH as silently
-- not-applicable (correct when both sides speak the same vocabulary, an
-- invisible suppression of a real obligation when they do not). So the
-- vocabulary is a data contract enforced on BOTH sides:
--
--   * companies.sector is constrained to the token list below;
--   * ai_structured_rules.sectors may only contain the same tokens.
--
-- The tokens are product taxonomy (which sectors BD regulation
-- distinguishes at the level rules are scoped), not regulatory facts; the
-- corpus carries no sector-scoped rule yet, so the constraint binds from
-- day one. Growing the list is one migration plus the mirrored TS constant
-- (src/features/compliance/sectors.ts — a drift test holds them together).
--
-- NULL sector stays meaningful: unknown. A sector-scoped rule against an
-- unknown sector resolves "may apply — confirm" (surfaced), never a silent
-- exclusion. The customer-facing "prefer not to say / unsure" maps to NULL.
--
-- Reversal: drop the sector column and the two check constraints.
-- ---------------------------------------------------------------------------

alter table public.companies
  add column sector text,
  add constraint companies_sector_values check (
    sector is null
    or sector in (
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
      'other'
    )
  );

comment on column public.companies.sector is
  'Sector token from the shared vocabulary (src/features/compliance/sectors.ts). NULL = unknown: sector-scoped rules surface as "may apply" instead of silently matching or not.';

-- Rules must scope by the same tokens, or never sector-scope at all.
alter table public.ai_structured_rules
  add constraint ai_structured_rules_sectors_vocabulary check (
    sectors <@ array[
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
      'other'
    ]::text[]
  );
