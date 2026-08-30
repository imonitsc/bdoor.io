import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ORGS,
  USERS,
  connect,
  disconnect,
  expectRejected,
  inRolledBackTransaction,
  setIdentity,
} from './helpers/db';

/**
 * Fundable-startup core (Phases 0–1): the analytics/metrics tables must be
 * invisible to customers and partners, unwritable through the Data API, and
 * append-only even for the highest roles; a subscription must be impossible
 * to activate without a verified payment record.
 */

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

const EVENT_ID = 'ee000000-0000-4000-8000-000000000001';

async function insertEvent(c: Client): Promise<void> {
  await c.query(
    `insert into public.analytics_events (id, event_name, idempotency_key, organization_id)
     values ($1, 'application_submitted', 'test:application_submitted:1', $2)`,
    [EVENT_ID, ORGS.padma],
  );
}

describe('analytics_events isolation', () => {
  it('is readable by the metrics roles only — not customers, partners or case managers', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertEvent(c);
      for (const [who, expected] of [
        [null, 0],
        [USERS.localFounder, 0], // the org the event references — still invisible
        [USERS.partnerOwner, 0],
        [USERS.caseManager, 0], // staff, but not a metrics role
        [USERS.finance, 1],
        [USERS.admin, 1],
      ] as const) {
        await setIdentity(c, who);
        const { rows } = await c.query('select id from public.analytics_events');
        expect(rows.length, String(who)).toBe(expected);
        await c.query('reset role');
      }
    });
  });

  it('accepts no insert through the Data API roles, even admin', async () => {
    const attempt = await expectRejected(
      client,
      USERS.admin,
      `insert into public.analytics_events (event_name, idempotency_key)
       values ('payment_confirmed', 'test:forged:1')`,
    );
    expect(attempt.rejected).toBe(true);
    expect(attempt.code).toBe('42501');
  });

  it('is append-only: the service role itself cannot rewrite a milestone', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertEvent(c);
      await expect(
        c.query(`update public.analytics_events set event_name = 'case_completed' where id = $1`, [
          EVENT_ID,
        ]),
      ).rejects.toThrow(/append-only/);
    });
    await inRolledBackTransaction(client, async (c) => {
      await insertEvent(c);
      await expect(
        c.query('delete from public.analytics_events where id = $1', [EVENT_ID]),
      ).rejects.toThrow(/append-only/);
    });
  });

  it('drops a replayed idempotency key', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertEvent(c);
      await expect(
        c.query(
          `insert into public.analytics_events (event_name, idempotency_key)
           values ('application_submitted', 'test:application_submitted:1')`,
        ),
      ).rejects.toThrow(/duplicate key/);
    });
  });
});

