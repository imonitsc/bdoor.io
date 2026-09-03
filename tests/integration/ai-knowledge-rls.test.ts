import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect, disconnect, inRolledBackTransaction, setIdentity, USERS } from './helpers/db';

let client: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/**
 * The Ask bdoor AI tables, against the real policies.
 *
 * Two separate guarantees are checked here, because they fail in different
 * ways:
 *
 *   1. RLS — what a browser session can read. This is what protects a
 *      customer's transcript from another customer.
 *   2. The retrieval function's own filters — what the *service role* can
 *      retrieve. The service role bypasses RLS entirely, so a filter that
 *      lives only in a policy is no filter at all on the path the assistant
 *      actually uses. That is the guarantee that keeps draft, expired and
 *      restricted content out of a customer's answer.
 */

const VECTOR = `[${Array.from({ length: 768 }, (_, i) => (i === 0 ? 1 : 0)).join(',')}]`;

async function seedSource(
  tx: Awaited<ReturnType<typeof connect>>,
  overrides: Record<string, string>,
) {
  const columns = {
    slug: 'test-source',
    title: 'Test source',
    country: 'bd',
    locale: 'en',
    source_type: 'guide',
    body: 'Trade licence renewal is handled by the city corporation.',
    status: 'published',
    access_scope: 'public',
    effective_from: 'current_date',
    ...overrides,
  };

  const { rows } = await tx.query<{ id: string }>(
    `insert into public.ai_knowledge_sources
       (slug, title, country, locale, source_type, body, status, access_scope, effective_from, expires_on)
     values ($1, $2, $3, $4::public.locale_code, $5::public.ai_source_type, $6,
             $7::public.ai_source_status, $8::public.ai_access_scope, $9::date, $10::date)
     returning id`,
    [
      columns.slug,
      columns.title,
      columns.country,
      columns.locale,
      columns.source_type,
      columns.body,
      columns.status,
      columns.access_scope,
      overrides.effective_from ?? new Date().toISOString().slice(0, 10),
      overrides.expires_on ?? null,
    ],
  );

  const sourceId = rows[0]!.id;
  await tx.query(
    `insert into public.ai_knowledge_chunks (source_id, chunk_index, content, embedding)
     values ($1, 0, $2, $3::extensions.vector)`,
    [sourceId, columns.body, VECTOR],
  );
  return sourceId;
}

describe('knowledge visibility', () => {
  it('shows anonymous callers published, in-date, public sources only', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const live = await seedSource(tx, { slug: 'live-source' });
      const draft = await seedSource(tx, { slug: 'draft-source', status: 'draft' });
      const restricted = await seedSource(tx, {
        slug: 'restricted-source',
        access_scope: 'restricted',
      });
      const expired = await seedSource(tx, {
        slug: 'expired-source',
        expires_on: '2020-01-01',
      });
      const future = await seedSource(tx, {
        slug: 'future-source',
        effective_from: '2099-01-01',
      });

      await setIdentity(tx, null);
      const { rows } = await tx.query<{ id: string }>(
        `select id from public.ai_knowledge_sources where id = any($1::uuid[])`,
        [[live, draft, restricted, expired, future]],
      );

      expect(rows.map((row) => row.id)).toEqual([live]);
    });
  });

  it('hides the chunks of anything a caller cannot read', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const live = await seedSource(tx, { slug: 'chunk-live' });
      await seedSource(tx, { slug: 'chunk-draft', status: 'draft' });
      await seedSource(tx, { slug: 'chunk-restricted', access_scope: 'restricted' });

      await setIdentity(tx, null);
      const { rows } = await tx.query<{ source_id: string }>(
        `select source_id from public.ai_knowledge_chunks
         where source_id in (
           select id from public.ai_knowledge_sources
         )`,
      );

      // The chunk policy is written against the source, so a chunk cannot
      // outlive its source's visibility.
      const visible = new Set(rows.map((row) => row.source_id));
      expect(visible.has(live)).toBe(true);
      expect(visible.size).toBe(1);
    });
  });
});

