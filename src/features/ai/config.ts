import 'server-only';

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
 * The answer model. Claude, always — the brief is explicit that there is no
 * silent fallback to a different answer model, so this constant is referenced
 * everywhere and never chosen at runtime.
 */
export const ANSWER_MODEL = 'anthropic/claude-sonnet-5';

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
 * Failover *within Claude*. AI Gateway may serve claude-sonnet-5 from
 * Anthropic directly or through Bedrock/Vertex; any of those is the same model
 * and the same answer. `only` is the guard that matters: it makes it
 * impossible for the gateway to satisfy the request with someone else's model
 * if every Claude route is down. A gateway outage must surface as an outage.
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

/** Usage tags. `bdoor-ai` identifies the feature in spend reports; the rest split it. */
export function usageTags(country: string, locale: string): string[] {
  return ['bdoor-ai', `country:${country}`, `lang:${locale}`];
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
