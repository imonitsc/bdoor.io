import { describe, expect, it } from 'vitest';

import { describeGatewayFailure } from '@/features/ai/gateway-error';

/**
 * What a failed gateway lookup is allowed to tell the log.
 *
 * The first case reproduces the shape production actually threw on
 * 4 September: a `GatewayResponseError` whose message is the SDK's
 * "Invalid error response format" and whose status code the previous log
 * discarded. That status code is the whole point — it is what separates a key
 * permission problem from our own timing.
 */

class FakeGatewayResponseError extends Error {
  readonly statusCode: number;
  readonly response: unknown;

  constructor(message: string, statusCode: number, response: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
  }
}

describe('describeGatewayFailure', () => {
  it('keeps the status code the old log threw away', () => {
    const described = describeGatewayFailure(
      new FakeGatewayResponseError('Invalid error response format: Gateway request failed', 404, {
        detail: 'not found',
      }),
    );

    expect(described.message).toBe('Invalid error response format: Gateway request failed');
    expect(described.statusCode).toBe(404);
  });

  it('reports the response shape by key name only, never by value', () => {
    // §17 forbids logging PII, and a gateway response body can carry prompt or
    // completion text. Key names identify the shape; values are not ours to log.
    const described = describeGatewayFailure(
      new FakeGatewayResponseError('boom', 500, {
        prompt: 'how do I register a company for Mr Rahman',
        completion: 'You will need...',
      }),
    );

    expect(described.responseKeys).toEqual(['completion', 'prompt']);
    expect(JSON.stringify(described)).not.toContain('Rahman');
  });

  it('caps the key list rather than logging an unbounded object', () => {
    const wide = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, i]));
    const described = describeGatewayFailure(new FakeGatewayResponseError('boom', 500, wide));

    expect(described.responseKeys).toHaveLength(12);
  });

  it('reports no status code when the error does not carry one', () => {
    const described = describeGatewayFailure(new Error('network down'));

    expect(described).toEqual({
      message: 'network down',
      statusCode: null,
      responseKeys: null,
    });
  });

  it('survives a thrown non-Error without losing the log line', () => {
    expect(describeGatewayFailure('something odd')).toEqual({
      message: 'something odd',
      statusCode: null,
      responseKeys: null,
    });
  });

  it('does not mistake an array body for a keyed object', () => {
    const described = describeGatewayFailure(new FakeGatewayResponseError('boom', 502, ['a', 'b']));

    expect(described.responseKeys).toBeNull();
    expect(described.statusCode).toBe(502);
  });

  it('ignores a non-numeric status code rather than reporting a wrong one', () => {
    const described = describeGatewayFailure(
      new FakeGatewayResponseError('boom', '404' as unknown as number, null),
    );

    expect(described.statusCode).toBeNull();
  });
});
