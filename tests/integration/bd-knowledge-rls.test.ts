import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  connect,
  disconnect,
  expectRejected,
  inRolledBackTransaction,
  setIdentity,
  USERS,
} from './helpers/db';

let client: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/**
 * The Bangladesh knowledge registry, against the real policies.
 *
 * The trust boundary under test: everything ingested from the internet is
 * staff-only until published, structured rules have exactly one public face
 * (published + in-date), and the upgraded retrieval function prefers higher
 * authority without ever loosening the published/effective/public filters.
 */

const VECTOR = `[${Array.from({ length: 768 }, (_, i) => (i === 0 ? 1 : 0)).join(',')}]`;

async function seedRegistrySource(tx: Awaited<ReturnType<typeof connect>>): Promise<string> {
  const { rows } = await tx.query<{ id: string }>(
    `insert into public.ai_source_registry (code, institution, kind, base_url, authority_tier)
     values ('test-rjsc', 'Test Registrar (sample)', 'regulator', 'https://example.test/', 3)
     returning id`,
  );
  return rows[0]!.id;
}

describe('registry tables are staff-only', () => {
  it('hides the registry, documents, jobs, alerts and audit from anonymous and customers', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const sourceId = await seedRegistrySource(tx);
      await tx.query(
        `insert into public.ai_registry_documents
           (registry_source_id, issuing_institution, source_kind, official_title, canonical_url, authority_tier, lifecycle, extracted_text)
         values ($1, 'Test Registrar (sample)', 'fee_schedule', 'Fee schedule (sample)', 'https://example.test/fees', 3, 'review_required', 'The fee is Tk 100.')`,
        [sourceId],
      );
      await tx.query(
        `insert into public.ai_ingestion_jobs (job_type, registry_source_id) values ('check_source', $1)`,
        [sourceId],
      );
      await tx.query(
        `insert into public.ai_source_change_alerts (alert_type, registry_source_id, summary)
         values ('fee_change', $1, 'Fee changed (sample)')`,
        [sourceId],
      );

      for (const table of [
        'ai_source_registry',
        'ai_registry_documents',
        'ai_ingestion_jobs',
        'ai_source_change_alerts',
        'ai_registry_audit_log',
      ]) {
        for (const viewer of [null, USERS.localFounder, USERS.partnerOwner]) {
          await setIdentity(tx, viewer);
          const { rows } = await tx.query(`select count(*)::int as n from public.${table}`);
          expect(rows[0]?.n, `${table} for ${viewer ?? 'anon'}`).toBe(0);
        }
        await setIdentity(tx, null);
        await tx.query('reset role');
      }
    });
  });

  it('lets the content publisher read the pipeline, and refuses a customer write', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await seedRegistrySource(tx);

      await setIdentity(tx, USERS.admin, { aal: 'aal2' });
      const { rows } = await tx.query('select count(*)::int as n from public.ai_source_registry');
      expect(rows[0]?.n).toBeGreaterThan(0);
      await tx.query('reset role');
    });

    const attempt = await expectRejected(
      client,
      USERS.localFounder,
      `insert into public.ai_source_registry (code, institution, kind, base_url, authority_tier)
       values ('rogue', 'Rogue (sample)', 'secondary', 'https://rogue.test/', 6)`,
    );
    expect(attempt.rejected).toBe(true);
  });
});

describe('structured rules', () => {
  async function seedRule(
    tx: Awaited<ReturnType<typeof connect>>,
    overrides: { status?: string; effectiveFrom?: string | null; effectiveTo?: string | null } = {},
  ) {
    await tx.query(
      `insert into public.ai_structured_rules
         (topic, title, applies_to, required_action, responsible_authority, legal_authority,
          status, effective_from, effective_to)
       values ('trade_licence_local', 'Trade licence renewal (sample)', 'City businesses',
               'Renew annually', 'City corporation', 'Sample Act, s. 1',
               $1::public.ai_rule_status, $2::date, $3::date)`,
      [
        overrides.status ?? 'published',
        overrides.effectiveFrom ?? null,
        overrides.effectiveTo ?? null,
      ],
    );
  }

  it('shows the public only published, in-date rules', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await seedRule(tx, { status: 'published' });
      await seedRule(tx, { status: 'draft' });
      await seedRule(tx, { status: 'published', effectiveFrom: '2099-01-01' });
      await seedRule(tx, { status: 'published', effectiveTo: '2000-01-01' });

      await setIdentity(tx, null);
      const { rows } = await tx.query(`select count(*)::int as n from public.ai_structured_rules`);
      // Exactly the one live rule: not the draft, not the future one, not the
      // expired one.
      expect(rows[0]?.n).toBe(1);
      await tx.query('reset role');
    });
  });

  it('refuses a rule write from anyone without content.publish', async () => {
    const attempt = await expectRejected(
      client,
      USERS.finance,
      `insert into public.ai_structured_rules
         (topic, title, applies_to, required_action, responsible_authority, legal_authority)
       values ('tax_vat', 'Fake rule (sample)', 'Everyone', 'Pay', 'NBR', 'None')`,
    );
    expect(attempt.rejected).toBe(true);
  });
});

