import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ORGS,
  USERS,
  asUser,
  connect,
  disconnect,
  expectRejected,
  inRolledBackTransaction,
  selectAs,
  setIdentity,
} from './helpers/db';
import {
  ALL_CAPABILITIES,
  STEP_UP_CAPABILITIES,
  ORGANIZATION_ROLES,
  PLATFORM_ROLES,
  organizationCapabilities,
  platformCapabilities,
  type Capability,
  type OrganizationRole,
  type PlatformRole,
} from '@/lib/permissions/roles';

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/** Permission keys a template bundles, read as the database owner. */
async function templatePermissions(code: string): Promise<string[]> {
  const { rows } = await client.query<{ permission_key: string }>(
    'select permission_key from public.role_template_permissions where template_code = $1 order by 1',
    [code],
  );
  return rows.map((r) => r.permission_key);
}

function sorted(caps: Iterable<Capability>): string[] {
  return [...caps].sort();
}

/**
 * The capability matrix lives in two places by necessity: TypeScript enforces
 * it in Server Actions, PostgreSQL enforces it in RLS. Neither can import the
 * other, so the only thing keeping them honest is a test that reads both. This
 * is the same guard `tests/integration/case-transitions.test.ts` puts on the
 * case state machine.
 */
describe('permission catalogue matches the code', () => {
  it('holds exactly the capabilities the application enforces', async () => {
    const { rows } = await client.query<{ key: string }>(
      'select key from public.permission_catalog order by 1',
    );
    expect(rows.map((r) => r.key)).toEqual([...ALL_CAPABILITIES].sort());
  });

  it('grants every catalogued permission through at least one template', async () => {
    const { rows } = await client.query<{ key: string }>(
      `select c.key from public.permission_catalog c
       where not exists (
         select 1 from public.role_template_permissions tp where tp.permission_key = c.key
       )
       order by 1`,
    );
    // A key nothing grants reads like a control that exists and does not.
    expect(rows.map((r) => r.key)).toEqual([]);
  });

  it.each(PLATFORM_ROLES)('bundles %s exactly as the code matrix does', async (role) => {
    expect(await templatePermissions(role)).toEqual(sorted(platformCapabilities([role])));
  });

  it.each(ORGANIZATION_ROLES)('bundles %s exactly as the code matrix does', async (role) => {
    expect(await templatePermissions(role)).toEqual(sorted(organizationCapabilities([role])));
  });

  it('has a template for every enum value in both role models', async () => {
    const { rows } = await client.query<{ code: string }>(
      'select code from public.role_templates order by 1',
    );
    const codes = new Set(rows.map((r) => r.code));
    for (const role of [...PLATFORM_ROLES, ...ORGANIZATION_ROLES]) {
      // Without this the legacy enum row grants nothing through
      // app.platform_permissions(), which joins on the template code.
      expect(codes.has(role), `no role_template for the ${role} enum value`).toBe(true);
    }
  });
});

