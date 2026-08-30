import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CASES,
  ORGS,
  USERS,
  connect,
  disconnect,
  expectRejected,
  inRolledBackTransaction,
  setIdentity,
} from './helpers/db';

/**
 * Provider network (portals spec): provider_applications isolation, the
 * database-enforced application status machine, and the assignment column
 * guard that keeps each actor to their own part of the §10 sharing chain.
 */

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

const APP_ID = 'e7000000-0000-4000-8000-000000000001';

async function insertApplication(c: Client, status = 'submitted'): Promise<void> {
  await c.query(
    `insert into public.provider_applications (id, reference, status, legal_name, contact_name, contact_email)
     values ($1, 'PP-2026-000001', 'draft', 'Meghna Legal (sample)', 'A Rahman (sample)', 'meghna@example.test')`,
    [APP_ID],
  );
  if (status !== 'draft') {
    await c.query(`update public.provider_applications set status = 'submitted' where id = $1`, [
      APP_ID,
    ]);
    if (status !== 'submitted') {
      await c.query(`update public.provider_applications set status = $2 where id = $1`, [
        APP_ID,
        status,
      ]);
    }
  }
}

describe('provider_applications isolation', () => {
  it('is invisible to anonymous, customer and partner users; staff read the queue', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertApplication(c);

      for (const [who, expected] of [
        [null, 0],
        [USERS.localFounder, 0],
        [USERS.partnerOwner, 0],
        [USERS.caseManager, 1],
        [USERS.admin, 1],
      ] as const) {
        await setIdentity(c, who);
        const { rows } = await c.query('select id from public.provider_applications');
        expect(rows.length, String(who)).toBe(expected);
        await c.query('reset role');
      }
    });
  });

  it('accepts no direct insert or update from any application role', async () => {
    const insert = await expectRejected(
      client,
      USERS.admin,
      `insert into public.provider_applications (reference, legal_name) values ('PP-2026-999999', 'Sneak (sample)')`,
    );
    expect(insert.rejected).toBe(true);
    expect(insert.code).toBe('42501');

    // An update matches no rows (there is no update policy), so nothing moves.
    await inRolledBackTransaction(client, async (c) => {
      await insertApplication(c);
      await setIdentity(c, USERS.admin);
      const { rowCount } = await c.query(
        `update public.provider_applications set status = 'approved' where id = $1`,
        [APP_ID],
      );
      expect(rowCount).toBe(0);
      await c.query('reset role');
    });
  });
});

describe('provider application status machine', () => {
  it('follows the declared transitions and rejects jumps', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertApplication(c, 'submitted');
      // submitted → under_review → verification_in_progress → approved is legal.
      await c.query(
        `update public.provider_applications set status = 'under_review' where id = $1`,
        [APP_ID],
      );
      await c.query(
        `update public.provider_applications set status = 'verification_in_progress' where id = $1`,
        [APP_ID],
      );
      await c.query(`update public.provider_applications set status = 'approved' where id = $1`, [
        APP_ID,
      ]);
      const { rows } = await c.query(
        'select status from public.provider_applications where id = $1',
        [APP_ID],
      );
      expect(rows[0]!.status).toBe('approved');
    });

    await inRolledBackTransaction(client, async (c) => {
      await insertApplication(c, 'submitted');
      // submitted → approved skips review and must be refused by the trigger.
      await expect(
        c.query(`update public.provider_applications set status = 'approved' where id = $1`, [
          APP_ID,
        ]),
      ).rejects.toThrow(/invalid provider application transition/);
    });
  });
});

const OFFERED_ASSIGNMENT = 'f1000000-0000-4000-8000-000000000077';

/** A fresh offered assignment for the seeded partner on a case with none. */
async function insertOfferedAssignment(c: Client): Promise<void> {
  await c.query(
    `insert into public.case_partner_assignments (id, case_id, partner_org_id, status, scope_note)
     values ($1, $2, $3, 'offered', 'Registration paperwork for the IRC case (sample).')`,
    [OFFERED_ASSIGNMENT, CASES.padmaIrc, ORGS.partner],
  );
}

