import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { fuseRankedLists, type RankedChunk } from '@/features/ai/fusion';
import { connect, disconnect, inRolledBackTransaction } from './helpers/db';

let client: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/**
 * The split retrieval functions against the real database.
 *
 * The performance work moved fusion from SQL to TypeScript so keyword search
 * no longer waits for the embedding. That is only safe if the two paths stay
 * equivalent — so this suite seeds a corpus, runs the old hybrid function and
 * the new split-then-fuse path over identical inputs, and requires the same
 * chunks in the same order with the same scores.
 */

const VECTOR = (first: number) =>
  `[${Array.from({ length: 768 }, (_, i) => (i === 0 ? first : i === 1 ? Math.sqrt(1 - first * first) : 0)).join(',')}]`;

async function seedSource(
  tx: Awaited<ReturnType<typeof connect>>,
  options: { slug: string; tier: number | null; body: string; vectorFirst: number; status?: string },
) {
  const { rows } = await tx.query<{ id: string }>(
    `insert into public.ai_knowledge_sources
       (slug, title, country, locale, source_type, body, status, access_scope, effective_from, authority_tier)
     values ($1, $2, 'bd', 'en', 'government_reference', $3, $4::public.ai_source_status,
             'public', '2020-01-01', $5)
     returning id`,
    [options.slug, `Source ${options.slug}`, options.body, options.status ?? 'published', options.tier],
  );
  await tx.query(
    `insert into public.ai_knowledge_chunks (source_id, chunk_index, content, embedding)
     values ($1, 0, $2, $3::extensions.vector)`,
    [rows[0]!.id, options.body, VECTOR(options.vectorFirst)],
  );
}

const QUERY = 'trade licence renewal fee schedule';

describe('split retrieval parity', () => {
  it('keyword + semantic fused in TypeScript equals the hybrid SQL function', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await seedSource(tx, {
        slug: 'p-1',
        tier: 1,
        vectorFirst: 0.99,
        body: 'The trade licence renewal fee schedule is published by the city corporation.',
      });
      await seedSource(tx, {
        slug: 'p-2',
        tier: 5,
        vectorFirst: 0.95,
        body: 'A trade licence renewal is filed each year with the fee set in the schedule.',
      });
      await seedSource(tx, {
        slug: 'p-3',
        tier: null,
        vectorFirst: 0.5,
        body: 'bdoor helps with annual filings and licence renewal paperwork.',
      });

      const embedding = VECTOR(1);

      const { rows: hybrid } = await tx.query(
        `select chunk_id, title, score from public.ai_search_knowledge($1::extensions.vector, $2, 'en', 'bd', 8)`,
        [embedding, QUERY],
      );

      const { rows: keyword } = await tx.query(
        `select * from public.ai_search_keyword($1, 'bd', 40)`,
        [QUERY],
      );
      const { rows: semantic } = await tx.query(
        `select * from public.ai_search_semantic($1::extensions.vector, 'bd', 40)`,
        [embedding],
      );

      const fused = fuseRankedLists(semantic as RankedChunk[], keyword as RankedChunk[], {
        count: 8,
        locale: 'en',
      });

      expect(hybrid.length).toBeGreaterThan(0);
      expect(fused.map((chunk) => chunk.chunk_id)).toEqual(hybrid.map((row) => row.chunk_id));
      fused.forEach((chunk, index) => {
        expect(chunk.score).toBeCloseTo(Number(hybrid[index]?.score), 9);
      });
    });
  });

  it('both split functions refuse draft, expired and future-dated sources', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await seedSource(tx, {
        slug: 'q-draft',
        tier: 1,
        vectorFirst: 0.9,
        body: 'A uniquely sampled licence sentence.',
        status: 'draft',
      });
      await tx.query(
        `update public.ai_knowledge_sources set effective_from = '2099-01-01'
         where slug = 'q-draft'`,
      );

      const { rows: keyword } = await tx.query(
        `select * from public.ai_search_keyword('uniquely sampled licence sentence', 'bd', 40)`,
      );
      const { rows: semantic } = await tx.query(
        `select * from public.ai_search_semantic($1::extensions.vector, 'bd', 40)`,
        [VECTOR(0.9)],
      );
      expect(keyword.filter((row) => String(row.title).includes('q-draft'))).toHaveLength(0);
      expect(semantic.filter((row) => String(row.title).includes('q-draft'))).toHaveLength(0);
    });
  });
});
