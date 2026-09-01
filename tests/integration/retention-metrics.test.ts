import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Client } from 'pg';

import { connect, disconnect, inRolledBackTransaction, ORGS } from './helpers/db';

/**
 * The P4 retention views, against real fixture rows. Every date is a
 * fixture; every figure is asserted, because a retention number nobody can
 * re-derive is not a metric. Fixtures are inserted as the table owner —
 * the views are SECURITY INVOKER and their staff-visibility is the same
 * policy surface the RLS suites already pin.
 */

const SUB_A = 'aa000000-0000-4000-8000-0000000000a1';
const SUB_B = 'aa000000-0000-4000-8000-0000000000b1';
const PAY_A = 'bb000000-0000-4000-8000-0000000000a1';
const PAY_B = 'bb000000-0000-4000-8000-0000000000b1';

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/** A subscription born pending, paid, then activated — the real lifecycle. */
async function activateSubscription(
  c: Client,
  id: string,
  paymentId: string,
  organizationId: string,
  startedAt: string,
  sandbox: boolean,
): Promise<void> {
  await c.query(
    `insert into public.subscriptions (id, organization_id, plan_id, status)
     select $1, $2, id, 'pending_activation' from public.subscription_plans limit 1`,
    [id, organizationId],
  );
  await c.query(
    `insert into public.payments (id, organization_id, subscription_id, provider,
       checkout_session_id, status, currency, amount_minor, is_sandbox)
     values ($1, $2, $3, 'mock', $4, 'paid', 'BDT', 1190000, $5)`,
    [paymentId, organizationId, id, `cs-${paymentId}`, sandbox],
  );
  await c.query(
    `update public.subscriptions
     set status = 'active', started_at = $2, activation_payment_id = $3
     where id = $1`,
    [id, startedAt, paymentId],
  );
}

describe('metrics_comply_retention', () => {
  it('answers month-N logo retention per cohort, from paid periods only', async () => {
    await inRolledBackTransaction(client, async (c) => {
      // Padma onboards in June 2026 and pays two monthly periods, then lapses.
      await activateSubscription(c, SUB_A, PAY_A, ORGS.padma, '2026-06-05T00:00:00Z', false);
      await c.query(
        `insert into public.subscription_periods (subscription_id, period_start, period_end, amount_minor, status)
         values ($1, '2026-06-05', '2026-07-05', 1190000, 'paid'),
                ($1, '2026-07-05', '2026-08-05', 1190000, 'paid')`,
        [SUB_A],
      );

      const { rows } = await c.query(
        `select months_since, retained_organizations, cohort_organizations, retention_rate
         from public.metrics_comply_retention
         where cohort_month = '2026-06-01'
         order by months_since`,
      );
      // June, July, August overlap the two paid periods; September does not.
      expect(rows.slice(0, 4)).toEqual([
        {
          months_since: 0,
          retained_organizations: '1',
          cohort_organizations: '1',
          retention_rate: '1.0000',
        },
        {
          months_since: 1,
          retained_organizations: '1',
          cohort_organizations: '1',
          retention_rate: '1.0000',
        },
        {
          months_since: 2,
          retained_organizations: '1',
          cohort_organizations: '1',
          retention_rate: '1.0000',
        },
        {
          months_since: 3,
          retained_organizations: '0',
          cohort_organizations: '1',
          retention_rate: '0.0000',
        },
      ]);
    });
  });

  it('excludes sandbox-activated subscriptions — test traffic is not traction', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await activateSubscription(c, SUB_B, PAY_B, ORGS.northwind, '2026-06-05T00:00:00Z', true);
      const { rows } = await c.query(
        `select count(*)::int as n from public.metrics_comply_retention
         where cohort_month = '2026-06-01'`,
      );
      expect(rows[0]?.n).toBe(0);
    });
  });

  it('a scheduled-but-unpaid period does not count as retained', async () => {
    await inRolledBackTransaction(client, async (c) => {
      await activateSubscription(c, SUB_A, PAY_A, ORGS.padma, '2026-06-05T00:00:00Z', false);
      await c.query(
        `insert into public.subscription_periods (subscription_id, period_start, period_end, amount_minor, status)
         values ($1, '2026-06-05', '2026-07-05', 1190000, 'scheduled')`,
        [SUB_A],
      );
      const { rows } = await c.query(
        `select retained_organizations from public.metrics_comply_retention
         where cohort_month = '2026-06-01' and months_since = 0`,
      );
      expect(rows[0]?.retained_organizations).toBe('0');
    });
  });
});

describe('metrics_obligation_engagement', () => {
  it('buckets the funnel by due month from real reminder and status rows', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const { rows: obligations } = await c.query(
        `insert into public.compliance_obligations
           (organization_id, obligation_type, label_en, label_bn, due_on, status)
         values ($1, 'governance_rjsc', 'Filed one (sample)', 'Filed one (sample)', '2030-05-10', 'completed'),
                ($1, 'governance_rjsc', 'Untouched one (sample)', 'Untouched one (sample)', '2030-05-20', 'upcoming')
         returning id`,
        [ORGS.padma],
      );
      await c.query(
        `insert into public.compliance_reminders (obligation_id, offset_days, scheduled_for, sent_at, opened_at)
         values ($1, 30, '2030-04-10', '2030-04-10T09:00:00Z', '2030-04-10T10:00:00Z')`,
        [obligations[0]!.id],
      );

      const { rows } = await c.query(
        `select obligations, reminded, opened, acted, filed
         from public.metrics_obligation_engagement where due_month = '2030-05-01'`,
      );
      expect(rows[0]).toEqual({
        obligations: '2',
        reminded: '1',
        opened: '1',
        acted: '1',
        filed: '1',
      });
    });
  });
});

describe('metrics_renewal_conversion', () => {
  it('counts offered, accepted (past draft, not cancelled) and completed', async () => {
    await inRolledBackTransaction(client, async (c) => {
      const { rows: obligation } = await c.query(
        `insert into public.compliance_obligations
           (organization_id, obligation_type, label_en, label_bn, due_on)
         values ($1, 'governance_rjsc', 'Renewal source (sample)', 'Renewal source (sample)', '2030-06-30')
         returning id`,
        [ORGS.padma],
      );
      const { rows: cases } = await c.query(
        `insert into public.cases (organization_id, created_by, status, reference, title)
         values ($1, null, 'draft', 'BD-REN-0001', 'Renewal case one (sample)'),
                ($1, null, 'submitted', 'BD-REN-0002', 'Renewal case two (sample)'),
                ($1, null, 'approved', 'BD-REN-0003', 'Renewal case three (sample)')
         returning id`,
        [ORGS.padma],
      );
      for (const [i, row] of cases.entries()) {
        await c.query(
          `insert into public.renewal_cases (obligation_id, case_id, period_label)
           values ($1, $2, $3)`,
          [obligation[0]!.id, row.id, `2030-P${i}`],
        );
      }

      const { rows } = await c.query(
        `select offered, accepted, completed from public.metrics_renewal_conversion`,
      );
      expect(rows[0]).toEqual({ offered: '3', accepted: '2', completed: '1' });
    });
  });
});
