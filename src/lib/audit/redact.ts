/**
 * Redaction used by the audit service, the logger and the AI adapter.
 *
 * The rule is deny-by-shape, not deny-by-list: anything whose *key* looks
 * sensitive is dropped, and anything whose *value* looks like a secret or an
 * identity number is masked, wherever it appears in the object graph.
 */

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
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(val, depth + 1);
    }
    return out;
  }

  return REDACTED;
}

export function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return redact(metadata) as Record<string, unknown>;
}
