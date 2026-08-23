import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CASES,
  ORGS,
  USERS,
  connect,
  disconnect,
  ensureStranger,
  expectRejected,
  selectAs,
} from './helpers/db';

/**
 * Tenancy isolation.
 *
 * Every assertion here goes straight to the database as the `authenticated`
 * role with a specific JWT subject, exactly as PostgREST would. Passing means
 * the Row Level Security policies hold even when the UI is bypassed entirely.
 */
let client: Client;

beforeAll(async () => {
  client = await connect();
  await ensureStranger(client);
});

afterAll(async () => {
  await disconnect(client);
});

describe('customer A cannot reach customer B', () => {
  it('sees only its own cases', async () => {
    const padma = await selectAs(client, USERS.localFounder, 'select id from public.cases');
    const ids = padma.map((row) => row.id);

    expect(ids).toContain(CASES.padmaDraft);
    expect(ids).toContain(CASES.padmaIrc);
    expect(ids).not.toContain(CASES.northwindIncorporation);
  });

  it('cannot select another organisation case even by id', async () => {
    const rows = await selectAs(
      client,
      USERS.localFounder,
      'select id from public.cases where id = $1',
      [CASES.northwindIncorporation],
    );
    expect(rows).toHaveLength(0);
  });

  it('cannot update another organisation case', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `update public.cases set title = 'hijacked' where id = $1`,
      [CASES.northwindIncorporation],
    );
    // RLS filters the row out rather than raising, so the update affects nothing.
    expect(result.rejected).toBe(false);

    const after = await selectAs(
      client,
      USERS.foreignFounder,
      'select title from public.cases where id = $1',
      [CASES.northwindIncorporation],
    );
    expect(after[0]?.title).not.toBe('hijacked');
  });

  it('cannot insert a case into another organisation', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.cases (reference, organization_id, title, status, created_by)
       values ('BD-TEST-000001', $1, 'Sneaky', 'draft', $2)`,
      [ORGS.northwind, USERS.localFounder],
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('cannot read another organisation documents', async () => {
    const rows = await selectAs(
      client,
      USERS.localFounder,
      'select id from public.documents where organization_id = $1',
      [ORGS.northwind],
    );
    expect(rows).toHaveLength(0);
  });

  it('cannot read another organisation quotes or invoices', async () => {
    const quotes = await selectAs(
      client,
      USERS.localFounder,
      'select id from public.quote_versions',
    );
    expect(quotes).toHaveLength(0);

    const invoices = await selectAs(client, USERS.localFounder, 'select id from public.invoices');
    expect(invoices).toHaveLength(0);
  });

  it('shows a user with no membership nothing at all', async () => {
    for (const table of ['cases', 'documents', 'companies', 'quotes', 'invoices', 'payments']) {
      const rows = await selectAs(client, USERS.stranger, `select 1 from public.${table}`);
      expect(rows, `${table} leaked to an unrelated user`).toHaveLength(0);
    }
  });

  it('shows an anonymous caller published catalog content but no customer data', async () => {
    const services = await selectAs(client, null, 'select id from public.services');
    expect(services.length).toBeGreaterThan(0);

    for (const table of ['cases', 'documents', 'profiles', 'organizations', 'leads']) {
      const rows = await selectAs(client, null, `select 1 from public.${table}`);
      expect(rows, `${table} is readable anonymously`).toHaveLength(0);
    }
  });
});

describe('membership boundaries inside one organisation', () => {
  it('lets a member see the organisation cases', async () => {
    const rows = await selectAs(client, USERS.colleague, 'select id from public.cases');
    expect(rows.map((r) => r.id)).toContain(CASES.padmaDraft);
  });

  it('does not let a member read identity records', async () => {
    // identity_records are restricted to the owner and compliance.
    const rows = await selectAs(client, USERS.colleague, 'select id from public.identity_records');
    expect(rows).toHaveLength(0);
  });

  it('does not let a member invite people', async () => {
    const result = await expectRejected(
      client,
      USERS.colleague,
      `insert into public.organization_invitations
         (organization_id, email, role, token_hash, expires_at)
       values ($1, 'someone@example.test', 'customer_owner', 'hash-test-1', now() + interval '7 days')`,
      [ORGS.padma],
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('lets an owner invite people', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.organization_invitations
         (organization_id, email, role, token_hash, expires_at)
       values ($1, 'someone@example.test', 'customer_member', 'hash-test-2', now() + interval '7 days')`,
      [ORGS.padma],
    );
    expect(result.rejected).toBe(false);
  });

  it('refuses an invitation that is already expired', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.organization_invitations
         (organization_id, email, role, token_hash, expires_at)
       values ($1, 'late@example.test', 'customer_member', 'hash-test-3', now() - interval '1 day')`,
      [ORGS.padma],
    );
    expect(result.rejected).toBe(true);
  });
});

describe('nobody can grant themselves a role', () => {
  it('refuses a customer inserting a platform role', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.platform_roles (user_id, role) values ($1, 'super_admin')`,
      [USERS.localFounder],
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('refuses even an admin granting a role to themselves', async () => {
    const result = await expectRejected(
      client,
      USERS.admin,
      `insert into public.platform_roles (user_id, role) values ($1, 'super_admin')`,
      [USERS.admin],
    );
    expect(result.rejected).toBe(true);
  });

  it('lets an admin grant a role to somebody else', async () => {
    const result = await expectRejected(
      client,
      USERS.admin,
      `insert into public.platform_roles (user_id, role) values ($1, 'case_manager')`,
      [USERS.stranger],
    );
    expect(result.rejected).toBe(false);
  });

  it('refuses a customer joining an organisation by inserting a membership', async () => {
    const result = await expectRejected(
      client,
      USERS.stranger,
      `insert into public.organization_memberships (organization_id, user_id, role)
       values ($1, $2, 'customer_owner')`,
      [ORGS.padma, USERS.stranger],
    );
    expect(result.rejected).toBe(true);
  });
});