describe('the deliberate separations survive', () => {
  async function platformHas(user: string, key: Capability): Promise<boolean> {
    const rows = await selectAs(client, user, 'select app.has_platform_permission($1) as ok', [
      key,
    ]);
    return rows[0]?.ok === true;
  }

  it('denies finance every compliance capability', async () => {
    // A finance user must not be able to make a compliance decision.
    for (const key of ['kyc.decide', 'kyc.read', 'risk.read', 'risk.write'] as const) {
      expect(await platformHas(USERS.finance, key), `finance reached ${key}`).toBe(false);
    }
  });

  it('gives finance what it does need', async () => {
    for (const key of ['payment.reconcile', 'refund.approve', 'quote.approve'] as const) {
      expect(await platformHas(USERS.finance, key), `finance lost ${key}`).toBe(true);
    }
  });

  it('denies plain admin the two super-admin capabilities', async () => {
    expect(await platformHas(USERS.admin, 'kyc.decide')).toBe(false);
    expect(await platformHas(USERS.admin, 'refund.approve')).toBe(false);
  });

  it('grants a case manager its own capabilities and nothing more', async () => {
    expect(await platformHas(USERS.caseManager, 'case.transition')).toBe(true);
    expect(await platformHas(USERS.caseManager, 'user.manage')).toBe(false);
    expect(await platformHas(USERS.caseManager, 'kyc.decide')).toBe(false);
  });

  it('grants a compliance officer the KYC decision and no commercial approval', async () => {
    expect(await platformHas(USERS.compliance, 'kyc.decide')).toBe(true);
    expect(await platformHas(USERS.compliance, 'refund.approve')).toBe(false);
    expect(await platformHas(USERS.compliance, 'quote.approve')).toBe(false);
  });

  it('gives a customer no platform permission at all', async () => {
    const rows = await selectAs(
      client,
      USERS.localFounder,
      'select app.platform_permissions() as p',
    );
    expect(rows).toEqual([]);
  });

  it('gives an unauthenticated request no permission', async () => {
    // anon has no execute grant, so the call must be refused outright rather
    // than returning false — a false would mean the function ran for anon.
    const result = await expectRejected(client, null, 'select app.has_platform_permission($1)', [
      'audit.read',
    ]);
    expect(result.rejected).toBe(true);
  });
});

describe('organization permissions', () => {
  async function orgHas(user: string, org: string, key: Capability): Promise<boolean> {
    const rows = await selectAs(client, user, 'select app.has_org_permission($1, $2) as ok', [
      org,
      key,
    ]);
    return rows[0]?.ok === true;
  }

  it('grants a customer owner its membership capabilities', async () => {
    expect(await orgHas(USERS.localFounder, ORGS.padma, 'quote.accept')).toBe(true);
    expect(await orgHas(USERS.localFounder, ORGS.padma, 'case.create')).toBe(true);
  });

  it('denies a customer member what only the owner has', async () => {
    expect(await orgHas(USERS.colleague, ORGS.padma, 'quote.accept')).toBe(false);
    expect(await orgHas(USERS.colleague, ORGS.padma, 'case.create')).toBe(false);
  });

  it('grants nothing inside an organisation the user does not belong to', async () => {
    expect(await orgHas(USERS.localFounder, ORGS.northwind, 'case.read.own')).toBe(false);
    expect(await orgHas(USERS.localFounder, ORGS.partner, 'partner.read_assigned')).toBe(false);
  });

  it('separates partner owner from partner staff', async () => {
    expect(await orgHas(USERS.partnerOwner, ORGS.partner, 'document.review')).toBe(true);
    expect(await orgHas(USERS.partnerStaff, ORGS.partner, 'document.review')).toBe(false);
    expect(await orgHas(USERS.partnerStaff, ORGS.partner, 'partner.read_assigned')).toBe(true);
  });

  it('gives a partner no platform capability through its organisation role', async () => {
    const rows = await selectAs(
      client,
      USERS.partnerOwner,
      'select app.platform_permissions() as p',
    );
    expect(rows).toEqual([]);
  });
});

