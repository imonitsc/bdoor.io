import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect, disconnect, inRolledBackTransaction, selectAs } from './helpers/db';

let client: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/**
 * Verification is an internal control; the public directory is an
 * endorsement. `verified_partners_public` must list a partner only when an
 * admin has ALSO approved the public profile — a verified partner alone is
 * not a listing, and an approved profile that is not verified is not either.
 */
describe('verified_partners_public gating', () => {
  async function insertPartner(
    tx: { query: (sql: string, values?: unknown[]) => Promise<{ rows: Array<{ id: string }> }> },
    opts: { verified: boolean; publicApproved: boolean; slug: string },
  ) {
    const { rows: orgs } = await tx.query(
      `insert into public.organizations (kind, name, slug)
       values ('partner', $1, $1) returning id`,
      [opts.slug],
    );
    const { rows } = await tx.query(
      `insert into public.partners (
         organization_id, legal_name, practice_type,
         verification_status, public_profile_approved
       ) values ($1, $2, 'law_firm', $3, $4)
       returning id`,
      [orgs[0]!.id, opts.slug, opts.verified ? 'verified' : 'unverified', opts.publicApproved],
    );
    return rows[0]!.id;
  }

  it('verification alone does not publish a profile', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await insertPartner(tx, {
        verified: true,
        publicApproved: false,
        slug: 'test-verified-unlisted',
      });

      const listed = await selectAs(
        tx,
        null,
        `select name from public.verified_partners_public where name like 'test-%'`,
      );
      expect(listed).toEqual([]);
    });
  });

  it('public approval alone does not publish an unverified partner', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await insertPartner(tx, {
        verified: false,
        publicApproved: true,
        slug: 'test-approved-unverified',
      });

      const listed = await selectAs(
        tx,
        null,
        `select name from public.verified_partners_public where name like 'test-%'`,
      );
      expect(listed).toEqual([]);
    });
  });

  it('lists a partner that is both verified and profile-approved', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await insertPartner(tx, {
        verified: true,
        publicApproved: true,
        slug: 'test-verified-listed',
      });

      const listed = await selectAs(
        tx,
        null,
        `select name from public.verified_partners_public where name like 'test-%'`,
      );
      expect(listed).toEqual([{ name: 'test-verified-listed' }]);
    });
  });

  it('defaults new partners to unlisted', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const { rows: orgs } = await tx.query(
        `insert into public.organizations (kind, name, slug)
         values ('partner', 'test-default', 'test-default') returning id`,
      );
      const { rows } = await tx.query(
        `insert into public.partners (organization_id, legal_name, practice_type, verification_status)
         values ($1, 'test-default', 'law_firm', 'verified')
         returning public_profile_approved`,
        [orgs[0]!.id],
      );
      expect(rows[0]).toEqual({ public_profile_approved: false });
    });
  });
});
