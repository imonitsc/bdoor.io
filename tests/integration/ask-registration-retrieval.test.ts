import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { chunkStructured } from '@/features/ai/registry/chunker';
import { seedSources } from '@/features/ai/knowledge-seed';
import { keywordQuery } from '@/features/ai/retrieval';
import { connect, disconnect, inRolledBackTransaction } from './helpers/db';

let client: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

/**
 * The production question, against the real seed corpus and the real search
 * function.
 *
 * "How do I register a company in Bangladesh?" went unanswered in production
 * because the knowledge base held no Bangladesh registration content at all —
 * keyword search returned zero rows. This suite loads the repo's actual seed
 * (published and chunked exactly the way `indexSource` chunks it, minus the
 * embeddings, which keyword search does not use) and requires the retrieval
 * the customer depends on: official government sources, not only bdoor pages.
 */

const QUESTION = 'How do I register a company in Bangladesh?';

async function seedTheRealCorpus(tx: Awaited<ReturnType<typeof connect>>) {
  for (const source of seedSources()) {
    const { rows } = await tx.query<{ id: string }>(
      `insert into public.ai_knowledge_sources
         (slug, title, country, locale, source_type, source_url, body, status, access_scope,
          effective_from, last_reviewed_at, indexed_at, authority_tier, issuing_institution, reference_number)
       values ($1, $2, $3, $4, $5::public.ai_source_type, $6, $7, 'published', 'public',
               '2020-01-01', $8, now(), $9, $10, $11)
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
        source.authorityTier ?? null,
        source.issuingInstitution ?? null,
        source.referenceNumber ?? null,
      ],
    );
    const pieces = chunkStructured(source.body);
    for (const [index, piece] of pieces.entries()) {
      await tx.query(
        `insert into public.ai_knowledge_chunks
           (source_id, chunk_index, content, heading, section_ref, page_start, page_end)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          rows[0]!.id,
          index,
          piece.content,
          piece.heading,
          piece.sectionRef,
          piece.pageStart,
          piece.pageEnd,
        ],
      );
    }
  }
}

type Row = {
  title: string;
  source_type: string;
  authority_tier: number | null;
  issuing_institution: string | null;
  source_url: string | null;
  content: string;
};

describe('the registration question against the real seed corpus', () => {
  it('retrieves official government sources with the process, forms and authorities', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await seedTheRealCorpus(tx);

      // The exact call retrieval makes: the raw question is rewritten to its
      // meaningful terms before it reaches the SQL function.
      const { rows } = await tx.query<Row>(
        `select title, source_type, authority_tier, issuing_institution, source_url, content
         from public.ai_search_keyword($1, 'bd', 40)`,
        [keywordQuery(QUESTION)],
      );

      // The production failure mode: zero rows.
      expect(rows.length).toBeGreaterThan(0);

      // Official material is retrievable, not only bdoor pages.
      const official = rows.filter((row) => row.source_type === 'government_reference');
      expect(official.length).toBeGreaterThan(0);
      for (const row of official) {
        expect(row.authority_tier).not.toBeNull();
        expect(row.issuing_institution).toBeTruthy();
      }

      // The retrieved set carries the substance of the registration answer.
      const text = rows.map((row) => `${row.title}\n${row.content}`).join('\n');
      for (const required of [
        /name clearance/i,
        /RJSC/,
        /Memorandum of Association|MOA/,
        /Form IX|Form XII/,
        /Certificate of Incorporation/i,
      ]) {
        expect(text).toMatch(required);
      }

      // At least one retrieved citation is a clickable official URL.
      expect(rows.some((row) => /https?:\/\/.+gov\.bd/.test(row.source_url ?? ''))).toBe(true);
    });
  });

  it('answers the Bangla form of the question from the Bangla corpus', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await seedTheRealCorpus(tx);

      const { rows } = await tx.query<Row>(
        `select title, source_type, authority_tier, issuing_institution, source_url, content
         from public.ai_search_keyword($1, 'bd', 40)`,
        [keywordQuery('বাংলাদেশে কোম্পানি নিবন্ধন করব কীভাবে?')],
      );

      expect(rows.length).toBeGreaterThan(0);
      const text = rows.map((row) => row.content).join('\n');
      expect(text).toMatch(/নিবন্ধন|ছাড়পত্র/);
    });
  });
});
