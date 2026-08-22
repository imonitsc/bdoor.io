import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CASES, ORGS, USERS, connect, expectRejected } from './helpers/db';
import { ALLOWED_TRANSITIONS, CASE_STATUSES } from '@/features/cases/state-machine';

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await client.end();
});

/** Mirrors app.canonical_document_path(). */
function path(orgId: string, caseId: string | null, docId: string, version = 1, ext = 'pdf') {
  return `org/${orgId}/case/${caseId ?? 'none'}/doc/${docId}/v${version}.${ext}`;
}

describe('storage object policies', () => {
  const docId = 'aaaaaaaa-0000-4000-8000-00000000000a';

  it('lets a customer write into their own organisation prefix', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into storage.objects (bucket_id, name, owner) values ('case-documents', $1, $2)`,
      [path(ORGS.padma, CASES.padmaDraft, docId), USERS.localFounder],
    );
    expect(result.rejected).toBe(false);
  });

  it('refuses a write into another organisation prefix', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into storage.objects (bucket_id, name, owner) values ('case-documents', $1, $2)`,
      [path(ORGS.northwind, CASES.northwindIncorporation, docId), USERS.localFounder],
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('refuses a path that does not follow the canonical shape', async () => {
    for (const name of ['passport.pdf', `../${ORGS.northwind}/x.pdf`, 'org//case/x/doc/y/v1.pdf']) {
      const result = await expectRejected(
        client,
        USERS.localFounder,
        `insert into storage.objects (bucket_id, name, owner) values ('case-documents', $1, $2)`,
        [name, USERS.localFounder],
      );
      expect(result.rejected, `accepted a non-canonical path: ${name}`).toBe(true);
    }
  });

  it('refuses a write onto a case the customer does not belong to', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into storage.objects (bucket_id, name, owner) values ('identity-documents', $1, $2)`,
      [path(ORGS.padma, CASES.northwindIncorporation, docId), USERS.localFounder],
    );
    expect(result.rejected).toBe(true);
  });

  it('does not let a customer read another organisation objects', async () => {
    await client.query('begin');
    try {
      await client.query(
        `insert into storage.objects (bucket_id, name, owner) values ('case-documents', $1, $2)`,
        [path(ORGS.northwind, CASES.northwindIncorporation, docId), USERS.foreignFounder],
      );
      await client.query('set local role authenticated');
      await client.query('select set_config($1, $2, true)', [
        'request.jwt.claims',
        JSON.stringify({ sub: USERS.localFounder, role: 'authenticated' }),
      ]);
      const { rows } = await client.query('select name from storage.objects');
      expect(rows.every((r: { name: string }) => !r.name.includes(ORGS.northwind))).toBe(true);
    } finally {
      await client.query('rollback');
    }
  });

  it('does not let a customer delete a stored object', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `delete from storage.objects where bucket_id = 'case-documents'`,
    );
    // No delete policy matches, so nothing is removed.
    expect(result.rejected).toBe(false);
  });

  it('keeps every customer bucket private', async () => {
    const { rows } = await client.query(
      `select id, public from storage.buckets
       where id in ('identity-documents','case-documents','official-records',
                    'message-attachments','partner-credentials')`,
    );
    expect(rows).toHaveLength(5);
    for (const row of rows) expect(row.public, `${row.id} is public`).toBe(false);
  });

  it('restricts partner credentials to the partner organisation', async () => {
    const credentialPath = `org/${ORGS.partner}/case/none/doc/${docId}/v1.pdf`;

    const partnerWrite = await expectRejected(
      client,
      USERS.partnerOwner,
      `insert into storage.objects (bucket_id, name, owner) values ('partner-credentials', $1, $2)`,
      [credentialPath, USERS.partnerOwner],
    );
    expect(partnerWrite.rejected).toBe(false);

    const customerWrite = await expectRejected(
      client,
      USERS.localFounder,
      `insert into storage.objects (bucket_id, name, owner) values ('partner-credentials', $1, $2)`,
      [credentialPath, USERS.localFounder],
    );
    expect(customerWrite.rejected).toBe(true);
  });
});

describe('append-only records', () => {
  it('refuses to update or delete an audit log entry', async () => {
    await client.query(
      `insert into public.audit_logs (actor_id, action, target_type) values ($1, 'case.created', 'case')`,
      [USERS.admin],
    );

    await expect(client.query(`update public.audit_logs set action = 'tampered'`)).rejects.toThrow(
      /append-only/i,
    );

    await expect(client.query('delete from public.audit_logs')).rejects.toThrow(/append-only/i);
  });

  it('refuses to edit case status history', async () => {
    await expect(
      client.query(`update public.case_status_history set reason = 'rewritten'`),
    ).rejects.toThrow(/append-only/i);
  });

  it('refuses to alter a document version after upload', async () => {
    await expect(
      client.query(`update public.document_versions set storage_path = 'elsewhere'`),
    ).rejects.toThrow(/immutable/i);
  });

  it('refuses to edit a message', async () => {
    await expect(client.query(`update public.messages set body = 'rewritten'`)).rejects.toThrow(
      /append-only/i,
    );
  });

  it('refuses to change the numbers on an accepted quote', async () => {
    await expect(
      client.query(
        `update public.quote_versions set total_minor = 1 where accepted_at is not null`,
      ),
    ).rejects.toThrow(/immutable/i);
  });
});

describe('case state machine is enforced by the database', () => {
  it('rejects a transition that is not in the table', async () => {
    await expect(
      client.query(`update public.cases set status = 'approved' where id = $1`, [CASES.padmaDraft]),
    ).rejects.toThrow(/Invalid case transition/i);
  });

  it('accepts a transition that is', async () => {
    await client.query('begin');
    try {
      await client.query(`update public.cases set status = 'awaiting_kyc' where id = $1`, [
        CASES.padmaDraft,
      ]);
      const { rows } = await client.query('select status from public.cases where id = $1', [
        CASES.padmaDraft,
      ]);
      expect(rows[0].status).toBe('awaiting_kyc');
    } finally {
      await client.query('rollback');
    }
  });

  it('stamps closed_at when a case reaches a terminal state', async () => {
    await client.query('begin');
    try {
      await client.query(`update public.cases set status = 'cancelled' where id = $1`, [
        CASES.padmaDraft,
      ]);
      const { rows } = await client.query('select closed_at from public.cases where id = $1', [
        CASES.padmaDraft,
      ]);
      expect(rows[0].closed_at).not.toBeNull();
    } finally {
      await client.query('rollback');
    }
  });

  it('matches the transition table the application uses', async () => {
    const { rows } = await client.query(
      'select from_status, to_status from public.case_status_transitions',
    );
    const inDatabase = new Set(
      rows.map(
        (r: { from_status: string; to_status: string }) => `${r.from_status}->${r.to_status}`,
      ),
    );

    const inCode = new Set<string>();
    for (const status of CASE_STATUSES) {
      for (const edge of ALLOWED_TRANSITIONS[status]) inCode.add(`${status}->${edge.to}`);
    }

    // Drift here would let the UI offer a transition the database refuses, or
    // hide one it would accept.
    expect([...inCode].filter((t) => !inDatabase.has(t))).toEqual([]);
    expect([...inDatabase].filter((t) => !inCode.has(t))).toEqual([]);
  });
});

describe('data integrity invariants', () => {
  it('refuses a membership role that does not fit the organisation kind', async () => {
    await expect(
      client.query(
        `insert into public.organization_memberships (organization_id, user_id, role)
         values ($1, $2, 'partner_owner')`,
        [ORGS.padma, USERS.stranger],
      ),
    ).rejects.toThrow(/not valid for a customer organization/i);
  });

  it('refuses to assign a customer organisation as a partner', async () => {
    await expect(
      client.query(
        `insert into public.case_partner_assignments (case_id, partner_org_id, scope_note)
         values ($1, $2, 'test')`,
        [CASES.padmaDraft, ORGS.northwind],
      ),
    ).rejects.toThrow(/not a partner organization/i);
  });

  it('refuses a second live partner assignment on one case', async () => {
    await expect(
      client.query(
        `insert into public.case_partner_assignments (case_id, partner_org_id, scope_note)
         values ($1, $2, 'duplicate')`,
        [CASES.northwindIncorporation, ORGS.partner],
      ),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('refuses to disburse more than the advance received', async () => {
    await expect(
      client.query(
        `update public.government_fee_advances set disbursed_minor = received_minor + 1`,
      ),
    ).rejects.toThrow(/government_fee_advances_balance/i);
  });

  it('refuses a government fee line that is not marked as an estimate', async () => {
    await expect(
      client.query(
        `insert into public.quote_items
           (quote_version_id, category, description_en, description_bn, unit_amount_minor, payee, is_estimate)
         select id, 'government_fee_estimate', 'x', 'x', 1000, 'bdoor', false
         from public.quote_versions limit 1`,
      ),
    ).rejects.toThrow(/quote_items_government_shape/i);
  });

  it('refuses an official receipt with no document attached', async () => {
    await expect(
      client.query(
        `insert into public.receipts (case_id, organization_id, kind)
         values ($1, $2, 'government_official')`,
        [CASES.padmaApproved, ORGS.padma],
      ),
    ).rejects.toThrow(/receipts_official_needs_document/i);
  });

  it('refuses a published time estimate that has never been reviewed', async () => {
    await expect(
      client.query(
        `update public.services set estimated_days_min = 5, estimated_days_max = 10,
                                    time_reviewed_at = null
         where slug = 'trade-licence'`,
      ),
    ).rejects.toThrow(/services_estimate_needs_review/i);
  });

  it('refuses a document version whose type is outside the allow-list', async () => {
    await expect(
      client.query(
        `insert into public.document_versions
           (document_id, version_no, storage_path, file_name, mime_type, byte_size)
         select id, 99, 'org/x/case/none/doc/y/v99.sh', 'x.sh', 'application/x-sh', 10
         from public.documents limit 1`,
      ),
    ).rejects.toThrow(/document_versions_mime_allowed/i);
  });
});