describe('metric definitions and snapshots', () => {
  it('seeds the v1 definitions, readable by staff and invisible to customers', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.caseManager);
      const staff = await c.query('select key from public.metric_definitions');
      expect(staff.rows.length).toBeGreaterThanOrEqual(12);
      await c.query('reset role');

      await setIdentity(c, USERS.localFounder);
      const customer = await c.query('select key from public.metric_definitions');
      expect(customer.rows).toHaveLength(0);
      await c.query('reset role');
    });
  });

  it('definitions are append-only — a formula change is a new version, never an edit', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(`update public.metric_definitions set formula = 'better one' where key = 'mrr'`),
      ).rejects.toThrow(/append-only/);
    });
  });

  it('finance records a snapshot; a customer cannot, and nobody can edit one', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.finance);
      await c.query(
        `insert into public.metric_snapshots (month, payload, computed_by)
         values ('2026-08-01', '{"note":"test"}'::jsonb, $1)`,
        [USERS.finance],
      );
      await c.query('reset role');

      await expect(
        c.query(`update public.metric_snapshots set payload = '{}'::jsonb`),
      ).rejects.toThrow(/append-only/);
    });

    const forged = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.metric_snapshots (month, payload, computed_by)
       values ('2026-08-01', '{}'::jsonb, '${USERS.localFounder}')`,
    );
    expect(forged.rejected).toBe(true);
    expect(forged.code).toBe('42501');
  });

  it('rejects a snapshot month that is not the first of the month', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(
          `insert into public.metric_snapshots (month, payload) values ('2026-08-15', '{}'::jsonb)`,
        ),
      ).rejects.toThrow(/metric_snapshots_month_is_first/);
    });
  });
});

describe('subscriptions', () => {
  async function planId(c: Client): Promise<string> {
    const { rows } = await c.query(
      `select id from public.subscription_plans where code = 'annual-compliance' and version = 1`,
    );
    expect(rows).toHaveLength(1);
    return rows[0]!.id as string;
  }

  it('seeds the two recurring plans, publicly readable', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, null);
      const { rows } = await c.query(
        'select code, billing_period, amount_minor from public.subscription_plans order by code',
      );
      expect(rows.map((r) => r.code)).toEqual(['annual-compliance', 'managed-finance-compliance']);
      expect(rows[0]!.amount_minor).toBe('4990000');
      await c.query('reset role');
    });
  });

  it('is visible to its own organisation and finance, nobody else', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const plan = await planId(c);
      await c.query(`insert into public.subscriptions (organization_id, plan_id) values ($1, $2)`, [
        ORGS.padma,
        plan,
      ]);
      for (const [who, expected] of [
        [USERS.localFounder, 1], // padma owner
        [USERS.foreignFounder, 0], // different customer org
        [USERS.partnerOwner, 0],
        [USERS.finance, 1],
      ] as const) {
        await setIdentity(c, who);
        const { rows } = await c.query('select id from public.subscriptions');
        expect(rows.length, String(who)).toBe(expected);
        await c.query('reset role');
      }
    });
  });

  it('can never be active without a verified payment or offline record (§7.2)', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const plan = await planId(c);
      await c.query(
        `insert into public.subscriptions (id, organization_id, plan_id)
                     values ('cc000000-0000-4000-8000-000000000001', $1, $2)`,
        [ORGS.padma, plan],
      );
      await expect(
        c.query(
          `update public.subscriptions set status = 'active', started_at = now()
           where id = 'cc000000-0000-4000-8000-000000000001'`,
        ),
      ).rejects.toThrow(/subscriptions_active_needs_verified_payment/);
    });

    // A staff-verified offline payment satisfies the constraint.
    await inRolledBackTransaction(client, async (c) => {
      const plan = await planId(c);
      await c.query(
        `insert into public.subscriptions (id, organization_id, plan_id)
                     values ('cc000000-0000-4000-8000-000000000001', $1, $2)`,
        [ORGS.padma, plan],
      );
      await c.query(
        `update public.subscriptions
           set status = 'active', started_at = now(),
               offline_payment_reference = 'BANK-TRF-001 (sample)',
               offline_payment_verified_by = $1, offline_payment_verified_at = now()
         where id = 'cc000000-0000-4000-8000-000000000001'`,
        [USERS.finance],
      );
      const { rows } = await c.query(
        `select status from public.subscriptions where id = 'cc000000-0000-4000-8000-000000000001'`,
      );
      expect(rows[0]!.status).toBe('active');
    });
  });

  it('rejects status jumps the machine does not declare', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const plan = await planId(c);
      await c.query(
        `insert into public.subscriptions (id, organization_id, plan_id)
                     values ('cc000000-0000-4000-8000-000000000002', $1, $2)`,
        [ORGS.padma, plan],
      );
      await expect(
        c.query(
          `update public.subscriptions
             set status = 'past_due', started_at = now(),
                 offline_payment_reference = 'x', offline_payment_verified_by = $1,
                 offline_payment_verified_at = now()
           where id = 'cc000000-0000-4000-8000-000000000002'`,
          [USERS.finance],
        ),
      ).rejects.toThrow(/invalid subscription transition/);
    });
  });

  it('a customer cannot write their own subscription', async () => {
    const attempt = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.subscriptions (organization_id, plan_id)
       values ('${ORGS.padma}', (select id from public.subscription_plans limit 1))`,
    );
    expect(attempt.rejected).toBe(true);
    expect(attempt.code).toBe('42501');
  });
});
