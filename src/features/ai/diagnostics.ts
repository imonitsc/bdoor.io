import 'server-only';

import { LIMITS } from './config';
import { aiDb, hasAiDatabase } from './db';
import { embedQuery } from './embeddings';
import { AUTHORITY_BONUS_PER_TIER, RRF_K, type RankedChunk } from './fusion';
import { keywordQuery } from './retrieval';
import { logger } from '@/lib/logger';

/**
 * Retrieval diagnostics for the admin testing console.
 *
 * `retrieveContext` answers "what does the model see"; this module answers
 * "why". For a question it reports every candidate chunk with its per-list
 * ranks and score components, whether it made the cut, and — the part a score
 * table cannot show — the sources that could never have been retrieved at all,
 * with the reason: not published, published but never indexed, or restricted.
 *
 * Admin-only (`content.publish` gates the caller). Never on the answer path:
 * the extra queries here are diagnostic spend, not customer latency.
 */

export type ChunkDiagnostic = {
  chunkId: string;
  sourceSlug: string | null;
  title: string;
  locale: string;
  authorityTier: number | null;
  keywordRank: number | null;
  semanticRank: number | null;
  rrfScore: number;
  authorityBonus: number;
  totalScore: number;
  included: boolean;
};

export type ExcludedSource = {
  slug: string;
  title: string;
  status: string;
  reason: 'not_published' | 'published_not_indexed' | 'restricted';
};

export type RetrievalDiagnostics = {
  candidates: ChunkDiagnostic[];
  excluded: ExcludedSource[];
  /** Number of chunks that would reach the model. */
  includedCount: number;
};

const CANDIDATES = Math.max(LIMITS.retrievalCount * 4, 40);

type Rpc = (
  fn: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: RankedChunk[] | null; error: { code?: string } | null }>;

/** Meaningful terms from the question, for the exclusion sweep. */
function questionTerms(question: string): string[] {
  return question
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 3);
}

export async function retrieveDiagnostics(
  question: string,
  locale: 'en' | 'bn',
  country: string,
): Promise<RetrievalDiagnostics> {
  if (!hasAiDatabase()) return { candidates: [], excluded: [], includedCount: 0 };

  const db = aiDb();
  const rpc = db.rpc.bind(db) as unknown as Rpc;

  const [keyword, semantic] = await Promise.all([
    rpc('ai_search_keyword', {
      query_text: keywordQuery(question),
      p_country: country,
      candidate_count: CANDIDATES,
    }),
    embedQuery(question).then((embedding) =>
      rpc('ai_search_semantic', {
        query_embedding: JSON.stringify(embedding),
        p_country: country,
        candidate_count: CANDIDATES,
      }),
    ),
  ]);

  const keywordList = keyword.data ?? [];
  const semanticList = semantic.data ?? [];
  if (keyword.error)
    logger.warn('ai.diagnostics.keyword_failed', { code: keyword.error.code ?? null });
  if (semantic.error)
    logger.warn('ai.diagnostics.semantic_failed', { code: semantic.error.code ?? null });

  // Reproduce the fusion arithmetic per chunk, but keep the parts visible.
  const byChunk = new Map<string, ChunkDiagnostic>();
  const fold = (list: RankedChunk[], leg: 'keyword' | 'semantic') => {
    list.forEach((chunk) => {
      const rank = chunk.rank;
      const entry = byChunk.get(chunk.chunk_id) ?? {
        chunkId: chunk.chunk_id,
        sourceSlug: null,
        title: chunk.title,
        locale: chunk.locale,
        authorityTier: chunk.authority_tier,
        keywordRank: null,
        semanticRank: null,
        rrfScore: 0,
        authorityBonus: chunk.authority_tier
          ? (7 - chunk.authority_tier) * AUTHORITY_BONUS_PER_TIER
          : 0,
        totalScore: 0,
        included: false,
      };
      if (leg === 'keyword') entry.keywordRank = rank;
      else entry.semanticRank = rank;
      entry.rrfScore += 1 / (RRF_K + rank);
      entry.totalScore = entry.rrfScore + entry.authorityBonus;
      byChunk.set(chunk.chunk_id, entry);
    });
  };
  fold(semanticList, 'semantic');
  fold(keywordList, 'keyword');

  const ranked = [...byChunk.values()].sort((a, b) => {
    const aLocale = a.locale === locale ? 1 : 0;
    const bLocale = b.locale === locale ? 1 : 0;
    if (aLocale !== bLocale) return bLocale - aLocale;
    return b.totalScore - a.totalScore;
  });
  ranked.forEach((entry, index) => {
    entry.included = index < LIMITS.retrievalCount;
  });

  // The exclusion sweep: sources the search can never return, that still look
  // relevant to the question by plain term overlap. This is what explains
  // "the answer exists but the assistant did not use it".
  const terms = questionTerms(question);
  const { data: sources } = await db
    .from('ai_knowledge_sources')
    .select('id, slug, title, body, status, access_scope, country, indexed_at')
    .limit(500);

  const excluded: ExcludedSource[] = [];
  for (const source of sources ?? []) {
    if (source.country !== country && source.country !== 'global') continue;
    const haystack = `${source.title}\n${source.body}`.toLowerCase();
    const relevant = terms.some((term) => haystack.includes(term));
    if (!relevant) continue;

    if (source.status !== 'published') {
      excluded.push({
        slug: source.slug,
        title: source.title,
        status: source.status,
        reason: 'not_published',
      });
    } else if (source.access_scope !== 'public') {
      excluded.push({
        slug: source.slug,
        title: source.title,
        status: source.status,
        reason: 'restricted',
      });
    } else if (!source.indexed_at) {
      excluded.push({
        slug: source.slug,
        title: source.title,
        status: source.status,
        reason: 'published_not_indexed',
      });
    }
  }

  return {
    candidates: ranked,
    excluded,
    includedCount: Math.min(ranked.length, LIMITS.retrievalCount),
  };
}
