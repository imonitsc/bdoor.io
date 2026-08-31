import 'server-only';

import {
  ANSWER_PROVIDER_ORDER,
  DEFAULT_ANSWER_MODEL,
  DEFAULT_EXTRACTION_MODEL,
  EMBEDDING_MODEL,
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
      return [
        env.AI_ANSWER_MODEL ?? DEFAULT_ANSWER_MODEL,
        ...parseChain(env.AI_ANSWER_FALLBACK_MODELS),
      ];
    // The expert chain answers high-risk questions. Unconfigured, it is the
    // answer chain — a high-risk question must never get a *weaker* route
    // than a standard one just because no expert model is set.
    case 'expert': {
      const chain = parseChain(env.AI_EXPERT_MODEL);
      return chain.length > 0
        ? [...chain, ...parseChain(env.AI_ANSWER_FALLBACK_MODELS)]
        : modelChain('answer');
    }
    // Empty by default: the verifier turns on by configuration once it has
    // been evaluated (§15 — no manufactured quality), never by code default.
    case 'verifier':
      return parseChain(env.AI_VERIFIER_MODEL);
    case 'extraction':
      return [env.AI_EXTRACTION_MODEL ?? DEFAULT_EXTRACTION_MODEL];
    // Never a chain. A different embedding model is a different vector space;
    // "failing over" would silently corrupt retrieval. Changing it is a
    // migration plus a full reindex.
    case 'embedding':
      return [EMBEDDING_MODEL];
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
