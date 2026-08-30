import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_EVENTS, isTestActorEmail } from '@/lib/analytics/taxonomy';

/**
 * The taxonomy exists twice on purpose — once in code, once as the database
 * check constraint — and this test is what keeps them the same list, the same
 * way the case state machine and provider-application transitions are held
 * to their SQL.
 */

const MIGRATION = join(
  process.cwd(),
  'supabase/migrations/20260101002600_analytics_metrics_subscriptions.sql',
);

function eventNamesFromMigration(): string[] {
  const sql = readFileSync(MIGRATION, 'utf8');
  const constraint = sql.match(
    /constraint analytics_events_name_values check \(\s*event_name in \(([\s\S]*?)\)\s*\)/,
  );
  if (!constraint) throw new Error('analytics_events_name_values constraint not found');
  return [...constraint[1]!.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]!);
}

describe('analytics taxonomy', () => {
  it('matches the database check constraint exactly', () => {
    expect([...eventNamesFromMigration()].sort()).toEqual([...ANALYTICS_EVENTS].sort());
  });

  it('has unique, snake_case event names', () => {
    expect(new Set(ANALYTICS_EVENTS).size).toBe(ANALYTICS_EVENTS.length);
    for (const event of ANALYTICS_EVENTS) {
      expect(event).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });
});

describe('test-actor detection (§13.7)', () => {
  it('flags the seed and example-domain actors', () => {
    expect(isTestActorEmail('founder@example.com')).toBe(true);
    expect(isTestActorEmail('someone@example.test')).toBe(true);
    expect(isTestActorEmail('meghna (sample)')).toBe(true);
    expect(isTestActorEmail('ops+bdoor-test@bdoor.io')).toBe(true);
  });

  it('never flags a plausible real customer', () => {
    expect(isTestActorEmail('founder@meghnatrading.com.bd')).toBe(false);
    expect(isTestActorEmail('exampleperson@gmail.com')).toBe(false);
    expect(isTestActorEmail(null)).toBe(false);
    expect(isTestActorEmail(undefined)).toBe(false);
  });
});