describe('scoped assignments', () => {
  const template = 'auditor';

  it('grants through a live platform-scope assignment', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.role_assignments (user_id, template_code, scope_kind, granted_by, reason)
         values ($1, $2, 'platform', $3, 'integration test')`,
        [USERS.caseManager, template, USERS.admin],
      );
      await setIdentity(c, USERS.caseManager);
      const { rows } = await c.query('select app.has_platform_permission($1) as ok', [
        'audit.read',
      ]);
      expect(rows[0]?.ok).toBe(true);
    });
  });

  it('does not grant through an expired assignment', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.role_assignments
           (user_id, template_code, scope_kind, granted_by, reason, starts_at, expires_at)
         values ($1, $2, 'platform', $3, 'integration test', now() - interval '2 days',
                 now() - interval '1 day')`,
        [USERS.caseManager, template, USERS.admin],
      );
      await setIdentity(c, USERS.caseManager);
      const { rows } = await c.query('select app.has_platform_permission($1) as ok', [
        'audit.read',
      ]);
      expect(rows[0]?.ok).toBe(false);
    });
  });

  it('does not grant through a revoked assignment', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.role_assignments
           (user_id, template_code, scope_kind, granted_by, reason, revoked_at, revoke_reason)
         values ($1, $2, 'platform', $3, 'integration test', now(), 'integration test')`,
        [USERS.caseManager, template, USERS.admin],
      );
      await setIdentity(c, USERS.caseManager);
      const { rows } = await c.query('select app.has_platform_permission($1) as ok', [
        'audit.read',
      ]);
      expect(rows[0]?.ok).toBe(false);
    });
  });

  it('does not grant a platform capability from an organization-scope assignment', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.role_assignments
           (user_id, template_code, scope_kind, scope_id, organization_id, granted_by, reason)
         values ($1, $2, 'organization', $3, $3, $4, 'integration test')`,
        [USERS.localFounder, template, ORGS.padma, USERS.admin],
      );
      await setIdentity(c, USERS.localFounder);
      const platform = await c.query('select app.has_platform_permission($1) as ok', [
        'audit.read',
      ]);
      expect(platform.rows[0]?.ok).toBe(false);
      const scoped = await c.query('select app.has_org_permission($1, $2) as ok', [
        ORGS.padma,
        'audit.read',
      ]);
      expect(scoped.rows[0]?.ok).toBe(true);
    });
  });

  it('refuses an organization-scope row whose scope_id and organization_id disagree', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(
          `insert into public.role_assignments
             (user_id, template_code, scope_kind, scope_id, organization_id, granted_by, reason)
           values ($1, $2, 'organization', $3, $4, $5, 'integration test')`,
          [USERS.localFounder, template, ORGS.padma, ORGS.northwind, USERS.admin],
        ),
      ).rejects.toThrow(/role_assignments_org_scope/);
    });
  });

  it('refuses a non-platform scope with no scope_id', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(
          `insert into public.role_assignments (user_id, template_code, scope_kind, granted_by, reason)
           values ($1, $2, 'case', $3, 'integration test')`,
          [USERS.localFounder, template, USERS.admin],
        ),
      ).rejects.toThrow(/role_assignments_scope_id_shape/);
    });
  });

  it('refuses a second live grant of the same template at the same scope', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const insert = `insert into public.role_assignments
          (user_id, template_code, scope_kind, granted_by, reason)
        values ($1, $2, 'platform', $3, 'integration test')`;
      await c.query(insert, [USERS.caseManager, template, USERS.admin]);
      await expect(c.query(insert, [USERS.caseManager, template, USERS.admin])).rejects.toThrow(
        /role_assignments_unique_live/,
      );
    });
  });
});

