import { describe, expect, it } from 'vitest';

import { detectCountry } from '@/features/ai/config';
import { classifyUpstreamError, failureMessage, failureStatus } from '@/features/ai/errors';
import { messageTelemetry, redactSensitive } from '@/features/ai/redaction';
import { classifyScope, outOfScopeReply } from '@/features/ai/scope';
import { canTransition, isPublishable, type SourceStatus } from '@/features/ai/knowledge';

/**
 * The safety properties of Ask bdoor AI that do not need a database, a network
 * or a model to check — which is most of them, deliberately. Every rule the
 * brief states as "never" is a rule that should fail a test rather than fail in
 * production.
 */

describe('redaction', () => {
  it('removes identifiers people actually paste into chat', () => {
    const cases: Array<[string, string]> = [
      ['email me at rafi.hasan@example.com', 'email'],
      ['my card is 4111 1111 1111 1111', 'card'],
      ['NID 1990123456789', 'nid'],
      ['passport BA1234567', 'passport'],
      ['call 01712345678', 'phone'],
      ['my TIN: 123456789012', 'tin'],
    ];

    for (const [input, rule] of cases) {
      const result = redactSensitive(input);
      expect(result.redacted, input).toContain(rule);
      expect(result.text, input).not.toEqual(input);
    }
  });

  it('leaves an ordinary business question untouched', () => {
    const question = 'How long does RJSC name clearance take for a private limited company?';
    const result = redactSensitive(question);
    expect(result.text).toBe(question);
    expect(result.redacted).toEqual([]);
  });

  it('never carries the message text into telemetry', () => {
    const secret = 'my passport is BA1234567 and I want a trade licence';
    const telemetry = messageTelemetry(secret);

    // The whole point: a log line derived from a question must not be able to
    // reconstruct any part of it.
    expect(Object.values(telemetry).join(' ')).not.toContain('BA1234567');
    expect(JSON.stringify(telemetry)).not.toContain('passport is');
    expect(telemetry.chars).toBe(secret.length);
    expect(telemetry.redacted).toContain('passport');
  });

  it('is stable across repeated calls', () => {
    // A global regex that keeps `lastIndex` between calls silently stops
    // matching every other time. This is that bug's regression test.
    const input = 'reach me on rafi@example.com';
    expect(redactSensitive(input).redacted).toEqual(redactSensitive(input).redacted);
    expect(redactSensitive(input).redacted).toEqual(redactSensitive(input).redacted);
  });
});

describe('scope', () => {
  it('accepts business questions in English and Bangla', () => {
    const inScope = [
      'How much does a trade licence cost in Dhaka?',
      'Can a foreigner own 100% of a Bangladeshi company?',
      'What is the difference between TIN and BIN?',
      'কোম্পানি নিবন্ধনের খরচ কত?',
      'ট্রেড লাইসেন্স নবায়ন কীভাবে করব?',
    ];
    for (const question of inScope) {
      expect(classifyScope(question).inScope, question).toBe(true);
    }
  });

  it('declines entertainment, coding, medical and party-political requests', () => {
    const outOfScope = [
      'write me a poem about the moon',
      'tell me a joke',
      'debug this python code for me',
      'what is the treatment for a fever',
      'who should i vote for',
    ];
    for (const question of outOfScope) {
      expect(classifyScope(question).inScope, question).toBe(false);
    }
  });

  it('answers a real question that has noise attached', () => {
    // Refusing the whole message because it ends in a joke would be the
    // unhelpful failure. The business signal wins.
    const mixed = 'How do I register a private limited company? Also tell me a joke.';
    expect(classifyScope(mixed).inScope).toBe(true);
  });

  it('declines in the customer language', () => {
    expect(outOfScopeReply('en')).toMatch(/Ask bdoor AI/);
    expect(outOfScopeReply('bn')).toMatch(/[ঀ-৿]/);
    expect(outOfScopeReply('en')).not.toBe(outOfScopeReply('bn'));
  });
});

describe('failures', () => {
  it('separates a budget rejection from an outage', () => {
    // AI Gateway answers an exceeded budget with 402 and this code. Treating it
    // as a generic outage would tell the customer to retry into a wall.
    expect(classifyUpstreamError(new Error('quota_for_entity_exceeded'))).toBe('budget_exceeded');
    expect(classifyUpstreamError(new Error('fetch failed'))).toBe('upstream_unavailable');
    expect(classifyUpstreamError(new Error('The operation was aborted'))).toBe('timeout');
    expect(failureStatus('budget_exceeded')).toBe(402);
    expect(failureStatus('rate_limited')).toBe(429);
  });

  it('offers a human on every failure, in both languages', () => {
    const failures = [
      'rate_limited',
      'budget_exceeded',
      'upstream_unavailable',
      'timeout',
      'unknown',
    ] as const;

    for (const failure of failures) {
      // No silent degradation: the customer is told and given somewhere to go.
      expect(failureMessage(failure, 'en'), failure).toMatch(/specialist/i);
      expect(failureMessage(failure, 'bn'), failure).toMatch(/বিশেষজ্ঞ/);
    }
  });
});

describe('knowledge workflow', () => {
  it('refuses the draft-to-published shortcut', () => {
    expect(canTransition('draft', 'published')).toBe(false);
    expect(canTransition('in_review', 'published')).toBe(false);
    expect(canTransition('approved', 'published')).toBe(true);
  });

  it('walks the whole approved path one step at a time', () => {
    const path: SourceStatus[] = ['draft', 'in_review', 'approved', 'published'];
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i]!, path[i + 1]!), `${path[i]} -> ${path[i + 1]}`).toBe(true);
    }
  });

  it('lets anything be withdrawn, and only published content be retrieved', () => {
    for (const status of ['draft', 'in_review', 'approved', 'published'] as const) {
      expect(canTransition(status, 'withdrawn'), status).toBe(true);
    }
    for (const status of ['draft', 'in_review', 'approved', 'withdrawn'] as const) {
      expect(isPublishable(status), status).toBe(false);
    }
    expect(isPublishable('published')).toBe(true);
  });
});

describe('country detection', () => {
  it('routes a question to the country it names', () => {
    const cases: Array<[string, string | null]> = [
      ['Can I open a Wyoming LLC from Dhaka?', 'us'],
      ['How do I register with Companies House in the UK?', 'gb'],
      ['What is a Dubai free zone company?', 'ae'],
      ['Setting up in Singapore with ACRA', 'sg'],
      ['company in Saudi Arabia', 'sa'],
      ['business in Doha', 'qa'],
      ['ঢাকায় কোম্পানি নিবন্ধন', 'bd'],
      ['How much does a trade licence cost?', null],
    ];

    for (const [question, expected] of cases) {
      expect(detectCountry(question), question).toBe(expected);
    }
  });
});