describe('retrieval, as the assistant runs it', () => {
  it('never returns draft, expired, future or restricted content — even to the owner role', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const live = await seedSource(tx, { slug: 'rpc-live' });
      await seedSource(tx, { slug: 'rpc-draft', status: 'draft' });
      await seedSource(tx, { slug: 'rpc-withdrawn', status: 'withdrawn' });
      await seedSource(tx, { slug: 'rpc-restricted', access_scope: 'restricted' });
      await seedSource(tx, { slug: 'rpc-expired', expires_on: '2020-01-01' });
      await seedSource(tx, { slug: 'rpc-future', effective_from: '2099-01-01' });

      // No `set local role`: this runs as the database owner, which is the
      // closest analogue to the service role the assistant uses. Anything the
      // function returns here is something a customer could be shown.
      const { rows } = await tx.query<{ source_id: string; title: string }>(
        `select source_id, title from public.ai_search_knowledge(
           $1::extensions.vector, 'trade licence renewal', 'en', 'bd', 10)`,
        [VECTOR],
      );

      expect(rows.map((row) => row.source_id)).toEqual([live]);
    });
  });

  it('includes global content alongside the asked-for country', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const bd = await seedSource(tx, { slug: 'rpc-bd', country: 'bd' });
      const global = await seedSource(tx, { slug: 'rpc-global', country: 'global' });
      await seedSource(tx, { slug: 'rpc-uk', country: 'gb' });

      const { rows } = await tx.query<{ source_id: string }>(
        `select source_id from public.ai_search_knowledge(
           $1::extensions.vector, 'trade licence', 'en', 'bd', 10)`,
        [VECTOR],
      );

      const found = new Set(rows.map((row) => row.source_id));
      expect(found).toEqual(new Set([bd, global]));
    });
  });

  it('prefers the asked-for language without excluding the other', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await seedSource(tx, { slug: 'rpc-en', locale: 'en' });
      const bn = await seedSource(tx, {
        slug: 'rpc-bn',
        locale: 'bn',
        body: 'ট্রেড লাইসেন্স নবায়ন সিটি কর্পোরেশন করে থাকে।',
      });

      const { rows } = await tx.query<{ source_id: string; locale: string }>(
        `select source_id, locale from public.ai_search_knowledge(
           $1::extensions.vector, 'ট্রেড লাইসেন্স', 'bn', 'bd', 10)`,
        [VECTOR],
      );

      // Much of the government-reference material exists in English only, so
      // excluding the other language would lose real answers.
      expect(rows.length).toBe(2);
      expect(rows[0]!.source_id).toBe(bn);
    });
  });
});

