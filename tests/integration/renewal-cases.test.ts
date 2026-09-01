import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Client } from 'pg';

import {
  connect,
  disconnect,
  expectRejected,
  inRolledBackTransaction,
  ORGS,
  setIdentity,
  USERS,
} from './helpers/db';

/**
 * The database guarantees renewal-case generation leans on.
 *
 * Eligibility is unit-tested; these are the three properties only a real
 * Postgres can prove: an obligation can never be offered twice, a customer
 * cannot manufacture an offer, and a generated draft counts as offered but
 * not yet accepted — which is the whole meaning of the take rate.
 */

const OBLIGATION = 'c0000000-0000-4000-8000-00000000e001';
const OTHER_OBLIGATION = 'c0000000-0000-4000-8000-00000000e002';
const CASE_A = 'd0000000-0000-4000-8000-00000000e001';
const CASE_B = 'd0000000-0000-4000-8000-00000000e002';
const CASE_C = 'd0000000-0000-4000-8000-00000000e003';

/** A month of its own, so the assertions never depend on other fixtures. */
const OFFERED_AT = '2029-01-15T00:00:00Z';
const OFFERED_MONTH = '2029-01-01';

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

async function seedObligation(c: Client, id: string, organizationId: string): Promise<void> {
  await c.query(
    `insert into public.compliance_obligations
       (id, organization_id, obligation_type, label_en, label_bn, due_on, status)
     values ($1, $2, 'annual_return', 'Annual return (sample)', 'Annual return (sample)',
             '2029-03-31', 'upcoming')`,
    [id, organizationId],
  );
}

/** What the generator's case insert does, in SQL terms. */
async function seedCase(
  c: Client,
  id: string,
  organizationId: string,
  reference: string,
  status = 'draft',
): Promise<void> {
  await c.query(
    `insert into public.cases (id, organization_id, reference, title, status)
     values ($1, $2, $3, 'Annual return (sample)', $4)`,
    [id, organizationId, reference, status],
  );
}

async function offer(
  c: Client,
  obligationId: string,
  caseId: string,
  periodLabel: string,
): Promise<void> {
  await c.query(
    `insert into public.renewal_cases (obligation_id, case_id, period_label, created_at)
     values ($1, $2, $3, $4)`,
    [obligationId, caseId, periodLabel, OFFERED_AT],
  );
}

describe('renewal offer idempotency', () => {
  it('refuses a second offer for the same obligation and period', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedCase(c, CASE_A, ORGS.padma, 'BD-REN-A001');
      await seedCase(c, CASE_B, ORGS.padma, 'BD-REN-A002');

      await offer(c, OBLIGATION, CASE_A, '2029-03-31');

      // The generator's guard is this unique key; a re-run must not produce a
      // second case for the same deadline.
      await expect(offer(c, OBLIGATION, CASE_B, '2029-03-31')).rejects.toMatchObject({
        code: '23505',
      });
    });
  });

  it('allows a fresh offer for a different period of the same obligation', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedCase(c, CASE_A, ORGS.padma, 'BD-REN-B001');
      await seedCase(c, CASE_B, ORGS.padma, 'BD-REN-B002');

      await offer(c, OBLIGATION, CASE_A, '2029-03-31');
      await offer(c, OBLIGATION, CASE_B, '2030-03-31');

      const { rows } = await c.query(
        `select count(*)::int as n from public.renewal_cases where obligation_id = $1`,
        [OBLIGATION],
      );
      expect(rows[0].n).toBe(2);
    });
  });
});

describe('renewal conversion semantics', () => {
  it('counts a generated draft as offered but not accepted', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedCase(c, CASE_A, ORGS.padma, 'BD-REN-C001');
      await offer(c, OBLIGATION, CASE_A, '2029-03-31');

      const { rows } = await c.query(
        `select offered, accepted, completed from public.metrics_renewal_conversion
         where offered_month = $1`,
        [OFFERED_MONTH],
      );

      // This is the property that makes the take rate mean anything: if the
      // generator created cases past draft, every offer would be instantly
      // "accepted" and the metric would measure nothing.
      expect(rows[0]).toMatchObject({ offered: '1', accepted: '0', completed: '0' });
    });
  });

  it('counts acceptance only when the customer moves the case out of draft', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedCase(c, CASE_A, ORGS.padma, 'BD-REN-D001');
      await offer(c, OBLIGATION, CASE_A, '2029-03-31');

      // The one transition the state machine allows out of draft.
      await c.query(`update public.cases set status = 'awaiting_kyc' where id = $1`, [CASE_A]);

      const { rows } = await c.query(
        `select offered, accepted, completed from public.metrics_renewal_conversion
         where offered_month = $1`,
        [OFFERED_MONTH],
      );
      expect(rows[0]).toMatchObject({ offered: '1', accepted: '1', completed: '0' });
    });
  });

  it('does not count a cancelled offer as accepted', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedCase(c, CASE_C, ORGS.padma, 'BD-REN-E001');
      await offer(c, OBLIGATION, CASE_C, '2029-03-31');

      await c.query(`update public.cases set status = 'cancelled' where id = $1`, [CASE_C]);

      const { rows } = await c.query(
        `select offered, accepted from public.metrics_renewal_conversion
         where offered_month = $1`,
        [OFFERED_MONTH],
      );
      expect(rows[0]).toMatchObject({ offered: '1', accepted: '0' });
    });
  });
});

describe('renewal offer visibility', () => {
  it('a customer sees the offer on their own case and no one else’s', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedObligation(c, OTHER_OBLIGATION, ORGS.northwind);
      await seedCase(c, CASE_A, ORGS.padma, 'BD-REN-F001');
      await seedCase(c, CASE_B, ORGS.northwind, 'BD-REN-F002');
      await offer(c, OBLIGATION, CASE_A, '2029-03-31');
      await offer(c, OTHER_OBLIGATION, CASE_B, '2029-03-31');

      await setIdentity(c, USERS.localFounder);
      const { rows } = await c.query(
        `select obligation_id from public.renewal_cases where obligation_id = any($1::uuid[])`,
        [[OBLIGATION, OTHER_OBLIGATION]],
      );

      expect(rows.map((r) => r.obligation_id)).toEqual([OBLIGATION]);
    });
  });

  it('a customer cannot manufacture an offer for themselves', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedCase(c, CASE_A, ORGS.padma, 'BD-REN-G001');

      // Offers are bdoor's to make; a customer inventing one would inflate
      // the take rate from the side being measured.
      const attempt = await expectRejected(
        c,
        USERS.localFounder,
        `insert into public.renewal_cases (obligation_id, case_id, period_label)
         values ($1, $2, '2029-03-31')`,
        [OBLIGATION, CASE_A],
      );
      expect(attempt.rejected).toBe(true);
    });
  });
});
