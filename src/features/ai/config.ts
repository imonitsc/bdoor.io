import 'server-only';

import { serverEnv } from '@/lib/env';

/**
 * Ask bdoor AI: the settings that are policy rather than preference.
 *
 * Everything here is deliberately a constant rather than an environment
 * variable. A limit that can be raised by editing a dashboard field is a limit
 * that gets raised at 2am during an incident; these are reviewed in a pull
 * request instead. The two exceptions are the spend caps, which finance owns,
 * and the feature switch.
 */

/**
 * The primary answer model: the slug verified in production. `AI_ANSWER_MODEL`
 * exists so a model *upgrade* is a configuration change with a rollback, not a
 * deploy; it goes through `serverEnv()` (the validated layer), never a bare
 * process.env read. Fallback beyond this model is a configured chain in
 * models.ts (BI-OS §6.1, 31 Aug 2026, superseding the earlier Claude-only
 * rule — see docs/BIOS-BASELINE.md): explicit, counted, per-slug
 * provider-locked, never silent.
 */
export const DEFAULT_ANSWER_MODEL = 'anthropic/claude-sonnet-5';

export function answerModel(): string {
  return serverEnv().AI_ANSWER_MODEL ?? DEFAULT_ANSWER_MODEL;
}

/**
 * Classification and document extraction. Never customer-facing: its output
 * is a draft a reviewer sees, so a lower-cost model is acceptable here once
 * it passes evaluation. Until a cheaper slug has been evaluated against the
 * extraction test set, the default stays the verified answer model —
 * `AI_EXTRACTION_MODEL` is how a cheaper model is adopted after it earns it.
 */
export const DEFAULT_EXTRACTION_MODEL = 'anthropic/claude-sonnet-5';

export function extractionModel(): string {
  return serverEnv().AI_EXTRACTION_MODEL ?? DEFAULT_EXTRACTION_MODEL;
}

/**
 * Retrieval only. The embedding model never writes a word the customer reads;
 * it decides which approved paragraphs Claude is allowed to see.
 */
export const EMBEDDING_MODEL = 'google/gemini-embedding-001';

/**
 * 768 for both documents and queries. gemini-embedding-001 is a Matryoshka
 * model, so a 768-dimension vector is a supported truncation of its native
 * output rather than a different embedding space — but documents and queries
 * must still be produced identically, which is why one constant serves both.
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Failover *within one Anthropic model*. AI Gateway may serve a claude slug
 * from Anthropic directly or through Bedrock/Vertex; any of those is the same
 * model and the same answer. Passed as the gateway `only` lock for anthropic/
 * slugs (models.ts `providerLockFor`), so the gateway can never satisfy the
 * request with someone else's model — moving to a different model is an
 * explicit hop to the next slug in the configured chain, never the gateway's
 * own idea.
 */
export const ANSWER_PROVIDER_ORDER = ['anthropic', 'bedrock', 'vertex'] as const;

export const LIMITS = {
  /** One question. Long enough for a detailed scenario, short enough to bound cost. */
  maxMessageChars: 2_000,
  /** Turns of history replayed to the model, newest last. */
  maxHistoryMessages: 12,
  maxOutputTokens: 1_200,
  /** Chunks retrieved per question before the model sees anything. */
  retrievalCount: 8,
  /** Wall-clock ceiling for one answer, including retries. */
  requestTimeoutMs: 45_000,
  embeddingTimeoutMs: 10_000,
  maxRetries: 2,
  /** Anonymous callers, per IP. */
  perIpPerMinute: 8,
  perIpPerDay: 120,
  /** Per conversation, so one session cannot monopolise the per-IP budget. */
  perConversationPerHour: 40,
  /** Conversations are deleted this long after their last message. */
  retentionDays: 90,
} as const;

/**
 * Usage tags. `bdoor-ai` identifies the feature in spend reports; the rest
 * split it. Role and risk (§6.2 "tag calls by role and risk") are optional so
 * the greeting fast path, which never reaches a model, stays untagged.
 */
export function usageTags(
  country: string,
  locale: string,
  routing?: { role: string; risk: string },
): string[] {
  const tags = ['bdoor-ai', `country:${country}`, `lang:${locale}`];
  if (routing) tags.push(`role:${routing.role}`, `risk:${routing.risk}`);
  return tags;
}

/** Countries the assistant will answer for, Bangladesh first. */
export const SUPPORTED_COUNTRIES = ['bd', 'us', 'gb', 'ae', 'sg', 'sa', 'qa'] as const;
export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export function isSupportedCountry(value: string): value is SupportedCountry {
  return (SUPPORTED_COUNTRIES as readonly string[]).includes(value);
}

/**
 * Country mentioned in the question, when it differs from the one the page is
 * set to.
 *
 * The widget knows which country page it is on; the customer does not
 * necessarily care. "Can I open a Wyoming LLC from Dhaka?" asked on the
 * Bangladesh homepage is a US question, and retrieving only Bangladesh
 * content answers it with "I cannot confirm that" — technically safe and
 * completely unhelpful. Detecting the country lets retrieval look in both
 * places; the model still says which country each fact belongs to.
 */
const COUNTRY_MENTIONS: Array<[SupportedCountry, RegExp]> = [
  [
    'us',
    /\b(usa|u\.s\.|united states|america|delaware|wyoming|florida|llc|c-?corp|ein|irs)\b|যুক্তরাষ্ট্র/i,
  ],
  [
    'gb',
    /\b(uk|united kingdom|britain|england|companies house|ltd company in the uk)\b|যুক্তরাজ্য/i,
  ],
  ['ae', /\b(uae|dubai|abu dhabi|emirates|freezone|free zone|difc)\b|আমিরাত|দুবাই/i],
  ['sg', /\b(singapore|acra)\b|সিঙ্গাপুর/i],
  ['sa', /\b(saudi|ksa|riyadh|misa)\b|সৌদি/i],
  ['qa', /\b(qatar|doha)\b|কাতার/i],
  ['bd', /\b(bangladesh|dhaka|chattogram|rjsc|nbr|bida)\b|বাংলাদেশ|ঢাকা/i],
];

export function detectCountry(question: string): SupportedCountry | null {
  for (const [code, pattern] of COUNTRY_MENTIONS) {
    if (pattern.test(question)) return code;
  }
  return null;
}
