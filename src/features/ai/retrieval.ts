import 'server-only';

import { detectCountry, LIMITS } from './config';
import { aiDb, hasAiDatabase, type RetrievedChunk } from './db';
import { embedQuery } from './embeddings';
import { STRUCTURED_SOURCE, structuredRecordsFor } from './structured';
import { logger } from '@/lib/logger';

/**
 * Retrieval.
 *
 * Two things reach the model: approved knowledge chunks, and live structured
 * records. Nothing else. This module is the only place that assembles them,
 * which is what makes "the assistant cannot see a customer's case" a property
 * of the code rather than a promise in a prompt — there is no code path from
 * here to any customer table.
 */

export type Citation = {
  /** The bracketed number the model is told to cite. 1-based. */
  index: number;
  sourceId: string | null;
  title: string;
  url: string | null;
  /** ISO date. What "last reviewed" means to the customer: when a person checked it. */
  lastReviewed: string | null;
};

export type RetrievalResult = {
  /** Numbered context, ready to paste into the system prompt. */
  context: string;
  /** Live prices and fees, rendered. Empty when the catalogue has nothing to say. */
  structured: string;
  citations: Citation[];
  /** Distinct knowledge sources used, for `ai_messages.source_ids`. */
  sourceIds: string[];
  /** True when nothing matched — the caller logs an unanswered question. */
  empty: boolean;
};

function reviewDate(chunk: RetrievedChunk): string | null {
  const reviewed = chunk.last_reviewed_at ?? chunk.effective_from;
  return reviewed ? reviewed.slice(0, 10) : null;
}

/**
 * Turn chunks into a numbered block. Every entry carries its title and review
 * date inline, because the model is required to attribute a factual answer and
 * cannot attribute what it was not shown.
 */
function renderContext(chunks: RetrievedChunk[], offset: number): string {
  return chunks
    .map((chunk, i) => {
      const header = [
        `[${offset + i + 1}] ${chunk.title}`,
        `type: ${chunk.source_type}`,
        `country: ${chunk.country}`,
        `last reviewed: ${reviewDate(chunk) ?? 'not recorded'}`,
      ].join(' | ');
      return `${header}\n${chunk.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Retrieve for one question.
 *
 * Failure here is not fatal: a database or embedding outage degrades the
 * answer to "I cannot confirm that, here is a specialist", which is the
 * correct behaviour, rather than taking the whole endpoint down. What it must
 * never do is quietly answer from the model's own memory — that is why an
 * empty result is reported as empty and the prompt says so explicitly.
 */
export async function retrieveContext(
  question: string,
  locale: 'en' | 'bn',
  country: string,
): Promise<RetrievalResult> {
  const structured = structuredRecordsFor(country);

  // The catalogue is source [1] whenever it has content, so a quoted price is
  // always attributable to the page a customer can check it on.
  const citations: Citation[] = [];
  if (structured) {
    citations.push({
      index: 1,
      sourceId: null,
      title: STRUCTURED_SOURCE.title,
      url: STRUCTURED_SOURCE.url,
      lastReviewed: STRUCTURED_SOURCE.lastReviewed,
    });
  }

  const offset = citations.length;

  if (!hasAiDatabase()) {
    return { context: '', structured, citations, sourceIds: [], empty: true };
  }

  // The page's country, plus any other country the question names. Both are
  // searched; the context block labels each result with the country it came
  // from, so the model can say which answer belongs where rather than blending
  // them.
  const mentioned = detectCountry(question);
  const countries = mentioned && mentioned !== country ? [country, mentioned] : [country];

  let chunks: RetrievedChunk[] = [];
  try {
    const embedding = await embedQuery(question);

    // `src/types/database.ts` is generated with `Functions: Record<string,
    // never>`, so RPC signatures are not inferred and this one call needs a
    // cast. `RetrievedChunk` mirrors the function's `returns table (...)`
    // clause; the integration test in tests/integration/ai-knowledge-rls.test.ts
    // is what actually holds the two in step, by calling the real function.
    const rpc = aiDb().rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ data: RetrievedChunk[] | null; error: { code?: string } | null }>;

    const results = await Promise.all(
      countries.map((code) =>
        rpc('ai_search_knowledge', {
          // pgvector accepts its text form, which a JSON array serialises to.
          query_embedding: JSON.stringify(embedding),
          query_text: question,
          p_locale: locale,
          p_country: code,
          match_count: LIMITS.retrievalCount,
        }),
      ),
    );

    const seen = new Set<string>();
    for (const { data, error } of results) {
      if (error) {
        logger.warn('ai.retrieval.failed', { code: error.code ?? null });
        continue;
      }
      for (const chunk of data ?? []) {
        // 'global' sources match every country, so the two searches overlap.
        if (seen.has(chunk.chunk_id)) continue;
        seen.add(chunk.chunk_id);
        chunks.push(chunk);
      }
    }

    // Scores are comparable across the two calls — same query vector, same
    // fusion constant — so one sort gives the combined ranking.
    chunks.sort((a, b) => b.score - a.score);
    chunks = chunks.slice(0, LIMITS.retrievalCount);
  } catch (error) {
    // The question itself is never logged — only that retrieval failed.
    logger.warn('ai.retrieval.error', { message: (error as Error).message });
  }

  for (const [i, chunk] of chunks.entries()) {
    citations.push({
      index: offset + i + 1,
      sourceId: chunk.source_id,
      title: chunk.title,
      url: chunk.source_url,
      lastReviewed: reviewDate(chunk),
    });
  }

  const sourceIds = [...new Set(chunks.map((chunk) => chunk.source_id))];

  return {
    context: renderContext(chunks, offset),
    structured,
    citations,
    sourceIds,
    // "Empty" means no retrieved knowledge. The catalogue alone is not enough
    // to answer a regulatory question, so the gap is still worth recording.
    empty: chunks.length === 0,
  };
}
