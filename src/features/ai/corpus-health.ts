import 'server-only';

import { aiDb, hasAiDatabase } from './db';
import { seedSources } from './knowledge-seed';

/**
 * Corpus health — whether the thing retrieval reads from is actually there.
 *
 * Every other AI check in this repo measures a REQUEST: latency, cost,
 * citations, refusals. None of them notice the failure that matters most,
 * because it does not fail — it answers. A corpus with no embeddings still
 * returns keyword rows. A corpus with no official source still returns bdoor's
 * own pages. The request looks healthy the whole way down, and the customer
 * gets a marketing page where an RJSC procedure should be.
 *
 * That is not hypothetical. It is the state production has been in since the
 * 30 August seed: the seed wrote chunks and deliberately left embeddings to a
 * human "Index" click that nobody made, so the vector leg of hybrid retrieval
 * has never run in production, and the reviewed government-reference sources
 * in `BD_REGISTRATION_KNOWLEDGE` were never imported at all.
 *
 * The admin page already warned that sources were unindexed — that half was
 * visible and simply not acted on. What nothing reported is the consequence
 * and the second gap: that hybrid retrieval had silently degraded to one leg,
 * that not one published source carries an authority tier, and that reviewed
 * content sits in the repository with no row in the database. Those are what
 * this module adds.
 *
 * It reports STATE, never a verdict about content quality, and it cannot
 * change anything — the remedy is an audited admin action taken by a person,
 * because publishing regulatory content without a recorded reviewer is exactly
 * what CLAUDE.md §6.6 forbids.
 */

export type CorpusHealth = {
  /** Sources in `published`, the only status retrieval reads. */
  publishedSources: number;
  /** Published sources whose chunks have never been embedded. */
  unindexedSources: number;
  chunks: number;
  /** Chunks carrying a vector. When this is 0, semantic search returns nothing. */
  embeddedChunks: number;
  /**
   * Published sources carrying an authority tier — the ones that let a
   * regulatory answer cite RJSC or NBR rather than a bdoor page.
   */
  officialSources: number;
  /** Reviewed seed slugs in the repository with no row in the database. */
  missingSeedSlugs: string[];
  /**
   * True when there is a published corpus but not one vector in it, so
   * `ai_search_semantic` cannot return a row and retrieval is keyword-only.
   */
  vectorLegDead: boolean;
  /**
   * True when nothing published carries an authority tier, so no answer can
   * cite an official source however well retrieval performs.
   */
  noOfficialSource: boolean;
};

const EMPTY: CorpusHealth = {
  publishedSources: 0,
  unindexedSources: 0,
  chunks: 0,
  embeddedChunks: 0,
  officialSources: 0,
  missingSeedSlugs: [],
  vectorLegDead: false,
  noOfficialSource: false,
};

/** One source row, reduced to the columns health depends on. */
export type CorpusSourceRow = {
  slug: string;
  status: string;
  indexed_at: string | null;
  authority_tier: number | null;
};

/**
 * The judgement, separated from the fetch so it can be tested without a
 * database. `vectorLegDead` deliberately requires a published corpus to exist
 * first: an empty database is a deployment that has not been seeded, not a
 * broken vector leg, and reporting the two identically would send whoever
 * reads this looking for the wrong fault.
 */
export function summariseCorpus(
  sources: CorpusSourceRow[],
  chunks: { total: number; embedded: number },
  repoSeedSlugs: string[],
): CorpusHealth {
  const published = sources.filter((source) => source.status === 'published');
  const present = new Set(sources.map((source) => source.slug));

  return {
    publishedSources: published.length,
    unindexedSources: published.filter((source) => source.indexed_at === null).length,
    chunks: chunks.total,
    embeddedChunks: chunks.embedded,
    officialSources: published.filter((source) => source.authority_tier !== null).length,
    missingSeedSlugs: repoSeedSlugs.filter((slug) => !present.has(slug)),
    vectorLegDead: published.length > 0 && chunks.embedded === 0,
    noOfficialSource:
      published.length > 0 && published.every((source) => source.authority_tier === null),
  };
}

export async function corpusHealth(): Promise<CorpusHealth> {
  if (!hasAiDatabase()) return EMPTY;
  const db = aiDb();

  const [sources, total, embedded] = await Promise.all([
    db.from('ai_knowledge_sources').select('slug, status, indexed_at, authority_tier').limit(2_000),
    db.from('ai_knowledge_chunks').select('id', { count: 'exact', head: true }),
    db
      .from('ai_knowledge_chunks')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null),
  ]);

  if (sources.error) return EMPTY;

  return summariseCorpus(
    (sources.data ?? []) as CorpusSourceRow[],
    { total: total.count ?? 0, embedded: embedded.count ?? 0 },
    seedSources().map((source) => source.slug),
  );
}