describe('conversations', () => {
  it('lets a customer read their own and nobody else', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const { rows: mine } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (user_id, country, locale)
         values ($1, 'bd', 'en') returning id`,
        [USERS.localFounder],
      );
      const { rows: theirs } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (user_id, country, locale)
         values ($1, 'bd', 'en') returning id`,
        [USERS.foreignFounder],
      );

      await tx.query(
        `insert into public.ai_messages (conversation_id, role, content)
         values ($1, 'user', 'my question'), ($2, 'user', 'their question')`,
        [mine[0]!.id, theirs[0]!.id],
      );

      await setIdentity(tx, USERS.localFounder);

      const { rows: conversations } = await tx.query<{ id: string }>(
        `select id from public.ai_conversations where id = any($1::uuid[])`,
        [[mine[0]!.id, theirs[0]!.id]],
      );
      expect(conversations.map((row) => row.id)).toEqual([mine[0]!.id]);

      const { rows: messages } = await tx.query<{ content: string }>(
        `select content from public.ai_messages`,
      );
      expect(messages.map((row) => row.content)).toEqual(['my question']);
    });
  });

  it('gives an anonymous caller no read on any transcript', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (anonymous_session_id, country, locale)
         values ('anon-session-abcdefgh', 'bd', 'en') returning id`,
      );
      await tx.query(
        `insert into public.ai_messages (conversation_id, role, content)
         values ($1, 'assistant', 'an answer')`,
        [rows[0]!.id],
      );

      await setIdentity(tx, null);
      const { rows: visible } = await tx.query(`select id from public.ai_conversations`);
      const { rows: messages } = await tx.query(`select id from public.ai_messages`);

      // The browser already holds the transcript it just received; exposing it
      // for re-reading only creates a way to read someone else's.
      expect(visible).toHaveLength(0);
      expect(messages).toHaveLength(0);
    });
  });

  it('refuses a forged transcript, token count or cost line from the browser', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (user_id, country, locale)
         values ($1, 'bd', 'en') returning id`,
        [USERS.localFounder],
      );
      const conversationId = rows[0]!.id;

      await setIdentity(tx, USERS.localFounder);

      // No insert policy exists on any of these tables for a browser role.
      // Each attempt gets its own savepoint: the first refusal aborts the
      // transaction, and without one the remaining assertions would pass for
      // the wrong reason.
      const refused = async (sql: string, params: unknown[] = []) => {
        await tx.query('savepoint attempt');
        try {
          await tx.query(sql, params);
          return null;
        } catch (error) {
          return (error as Error).message;
        } finally {
          await tx.query('rollback to savepoint attempt');
        }
      };

      expect(
        await refused(
          `insert into public.ai_messages (conversation_id, role, content)
           values ($1, 'assistant', 'bdoor guarantees registration in one day')`,
          [conversationId],
        ),
      ).toMatch(/row-level security/i);

      expect(
        await refused(
          `insert into public.ai_usage (model, status, estimated_cost_usd)
           values ('anthropic/claude-sonnet-5', 'complete', 0)`,
        ),
      ).toMatch(/row-level security/i);

      expect(
        await refused(
          `insert into public.ai_conversations (user_id, country, locale) values ($1, 'bd', 'en')`,
          [USERS.localFounder],
        ),
      ).toMatch(/row-level security/i);
    });
  });

  it('keeps usage, gaps and the audit trail away from customers', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await tx.query(
        `insert into public.ai_usage (model, status, estimated_cost_usd)
         values ('anthropic/claude-sonnet-5', 'complete', 0.0123)`,
      );
      await tx.query(
        `insert into public.ai_unanswered_questions (question, locale, reason)
         values ('something we could not answer', 'en', 'no_match')`,
      );
      await tx.query(
        `insert into public.ai_knowledge_audit_log (source_slug, action)
         values ('some-source', 'created')`,
      );

      await setIdentity(tx, USERS.localFounder);
      for (const table of ['ai_usage', 'ai_unanswered_questions', 'ai_knowledge_audit_log']) {
        const { rows } = await tx.query(`select 1 from public.${table}`);
        expect(rows, table).toHaveLength(0);
      }
    });
  });
});

