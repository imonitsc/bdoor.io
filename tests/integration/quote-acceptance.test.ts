import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CASES,
  ORGS,
  USERS,
  connect,
  disconnect,
  ensureStranger,
  inRolledBackTransaction,
  setIdentity,
} from './helpers/db';

let client: Client;

beforeAll(async () => {
  client = await connect();
  await ensureStranger(client);
});

afterAll(async () => {
  await disconnect(client);
});

const VERSION = 'f5000000-0000-4000-8000-0000000000aa';

/** A quote version that has been sent and is waiting to be accepted. */
async function seedSentVersion(c: Client): Promise<void> {
  const { rows } = await c.query<{ id: string }>(
    'select id from public.quotes where organization_id = $1 limit 1',
    [ORGS.northwind],
  );
  const quoteId = rows[0]?.id;
  if (!quoteId) throw new Error('no seeded quote for northwind');

  await c.query(
    `insert into public.quote_versions
       (id, quote_id, version_no, status, currency, subtotal_minor, tax_minor, total_minor,
        bdoor_revenue_minor, pass_through_minor, valid_until, sent_at)
     values ($1, $2, 99, 'sent', 'BDT', 100000, 15000, 115000, 100000, 15000,
             (now() + interval '30 days')::date, now())`,
    [VERSION, quoteId],
  );
}

/**
 * Accepting a quote used to be a silent no-op.
 *
 * The customer matched no permissive write policy on quote_versions, so RLS
 * filtered the update to zero rows; PostgREST reports that as success, and the
 * action did not check. The engagement_acceptances row was written, so the
 * record of acceptance existed, but the version stayed `sent` — the customer
 * was told it was accepted while every screen keyed on status still showed it
 * outstanding.
 */
describe('a customer accepting a quote version', () => {
  it('can accept a sent version of their own organisation', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedSentVersion(c);
      await setIdentity(c, USERS.foreignFounder);
      const { rowCount } = await c.query(
        `update public.quote_versions set status = 'accepted', accepted_at = now() where id = $1`,
        [VERSION],
      );
      expect(rowCount).toBe(1);
    });
  });

  it('cannot accept a version belonging to another organisation', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedSentVersion(c);
      // localFounder owns Padma, not Northwind.
      await setIdentity(c, USERS.localFounder);
      const { rowCount } = await c.query(
        `update public.quote_versions set status = 'accepted', accepted_at = now() where id = $1`,
        [VERSION],
      );
      expect(rowCount).toBe(0);
    });
  });

  it('cannot be accepted by a stranger', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedSentVersion(c);
      await setIdentity(c, USERS.stranger);
      const { rowCount } = await c.query(
        `update public.quote_versions set status = 'accepted', accepted_at = now() where id = $1`,
        [VERSION],
      );
      expect(rowCount).toBe(0);
    });
  });

  it('cannot be accepted by a member who is not the owner', async () => {
    await inRolledBackTransaction(client, async (c) => {
      // The seed has one quote and it belongs to Northwind, whose only member
      // is its owner. A member-but-not-owner needs Padma, which has both.
      const quoteId = 'f4000000-0000-4000-8000-0000000000aa';
      await c.query(
        `insert into public.quotes (id, organization_id, case_id, reference, status)
         values ($1, $2, $3, 'QT-TEST-0001', 'sent')`,
        [quoteId, ORGS.padma, CASES.padmaDraft],
      );
      await c.query(
        `insert into public.quote_versions
           (id, quote_id, version_no, status, currency, subtotal_minor, tax_minor, total_minor,
            bdoor_revenue_minor, pass_through_minor, valid_until, sent_at)
         values ($1, $2, 98, 'sent', 'BDT', 1000, 0, 1000, 1000, 0,
                 (now() + interval '30 days')::date, now())`,
        [VERSION, quoteId],
      );
      // quote.accept belongs to customer_owner. A member does not hold it.
      await setIdentity(c, USERS.colleague);
      const { rowCount } = await c.query(
        `update public.quote_versions set status = 'accepted', accepted_at = now() where id = $1`,
        [VERSION],
      );
      expect(rowCount).toBe(0);
    });
  });

  it('cannot alter the price in the same statement that accepts it', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedSentVersion(c);
      await setIdentity(c, USERS.foreignFounder);
      // The with-check inspects only the resulting row, which would still read
      // as accepted. The trigger is what refuses this.
      await expect(
        c.query(
          `update public.quote_versions
             set status = 'accepted', accepted_at = now(), total_minor = 1
           where id = $1`,
          [VERSION],
        ),
      ).rejects.toThrow(/may accept a quote version, not alter it/);
    });
  });

  it('cannot move a version to any other status', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedSentVersion(c);
      await setIdentity(c, USERS.foreignFounder);
      // Refused by the with-check rather than filtered out: the using clause
      // matches, so the row is reached and then the resulting shape is
      // rejected. An error, not a silent no-op — which is the point.
      await expect(
        c.query(`update public.quote_versions set status = 'draft' where id = $1`, [VERSION]),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it('cannot accept the same version twice', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedSentVersion(c);
      await setIdentity(c, USERS.foreignFounder);
      const first = await c.query(
        `update public.quote_versions set status = 'accepted', accepted_at = now() where id = $1`,
        [VERSION],
      );
      expect(first.rowCount).toBe(1);
      // accepted_at is no longer null, so the using clause no longer matches.
      const second = await c.query(
        `update public.quote_versions set status = 'accepted', accepted_at = now() where id = $1`,
        [VERSION],
      );
      expect(second.rowCount).toBe(0);
    });
  });

  it('cannot accept a version that was never sent', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const { rows } = await c.query<{ id: string }>(
        'select id from public.quotes where organization_id = $1 limit 1',
        [ORGS.northwind],
      );
      await c.query(
        `insert into public.quote_versions
           (id, quote_id, version_no, status, currency, subtotal_minor, tax_minor, total_minor,
            bdoor_revenue_minor, pass_through_minor, valid_until)
         values ($1, $2, 97, 'draft', 'BDT', 1000, 0, 1000, 1000, 0,
                 (now() + interval '30 days')::date)`,
        [VERSION, rows[0]?.id],
      );
      await setIdentity(c, USERS.foreignFounder);
      const { rowCount } = await c.query(
        `update public.quote_versions set status = 'accepted', accepted_at = now() where id = $1`,
        [VERSION],
      );
      // A draft the customer cannot even read is not one they can accept.
      expect(rowCount).toBe(0);
    });
  });

  it('still lets staff revise a version normally', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await seedSentVersion(c);
      await setIdentity(c, USERS.finance);
      // The narrowing trigger exempts platform staff, or preparing a quote
      // would have become impossible.
      const { rowCount } = await c.query(
        `update public.quote_versions set total_minor = 222000 where id = $1`,
        [VERSION],
      );
      expect(rowCount).toBe(1);
    });
  });
});
