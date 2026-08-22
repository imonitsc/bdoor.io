import { Client } from 'pg';

/**
 * Integration-test harness.
 *
 * These tests run the real migrations against a real PostgreSQL server and
 * exercise the actual Row Level Security policies — not a mock of them.
 * `scripts/local-db/apply.sh --seed` builds the database; `pnpm run
 * test:integration` assumes it has been run (see README → Testing).
 *
 * `asUser` reproduces what PostgREST does per request: switch to the
 * `authenticated` role and set the request JWT claims, so `auth.uid()` returns
 * the right subject and every policy sees exactly what it would in production.
 */
export const CONNECTION = {
  host: process.env.PGHOST ?? '/tmp',
  port: Number(process.env.PGPORT ?? 55432),
  user: process.env.PGUSER ?? 'postgres',
  database: process.env.PGDATABASE ?? 'bdoor_test',
};

/** Fixed ids from supabase/seed.sql. */
export const USERS = {
  localFounder: '11111111-1111-4111-8111-000000000001',
  foreignFounder: '11111111-1111-4111-8111-000000000002',
  colleague: '11111111-1111-4111-8111-000000000003',
  partnerOwner: '22222222-2222-4222-8222-000000000001',
  partnerStaff: '22222222-2222-4222-8222-000000000002',
  caseManager: '33333333-3333-4333-8333-000000000001',
  compliance: '33333333-3333-4333-8333-000000000002',
  finance: '33333333-3333-4333-8333-000000000003',
  admin: '33333333-3333-4333-8333-000000000004',
  stranger: '99999999-9999-4999-8999-000000000001',
} as const;

export const ORGS = {
  padma: 'a0000000-0000-4000-8000-000000000001',
  northwind: 'a0000000-0000-4000-8000-000000000002',
  partner: 'b0000000-0000-4000-8000-000000000001',
} as const;

export const CASES = {
  padmaDraft: 'f0000000-0000-4000-8000-000000000001',
  northwindIncorporation: 'f0000000-0000-4000-8000-000000000002',
  padmaIrc: 'f0000000-0000-4000-8000-000000000003',
  padmaApproved: 'f0000000-0000-4000-8000-000000000004',
} as const;

export const DOCUMENTS = {
  northwindPassport: 'f3000000-0000-4000-8000-000000000001',
  padmaCertificate: 'f3000000-0000-4000-8000-000000000003',
} as const;

export async function connect(): Promise<Client> {
  const client = new Client(CONNECTION);
  await client.connect();
  return client;
}

/** Runs `fn` with the session acting as `userId` under the `authenticated` role. */
export async function asUser<T>(
  client: Client,
  userId: string | null,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  await client.query('begin');
  try {
    await client.query(`set local role ${userId ? 'authenticated' : 'anon'}`);
    await client.query('select set_config($1, $2, true)', [
      'request.jwt.claims',
      JSON.stringify({ sub: userId, role: userId ? 'authenticated' : 'anon' }),
    ]);
    return await fn(client);
  } finally {
    await client.query('rollback');
  }
}

/** Rows visible to `userId` for a simple select. */
export async function selectAs(
  client: Client,
  userId: string | null,
  sql: string,
  values: unknown[] = [],
): Promise<Array<Record<string, unknown>>> {
  return asUser(client, userId, async (c) => (await c.query(sql, values)).rows);
}

/** Captures the error code of a statement that is expected to be refused. */
export async function expectRejected(
  client: Client,
  userId: string | null,
  sql: string,
  values: unknown[] = [],
): Promise<{ rejected: boolean; code?: string; message?: string }> {
  return asUser(client, userId, async (c) => {
    try {
      await c.query(sql, values);
      return { rejected: false };
    } catch (error) {
      const err = error as { code?: string; message?: string };
      return { rejected: true, code: err.code, message: err.message };
    }
  });
}

/** Ensures the extra test user exists without touching the seed file. */
export async function ensureStranger(client: Client): Promise<void> {
  await client.query(
    `insert into auth.users (id, email) values ($1, 'stranger@example.test')
     on conflict (id) do nothing`,
    [USERS.stranger],
  );
  await client.query(
    `insert into public.profiles (id, full_name, email)
     values ($1, 'Unrelated Person (sample)', 'stranger@example.test')
     on conflict (id) do nothing`,
    [USERS.stranger],
  );
}
