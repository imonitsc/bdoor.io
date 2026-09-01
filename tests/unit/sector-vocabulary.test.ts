import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { SECTORS } from '@/features/compliance/sectors';

/**
 * The sector vocabulary exists three times on purpose — the TS constant and
 * two database check constraints (companies.sector and
 * ai_structured_rules.sectors) — because the P1 engine excludes SILENTLY on
 * a sector mismatch. Any drift between the lists is an invisible suppression
 * of real obligations, so this test holds all three to one list.
 */

const MIGRATION = join(process.cwd(), 'supabase/migrations/20260101003600_entity_import.sql');

function tokensFrom(pattern: RegExp): string[] {
  const sql = readFileSync(MIGRATION, 'utf8');
  const match = sql.match(pattern);
  if (!match) throw new Error(`constraint not found: ${pattern}`);
  return [...match[1]!.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]!);
}

describe('sector vocabulary', () => {
  it('matches the companies.sector check constraint exactly', () => {
    const tokens = tokensFrom(
      /constraint companies_sector_values check \(\s*sector is null\s*or sector in \(([\s\S]*?)\)\s*\)/,
    );
    expect([...tokens].sort()).toEqual([...SECTORS].sort());
  });

  it('matches the rules sectors constraint exactly', () => {
    const tokens = tokensFrom(
      /constraint ai_structured_rules_sectors_vocabulary check \(\s*sectors <@ array\[([\s\S]*?)\]::text\[\]/,
    );
    expect([...tokens].sort()).toEqual([...SECTORS].sort());
  });

  it('uses unique snake_case tokens', () => {
    expect(new Set(SECTORS).size).toBe(SECTORS.length);
    for (const sector of SECTORS) {
      expect(sector).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });
});
