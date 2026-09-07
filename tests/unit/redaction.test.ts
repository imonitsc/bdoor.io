import { describe, expect, it } from 'vitest';
import { REDACTED, lastFour, maskString, redact, redactMetadata } from '@/lib/audit/redact';

describe('key-based redaction', () => {
  it('drops values whose key looks sensitive, whatever the value is', () => {
    const out = redactMetadata({
      password: 'hunter2',
      apiKey: 'k',
      Authorization: 'Bearer abc',
      passport_number: 'A1234567',
      nid: '1990123456789',
      dateOfBirth: '1990-01-01',
      safe: 'kept',
    });

    expect(out.password).toBe(REDACTED);
    expect(out.apiKey).toBe(REDACTED);
    expect(out.Authorization).toBe(REDACTED);
    expect(out.passport_number).toBe(REDACTED);
    expect(out.nid).toBe(REDACTED);
    expect(out.dateOfBirth).toBe(REDACTED);
    expect(out.safe).toBe('kept');
  });

  it('redacts nested objects and arrays', () => {
    const out = redactMetadata({
      case: { owner: { secret: 'x', name: 'Sample Person' } },
      people: [{ token: 'abc' }],
    });

    const nested = out.case as { owner: Record<string, unknown> };
    expect(nested.owner.secret).toBe(REDACTED);
    expect(nested.owner.name).toBe('Sample Person');

    const people = out.people as Array<Record<string, unknown>>;
    expect(people[0]?.token).toBe(REDACTED);
  });

  it('stops recursing rather than following a deep structure forever', () => {
    type Deep = { next?: Deep; leaf?: string };
    let node: Deep = { leaf: 'bottom' };
    for (let i = 0; i < 20; i += 1) node = { next: node };
    expect(() => redact(node)).not.toThrow();
  });
});

describe('value-based masking', () => {
  it('masks long opaque strings that look like credentials', () => {
    const masked = maskString('token is sb_secret_abcdefghijklmnopqrstuvwxyz012345');
    expect(masked).not.toContain('abcdefghijklmnopqrstuvwxyz');
    expect(masked).toContain(REDACTED);
  });

  it('keeps only the domain of an email address', () => {
    // The local part keeps its length so a log line stays readable.
    expect(maskString('write to founder@example.test now')).toBe(
      'write to f******@example.test now',
    );
  });

  it('leaves only the last four digits of a long number', () => {
    expect(maskString('NID 1990123456789')).toBe('NID *********6789');
  });

  it('does not mangle ordinary prose or short numbers', () => {
    expect(maskString('Case BD-2026-000101 moved to submitted')).toBe(
      'Case BD-2026-000101 moved to submitted',
    );
  });
});

describe('lastFour', () => {
  it('keeps only the tail of an identifier', () => {
    expect(lastFour('A 1234 5678')).toBe('5678');
    expect(lastFour('12')).toBe('12');
  });
});

/**
 * Metric keys that contain "token" but are not tokens.
 *
 * Production logs showed `first_token`, `inputTokens` and `outputTokens` as
 * `[redacted]` because `SENSITIVE_KEY` matches the bare substring. §7.3's
 * headline gate is first-token latency, so the measurement that evidences it
 * was the one being hidden. These cases pin both halves: the metrics survive,
 * and every shape of actual credential still does not.
 */
describe('metric keys containing "token"', () => {
  it.each([
    'first_token',
    'first_token_ms',
    'firstTokenMs',
    'inputTokens',
    'outputTokens',
    'totalTokens',
    'promptTokens',
    'completionTokens',
  ])('keeps %s, which is a measurement', (key) => {
    expect(redactMetadata({ [key]: 4085 })).toEqual({ [key]: 4085 });
  });

  it.each(['token', 'access_token', 'accessToken', 'authToken', 'refresh_token', 'api_token'])(
    'still redacts %s, which is a credential',
    (key) => {
      expect(redactMetadata({ [key]: 'sk-live-abc123' })).toEqual({ [key]: REDACTED });
    },
  );

  it('redacts an unknown key containing token — the allowlist is exhaustive', () => {
    // A new key is sensitive until someone adds it deliberately. Failing
    // closed is the only safe default for a rule that guards credentials.
    expect(redactMetadata({ someNewToken: 'value' })).toEqual({ someNewToken: REDACTED });
  });

  it('does not let the allowlist rescue a genuinely sensitive sibling', () => {
    const out = redactMetadata({ inputTokens: 4658, access_token: 'sk-live-abc', nid: 123 });

    expect(out).toEqual({ inputTokens: 4658, access_token: REDACTED, nid: REDACTED });
  });

  it('keeps a metric nested inside a payload', () => {
    const out = redactMetadata({ timings: { first_token: 4085, completed: 7414 } });

    expect(out).toEqual({ timings: { first_token: 4085, completed: 7414 } });
  });

  it('still redacts a numeric identifier, which the key rule alone catches', () => {
    // redact() passes numbers through untouched, so the key rule is the only
    // defence here. This is why the fix is an allowlist and not "allow numbers".
    expect(redactMetadata({ nid: 1990123456789 })).toEqual({ nid: REDACTED });
  });
});
