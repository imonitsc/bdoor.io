import 'server-only';

import {
  ANSWER_PROVIDER_ORDER,
  DEFAULT_ANSWER_MODEL,
  DEFAULT_EXTRACTION_MODEL,
  embeddingModel,
} from './config';
import { detectTopics, type Topic } from './registry/taxonomy';
import { serverEnv } from '@/lib/env';

/**
 * The model role registry (BI-OS §6.1).
 *
 * One bdoor AI identity, several models behind it. Every generation runs under
 * a named role, and each role resolves to a fallback chain of AI Gateway
 * slugs: the first model that answers wins, and a failover is counted and
 * logged, never silent. Two roles from the instruction do not appear as
 * chains here, on purpose:
 *
 * - "router" is the existing deterministic classifier (greeting / scope /
 *   topic / risk detection). It is free, synchronous, and runs before the
 *   first byte of the response; a paid router model would put a network
 *   round-trip in front of the acknowledgement budget.
 * - "reranker" is the RRF fusion + authority ordering in fusion.ts.
 *
 * Cross-provider fallbacks ship EMPTY. Defaults stay the production-verified
 * slugs; anything beyond them is configured by an admin from the gateway's
 * runtime model listing (/admin/ai/models), so no model ID is hardcoded here
 * only to go stale (§6.1 "retrieve the current model identifiers at
 * runtime"). Configuration goes through serverEnv() — the validated layer —
 * never a bare process.env read.
 */

export type ModelRole = 'answer' | 'expert' | 'verifier' | 'extraction' | 'embedding';

export type RiskClass = 'standard' | 'high';

/**
 * Topics where a wrong answer costs the customer money or legal standing
 * (§6.2: legal, tax, VAT, customs, investment, FX, licensing). A question
 * touching any of these routes to the expert chain, and — once a verifier
 * chain is configured and evaluated — earns verification.
 */
const HIGH_RISK_TOPICS: ReadonlySet<Topic> = new Set([
  'tax_vat',
  'banking_fx_investment',
  'import_export_customs',
  'sector_licensing',
  'trade_licence_local',
] satisfies Topic[]);

export function riskClassFor(topics: readonly Topic[]): RiskClass {
  return topics.some((topic) => HIGH_RISK_TOPICS.has(topic)) ? 'high' : 'standard';
}

export function classifyRisk(question: string): RiskClass {
  return riskClassFor(detectTopics(question));
}

/** A comma-separated env value into a clean, de-duplicated slug list. */
export function parseChain(value: string | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  for (const item of value.split(',')) {
    const slug = item.trim();
    if (slug.length > 0) seen.add(slug);
  }
  return [...seen];
}

/**
 * The gateway providers allowed to serve one model. This is what keeps
 * "automatic fallback" from decaying into "whichever vendor was up": a slug
 * may be served only by its own vendor's routes, so a failover is always an
 * explicit hop to the next slug in the chain, recorded as such. Anthropic
 * models additionally allow Bedrock and Vertex, which serve the *same* model
 * under resale — the answer is identical, so those are availability, not
 * substitution.
 */
export function providerLockFor(model: string): string[] {
  const vendor = model.split('/')[0] ?? model;
  return vendor === 'anthropic' ? [...ANSWER_PROVIDER_ORDER] : [vendor];
}

export function modelChain(role: ModelRole): string[] {
  const env = serverEnv();
  switch (role) {
    case 'answer':
      // Primary, then at most one automatic failover — CLAUDE.md §4.1 allows
      // "maximum one automatic answer-model failover per request", which is
      // why this is a single secondary and not the open-ended chain it
      // replaces. `parseChain` still de-duplicates, so setting the secondary
      // to the primary is a no-op rather than a wasted retry against the same
      // model.
      return parseChain(
        [env.AI_PRIMARY_MODEL ?? DEFAULT_ANSWER_MODEL, env.AI_SECONDARY_MODEL]
          .filter(Boolean)
          .join(','),
      );
    // The expert chain answers high-risk questions. Unconfigured, it is the
    // answer chain — a high-risk question must never get a *weaker* route
    // than a standard one just because no expert model is set.
    case 'expert': {
      const chain = parseChain(env.AI_EXPERT_MODEL);
      return chain.length > 0
        ? parseChain([...chain, env.AI_SECONDARY_MODEL].filter(Boolean).join(','))
        : modelChain('answer');
    }
    // Empty by default: the verifier turns on by configuration once it has
    // been evaluated (§15 — no manufactured quality), never by code default.
    case 'verifier':
      return parseChain(env.AI_VERIFIER_MODEL);
    case 'extraction':
      return [env.AI_FAST_MODEL ?? DEFAULT_EXTRACTION_MODEL];
    // Never a chain. A different embedding model is a different vector space;
    // "failing over" would silently corrupt retrieval. Changing it is a
    // migration plus a full reindex — which is what
    // `assertEmbeddingModelMatchesCorpus` exists to catch.
    case 'embedding':
      return [embeddingModel()];
  }
}

export function verifierEnabled(): boolean {
  return modelChain('verifier').length > 0;
}

/** The chain and role that answer one question, given its risk class. */
export function answerRoute(risk: RiskClass): { role: ModelRole; chain: string[] } {
  return risk === 'high'
    ? { role: 'expert', chain: modelChain('expert') }
    : { role: 'answer', chain: modelChain('answer') };
}

/**
 * Whether the configured embedding model can read the stored corpus.
 *
 * `AI_EMBEDDING_MODEL` is configurable because CLAUDE.md §4.1 requires it, and
 * it is the one model variable where a wrong value fails *silently*: a query
 * embedded by a different model lands in a different vector space, so
 * retrieval returns confident nonsense rather than an error. Every chunk
 * records the model that produced it, so the mismatch is detectable — this is
 * the detection.
 *
 * Pure so it can be tested without a database; the caller supplies the models
 * actually present in `ai_knowledge_chunks.embedding_model`.
 */
export function embeddingCorpusMismatch(
  configured: string,
  corpusModels: readonly string[],
): { ok: true } | { ok: false; configured: string; corpus: string[] } {
  // An empty corpus cannot disagree: a fresh index will be written with
  // whatever is configured now, which is exactly the intended way to change it.
  const distinct = [...new Set(corpusModels.filter((m) => m.length > 0))];
  if (distinct.length === 0 || (distinct.length === 1 && distinct[0] === configured)) {
    return { ok: true };
  }
  return { ok: false, configured, corpus: distinct };
}
