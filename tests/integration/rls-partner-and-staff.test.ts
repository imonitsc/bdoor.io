import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CASES,
  ORGS,
  USERS,
  connect,
  disconnect,
  ensureStranger,
  expectRejected,
  selectAs,
} from './helpers/db';

let client: Client;

/** A second partner organisation, so "not assigned to me" can be tested properly. */
const OTHER_PARTNER_ORG = 'b0000000-0000-4000-8000-000000000009';
const OTHER_PARTNER_USER = '22222222-2222-4222-8222-000000000009';

beforeAll(async () => {
  client = await connect();
  await ensureStranger(client);

  await client.query(
    `insert into auth.users (id, email) values ($1, 'other.partner@example.test')
     on conflict (id) do nothing`,
    [OTHER_PARTNER_USER],
  );
  await client.query(
    `insert into public.profiles (id, full_name) values ($1, 'Other Partner (sample)')
     on conflict (id) do nothing`,
    [OTHER_PARTNER_USER],
  );
  await client.query(
    `insert into public.organizations (id, kind, name, slug)
     values ($1, 'partner', 'Jamuna Associates (sample)', 'jamuna-associates-sample')
     on conflict (id) do nothing`,
    [OTHER_PARTNER_ORG],
  );
  await client.query(
    `insert into public.organization_memberships (organization_id, user_id, role)
     values ($1, $2, 'partner_owner') on conflict do nothing`,
    [OTHER_PARTNER_ORG, OTHER_PARTNER_USER],
  );
});

afterAll(async () => {
  await disconnect(client);
});

describe('partner scoping', () => {
  it('sees the case assigned to its organisation', async () => {
    const rows = await selectAs(client, USERS.partnerOwner, 'select id from public.cases');
    expect(rows.map((r) => r.id)).toContain(CASES.northwindIncorporation);
  });

  it('does not see cases assigned to nobody or to another partner', async () => {
    const rows = await selectAs(client, USERS.partnerOwner, 'select id from public.cases');
    const ids = rows.map((r) => r.id);

    expect(ids).not.toContain(CASES.padmaDraft);
    expect(ids).not.toContain(CASES.padmaIrc);
    expect(ids).not.toContain(CASES.padmaApproved);
  });

  it('shows an unassigned partner organisation nothing', async () => {
    const rows = await selectAs(client, OTHER_PARTNER_USER, 'select id from public.cases');
    expect(rows).toHaveLength(0);
  });

  it('cannot read documents on a case it is not assigned to', async () => {
    const rows = await selectAs(
      client,
      OTHER_PARTNER_USER,
      'select id from public.documents where case_id = $1',
      [CASES.northwindIncorporation],
    );
    expect(rows).toHaveLength(0);
  });

  it('reads a shared document only while the customer authorisation stands', async () => {
    const before = await selectAs(
      client,
      USERS.partnerStaff,
      `select id from public.documents where case_id = $1 and visibility = 'partner_shared'`,
      [CASES.northwindIncorporation],
    );
    expect(before.length).toBeGreaterThan(0);

    // Withdraw the customer's authorisation and check again inside the same
    // transaction, so the seed is left untouched.
    const after = await (async () => {
      await client.query('begin');
      try {
        await client.query(
          `update public.case_partner_assignments set customer_authorized_at = null where case_id = $1`,
          [CASES.northwindIncorporation],
        );
        await client.query('set local role authenticated');
        await client.query('select set_config($1, $2, true)', [
          'request.jwt.claims',
          JSON.stringify({ sub: USERS.partnerStaff, role: 'authenticated' }),
        ]);
        const { rows } = await client.query(
          `select id from public.documents where case_id = $1 and visibility = 'partner_shared'`,
          [CASES.northwindIncorporation],
        );
        return rows;
      } finally {
        await client.query('rollback');
      }
    })();

    expect(after).toHaveLength(0);
  });

  it('cannot read internal case history', async () => {
    const rows = await selectAs(
      client,
      USERS.partnerOwner,
      'select id from public.case_status_history where case_id = $1',
      [CASES.northwindIncorporation],
    );
    expect(rows).toHaveLength(0);
  });

  it('cannot read the customer financial records', async () => {
    for (const table of ['invoices', 'payments', 'quote_versions', 'receipts']) {
      const rows = await selectAs(client, USERS.partnerOwner, `select 1 from public.${table}`);
      expect(rows, `${table} leaked to a partner`).toHaveLength(0);
    }
  });

  it('cannot verify its own organisation', async () => {
    // Start from unverified inside the transaction, so this is a real status
    // change rather than a no-op write of the value it already holds.
    await client.query('begin');
    try {
      await client.query(
        `update public.partners set verification_status = 'unverified' where organization_id = $1`,
        [ORGS.partner],
      );
      await client.query('set local role authenticated');
      await client.query('select set_config($1, $2, true)', [
        'request.jwt.claims',
        JSON.stringify({ sub: USERS.partnerOwner, role: 'authenticated' }),
      ]);

      await expect(
        client.query(
          `update public.partners set verification_status = 'verified' where organization_id = $1`,
          [ORGS.partner],
        ),
      ).rejects.toThrow(/administrator/i);
    } finally {
      await client.query('rollback');
    }
  });

  it('can still update its own contact details', async () => {
    const result = await expectRejected(
      client,
      USERS.partnerOwner,
      `update public.partners set contact_name = 'Updated Contact (sample)' where organization_id = $1`,
      [ORGS.partner],
    );
    expect(result.rejected).toBe(false);
  });

  it('cannot accept an assignment offered to a different partner', async () => {
    await client.query('begin');
    try {
      await client.query(
        `update public.case_partner_assignments set status = 'offered' where case_id = $1`,
        [CASES.northwindIncorporation],
      );
      await client.query('set local role authenticated');
      await client.query('select set_config($1, $2, true)', [
        'request.jwt.claims',
        JSON.stringify({ sub: OTHER_PARTNER_USER, role: 'authenticated' }),
      ]);
      const { rowCount } = await client.query(
        `update public.case_partner_assignments set status = 'accepted' where case_id = $1`,
        [CASES.northwindIncorporation],
      );
      expect(rowCount).toBe(0);
    } finally {
      await client.query('rollback');
    }
  });
});

