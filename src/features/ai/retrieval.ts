import 'server-only';

import { answerLimits, detectCountry } from './config';
import { aiDb, hasAiDatabase } from './db';
import { embedQuery } from './embeddings';
import { fuseRankedLists, type FusedChunk, type RankedChunk } from './fusion';
import {
  renderRules,
  ruleReviewDate,
  rulesForQuestion,
  type StructuredRule,
} from './registry/rules';
import { AUTHORITY_TIER_NAMES, type AuthorityTier } from './registry/taxonomy';
import { STRUCTURED_SOURCE, structuredRecordsFor } from './structured';
import type { Timings } from './timings';
import { logger } from '@/lib/logger';

/**
 * Retrieval.
 *
 * Two things reach the model: approved knowledge chunks, and live structured
 * records. Nothing else. This module is the only place that assembles them,
 * which is what makes "the assistant cannot see a customer's case" a property
 * of the code rather than a promise in a prompt — there is no code path from
 * here to any customer table.
 *
 * Latency shape (the reason this file was rewritten): keyword search needs
 * only the question text, so it fires immediately; the embedding call and the
 * vector search run beside it, not after it; structured rules run beside both.
 * Fusion happens here with the same arithmetic the old SQL used
 * (`fusion.ts`), so the parallelism changes when work happens, not what is
 * retrieved.
 */

export type Citation = {
  /** The bracketed number the model is told to cite. 1-based. */
  index: number;
  sourceId: string | null;
  title: string;
  url: string | null;
  /** ISO date. What "last reviewed" means to the customer: when a person checked it. */
  lastReviewed: string | null;
  /** Who issued the document, for official sources. Null for bdoor content. */
  institution: string | null;
  /** Act / SRO / circular / form number, verbatim, when the source carries one. */
  referenceNumber: string | null;
  /** Section/clause/schedule and page, when the cited chunk is that precise. */
  sectionRef: string | null;
  page: number | null;
  /** ISO date the source took effect — the "applicable date" of the answer. */
  effectiveFrom: string | null;
  /** Set when the citation is a published structured rule, not a document. */
  ruleId: string | null;
};

/** The Comply exit an answer can offer (ROADMAP P2): the cited rule whose
 *  analyst-set recurrence says the obligation comes back. */
export type ComplyTrack = { ruleId: string; title: string };

export type RetrievalResult = {
  /** Numbered context, ready to paste into the system prompt. */
  context: string;
  /** Live prices, fees and published rules, rendered. Empty when nothing applies. */
  structured: string;
  citations: Citation[];
  /** Distinct knowledge sources used, for `ai_messages.source_ids`. */
  sourceIds: string[];
  /** Published rules used, for `ai_messages.rule_ids`. */
  ruleIds: string[];
  complyTrack: ComplyTrack | null;
  /** True when nothing matched — the caller logs an unanswered question. */
  empty: boolean;
  /**
   * Whether a search actually ran.
   *
   * `empty` alone cannot carry the refusal decision, because it is true for
   * two unrelated reasons: the corpus was searched and had nothing, or there
   * is no knowledge database configured to search. The first is a coverage
   * gap the customer should be told about honestly; the second is an
   * infrastructure fault, and answering it with "I have no approved source
   * for this" would blame the question for an outage.
   */
  searched: boolean;
};

/**
 * Citations for the rules block, numbered after the document citations.
 * A rule cites its legal instrument rather than a URL, and its review date is
 * the reviewer's sign-off — the per-rule date ROADMAP P2 requires deadline
 * answers to carry. Recurrence is an analyst-entered fact (P1); a rule
 * without it never claims to recur, so the Comply exit is offered only on
 * the first rule whose recurrence is set.
 */
export function ruleCitations(
  rules: StructuredRule[],
  offset: number,
): { citations: Citation[]; complyTrack: ComplyTrack | null } {
  const citations = rules.map((rule, i): Citation => ({
    index: offset + i + 1,
    sourceId: null,
    title: rule.title,
    url: null,
    lastReviewed: ruleReviewDate(rule),
    institution: rule.responsible_authority,
    referenceNumber: rule.legal_authority,
    sectionRef: null,
    page: null,
    effectiveFrom: rule.effective_from,
    ruleId: rule.id,
  }));
  const recurring = rules.find((rule) => rule.recurrence !== null);
  return {
    citations,
    complyTrack: recurring ? { ruleId: recurring.id, title: recurring.title } : null,
  };
}

function reviewDate(chunk: FusedChunk): string | null {
  const reviewed = chunk.last_reviewed_at ?? chunk.effective_from;
  return reviewed ? reviewed.slice(0, 10) : null;
}

/**
 * Turn chunks into a numbered block. Every entry carries its title, authority
 * and review date inline, because the model is required to attribute a factual
 * answer and cannot attribute what it was not shown.
 */
