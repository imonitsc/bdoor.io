import { describe, expect, it, vi } from 'vitest';

import {
  GENERATION_INFO_RETRY_DELAYS_MS,
  lookupWithRetry,
  retryableGatewayFailure,
} from '@/features/ai/generation-info';

/**
 * Retrying the cost lookup.
 *
 * The failure this exists for is the 404 observed in production on 6 September:
 * the gateway settles asynchronously and we ask too early. The cases that
 * matter most are the ones that must NOT retry — a permission refusal does not
 * become an approval because it was asked twice, and spending a live function's
 * seconds to be refused again is worse than failing fast.
 *
 * `sleep` is injected so the schedule is asserted without waiting for it.
 */

class GatewayError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

function recordingSleep() {
  const slept: number[] = [];
  return { slept, sleep: async (ms: number) => void slept.push(ms) };
}

describe('retryableGatewayFailure', () => {
  it('retries 404 — the settle race this was built for', () => {
    expect(retryableGatewayFailure(404)).toBe(true);
  });

  it.each([500, 502, 503, 504])('retries %d, a gateway having a bad moment', (status) => {
    expect(retryableGatewayFailure(status)).toBe(true);
  });

  it.each([401, 403])('never retries %d — a permission decision is not a race', (status) => {
    expect(retryableGatewayFailure(status)).toBe(false);
  });

  it.each([400, 409, 422, 429])('does not retry %d', (status) => {
    expect(retryableGatewayFailure(status)).toBe(false);
  });

  it('does not retry an error that never had a status', () => {
    // An unrecognised failure shape is not a known-transient one, and retrying
    // it is how a quiet bug turns into a loud one.
    expect(retryableGatewayFailure(null)).toBe(false);
  });
});

describe('lookupWithRetry', () => {
  it('does not sleep when the first attempt succeeds', async () => {
    const { slept, sleep } = recordingSleep();
    const outcome = await lookupWithRetry(async () => ({ totalCost: 0.004 }), sleep);

    expect(outcome).toEqual({ ok: true, value: { totalCost: 0.004 }, attempts: 1 });
    expect(slept).toEqual([]);
  });

  it('recovers on the second ask, which is the production case', async () => {
    const { slept, sleep } = recordingSleep();
    const lookup = vi
      .fn()
      .mockRejectedValueOnce(new GatewayError('not found', 404))
      .mockResolvedValueOnce({ totalCost: 0.004 });

    const outcome = await lookupWithRetry(lookup, sleep);

    expect(outcome).toMatchObject({ ok: true, attempts: 2 });
    expect(slept).toEqual([300]);
  });

  it('follows the schedule in order across two retries', async () => {
    const { slept, sleep } = recordingSleep();
    const lookup = vi
      .fn()
      .mockRejectedValueOnce(new GatewayError('not found', 404))
      .mockRejectedValueOnce(new GatewayError('not found', 404))
      .mockResolvedValueOnce({ totalCost: 0.01 });

    const outcome = await lookupWithRetry(lookup, sleep);

    expect(outcome).toMatchObject({ ok: true, attempts: 3 });
    expect(slept).toEqual([300, 900]);
  });

  it('gives up when the schedule runs out, reporting the last failure', async () => {
    const { slept, sleep } = recordingSleep();
    const lookup = vi.fn().mockRejectedValue(new GatewayError('not found', 404));

    const outcome = await lookupWithRetry(lookup, sleep);

    expect(outcome.ok).toBe(false);
    expect(outcome).toMatchObject({ attempts: 3 });
    if (!outcome.ok) expect(outcome.failure.statusCode).toBe(404);
    // Three attempts, two waits — never a wait it cannot use.
    expect(slept).toEqual([300, 900]);
    expect(lookup).toHaveBeenCalledTimes(3);
  });

  it('gives up immediately on a permission refusal, without sleeping', async () => {
    const { slept, sleep } = recordingSleep();
    const lookup = vi.fn().mockRejectedValue(new GatewayError('forbidden', 403));

    const outcome = await lookupWithRetry(lookup, sleep);

    expect(outcome).toMatchObject({ ok: false, attempts: 1 });
    expect(slept).toEqual([]);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('gives up immediately on an unrecognised failure', async () => {
    const { slept, sleep } = recordingSleep();
    const outcome = await lookupWithRetry(async () => {
      throw new Error('socket hang up');
    }, sleep);

    expect(outcome).toMatchObject({ ok: false, attempts: 1 });
    expect(slept).toEqual([]);
  });

  it('makes exactly one attempt when given no retries at all', async () => {
    const { slept, sleep } = recordingSleep();
    const lookup = vi.fn().mockRejectedValue(new GatewayError('not found', 404));

    const outcome = await lookupWithRetry(lookup, sleep, []);

    expect(outcome).toMatchObject({ ok: false, attempts: 1 });
    expect(slept).toEqual([]);
  });

  it('keeps the added wall time bounded and small', async () => {
    // The answer has already streamed, so this costs function time rather than
    // customer time — but it is still a live function, so the total is capped.
    const total = GENERATION_INFO_RETRY_DELAYS_MS.reduce((sum, ms) => sum + ms, 0);

    expect(total).toBeLessThanOrEqual(1_500);
  });
});
