import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { USERS, connect, disconnect, expectRejected, selectAs } from './helpers/db';

/**
 * Directory, evidence and social tables. Public pages may read verified rows;
 * a customer, a finance user and anon must not write, and drafts must not leak.
 */
let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

describe('countries', () => {
  it('lets anon and a customer read the flagship row', async () => {
    const asAnon = await selectAs(
      client,
      null,
      `select code from public.countries where code = 'BD'`,
    );
    const asCustomer = await selectAs(
      client,
      USERS.localFounder,
      `select code from public.countries where code = 'BD'`,
    );
    expect(asAnon.map((r) => r.code)).toContain('BD');
    expect(asCustomer.map((r) => r.code)).toContain('BD');
  });

  it('refuses a customer insert', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.countries (code, slug, name_en, name_bn, summary_en, summary_bn)
       values ('ZZ', 'test-land', 'Test', 'পরীক্ষা', 'No', 'না')`,
    );
    expect(result.rejected).toBe(true);
  });

  it('refuses a finance insert — finance is not an admin', async () => {
    const result = await expectRejected(
      client,
      USERS.finance,
      `insert into public.countries (code, slug, name_en, name_bn, summary_en, summary_bn)
       values ('YY', 'finance-land', 'Test', 'পরীক্ষা', 'No', 'না')`,
    );
    expect(result.rejected).toBe(true);
  });
});

describe('evidence_claims', () => {
  it('hides draft claims from anon and from a customer', async () => {
    const asAnon = await selectAs(
      client,
      null,
      `select id from public.evidence_claims where id = 'EVD-OPERATOR-ENTITY'`,
    );
    const asCustomer = await selectAs(
      client,
      USERS.localFounder,
      `select id from public.evidence_claims where id = 'EVD-OPERATOR-ENTITY'`,
    );
    expect(asAnon).toHaveLength(0);
    expect(asCustomer).toHaveLength(0);
  });

  it('lets platform staff read a draft, and the public read a verified claim', async () => {
    const asStaff = await selectAs(
      client,
      USERS.caseManager,
      `select id from public.evidence_claims where id = 'EVD-OPERATOR-ENTITY'`,
    );
    const asAnon = await selectAs(
      client,
      null,
      `select id from public.evidence_claims where id = 'EVD-INDEPENDENCE'`,
    );
    expect(asStaff.map((r) => r.id)).toContain('EVD-OPERATOR-ENTITY');
    expect(asAnon.map((r) => r.id)).toContain('EVD-INDEPENDENCE');
  });

  it('refuses a customer write', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.evidence_claims (id, text_en, text_bn, source_type, status, is_public)
       values ('EVD-FAKE', 'Invented', 'উদ্ভাবিত', 'none', 'verified', true)`,
    );
    expect(result.rejected).toBe(true);
  });
});

describe('social_profiles', () => {
  it('shows anon nothing while every row is inactive', async () => {
    const asAnon = await selectAs(client, null, 'select network from public.social_profiles');
    expect(asAnon).toHaveLength(0);
  });

  it('lets staff see the reserved rows and refuses a customer update', async () => {
    const asStaff = await selectAs(
      client,
      USERS.admin,
      'select network from public.social_profiles',
    );
    expect(asStaff.length).toBeGreaterThan(0);

    const result = await expectRejected(
      client,
      USERS.localFounder,
      `update public.social_profiles set status = 'active', verified = true, url = 'https://example.test' where network = 'linkedin'`,
    );
    // Inactive rows are invisible to the customer, so the update is filtered
    // rather than raised.
    expect(result.rejected).toBe(false);

    const after = await selectAs(
      client,
      USERS.admin,
      `select status, verified from public.social_profiles where network = 'linkedin'`,
    );
    expect(after[0]?.status).toBe('inactive');
    expect(after[0]?.verified).toBe(false);
  });
});

describe('legal_policy_versions', () => {
  it('hides unpublished versions from anon', async () => {
    const asAnon = await selectAs(client, null, 'select id from public.legal_policy_versions');
    expect(asAnon).toHaveLength(0);
  });
});
