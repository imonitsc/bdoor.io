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