describe('membership overrides', () => {
  async function membershipId(org: string, user: string): Promise<string> {
    const { rows } = await client.query<{ id: string }>(
      'select id from public.organization_memberships where organization_id = $1 and user_id = $2',
      [org, user],
    );
    const id = rows[0]?.id;
    if (!id) throw new Error(`no membership for ${user} in ${org}`);
    return id;
  }

  it('adds a permission the membership role does not carry', async () => {
    const id = await membershipId(ORGS.padma, USERS.colleague);
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.membership_permission_overrides
           (membership_id, permission_key, effect, reason, granted_by)
         values ($1, 'quote.accept', 'grant', 'integration test', $2)`,
        [id, USERS.admin],
      );
      await setIdentity(c, USERS.colleague);
      const { rows } = await c.query('select app.has_org_permission($1, $2) as ok', [
        ORGS.padma,
        'quote.accept',
      ]);
      expect(rows[0]?.ok).toBe(true);
    });
  });

  it('removes a permission the membership role does carry', async () => {
    const id = await membershipId(ORGS.padma, USERS.localFounder);
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.membership_permission_overrides
           (membership_id, permission_key, effect, reason, granted_by)
         values ($1, 'quote.accept', 'revoke', 'integration test', $2)`,
        [id, USERS.admin],
      );
      await setIdentity(c, USERS.localFounder);
      const { rows } = await c.query('select app.has_org_permission($1, $2) as ok', [
        ORGS.padma,
        'quote.accept',
      ]);
      expect(rows[0]?.ok).toBe(false);
    });
  });

  it('lets a revoke beat a grant of the same key', async () => {
    const owner = await membershipId(ORGS.partner, USERS.partnerOwner);
    await inRolledBackTransaction(client, async (c) => {
      // Two live rows are prevented by the unique index, so the conflict this
      // resolves is a revoke override against the template that grants it.
      await c.query(
        `insert into public.membership_permission_overrides
           (membership_id, permission_key, effect, reason, granted_by)
         values ($1, 'document.review', 'revoke', 'integration test', $2)`,
        [owner, USERS.admin],
      );
      await setIdentity(c, USERS.partnerOwner);
      const { rows } = await c.query('select app.has_org_permission($1, $2) as ok', [
        ORGS.partner,
        'document.review',
      ]);
      expect(rows[0]?.ok).toBe(false);
    });
  });

  it('ignores an expired override', async () => {
    const id = await membershipId(ORGS.padma, USERS.colleague);
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.membership_permission_overrides
           (membership_id, permission_key, effect, reason, granted_by, expires_at)
         values ($1, 'quote.accept', 'grant', 'integration test', $2, now() - interval '1 hour')`,
        [id, USERS.admin],
      );
      await setIdentity(c, USERS.colleague);
      const { rows } = await c.query('select app.has_org_permission($1, $2) as ok', [
        ORGS.padma,
        'quote.accept',
      ]);
      expect(rows[0]?.ok).toBe(false);
    });
  });
});

describe('assurance level', () => {
  it('reports aal1 when the claim is absent', async () => {
    const rows = await selectAs(client, USERS.admin, 'select app.current_aal() as aal');
    // Absent must read as aal1: a caller that cannot prove a second factor is
    // never treated as though it had one.
    expect(rows[0]?.aal).toBe('aal1');
  });

  it('reflects the level the request arrived with', async () => {
    const one = await asUser(
      client,
      USERS.admin,
      async (c) => (await c.query('select app.current_aal_is_2() as ok')).rows[0],
      { aal: 'aal1' },
    );
    expect(one?.ok).toBe(false);

    const two = await asUser(
      client,
      USERS.admin,
      async (c) => (await c.query('select app.current_aal_is_2() as ok')).rows[0],
      { aal: 'aal2' },
    );
    expect(two?.ok).toBe(true);
  });

  it('marks the sensitive permissions as needing a second factor', async () => {
    const { rows } = await client.query<{ key: string }>(
      'select key from public.permission_catalog where requires_aal2 order by 1',
    );
    expect(rows.map((r) => r.key)).toEqual([
      'document.quarantine',
      'kyc.decide',
      'partner.verify',
      'payment.reconcile',
      'quote.approve',
      'refund.approve',
      'risk.write',
      'settings.manage',
      'user.manage',
    ]);
  });

  it('agrees with the code about which permissions need a second factor', async () => {
    // requireCapability() reads STEP_UP_CAPABILITIES rather than querying, so a
    // permission marked requires_aal2 in the database but missing from the set
    // would be enforced nowhere at all.
    const { rows } = await client.query<{ key: string }>(
      'select key from public.permission_catalog where requires_aal2 order by 1',
    );
    expect(rows.map((r) => r.key)).toEqual([...STEP_UP_CAPABILITIES].sort());
  });
});

describe('MFA expectations on templates', () => {
  it('requires MFA for every internal and partner template', async () => {
    const { rows } = await client.query<{ code: string; workspace: string }>(
      `select code, workspace from public.role_templates
       where workspace in ('internal', 'partner') and not requires_mfa
       order by 1`,
    );
    expect(rows).toEqual([]);
  });

  it('agrees with the code about which roles need MFA', async () => {
    const { rows } = await client.query<{ code: string; requires_mfa: boolean }>(
      'select code, requires_mfa from public.role_templates',
    );
    const byCode = new Map(rows.map((r) => [r.code, r.requires_mfa]));
    for (const role of PLATFORM_ROLES as readonly PlatformRole[]) {
      expect(byCode.get(role), `${role} MFA expectation`).toBe(true);
    }
    for (const role of ORGANIZATION_ROLES as readonly OrganizationRole[]) {
      const partner = role === 'partner_owner' || role === 'partner_staff';
      expect(byCode.get(role), `${role} MFA expectation`).toBe(partner);
    }
  });
});

describe('row level security on the authorization tables', () => {
  it('lets any signed-in user read the catalogue and templates', async () => {
    const rows = await selectAs(
      client,
      USERS.localFounder,
      'select key from public.permission_catalog',
    );
    expect(rows.length).toBe(ALL_CAPABILITIES.length);
  });

  it('hides the catalogue from an unauthenticated reader', async () => {
    const rows = await selectAs(client, null, 'select key from public.permission_catalog');
    expect(rows).toEqual([]);
  });

  it('refuses a non-admin write to the catalogue', async () => {
    const result = await expectRejected(
      client,
      USERS.caseManager,
      `insert into public.permission_catalog (key, category, description)
       values ('platform.takeover', 'platform', 'nope')`,
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('refuses a non-admin write to role_assignments', async () => {
    for (const actor of [
      USERS.caseManager,
      USERS.finance,
      USERS.partnerOwner,
      USERS.localFounder,
    ]) {
      const result = await expectRejected(
        client,
        actor,
        `insert into public.role_assignments (user_id, template_code, scope_kind, reason)
         values ($1, 'auditor', 'platform', 'attempt')`,
        [USERS.colleague],
      );
      expect(result.rejected, `${actor} wrote a role assignment`).toBe(true);
      expect(result.code).toBe('42501');
    }
  });

  it('refuses self-assignment even by an administrator', async () => {
    // The escalation this blocks is an admin granting themselves super_admin.
    const result = await expectRejected(
      client,
      USERS.admin,
      `insert into public.role_assignments (user_id, template_code, scope_kind, reason)
       values ($1, 'super_admin', 'platform', 'self')`,
      [USERS.admin],
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('lets an administrator assign somebody else', async () => {
    const result = await expectRejected(
      client,
      USERS.admin,
      `insert into public.role_assignments (user_id, template_code, scope_kind, reason)
       values ($1, 'auditor', 'platform', 'legitimate grant')`,
      [USERS.colleague],
    );
    expect(result.rejected).toBe(false);
  });

  it('shows a user their own assignments and nobody else theirs', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.role_assignments (user_id, template_code, scope_kind, granted_by, reason)
         values ($1, 'auditor', 'platform', $2, 'integration test')`,
        [USERS.localFounder, USERS.admin],
      );
      await setIdentity(c, USERS.localFounder);
      const own = await c.query('select user_id from public.role_assignments');
      expect(own.rows.map((r) => r.user_id)).toEqual([USERS.localFounder]);

      await setIdentity(c, USERS.colleague);
      const other = await c.query('select user_id from public.role_assignments');
      expect(other.rows).toEqual([]);
    });
  });

  it('refuses a non-admin write to a membership override', async () => {
    const { rows } = await client.query<{ id: string }>(
      'select id from public.organization_memberships where organization_id = $1 and user_id = $2',
      [ORGS.padma, USERS.colleague],
    );
    const membership = rows[0]?.id;
    expect(membership).toBeDefined();
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.membership_permission_overrides
         (membership_id, permission_key, effect, reason)
       values ($1, 'quote.accept', 'grant', 'attempt')`,
      [membership],
    );
    // A customer owner may read their organisation's overrides but must not be
    // able to widen their own colleague's permissions.
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });
});
