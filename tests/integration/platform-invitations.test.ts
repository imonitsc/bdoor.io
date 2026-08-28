import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AAL2,
  USERS,
  connect,
  disconnect,
  expectRejected,
  inRolledBackTransaction,
  selectAs,
  setIdentity,
} from './helpers/db';

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/** A pending invitation row, ready to be inserted. */
function invitation(email: string, template: string, suffix: string) {
  return {
    sql: `insert into public.platform_invitations
            (email, template_code, token_hash, invited_by, reason, expires_at)
          values ($1, $2, $3, $4, 'integration test', now() + interval '7 days')`,
    values: [email, template, `hash-${suffix}`, USERS.admin],
  };
}

async function mayInvite(user: string, template: string): Promise<boolean> {
  const rows = await selectAs(client, user, 'select app.may_invite_template($1) as ok', [template]);
  return rows[0]?.ok === true;
}

/**
 * The rule is that an inviter cannot hand out a permission they do not
 * themselves hold. Naming which roles may invite which would drift the moment
 * a bundle changes; comparing the permission sets cannot.
 */
describe('who may invite whom', () => {
  it('lets an administrator invite roles within their own permissions', async () => {
    for (const role of ['case_manager', 'admin', 'support', 'auditor', 'operations_manager']) {
      expect(await mayInvite(USERS.admin, role), `admin could not invite ${role}`).toBe(true);
    }
  });

  it('stops an administrator inviting a role that holds what they are denied', async () => {
    // compliance_officer holds kyc.decide and risk.write; finance holds
    // refund.approve. Those are precisely the permissions plain admin is
    // deliberately denied, and inviting a second account that holds them is
    // the obvious way around that denial.
    for (const role of ['compliance_officer', 'finance', 'super_admin']) {
      expect(await mayInvite(USERS.admin, role), `admin could invite ${role}`).toBe(false);
    }
  });

  it('lets a super administrator invite anything', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.platform_roles (user_id, role) values ($1, 'super_admin')`,
        [USERS.caseManager],
      );
      await setIdentity(c, USERS.caseManager);
      for (const role of [
        'case_manager',
        'compliance_officer',
        'finance',
        'admin',
        'super_admin',
      ]) {
        const { rows } = await c.query('select app.may_invite_template($1) as ok', [role]);
        expect(rows[0]?.ok, `super_admin could not invite ${role}`).toBe(true);
      }
    });
  });

  it('lets no non-administrator invite anybody', async () => {
    for (const actor of [
      USERS.caseManager,
      USERS.compliance,
      USERS.finance,
      USERS.partnerOwner,
      USERS.localFounder,
    ]) {
      expect(await mayInvite(actor, 'case_manager'), `${actor} could invite`).toBe(false);
    }
  });

  it('does not let a compliance officer invite themselves more power', async () => {
    // Compliance holds kyc.decide but is not an administrator at all, so the
    // first conjunct already refuses. Worth pinning: the rule is
    // "administrator AND no new permissions", not either one alone.
    expect(await mayInvite(USERS.compliance, 'compliance_officer')).toBe(false);
  });
});

describe('writing an invitation', () => {
  it('lets an administrator invite a case manager', async () => {
    const { sql, values } = invitation('newcm@bdoor.test', 'case_manager', 'a');
    const result = await expectRejected(client, USERS.admin, sql, values, AAL2);
    expect(result.rejected).toBe(false);
  });

  it('refuses an administrator inviting a compliance officer', async () => {
    const { sql, values } = invitation('newco@bdoor.test', 'compliance_officer', 'b');
    const result = await expectRejected(client, USERS.admin, sql, values, AAL2);
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('refuses an administrator inviting a super administrator', async () => {
    const { sql, values } = invitation('newsa@bdoor.test', 'super_admin', 'c');
    const result = await expectRejected(client, USERS.admin, sql, values, AAL2);
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('refuses every non-administrator', async () => {
    for (const actor of [
      USERS.caseManager,
      USERS.finance,
      USERS.partnerOwner,
      USERS.localFounder,
    ]) {
      const { sql, values } = invitation('x@bdoor.test', 'case_manager', `d-${actor}`);
      const result = await expectRejected(client, actor, sql, values);
      expect(result.rejected, `${actor} wrote an invitation`).toBe(true);
      expect(result.code).toBe('42501');
    }
  });

  it('refuses an invitation that is already expired', async () => {
    const result = await expectRejected(
      client,
      USERS.admin,
      `insert into public.platform_invitations
         (email, template_code, token_hash, invited_by, reason, expires_at)
       values ('stale@bdoor.test', 'case_manager', 'hash-e', $1, 'test', now() - interval '1 day')`,
      [USERS.admin],
      AAL2,
    );
    expect(result.rejected).toBe(true);
  });

  it('refuses an invitation created already accepted', async () => {
    // Otherwise an administrator could write a row that looks like somebody
    // else accepted it, with no token ever having been sent.
    const result = await expectRejected(
      client,
      USERS.admin,
      `insert into public.platform_invitations
         (email, template_code, status, token_hash, invited_by, reason, expires_at, accepted_by, accepted_at)
       values ('pre@bdoor.test', 'case_manager', 'accepted', 'hash-f', $1, 'test',
               now() + interval '1 day', $2, now())`,
      [USERS.admin, USERS.colleague],
      AAL2,
    );
    expect(result.rejected).toBe(true);
  });

  it('refuses a second live invitation to the same address', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const first = invitation('dupe@bdoor.test', 'case_manager', 'g1');
      await c.query(first.sql, first.values);
      const second = invitation('dupe@bdoor.test', 'support', 'g2');
      // Two valid links to one address must never exist at once.
      await expect(c.query(second.sql, second.values)).rejects.toThrow(
        /platform_invitations_pending_unique/,
      );
    });
  });

  it('refuses an address that is not lower case', async () => {
    const result = await expectRejected(
      client,
      USERS.admin,
      `insert into public.platform_invitations
         (email, template_code, token_hash, invited_by, reason, expires_at)
       values ('Mixed@BDoor.test', 'case_manager', 'hash-h', $1, 'test', now() + interval '1 day')`,
      [USERS.admin],
      AAL2,
    );
    // The acceptance check compares addresses, so one casing is the only way
    // that comparison stays honest.
    expect(result.rejected).toBe(true);
  });
});

describe('reading and revoking', () => {
  it('shows an invitation to platform staff', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('visible@bdoor.test', 'case_manager', 'i');
      await c.query(sql, values);
      await setIdentity(c, USERS.finance);
      const { rows } = await c.query(
        'select email from public.platform_invitations where email = $1',
        ['visible@bdoor.test'],
      );
      expect(rows).toHaveLength(1);
    });
  });

  it('hides it from everybody else', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('hidden@bdoor.test', 'case_manager', 'j');
      await c.query(sql, values);
      for (const actor of [USERS.localFounder, USERS.partnerOwner, USERS.colleague]) {
        await setIdentity(c, actor);
        const { rows } = await c.query('select email from public.platform_invitations');
        expect(rows, `${actor} saw an invitation`).toEqual([]);
      }
    });
  });

  it('hides it from an unauthenticated reader', async () => {
    const rows = await selectAs(client, null, 'select email from public.platform_invitations');
    expect(rows).toEqual([]);
  });

  it('lets an administrator revoke one', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('revokeme@bdoor.test', 'case_manager', 'k');
      await c.query(sql, values);
      const { rowCount } = await c.query(
        `update public.platform_invitations
         set status = 'revoked', revoked_at = now(), revoked_by = $1
         where email = $2`,
        [USERS.admin, 'revokeme@bdoor.test'],
      );
      expect(rowCount).toBe(1);
    });
  });

  it('refuses a case manager revoking one', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('safe@bdoor.test', 'case_manager', 'l');
      await c.query(sql, values);
      await setIdentity(c, USERS.caseManager);
      const { rowCount } = await c.query(
        `update public.platform_invitations set status = 'revoked' where email = $1`,
        ['safe@bdoor.test'],
      );
      // No matching row under the using clause, so the update is a no-op
      // rather than an error — which is still a refusal.
      expect(rowCount).toBe(0);
    });
  });

  it('stops an administrator editing a row into a role they could not create', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('escalate@bdoor.test', 'case_manager', 'm');
      await c.query(sql, values);
      // The insert gate would be pointless if update could reach past it.
      await expect(
        c.query(
          `update public.platform_invitations set template_code = 'super_admin' where email = $1`,
          ['escalate@bdoor.test'],
        ),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it('lets only a super administrator delete', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('deleteme@bdoor.test', 'case_manager', 'n');
      await c.query(sql, values);
      // An admin revokes, leaving the trail. Deleting the evidence is
      // deliberately a narrower right.
      const asAdmin = await c.query('delete from public.platform_invitations where email = $1', [
        'deleteme@bdoor.test',
      ]);
      expect(asAdmin.rowCount).toBe(0);
    });
  });
});

describe('the token', () => {
  it('is unique across every invitation', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const first = invitation('one@bdoor.test', 'case_manager', 'shared');
      await c.query(first.sql, first.values);
      const second = invitation('two@bdoor.test', 'case_manager', 'shared');
      await expect(c.query(second.sql, second.values)).rejects.toThrow(/token_hash/);
    });
  });

  it('is never readable by the invitee, who matches no policy', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('invitee@bdoor.test', 'case_manager', 'o');
      await c.query(sql, values);
      // The invitee holds no platform role yet, so acceptance has to go
      // through the service role — never through a select as themselves.
      await setIdentity(c, USERS.colleague);
      const { rows } = await c.query('select token_hash from public.platform_invitations');
      expect(rows).toEqual([]);
    });
  });
});

describe('the invitation table does not weaken what already existed', () => {
  it('still refuses a direct platform_roles insert by a non-administrator', async () => {
    const result = await expectRejected(
      client,
      USERS.caseManager,
      `insert into public.platform_roles (user_id, role) values ($1, 'admin')`,
      [USERS.caseManager],
    );
    expect(result.rejected).toBe(true);
  });

  it('grants nothing until the invitation is accepted', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.admin, AAL2);
      const { sql, values } = invitation('colleague@bdoor.test', 'case_manager', 'p');
      await c.query(sql, values);

      // A pending invitation is a promise of a role, not the role. Nothing
      // reads this table when working out what somebody may do.
      await setIdentity(c, USERS.colleague);
      const permission = await c.query('select app.has_platform_permission($1) as ok', [
        'case.transition',
      ]);
      expect(permission.rows[0]?.ok).toBe(false);

      const all = await c.query('select app.platform_permissions() as p');
      expect(all.rows).toEqual([]);
    });
  });
});
