#!/usr/bin/env node
/**
 * Dumps the active recommendation rules into src/content/rules-snapshot.ts,
 * so the questionnaire produces a recommendation even with no database.
 * Regenerate alongside the catalog snapshot.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const args = ['-h', process.env.PGHOST ?? '/tmp', '-p', process.env.PGPORT ?? '55432',
  '-U', process.env.PGUSER ?? 'postgres', '-d', process.env.PGDATABASE ?? 'bdoor_test', '-tAqc'];

const rules = JSON.parse(
  execFileSync('psql', [...args, `
    select coalesce(json_agg(json_build_object(
      'key', key, 'description', description,
      'conditions', conditions, 'outcome', outcome, 'priority', priority
    ) order by priority, key), '[]'::json)
    from public.recommendation_rules where is_active;
  `], { encoding: 'utf8' }).trim(),
);

writeFileSync(
  new URL('../../src/content/rules-snapshot.ts', import.meta.url),
  `// AUTO-GENERATED — DO NOT EDIT BY HAND.
//
// Offline copy of public.recommendation_rules, generated from supabase/seed.sql:
//   scripts/local-db/apply.sh --seed && node scripts/local-db/gen-rules-snapshot.mjs
//
// Used when the database is unreachable so the questionnaire still produces a
// recommendation. The hard manual-review checks in src/features/intake/rules.ts
// are in code and apply regardless of which source these rules came from.

import type { Rule } from '@/features/intake/rules';

export const SNAPSHOT_RULES: Rule[] = ${JSON.stringify(rules, null, 2)};
`,
);
console.log(`Snapshot: ${rules.length} recommendation rules.`);