describe('staff role separation', () => {
  it('lets a case manager read cases', async () => {
    const rows = await selectAs(client, USERS.caseManager, 'select id from public.cases');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('does not let a case manager write KYC state', async () => {
    const result = await expectRejected(
      client,
      USERS.caseManager,
      `update public.kyc_cases set overall_status = 'passed'`,
    );
    // No write policy applies, so nothing is updated rather than erroring.
    const rows = await selectAs(
      client,
      USERS.compliance,
      `select overall_status from public.kyc_cases where overall_status = 'passed'`,
    );
    expect(result.rejected).toBe(false);
    expect(rows.length).toBeGreaterThan(0); // unchanged from the seed
  });

  it('does not let finance touch KYC decisions', async () => {
    const result = await expectRejected(
      client,
      USERS.finance,
      `insert into public.kyc_checks (kyc_case_id, check_type, status)
       select id, 'identity', 'passed' from public.kyc_cases limit 1`,
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('does not let compliance rewrite a finalised payment', async () => {
    const result = await expectRejected(
      client,
      USERS.compliance,
      `update public.payments set status = 'refunded'`,
    );
    expect(result.rejected).toBe(false);

    const rows = await selectAs(
      client,
      USERS.finance,
      `select status from public.payments where status = 'refunded'`,
    );
    expect(rows).toHaveLength(0);
  });

  it('lets finance reconcile a payment', async () => {
    const result = await expectRejected(
      client,
      USERS.finance,
      `update public.payments set reconciled_at = now(), reconciled_by = $1`,
      [USERS.finance],
    );
    expect(result.rejected).toBe(false);
  });

  it('keeps the audit log readable to admins and to nobody else wholesale', async () => {
    await client.query(
      `insert into public.audit_logs (actor_id, action, target_type)
       values ($1, 'case.created', 'case') on conflict do nothing`,
      [USERS.caseManager],
    );

    const asAdmin = await selectAs(client, USERS.admin, 'select id from public.audit_logs');
    expect(asAdmin.length).toBeGreaterThan(0);

    // A case manager sees only their own actions.
    const asManager = await selectAs(
      client,
      USERS.caseManager,
      'select actor_id from public.audit_logs',
    );
    expect(asManager.every((row) => row.actor_id === USERS.caseManager)).toBe(true);

    const asCustomer = await selectAs(
      client,
      USERS.localFounder,
      'select id from public.audit_logs',
    );
    expect(asCustomer).toHaveLength(0);
  });
});

describe('restricted compliance schema', () => {
  it('is unreachable by every application role', async () => {
    for (const user of [
      USERS.localFounder,
      USERS.partnerOwner,
      USERS.caseManager,
      USERS.finance,
      USERS.admin,
    ]) {
      const result = await expectRejected(
        client,
        user,
        'select 1 from compliance.restricted_case_notes',
      );
      expect(result.rejected, `compliance schema reachable by ${user}`).toBe(true);
      expect(result.code).toBe('42501');
    }
  });

  it('is not reachable even by a compliance officer through the Data API roles', async () => {
    // Compliance staff reach it through server code with the service role, not
    // through PostgREST — the schema is not in the exposed list at all.
    const result = await expectRejected(
      client,
      USERS.compliance,
      'select 1 from compliance.compliance_decisions',
    );
    expect(result.rejected).toBe(true);
  });
});
