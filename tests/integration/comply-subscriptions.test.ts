import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ORGS,
  USERS,
  connect,
  disconnect,
  expectRejected,
  asUser,
  inRolledBackTransaction,
  setIdentity,
} from './helpers/db';

/**
 * Comply checkout policies (ROADMAP P0). The customer path must be exactly as
 * narrow as the migration claims: an owner may request a pending subscription
 * for their own organisation and create their own pending payment towards it —
 * nothing wider, and activation stays impossible without a verified payment.
 */
let client: Client;
let annualPlanId: string;

beforeAll(async () => {
  client = await connect();
  const { rows } = await client.query<{ id: string }>(
    `select id from public.subscription_plans where code = 'annual-compliance' order by version desc limit 1`,
  );
  annualPlanId = rows[0]!.id;
});

afterAll(async () => {
  await disconnect(client);
});

describe('comply subscription checkout policies', () => {
  it('lets a customer owner request a pending subscription for their own organisation', async () => {
    await asUser(client, USERS.localFounder, async (c) => {
      const { rows } = await c.query<{ id: string }>(
        `insert into public.subscriptions (organization_id, plan_id, status, created_by)
         values ($1, $2, 'pending_activation', $3) returning id`,
        [ORGS.padma, annualPlanId, USERS.localFounder],
      );
      expect(rows).toHaveLength(1);

      // …and their own pending payment towards it.
      await c.query(
        `insert into public.payments
           (subscription_id, organization_id, provider, checkout_session_id, status, currency, amount_minor, is_sandbox)
         values ($1, $2, 'mock', 'mock_test_sub_session', 'pending', 'BDT', 4990000, true)`,
        [rows[0]!.id, ORGS.padma],
      );
    });
  });

  it('refuses a customer member — subscribing commits the organisation to recurring billing', async () => {
    const attempt = await expectRejected(
      client,
      USERS.colleague,
      `insert into public.subscriptions (organization_id, plan_id, status, created_by)
       values ($1, $2, 'pending_activation', $3)`,
      [ORGS.padma, annualPlanId, USERS.colleague],
    );
    expect(attempt.rejected).toBe(true);
  });

  it('refuses an owner writing into another organisation', async () => {
    const attempt = await expectRejected(
      client,
      USERS.foreignFounder,
      `insert into public.subscriptions (organization_id, plan_id, status, created_by)
       values ($1, $2, 'pending_activation', $3)`,
      [ORGS.padma, annualPlanId, USERS.foreignFounder],
    );
    expect(attempt.rejected).toBe(true);
  });

  it('refuses a customer-created subscription in any status but pending_activation', async () => {
    const attempt = await expectRejected(
      client,
      USERS.foreignFounder,
      `insert into public.subscriptions (organization_id, plan_id, status, created_by, started_at)
       values ($1, $2, 'active', $3, now())`,
      [ORGS.northwind, annualPlanId, USERS.foreignFounder],
    );
    expect(attempt.rejected).toBe(true);
  });

  it('refuses a payment aimed at another organisation and a payment with no target', async () => {
    // Every asUser block rolls back, so the padma subscription is created in
    // the same transaction and the identity switched to northwind's owner —
    // who must not be able to attach a payment to it, even naming their own
    // organisation.
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.localFounder);
      const { rows } = await c.query<{ id: string }>(
        `insert into public.subscriptions (organization_id, plan_id, status, created_by)
         values ($1, $2, 'pending_activation', $3) returning id`,
        [ORGS.padma, annualPlanId, USERS.localFounder],
      );

      await setIdentity(c, USERS.foreignFounder);
      let rejected = false;
      try {
        await c.query(
          `insert into public.payments
             (subscription_id, organization_id, provider, checkout_session_id, status, currency, amount_minor, is_sandbox)
           values ($1, $2, 'mock', 'mock_cross_tenant', 'pending', 'BDT', 4990000, true)`,
          [rows[0]!.id, ORGS.northwind],
        );
      } catch {
        rejected = true;
      }
      expect(rejected).toBe(true);
    });

    // A payment aiming at neither a case nor a subscription violates
    // payments_target_present whoever writes it.
    const targetless = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.payments
         (organization_id, provider, checkout_session_id, status, currency, amount_minor, is_sandbox)
       values ($1, 'mock', 'mock_no_target', 'pending', 'BDT', 1000, true)`,
      [ORGS.padma],
    );
    expect(targetless).toMatchObject({ rejected: true, code: '23514' });
  });

  it('keeps activation impossible without a verified payment, even for the owner', async () => {
    // RLS gives customers no update path at all: the owner's own pending
    // subscription cannot be flipped to active from their session — the
    // update touches zero rows. A finance-role bypass would still hit
    // subscriptions_active_needs_verified_payment at the database.
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.localFounder);
      const { rows } = await c.query<{ id: string }>(
        `insert into public.subscriptions (organization_id, plan_id, status, created_by)
         values ($1, $2, 'pending_activation', $3) returning id`,
        [ORGS.padma, annualPlanId, USERS.localFounder],
      );

      const result = await c.query(
        `update public.subscriptions set status = 'active', started_at = now() where id = $1`,
        [rows[0]!.id],
      );
      expect(result.rowCount ?? 0).toBe(0);

      const { rows: after } = await c.query(
        `select status from public.subscriptions where id = $1`,
        [rows[0]!.id],
      );
      expect(after[0]?.status).toBe('pending_activation');
    });
  });
});
