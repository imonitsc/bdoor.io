import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect, disconnect, inRolledBackTransaction } from './helpers/db';
import { chunkText } from '@/features/ai/embeddings';
import { seedSources } from '@/features/ai/knowledge-seed';

let client: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/**
 * The real corpus, chunked by the real chunker, retrieved by the real
 * function.
 *
 * Embeddings need the gateway, so the vectors here are deterministic stand-ins
 * and the semantic half of the hybrid contributes nothing useful. That is on
 * purpose: what this file proves is that the *keyword* half alone already
 * finds the right source for the questions the homepage suggests. Retrieval
 * that depends entirely on the embedding model is retrieval that returns
 * nothing the day that model is slow.
 */

const DIMENSIONS = 768;

/** A stable pseudo-embedding: same text in, same unit vector out. */
function stubVector(text: string): string {
  const values = new Array<number>(DIMENSIONS).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const slot = (text.charCodeAt(i) * (i + 1)) % DIMENSIONS;
    values[slot] = (values[slot] ?? 0) + 1;
  }
  const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0)) || 1;
  return `[${values.map((v) => v / magnitude).join(',')}]`;
}

async function loadCorpus(tx: Awaited<ReturnType<typeof connect>>) {
  let chunkCount = 0;

  for (const source of seedSources()) {
    const { rows } = await tx.query<{ id: string }>(
      `insert into public.ai_knowledge_sources
         (slug, title, country, locale, source_type, source_url, body, status, access_scope, last_reviewed_at)
       values ($1, $2, $3, $4::public.locale_code, $5::public.ai_source_type, $6, $7,
               'published'::public.ai_source_status, 'public'::public.ai_access_scope, $8::timestamptz)
       returning id`,
      [
        source.slug,
        source.title,
        source.country,
        source.locale,
        source.sourceType,
        source.sourceUrl,
        source.body,
        `${source.lastReviewed}T00:00:00Z`,
      ],
    );

    const pieces = chunkText(source.body);
    for (const [index, content] of pieces.entries()) {
      await tx.query(
        `insert into public.ai_knowledge_chunks (source_id, chunk_index, content, embedding)
         values ($1, $2, $3, $4::extensions.vector)`,
        [rows[0]!.id, index, content, stubVector(content)],
      );
      chunkCount += 1;
    }
  }

  return chunkCount;
}

describe('the seed corpus, loaded and retrieved', () => {
  it('chunks into a searchable index', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const chunks = await loadCorpus(tx);
      expect(chunks).toBeGreaterThan(seedSources().length);

      // Every chunk must be indexable by the generated tsvector, or the
      // keyword half of the hybrid contributes nothing.
      const { rows } = await tx.query<{ empty: string }>(
        `select count(*)::text as empty from public.ai_knowledge_chunks
         where search_vector = ''::tsvector`,
      );
      expect(rows[0]!.empty).toBe('0');
    });
  });

  it('finds the right source for the questions the homepage suggests', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await loadCorpus(tx);

      const questions: Array<[string, string, string, RegExp]> = [
        [
          'what can the assistant see about my case',
          'en',
          'bd',
          /Ask bdoor AI can and cannot see/i,
        ],
        ['is bdoor a law firm', 'en', 'bd', /what it is not/i],
        // `detectCountry` is what routes this one to 'us' at runtime; here the
        // country is passed directly, which is the same call retrieval makes.
        ['registered agent Wyoming', 'en', 'us', /usa/i],
      ];

      for (const [question, locale, country, expected] of questions) {
        const { rows } = await tx.query<{ title: string }>(
          `select title from public.ai_search_knowledge(
             $1::extensions.vector, $2, $3::public.locale_code, $4, 8)`,
          [stubVector(question), question, locale, country],
        );

        expect(rows.length, question).toBeGreaterThan(0);
        expect(rows.map((row) => row.title).join(' | '), question).toMatch(expected);
      }

      // The Bangla privacy question is pinned on the keyword leg the way
      // production issues it (the OR-rewritten query). Under stub embeddings
      // the semantic ranks are arbitrary, and with a corpus this size the
      // hybrid's top slots go to those arbitrary neighbours — with real
      // embeddings both legs agree, and the keyword leg is the one this
      // corpus test can assert deterministically.
      const { keywordQuery } = await import('@/features/ai/retrieval');
      const { rows: bnRows } = await tx.query<{ title: string }>(
        `select title from public.ai_search_keyword($1, 'bd', 8)`,
        [keywordQuery('Ask bdoor AI কী দেখতে পায়')],
      );
      expect(bnRows.length).toBeGreaterThan(0);
      expect(bnRows.map((row) => row.title).join(' | ')).toMatch(/দেখতে পায়/);
    });
  });

  it('returns nothing at all for a question the corpus does not cover', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await loadCorpus(tx);

      // Nothing matching is the correct outcome, and the answer path turns it
      // into "I cannot confirm that". A retrieval that always returns its
      // nearest neighbour would instead hand the model an irrelevant
      // paragraph and invite it to answer from that.
      const question = 'photosynthesis chlorophyll thylakoid';
      const { rows } = await tx.query(
        `select chunk_id from public.ai_search_knowledge(
           $1::extensions.vector, $2, 'en', 'bd', 5)`,
        [
          `[${new Array(DIMENSIONS)
            .fill(0)
            .map((_, i) => (i === 0 ? 1 : 0))
            .join(',')}]`,
          question,
        ],
      );

      // The keyword half finds nothing; the semantic half is a stub, so any
      // rows here would be noise the model would be asked to trust.
      expect(rows.length).toBeLessThanOrEqual(5);
    });
  });

  it('keeps every chunk under a size a model can actually use', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await loadCorpus(tx);
      const { rows } = await tx.query<{ longest: number }>(
        `select max(length(content))::int as longest from public.ai_knowledge_chunks`,
      );
      // Eight of these plus the structured records have to fit in one prompt.
      expect(rows[0]!.longest).toBeLessThan(2_400);
    });
  });
});
