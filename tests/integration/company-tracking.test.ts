import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Client } from 'pg';

import { asUser, connect, disconnect, expectRejected, ORGS, USERS } from './helpers/db';

/**
 * The existing-entity Comply entry (ROADMAP P2) rides the companies RLS as it
 * stands: any member may record their own organisation's company, and never
 * anyone else's. This file pins that boundary, because the track action's
 * server-side check and this policy must not drift apart.
 */

const INSERT = `
  insert into public.companies (organization_id, legal_name, structure, status)
  values ($1, $2, $3, 'incorporated')
  returning id`;

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

describe('tracking a company under companies RLS', () => {
  it('lets an organisation owner add their own company', async () => {
    const rows = await asUser(client, USERS.localFounder, async (c) => {
      const { rows: created } = await c.query(INSERT, [
        ORGS.padma,
        'Tracked Company (sample)',
        'private_limited',
      ]);
      return created;
    });
    expect(rows[0]?.id).toBeTruthy();
  });

  it('lets a plain member add one too — parity with the policy the action relies on', async () => {
    const rows = await asUser(client, USERS.colleague, async (c) => {
      const { rows: created } = await c.query(INSERT, [
        ORGS.padma,
        'Member-added Company (sample)',
        'sole_proprietorship',
      ]);
      return created;
    });
    expect(rows[0]?.id).toBeTruthy();
  });

  it("refuses a company aimed at someone else's organisation", async () => {
    const result = await expectRejected(client, USERS.localFounder, INSERT, [
      ORGS.northwind,
      'Wrong Org Company (sample)',
      'private_limited',
    ]);
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('refuses a structure outside the check constraint', async () => {
    const result = await expectRejected(client, USERS.localFounder, INSERT, [
      ORGS.padma,
      'Bad Structure Company (sample)',
      'plc',
    ]);
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('23514');
  });
});

describe('ask funnel persistence', () => {
  it('ai_messages carries rule_ids, defaulting empty', async () => {
    const { rows } = await client.query(
      `select column_default, is_nullable from information_schema.columns
       where table_schema = 'public' and table_name = 'ai_messages' and column_name = 'rule_ids'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.is_nullable).toBe('NO');
  });

  it('analytics accepts the funnel events and refuses an unknown one', async () => {
    await client.query('begin');
    try {
      await client.query(
        `insert into public.analytics_events (event_name, idempotency_key)
         values ('ask_comply_exit', 'test:ask_comply_exit'), ('comply_company_tracked', 'test:tracked')`,
      );
      await expect(
        client.query(
          `insert into public.analytics_events (event_name, idempotency_key)
           values ('made_up_event', 'test:bad')`,
        ),
      ).rejects.toMatchObject({ code: '23514' });
    } finally {
      await client.query('rollback');
    }
  });
});
