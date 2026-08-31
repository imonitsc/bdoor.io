import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ORGS, USERS, connect, disconnect, expectRejected, asUser } from './helpers/db';

/**
 * One-time data capture (§4.0.1): the provenance table must ride exactly the
 * companies tenancy — a fact adds no new read or write path — and its
 * integrity constraints must hold at the database, not only in the module.
 */
let client: Client;
let padmaCompanyId: string;
let northwindCompanyId: string;

beforeAll(async () => {
  client = await connect();
  const { rows } = await client.query<{ id: string; organization_id: string }>(
    'select id, organization_id from public.companies',
  );
  padmaCompanyId = rows.find((row) => row.organization_id === ORGS.padma)!.id;
  northwindCompanyId = rows.find((row) => row.organization_id === ORGS.northwind)!.id;
});

afterAll(async () => {
  await disconnect(client);
});

describe('business profile facts', () => {
  it('lets an organisation member record and read a fact for their own company', async () => {
    await asUser(client, USERS.localFounder, async (c) => {
      await c.query(
        `insert into public.business_profile_facts (company_id, field_key, value, supplied_by)
         values ($1, 'registration.rjsc_number', 'C-000000 (sample)', $2)`,
        [padmaCompanyId, USERS.localFounder],
      );
      const { rows } = await c.query(
        `select value, verification_status from public.business_profile_facts
         where company_id = $1 and field_key = 'registration.rjsc_number' and superseded_at is null`,
        [padmaCompanyId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.verification_status).toBe('unverified');
    });
  });

  it('keeps exactly one current value per field — supersede, then insert', async () => {
    await asUser(client, USERS.localFounder, async (c) => {
      await c.query(
        `insert into public.business_profile_facts (company_id, field_key, value)
         values ($1, 'address.registered.city', 'Dhaka (sample)')`,
        [padmaCompanyId],
      );
      // A second current value for the same key must be refused outright…
      await expect(
        c.query(
          `insert into public.business_profile_facts (company_id, field_key, value)
           values ($1, 'address.registered.city', 'Chattogram (sample)')`,
          [padmaCompanyId],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    });

    await asUser(client, USERS.localFounder, async (c) => {
      await c.query(
        `insert into public.business_profile_facts (company_id, field_key, value)
         values ($1, 'address.registered.city', 'Dhaka (sample)')`,
        [padmaCompanyId],
      );
      // …while the supersede-then-insert path keeps the history and one head.
      await c.query(
        `update public.business_profile_facts set superseded_at = now()
         where company_id = $1 and field_key = 'address.registered.city' and superseded_at is null`,
        [padmaCompanyId],
      );
      await c.query(
        `insert into public.business_profile_facts (company_id, field_key, value)
         values ($1, 'address.registered.city', 'Chattogram (sample)')`,
        [padmaCompanyId],
      );
      const { rows } = await c.query(
        `select count(*)::int as total,
                count(*) filter (where superseded_at is null)::int as current
         from public.business_profile_facts
         where company_id = $1 and field_key = 'address.registered.city'`,
        [padmaCompanyId],
      );
      expect(rows[0]).toEqual({ total: 2, current: 1 });
    });
  });

  it('refuses the wrong actor in both directions', async () => {
    // A member of one organisation cannot write a fact onto another's company…
    const write = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.business_profile_facts (company_id, field_key, value)
       values ($1, 'registration.rjsc_number', 'X (sample)')`,
      [northwindCompanyId],
    );
    expect(write.rejected).toBe(true);

    // …and cannot see the other organisation's facts at all.
    await asUser(client, USERS.foreignFounder, async (c) => {
      await c.query(
        `insert into public.business_profile_facts (company_id, field_key, value)
         values ($1, 'registration.rjsc_number', 'N-000000 (sample)')`,
        [northwindCompanyId],
      );
    });
    await asUser(client, USERS.localFounder, async (c) => {
      const { rows } = await c.query(
        'select id from public.business_profile_facts where company_id = $1',
        [northwindCompanyId],
      );
      expect(rows).toHaveLength(0);
    });
  });

  it('holds the verifier-consistency check at the database', async () => {
    const inconsistent = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.business_profile_facts
         (company_id, field_key, value, verification_status)
       values ($1, 'tax.etin', '0000 (sample)', 'document_verified')`,
      [padmaCompanyId],
    );
    // Verified without a verified_at timestamp: check-constraint violation.
    expect(inconsistent).toMatchObject({ rejected: true, code: '23514' });
  });
});
