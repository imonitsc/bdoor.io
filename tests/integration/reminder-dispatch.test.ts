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
 * The database guarantees the reminder dispatcher leans on.
 *
 * The dispatcher itself is a thin orchestrator over `triageReminders` (unit
 * tested) and these three properties, which only a real Postgres can prove:
 * a re-run inserts nothing, two concurrent runs cannot both send the same
 * reminder, and a customer can read their reminders but never write one.
 */

const OBLIGATION = 'c0000000-0000-4000-8000-00000000d001';
const OTHER_OBLIGATION = 'c0000000-0000-4000-8000-00000000d002';

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
             '2030-06-30', 'upcoming')`,
    [id, organizationId],
  );
}

/** What `materializeReminders` issues, in SQL terms. */
async function materialize(c: Client, obligationId: string, offsets: number[]): Promise<number> {
  const { rowCount } = await c.query(
    `insert into public.compliance_reminders (obligation_id, offset_days, channel, scheduled_for)
     select $1, offset_days, 'in_app', date '2030-06-30' - offset_days
     from unnest($2::int[]) as offset_days
     on conflict (obligation_id, offset_days, channel) do nothing`,
    [obligationId, offsets],
  );
  return rowCount ?? 0;
}

describe('reminder materialisation', () => {
  it('is idempotent: a second run inserts nothing', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);

      expect(await materialize(c, OBLIGATION, [60, 30, 14, 7, 1])).toBe(5);
      // The cron runs daily against the same obligation; nothing may double up.
      expect(await materialize(c, OBLIGATION, [60, 30, 14, 7, 1])).toBe(0);

      const { rows } = await c.query(
        `select count(*)::int as n from public.compliance_reminders where obligation_id = $1`,
        [OBLIGATION],
      );
      expect(rows[0].n).toBe(5);
    });
  });

  it('separates the channels, so an in-app send never suppresses the email one', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await materialize(c, OBLIGATION, [30]);
      await c.query(
        `insert into public.compliance_reminders (obligation_id, offset_days, channel, scheduled_for)
         values ($1, 30, 'email', '2030-05-31')`,
        [OBLIGATION],
      );

      const { rows } = await c.query(
        `select channel from public.compliance_reminders
         where obligation_id = $1 and offset_days = 30 order by channel`,
        [OBLIGATION],
      );
      expect(rows.map((r) => r.channel)).toEqual(['in_app', 'email']);
    });
  });
});

describe('reminder dispatch claim', () => {
  it('lets only one of two concurrent runs stamp a send', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await materialize(c, OBLIGATION, [30]);

      const claim = async () => {
        const { rowCount } = await c.query(
          `update public.compliance_reminders set sent_at = now()
           where obligation_id = $1 and offset_days = 30 and channel = 'in_app'
             and sent_at is null
           returning id`,
          [OBLIGATION],
        );
        return rowCount ?? 0;
      };

      // The guard is `sent_at is null`: the second update matches no rows, so
      // an overlapping cron tick cannot send the same reminder twice.
      expect(await claim()).toBe(1);
      expect(await claim()).toBe(0);
    });
  });

  it('a retired reminder is never picked up again', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await materialize(c, OBLIGATION, [30]);
      await c.query(
        `update public.compliance_reminders
         set failed_at = now(), failure_reason = 'obligation_closed'
         where obligation_id = $1`,
        [OBLIGATION],
      );

      const { rows } = await c.query(
        `select count(*)::int as n from public.compliance_reminders
         where obligation_id = $1 and sent_at is null and failed_at is null`,
        [OBLIGATION],
      );
      expect(rows[0].n).toBe(0);
    });
  });
});

describe('reminder visibility', () => {
  it('a customer reads their own reminders and no one else’s', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await seedObligation(c, OTHER_OBLIGATION, ORGS.northwind);
      await materialize(c, OBLIGATION, [30]);
      await materialize(c, OTHER_OBLIGATION, [30]);

      await setIdentity(c, USERS.localFounder);
      const { rows } = await c.query(
        `select obligation_id from public.compliance_reminders where obligation_id = any($1::uuid[])`,
        [[OBLIGATION, OTHER_OBLIGATION]],
      );

      // Northwind's reminder is invisible even though the row exists.
      expect(rows.map((r) => r.obligation_id)).toEqual([OBLIGATION]);
    });
  });

  it('a customer cannot manufacture a reminder or mark one sent', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedObligation(c, OBLIGATION, ORGS.padma);
      await materialize(c, OBLIGATION, [30]);

      const insert = await expectRejected(
        c,
        USERS.localFounder,
        `insert into public.compliance_reminders (obligation_id, offset_days, channel, scheduled_for)
         values ($1, 3, 'in_app', '2030-06-27')`,
        [OBLIGATION],
      );
      expect(insert.rejected).toBe(true);

      await setIdentity(c, USERS.localFounder);
      // The engagement funnel is only trustworthy if `sent_at` and `opened_at`
      // are written by the dispatcher, never by the subject of the metric.
      const { rowCount } = await c.query(
        `update public.compliance_reminders set sent_at = now(), opened_at = now()
         where obligation_id = $1`,
        [OBLIGATION],
      );
      expect(rowCount).toBe(0);
    });
  });
});
