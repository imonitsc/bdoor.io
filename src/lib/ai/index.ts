import 'server-only';

import { serverEnv } from '@/lib/env';
import { redact } from '@/lib/audit/redact';
import { logger } from '@/lib/logger';

/**
 * AI adapter.
 *
 * Hard rules enforced here, not left to the caller:
 *   * The product works with AI_PROVIDER=disabled. Every recommendation and
 *     checklist comes from the deterministic rules engine.
 *   * Nothing but admin-approved catalog content and the user's own answers may
 *     be sent. Document bytes, identity numbers and payment data never leave.
 *   * Every request is redacted before it goes anywhere.
 *   * We log the model, prompt-template version, sources and outcome — never
 *     the raw content.
 *   * The adapter cannot make a KYC, sanctions, legal or payment decision. It
 *     has no code path that writes to any of those tables.
 */

export type GuideSource = {
  kind: 'service' | 'faq' | 'resource' | 'policy';
  slug: string;
  title: string;
  lastReviewedAt: string | null;
};

export type GuideRequest = {
  question: string;
  locale: 'en' | 'bn';
  /** Admin-approved content the answer may draw on. Nothing else is sent. */
  sources: GuideSource[];
  /** The user's questionnaire answers, already stripped of identifiers. */
  answersSummary?: Record<string, string | number | boolean>;
  promptTemplateVersion: string;
};

export type GuideResponse = {
  available: boolean;
  /** Always true for anything this returns: it is guidance, not advice. */
  preliminary: true;
  answer: string;
  sources: GuideSource[];
  model: string | null;
  escalateToPartner: boolean;
};

export interface AiProvider {
  readonly name: string;
  readonly enabled: boolean;
  ask(request: GuideRequest): Promise<GuideResponse>;
}

/** Phrases that always route to a human rather than an answer. */
const ESCALATION_PATTERNS = [
  /\bis it legal\b/i,
  /\bcan i (legally|lawfully)\b/i,
  /\bwill (it|this) be approved\b/i,
  /\bguarantee\b/i,
  /\btax (advice|planning|avoid)/i,
  /\bvisa\b.*\bguarant/i,
  /\bnominee\b/i,
];

export function shouldEscalate(question: string): boolean {
  return ESCALATION_PATTERNS.some((pattern) => pattern.test(question));
}

class DisabledAiProvider implements AiProvider {
  readonly name = 'disabled';
  readonly enabled = false;

  async ask(request: GuideRequest): Promise<GuideResponse> {
    return {
      available: false,
      preliminary: true,
      answer: '',
      sources: request.sources,
      model: null,
      escalateToPartner: shouldEscalate(request.question),
    };
  }
}

export function getAiProvider(): AiProvider {
  const configured = serverEnv().AI_PROVIDER;
  if (configured === 'disabled') return new DisabledAiProvider();

  throw new Error(
    'AI_PROVIDER is enabled but no adapter is implemented. Implement the AiProvider interface ' +
      'in src/lib/ai/ and register it here. It must keep the guardrails documented in this file: ' +
      'approved sources only, redaction before send, no automatic decisions.',
  );
}

export function aiIsEnabled(): boolean {
  return serverEnv().AI_PROVIDER !== 'disabled';
}

/**
 * The only sanctioned way to prepare a payload for a model. Applies redaction
 * and drops anything not on the allow-list of fields.
 */
export function prepareForModel(request: GuideRequest): Record<string, unknown> {
  return {
    question: redact(request.question),
    locale: request.locale,
    promptTemplateVersion: request.promptTemplateVersion,
    sources: request.sources.map((s) => ({
      kind: s.kind,
      slug: s.slug,
      title: s.title,
      lastReviewedAt: s.lastReviewedAt,
    })),
    answersSummary: request.answersSummary ? redact(request.answersSummary) : undefined,
  };
}

export function logAiInteraction(params: {
  model: string | null;
  promptTemplateVersion: string;
  sourceSlugs: string[];
  outcome: 'answered' | 'escalated' | 'unavailable';
  correlationId: string;
}): void {
  logger.info('ai.interaction', params);
}
