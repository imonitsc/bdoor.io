import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Client } from 'pg';

import {
  connect,
  disconnect,
  expectRejected,
  inRolledBackTransaction,
  selectAs,
  setIdentity,
  USERS,
} from './helpers/db';

/**
 * P1 rule scheduling: the public_holidays policies, the scheduling-column
 * constraints on ai_structured_rules, and the obligations idempotency index.
 * Every date and label below is a fixture, not a gazetted fact.
 */

const PADMA_COMPANY = 'e0000000-0000-4000-8000-000000000001';
const PADMA_ORG = 'a0000000-0000-4000-8000-000000000001';

/** A minimally-valid rule row; scheduling fields provided per test. */
const RULE_INSERT = `
  insert into public.ai_structured_rules
    (topic, title, applies_to, required_action, responsible_authority, legal_authority,
     recurrence, deadline_anchor, deadline_offset_days, deadline_month, deadline_day)
  values
    ('governance_rjsc', 'Constraint fixture (sample)', 'Sample entities', 'File the sample return',
     'Registrar (sample)', 'Sample Act, s 1', $1, $2, $3, $4, $5)
  returning id`;

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

describe('public_holidays access', () => {
  it('is readable without signing in — holiday dates are public facts', async () => {
    const rows = await selectAs(client, null, 'select * from public.public_holidays');
    expect(Array.isArray(rows)).toBe(true);
  });

  it('refuses a customer write — a wrong holiday moves real deadlines', async () => {
    const result = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.public_holidays (jurisdiction_code, holiday_date, label)
       values ('BD', '2030-01-15', 'Not a real holiday (sample)')`,
    );
    expect(result.rejected).toBe(true);
    expect(result.code).toBe('42501');
  });

  it('lets compliance staff enter a holiday, visible to everyone', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await setIdentity(c, USERS.compliance);
      await c.query(
        `insert into public.public_holidays (jurisdiction_code, holiday_date, label)
         values ('BD', '2030-01-15', 'Fixture holiday (sample)')`,
      );
      await setIdentity(c, USERS.localFounder);
      const { rows } = await c.query(
        `select label from public.public_holidays where holiday_date = '2030-01-15'`,
      );
      expect(rows).toHaveLength(1);
    });
  });

  it('refuses a duplicate date for the same jurisdiction', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(
        `insert into public.public_holidays (jurisdiction_code, holiday_date, label)
         values ('BD', '2030-01-15', 'Fixture holiday (sample)')`,
      );
      await expect(
        c.query(
          `insert into public.public_holidays (jurisdiction_code, holiday_date, label)
           values ('BD', '2030-01-15', 'Same day again (sample)')`,
        ),
      ).rejects.toMatchObject({ code: '23505' });
    });
  });
});

describe('ai_structured_rules scheduling constraints', () => {
  it('accepts a fully-specified fixed_date rule', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const { rows } = await c.query(RULE_INSERT, ['annual', 'fixed_date', 0, 1, 15]);
      expect(rows[0]?.id).toBeTruthy();
    });
  });

  it('refuses an unknown recurrence token', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(RULE_INSERT, ['fortnightly', 'fixed_date', 0, 1, 15]),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  it('refuses fixed_date without its month and day — no half-interpreted rows', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(RULE_INSERT, ['annual', 'fixed_date', 0, null, null]),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  it('refuses month/day on any other anchor', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(RULE_INSERT, ['annual', 'fiscal_year_end', 15, 6, 30]),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  it('refuses an offset beyond two years', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await expect(
        c.query(RULE_INSERT, ['annual', 'fixed_date', 731, 1, 15]),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });
});

describe('compliance_obligations idempotency index', () => {
  const OBLIGATION_INSERT = `
    insert into public.compliance_obligations
      (organization_id, company_id, obligation_type, label_en, label_bn, due_on, source, source_rule_ref)
    values ($1, $2, 'governance_rjsc', 'Generated fixture (sample)', 'Generated fixture (sample)',
            $3, $4, $5)`;

  it('makes re-generating the same (company, rule, due date) a no-op conflict', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const args = [PADMA_ORG, PADMA_COMPANY, '2030-02-01', 'verified_rule', 'rule-fixture-1'];
      await c.query(OBLIGATION_INSERT, args);
      await expect(c.query(OBLIGATION_INSERT, args)).rejects.toMatchObject({ code: '23505' });
    });
  });

  it('allows the same rule on a different due date — the next period', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await c.query(OBLIGATION_INSERT, [
        PADMA_ORG,
        PADMA_COMPANY,
        '2030-02-01',
        'verified_rule',
        'rule-fixture-1',
      ]);
      await c.query(OBLIGATION_INSERT, [
        PADMA_ORG,
        PADMA_COMPANY,
        '2031-02-01',
        'verified_rule',
        'rule-fixture-1',
      ]);
      const { rows } = await c.query(
        `select count(*)::int as n from public.compliance_obligations
         where source_rule_ref = 'rule-fixture-1'`,
      );
      expect(rows[0]?.n).toBe(2);
    });
  });

  it('leaves admin-entered obligations outside the uniqueness rule', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const args = [PADMA_ORG, PADMA_COMPANY, '2030-02-01', 'admin', 'rule-fixture-1'];
      await c.query(OBLIGATION_INSERT, args);
      await c.query(OBLIGATION_INSERT, args); // duplicate allowed: partial index scopes to verified_rule
      const { rows } = await c.query(
        `select count(*)::int as n from public.compliance_obligations
         where source = 'admin' and source_rule_ref = 'rule-fixture-1'`,
      );
      expect(rows[0]?.n).toBe(2);
    });
  });
});