describe('the citation audit columns', () => {
  it('is covered by the transcript policies, not by a policy of its own', async () => {
    // The migration adds columns rather than a table, on the claim that
    // row-level security governs rows and the existing ai_messages policies
    // therefore cover them. This is that claim under test: a customer must not
    // read another customer's audit any more than another customer's answer.
    await inRolledBackTransaction(client, async (tx) => {
      const { rows: mine } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (user_id, country, locale)
         values ($1, 'bd', 'en') returning id`,
        [USERS.localFounder],
      );
      const { rows: theirs } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (user_id, country, locale)
         values ($1, 'bd', 'en') returning id`,
        [USERS.foreignFounder],
      );

      await tx.query(
        `insert into public.ai_messages
           (conversation_id, role, content, citation_count, material_claims,
            supported_claims, uncited_claims, fabricated_marker_count, citation_audit_ok)
         values ($1, 'assistant', 'my answer', 3, 2, 2, 0, 0, true),
                ($2, 'assistant', 'their answer', 4, 5, 1, 4, 2, false)`,
        [mine[0]!.id, theirs[0]!.id],
      );

      await setIdentity(tx, USERS.localFounder);

      const { rows } = await tx.query<{ uncited_claims: number; citation_audit_ok: boolean }>(
        `select uncited_claims, citation_audit_ok from public.ai_messages`,
      );
      expect(rows).toEqual([{ uncited_claims: 0, citation_audit_ok: true }]);
    });
  });

  it('reaches a compliance reviewer, who is the person the review queue is for', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const { rows: conversation } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (user_id, country, locale)
         values ($1, 'bd', 'en') returning id`,
        [USERS.localFounder],
      );
      await tx.query(
        `insert into public.ai_messages
           (conversation_id, role, content, citation_count, material_claims,
            supported_claims, uncited_claims, fabricated_marker_count, citation_audit_ok)
         values ($1, 'assistant', 'an answer stating a fee', 2, 3, 1, 2, 1, false)`,
        [conversation[0]!.id],
      );

      await setIdentity(tx, USERS.admin, { aal: 'aal2' });

      const { rows } = await tx.query<{ fabricated_marker_count: number }>(
        `select fabricated_marker_count from public.ai_messages
         where citation_audit_ok is false`,
      );
      expect(rows).toEqual([{ fabricated_marker_count: 1 }]);
    });
  });

  it('leaves the audit null on an older answer rather than inventing a verdict', async () => {
    // Every row written before the migration, and every failed answer, has no
    // audit. Null must stay null: defaulting it to true would silently mark
    // unaudited history as clean, which is the one reading of this data that
    // would be actively misleading.
    await inRolledBackTransaction(client, async (tx) => {
      const { rows: conversation } = await tx.query<{ id: string }>(
        `insert into public.ai_conversations (user_id, country, locale)
         values ($1, 'bd', 'en') returning id`,
        [USERS.localFounder],
      );
      await tx.query(
        `insert into public.ai_messages (conversation_id, role, content)
         values ($1, 'assistant', 'an answer from before the audit existed')`,
        [conversation[0]!.id],
      );

      await setIdentity(tx, USERS.localFounder);
      const { rows } = await tx.query<{
        citation_audit_ok: boolean | null;
        citation_count: number | null;
      }>(`select citation_audit_ok, citation_count from public.ai_messages`);
      expect(rows).toEqual([{ citation_audit_ok: null, citation_count: null }]);
    });
  });
});

describe('staff access', () => {
  it('lets a content publisher see drafts and the improvement queue', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const draft = await seedSource(tx, { slug: 'staff-draft', status: 'draft' });
      await tx.query(
        `insert into public.ai_unanswered_questions (question, locale, reason)
         values ('a gap', 'en', 'no_match')`,
      );

      await setIdentity(tx, USERS.admin, { aal: 'aal2' });

      const { rows: sources } = await tx.query<{ id: string }>(
        `select id from public.ai_knowledge_sources where id = $1`,
        [draft],
      );
      expect(sources).toHaveLength(1);

      const { rows: gaps } = await tx.query(`select 1 from public.ai_unanswered_questions`);
      expect(gaps.length).toBeGreaterThan(0);
    });
  });
});

describe('liveness', () => {
  it('is one definition, applied identically to every case', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const cases: Array<[string, Record<string, string>, boolean]> = [
        ['published, in date', { slug: 'live-a' }, true],
        ['published, expires today', { slug: 'live-b', expires_on: todayIso() }, true],
        ['published, expired yesterday', { slug: 'live-c', expires_on: yesterdayIso() }, false],
        ['published, effective tomorrow', { slug: 'live-d', effective_from: tomorrowIso() }, false],
        ['approved but not published', { slug: 'live-e', status: 'approved' }, false],
        ['withdrawn', { slug: 'live-f', status: 'withdrawn' }, false],
      ];

      for (const [label, overrides, expected] of cases) {
        const id = await seedSource(tx, overrides);
        const { rows } = await tx.query<{ live: boolean }>(
          `select public.ai_source_is_live(s) as live
           from public.ai_knowledge_sources s where s.id = $1`,
          [id],
        );
        expect(rows[0]!.live, label).toBe(expected);
      }
    });
  });
});

function offsetIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
const todayIso = () => offsetIso(0);
const yesterdayIso = () => offsetIso(-1);
const tomorrowIso = () => offsetIso(1);