describe('ai_search_knowledge v2', () => {
  async function seedSearchable(
    tx: Awaited<ReturnType<typeof connect>>,
    options: {
      slug: string;
      tier: number | null;
      body: string;
      effectiveFrom?: string;
      expiresOn?: string | null;
      status?: string;
    },
  ) {
    const { rows } = await tx.query<{ id: string }>(
      `insert into public.ai_knowledge_sources
         (slug, title, country, locale, source_type, body, status, access_scope,
          effective_from, expires_on, authority_tier, issuing_institution, reference_number)
       values ($1, $2, 'bd', 'en', 'government_reference', $3,
               $4::public.ai_source_status, 'public', $5::date, $6::date, $7,
               'Test Registrar (sample)', 'SRO 42 (sample)')
       returning id`,
      [
        options.slug,
        `Source ${options.slug}`,
        options.body,
        options.status ?? 'published',
        options.effectiveFrom ?? '2020-01-01',
        options.expiresOn ?? null,
        options.tier,
      ],
    );
    const sourceId = rows[0]!.id;
    await tx.query(
      `insert into public.ai_knowledge_chunks
         (source_id, chunk_index, content, embedding, section_ref, page_start)
       values ($1, 0, $2, $3::extensions.vector, 'Section 7', 2)`,
      [sourceId, options.body, VECTOR],
    );
    return sourceId;
  }

  it('prefers the higher-authority source among comparable matches', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const body = 'The renewal fee for a sample licence is listed in the schedule.';
      await seedSearchable(tx, { slug: 'guide-version', tier: 5, body });
      await seedSearchable(tx, { slug: 'gazette-version', tier: 1, body });

      const { rows } = await tx.query(
        `select title, authority_tier, reference_number, section_ref, page_start
         from public.ai_search_knowledge($1::extensions.vector, 'sample licence renewal fee', 'en', 'bd', 4)`,
        [VECTOR],
      );
      expect(rows.length).toBeGreaterThanOrEqual(2);
      expect(rows[0]?.authority_tier).toBe(1);
      // The citation columns ride along.
      expect(rows[0]?.reference_number).toBe('SRO 42 (sample)');
      expect(rows[0]?.section_ref).toBe('Section 7');
      expect(rows[0]?.page_start).toBe(2);
    });
  });

  it('still refuses draft, future-dated and expired sources to every caller', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const body = 'A uniquely retrievable sentence about sample permits.';
      await seedSearchable(tx, { slug: 'draft-src', tier: 1, body, status: 'draft' });
      await seedSearchable(tx, { slug: 'future-src', tier: 1, body, effectiveFrom: '2099-01-01' });
      await seedSearchable(tx, { slug: 'expired-src', tier: 1, body, expiresOn: '2000-01-01' });

      // As the table owner — the closest stand-in for the service role, which
      // bypasses RLS: the function's own filters must do the refusing.
      const { rows } = await tx.query(
        `select * from public.ai_search_knowledge($1::extensions.vector, 'uniquely retrievable sample permits', 'en', 'bd', 8)`,
        [VECTOR],
      );
      expect(rows.filter((row) => String(row.title).includes('draft-src'))).toHaveLength(0);
      expect(rows.filter((row) => String(row.title).includes('future-src'))).toHaveLength(0);
      expect(rows.filter((row) => String(row.title).includes('expired-src'))).toHaveLength(0);
    });
  });

  it('does not let authority outrank relevance', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      // A tier-5 guide that matches the query directly vs a tier-1 gazette
      // about something else entirely.
      // 'simple' tsvector does no stemming, so the body carries the query's
      // exact word forms — which is also what a real matching page does.
      await seedSearchable(tx, {
        slug: 'relevant-guide',
        tier: 5,
        body: 'Widget import permit renewal is handled at the sample office every March.',
      });
      await seedSearchable(tx, {
        slug: 'irrelevant-gazette',
        tier: 1,
        body: 'Notification regarding the appointment of sample officials.',
      });

      const { rows } = await tx.query(
        `select title from public.ai_search_knowledge($1::extensions.vector, 'widget import permit renewal', 'en', 'bd', 4)`,
        [VECTOR],
      );
      expect(rows[0]?.title).toContain('relevant-guide');
    });
  });
});
