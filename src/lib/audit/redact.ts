/**
 * Redaction used by the audit service, the logger and the AI adapter.
 *
 * The rule is deny-by-shape, not deny-by-list: anything whose *key* looks
 * sensitive is dropped, and anything whose *value* looks like a secret or an
 * identity number is masked, wherever it appears in the object graph.
 */

/**
 * Metric keys that survive the deny rule below.
 *
 * `SENSITIVE_KEY` matches the bare substring `token`, which is right for
 * `access_token` and `apiToken` and wrong for the three latency and usage
 * measurements that happen to contain the same six letters. Production logs
 * showed `first_token`, `inputTokens` and `outputTokens` as `[redacted]` —
 * §7.3's headline first-token gate, unreadable in the logs that are supposed
 * to evidence it. (`ai_usage` stored all three correctly throughout, so this
 * cost observability, not data.)
 *
 * An explicit list rather than a cleverer pattern. `authToken` and
 * `inputTokens` are the same shape, so no boundary rule separates them, and a
 * rule that tried would be one subtle regex away from letting a credential
 * through. Nor may this key off the value being a number: `redact` passes
 * numbers through untouched, so a numeric NID or account number is caught by
 * the key rule alone, and blanket-allowing numbers would leak exactly the
 * identifiers this module exists to stop. Anything not named here still
 * redacts by default.
 */
const SAFE_METRIC_KEY: ReadonlySet<string> = new Set([
  'first_token',
  'firstToken',
  'first_token_ms',
  'firstTokenMs',
  'inputTokens',
  'input_tokens',
  'outputTokens',
  'output_tokens',
  'totalTokens',
  'total_tokens',
  'promptTokens',
  'completionTokens',
]);

const SENSITIVE_KEY = new RegExp(
  [
    'password',
    'passwd',
    'secret',
    'token',
    'api[-_]?key',
    'authorization',
    'cookie',
    'session',
    'jwt',
    'nid',
    'national[-_]?id',
    'passport',
    'signature',
    'card[-_]?number',
    'cvv',
    'iban',
    'account[-_]?number',
    'routing',
    'tax[-_]?id',
    'etin',
    'dob',
    'date[-_]?of[-_]?birth',
    'ssn',
  ].join('|'),
  'i',
);

/** Long unbroken alphanumeric runs — bearer tokens, keys, document numbers. */
const SECRET_LIKE = /\b[A-Za-z0-9_-]{28,}\b/g;
const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
const LONG_DIGITS = /\b\d{7,}\b/g;

export const REDACTED = '[redacted]';

export function maskString(value: string): string {
  return value
    .replace(SECRET_LIKE, REDACTED)
    .replace(EMAIL, (m) => {
      const at = m.indexOf('@');
      const local = m.slice(0, at);
      const head = local.slice(0, 1);
      return `${head}${'*'.repeat(Math.max(1, local.length - 1))}${m.slice(at)}`;
    })
    .replace(LONG_DIGITS, (m) => `${'*'.repeat(m.length - 4)}${m.slice(-4)}`);
}

/** Keep only the last four characters of an identifier for display. */
export function lastFour(value: string): string {
  const trimmed = value.replace(/\s+/g, '');
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4);
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return REDACTED;
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') return maskString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((v) => redact(v, depth + 1));
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const sensitive = SENSITIVE_KEY.test(key) && !SAFE_METRIC_KEY.has(key);
      out[key] = sensitive ? REDACTED : redact(val, depth + 1);
    }
    return out;
  }

  return REDACTED;
}

export function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return redact(metadata) as Record<string, unknown>;
}