describe('assignment column guard (§10 sharing chain)', () => {
  it('lets the partner accept only with their own recorded clean conflict result', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertOfferedAssignment(c);
      await setIdentity(c, USERS.partnerOwner);
      await c.query(
        `update public.case_partner_assignments
           set status = 'accepted', conflict_check_confirmed = true,
               conflict_check_result = 'none_identified', responded_at = now()
         where id = $1`,
        [OFFERED_ASSIGNMENT],
      );
      await c.query('reset role');
      const { rows } = await c.query(
        `select status, conflict_check_recorded_by from public.case_partner_assignments where id = $1`,
        [OFFERED_ASSIGNMENT],
      );
      expect(rows[0]!.status).toBe('accepted');
      // The trigger stamps the recorder server-side, whatever the client sent.
      expect(rows[0]!.conflict_check_recorded_by).toBe(USERS.partnerOwner);
    });
  });

  it('refuses a partner update that tries to self-grant customer authorisation', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertOfferedAssignment(c);
      await setIdentity(c, USERS.partnerOwner);
      await expect(
        c.query(
          `update public.case_partner_assignments
             set status = 'accepted', conflict_check_result = 'none_identified',
                 customer_authorized_at = now()
           where id = $1`,
          [OFFERED_ASSIGNMENT],
        ),
      ).rejects.toThrow(/restricted to bdoor staff or the customer/);
    });
  });

  it('refuses a partner rewrite of the assignment scope', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertOfferedAssignment(c);
      await setIdentity(c, USERS.partnerOwner);
      await expect(
        c.query(
          `update public.case_partner_assignments
             set status = 'accepted', conflict_check_result = 'none_identified',
                 scope_note = 'everything, forever'
           where id = $1`,
          [OFFERED_ASSIGNMENT],
        ),
      ).rejects.toThrow(/restricted to bdoor staff or the customer/);
    });
  });

  it('lets the partner record a potential conflict while the offer stays open', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await insertOfferedAssignment(c);
      await setIdentity(c, USERS.partnerOwner);
      await c.query(
        `update public.case_partner_assignments
           set conflict_check_result = 'potential_conflict'
         where id = $1`,
        [OFFERED_ASSIGNMENT],
      );
      await c.query('reset role');
      const { rows } = await c.query(
        `select status, conflict_check_result from public.case_partner_assignments where id = $1`,
        [OFFERED_ASSIGNMENT],
      );
      expect(rows[0]!.status).toBe('offered');
      expect(rows[0]!.conflict_check_result).toBe('potential_conflict');
    });
  });

  it('lets the customer grant consent but never move the assignment status', async () => {
    // The seeded accepted assignment on the foreign founder's own case.
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.foreignFounder);
      const { rowCount } = await c.query(
        `update public.case_partner_assignments
           set customer_authorized_at = now(), customer_authorized_by = $2
         where case_id = $1`,
        [CASES.northwindIncorporation, USERS.foreignFounder],
      );
      expect(rowCount).toBe(1);
    });

    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.foreignFounder);
      await expect(
        c.query(
          `update public.case_partner_assignments set status = 'completed' where case_id = $1`,
          [CASES.northwindIncorporation],
        ),
      ).rejects.toThrow(/restricted to bdoor staff or the assigned partner/);
    });
  });

  it('hides shared documents when the recorded conflict result is not clean', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `update public.case_partner_assignments
           set conflict_check_result = 'potential_conflict'
         where case_id = $1`,
        [CASES.northwindIncorporation],
      );
      await setIdentity(c, USERS.partnerStaff);
      const { rows } = await c.query(
        `select id from public.documents where case_id = $1 and visibility = 'partner_shared'`,
        [CASES.northwindIncorporation],
      );
      expect(rows).toHaveLength(0);
    });
  });
});