function renderContext(chunks: FusedChunk[], offset: number): string {
  return chunks
    .map((chunk, i) => {
      const header = [
        `[${offset + i + 1}] ${chunk.title}`,
        `type: ${chunk.source_type}`,
        `country: ${chunk.country}`,
        chunk.authority_tier
          ? `authority: ${AUTHORITY_TIER_NAMES[chunk.authority_tier as AuthorityTier] ?? `tier ${chunk.authority_tier}`}`
          : 'authority: bdoor content',
        chunk.issuing_institution ? `issued by: ${chunk.issuing_institution}` : null,
        chunk.reference_number ? `reference: ${chunk.reference_number}` : null,
        chunk.section_ref ? `provision: ${chunk.section_ref}` : null,
        `effective from: ${chunk.effective_from?.slice(0, 10) ?? 'not recorded'}`,
        `last reviewed: ${reviewDate(chunk) ?? 'not recorded'}`,
      ]
        .filter(Boolean)
        .join(' | ');
      return `${header}\n${chunk.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Cache for identical PUBLIC first-turn questions — the suggestion buttons
 * are the hot path, and the corpus they retrieve from is the same for every
 * visitor. Keyed only on question text, locale and country; nothing about the
 * caller is in the key or the value, and conversations are never cached
 * (the caller passes `cacheable: false` on any turn with history).
 */
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX = 300;
const cache = new Map<string, { expiresAt: number; result: RetrievalResult }>();

function cacheGet(key: string): RetrievalResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.result;
}

function cacheSet(key: string, result: RetrievalResult): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
}

type Rpc = (
  fn: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: RankedChunk[] | null; error: { code?: string } | null }>;

/**
 * Candidate pool per list, matching the old hybrid function's inner limits.
 * Read per call, not once at import: `answerLimits()` is the configured value
 * and a module constant would freeze whatever it happened to be first.
 */
function candidatePool(): number {
  return Math.max(answerLimits().retrievalCount * 4, 40);
}

/**
 * Question words and connectives that carry no retrieval signal, English and
 * Bangla. Not a linguistic stopword list — only the words that made real
 * questions fail.
 */
const QUERY_NOISE = new Set([
  // English
  'a',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'get',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'me',
  'my',
  'need',
  'of',
  'on',
  'or',
  'should',
  'the',
  'to',
  'want',
  'we',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'you',
  'your',
  // Bangla
  'কি',
  'কী',
  'কীভাবে',
  'কিভাবে',
  'কোথায়',
  'কখন',
  'কেন',
  'কত',
  'করব',
  'করবো',
  'করতে',
  'করার',
  'করা',
  'হবে',
  'হয়',
  'চাই',
  'আমি',
  'আমার',
  'আমরা',
  'এবং',
  'বা',
]);

/**
 * The chunk index uses the 'simple' text-search configuration (no stemming,
 * no stopwords — the price of indexing Bangla and English in one column), and
 * `websearch_to_tsquery` ANDs every word. A natural question — "How do I
 * register a company in Bangladesh?" — therefore matches nothing unless a
 * chunk contains "how", "do" and "i" literally. This rewrite keeps the words
 * that carry signal and ORs them, so ts_rank surfaces the chunks matching the
 * most meaningful terms instead of demanding all the meaningless ones.
 */
export function keywordQuery(question: string): string {
  const terms = [
    ...new Set(
      question
        .toLowerCase()
        // \p{M} keeps Bangla words whole: vowel signs and hasanta are
        // combining marks, and splitting on them shatters নিবন্ধন into noise.
        .split(/[^\p{L}\p{M}\p{N}]+/u)
        .filter((term) => term.length > 1 && !QUERY_NOISE.has(term)),
    ),
  ];
  // A query of nothing but noise words falls back to the raw question.
  return terms.length ? terms.join(' OR ') : question;
}

/**
 * supabase-js's `rpc` reads `this.rest` internally, so it must stay bound to
 * its client — extracting the bare method throws on the first call.
 */
function boundRpc(): Rpc {
  const db = aiDb();
  return db.rpc.bind(db) as unknown as Rpc;
}

async function keywordCandidates(question: string, countries: string[]): Promise<RankedChunk[][]> {
  const rpc = boundRpc();
  const results = await Promise.all(
    countries.map((code) =>
      rpc('ai_search_keyword', {
        query_text: keywordQuery(question),
        p_country: code,
        candidate_count: candidatePool(),
      }),
    ),
  );
  return results.map(({ data, error }) => {
    if (error) logger.warn('ai.retrieval.keyword_failed', { code: error.code ?? null });
    return data ?? [];
  });
}

async function semanticCandidates(
  question: string,
  countries: string[],
  timings?: Timings,
): Promise<RankedChunk[][]> {
  const embedding = await embedQuery(question);
  timings?.mark('embedding');
  const rpc = boundRpc();
  const results = await Promise.all(
    countries.map((code) =>
      rpc('ai_search_semantic', {
        query_embedding: JSON.stringify(embedding),
        p_country: code,
        candidate_count: candidatePool(),
      }),
    ),
  );
  return results.map(({ data, error }) => {
    if (error) logger.warn('ai.retrieval.semantic_failed', { code: error.code ?? null });
    return data ?? [];
  });
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
  options?: { timings?: Timings; cacheable?: boolean },
): Promise<RetrievalResult> {
  const timings = options?.timings;
  const cacheKey = `${locale}|${country}|${question.trim().toLowerCase()}`;

  if (options?.cacheable) {
    const cached = cacheGet(cacheKey);
    if (cached) {
      timings?.mark('fused');
      return cached;
    }
  }

  const catalogue = structuredRecordsFor(country);

  // The catalogue is source [1] whenever it has content, so a quoted price is
  // always attributable to the page a customer can check it on.
  const citations: Citation[] = [];
  if (catalogue) {
    citations.push({
      index: 1,
      sourceId: null,
      title: STRUCTURED_SOURCE.title,
      url: STRUCTURED_SOURCE.url,
      lastReviewed: STRUCTURED_SOURCE.lastReviewed,
      institution: null,
      referenceNumber: null,
      sectionRef: null,
      page: null,
      effectiveFrom: null,
      ruleId: null,
    });
  }
  const offset = citations.length;

  if (!hasAiDatabase()) {
    return {
      context: '',
      structured: catalogue,
      citations,
      sourceIds: [],
      ruleIds: [],
      complyTrack: null,
      empty: true,
      // Nothing was searched: there is no database to search.
      searched: false,
    };
  }

  // The page's country, plus any other country the question names. Both are
  // searched; the context block labels each result with its country, so the
  // model can say which answer belongs where rather than blending them.
  const mentioned = detectCountry(question);
  const countries = mentioned && mentioned !== country ? [country, mentioned] : [country];

  const { retrievalCount } = answerLimits();
  let chunks: FusedChunk[] = [];
  let rules: StructuredRule[] = [];
  try {
    // The three legs run beside each other. Keyword needs no embedding and
    // fires first; semantic starts the moment the embedding lands; published
    // structured rules are an independent read.
    const [keywordLists, semanticLists, ruleRows] = await Promise.all([
      keywordCandidates(question, countries).then((lists) => {
        timings?.mark('keyword');
        return lists;
      }),
      semanticCandidates(question, countries, timings).then((lists) => {
        timings?.mark('vector');
        return lists;
      }),
      country === 'bd' ? rulesForQuestion(question).catch(() => []) : Promise.resolve([]),
    ]);

    rules = ruleRows;

    // Fuse per country (ranks are per-list), then merge across countries the
    // way the old per-country hybrid calls merged: dedupe on chunk id keeping
    // the better score, one sort, one cut.
    const merged = new Map<string, FusedChunk>();
    countries.forEach((_, index) => {
      const fused = fuseRankedLists(semanticLists[index] ?? [], keywordLists[index] ?? [], {
        count: retrievalCount,
        locale,
      });
      for (const chunk of fused) {
        const existing = merged.get(chunk.chunk_id);
        if (!existing || chunk.score > existing.score) merged.set(chunk.chunk_id, chunk);
      }
    });
    const selected = [...merged.values()]
      .sort((a, b) => {
        const aLocale = a.locale === locale ? 1 : 0;
        const bLocale = b.locale === locale ? 1 : 0;
        if (aLocale !== bLocale) return bLocale - aLocale;
        return b.score - a.score;
      })
      .slice(0, retrievalCount);

    // Selection is by relevance; PRESENTATION puts official government sources
    // above bdoor's own content. The model reads the context top-down and the
    // customer reads the citation list top-down — for a regulatory question
    // the authority the answer rests on has to come before the sales page.
    chunks = selected.sort((a, b) => {
      const aTier = a.authority_tier ?? Number.MAX_SAFE_INTEGER;
      const bTier = b.authority_tier ?? Number.MAX_SAFE_INTEGER;
      if (aTier !== bTier) return aTier - bTier;
      return b.score - a.score;
    });
    timings?.mark('fused');
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
      institution: chunk.issuing_institution,
      referenceNumber: chunk.reference_number,
      sectionRef: chunk.section_ref,
      page: chunk.page_start,
      effectiveFrom: chunk.effective_from?.slice(0, 10) ?? null,
      ruleId: null,
    });
  }

  // Rules are numbered after the documents, in prompt and citation list
  // alike, so a deadline the model states carries the rule's own review date
  // rather than borrowing a page's (ROADMAP P2).
  const ruleOffset = citations.length;
  const { citations: ruleCites, complyTrack } = ruleCitations(rules, ruleOffset);
  citations.push(...ruleCites);
  const rulesBlock = rules.length
    ? `VERIFIED REGULATORY RULES (published after human review; each names its legal basis):\n${renderRules(rules, ruleOffset)}`
    : '';

  const result: RetrievalResult = {
    context: renderContext(chunks, offset),
    structured: [catalogue, rulesBlock].filter(Boolean).join('\n\n'),
    citations,
    sourceIds: [...new Set(chunks.map((chunk) => chunk.source_id))],
    ruleIds: rules.map((rule) => rule.id),
    complyTrack,
    // "Empty" means no retrieved knowledge. The catalogue alone is not enough
    // to answer a regulatory question, so the gap is still worth recording —
    // but a published rule is retrieved knowledge, not a gap.
    empty: chunks.length === 0 && rules.length === 0,
    searched: true,
  };

  if (options?.cacheable && !result.empty) cacheSet(cacheKey, result);
  return result;
}
