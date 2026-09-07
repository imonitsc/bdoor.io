import { describe, expect, it } from 'vitest';

import { summariseReconcile, type ReconcileOutcome } from '@/features/ai/cost-reconcile';

/**
 * What a reconcile run reports.
 *
 * The summary is the experiment's readout, not decoration. The in-request
 * lookup 404s and the bounded retry in #95 did not change that, and three
 * 404s inside 1.2 seconds cannot say whether the gateway settles slowly or
 * the id is simply not the route to this data. Running the same lookup hours
 * later can — so the failure STATUS CODES matter as much as the count, and a
 * run of all-404 long after the fact is a finding, not a shrug.
 */

function failure(statusCode: number | null): ReconcileOutcome {
  return {
    id: crypto.randomUUID(),
    ok: false,
    failure: { message: 'x', statusCode, responseKeys: null },
  };
}

describe('summariseReconcile', () => {
  it('reports nothing to do for an empty run', () => {
    expect(summariseReconcile([])).toEqual({
      attempted: 0,
      reconciled: 0,
      recoveredUsd: 0,
      failureStatuses: [],
    });
  });

  it('totals the cost actually recovered', () => {
    const summary = summariseReconcile([
      { id: 'a', ok: true, costUsd: 0.004 },
      { id: 'b', ok: true, costUsd: 0.0125 },
    ]);

    expect(summary).toMatchObject({ attempted: 2, reconciled: 2 });
    expect(summary.recoveredUsd).toBeCloseTo(0.0165, 6);
  });

  it('groups failures by status, most frequent first', () => {
    // This is the shape that answers the open question: if every failure hours
    // later is still 404, the id is not how this data is reached.
    const summary = summariseReconcile([failure(404), failure(404), failure(500), failure(404)]);

    expect(summary.failureStatuses).toEqual([
      { statusCode: 404, count: 3 },
      { statusCode: 500, count: 1 },
    ]);
    expect(summary.reconciled).toBe(0);
  });

  it('counts a statusless failure separately rather than folding it into a code', () => {
    const summary = summariseReconcile([failure(null), failure(404)]);

    expect(summary.failureStatuses).toContainEqual({ statusCode: null, count: 1 });
    expect(summary.failureStatuses).toContainEqual({ statusCode: 404, count: 1 });
  });

  it('reports a mixed run honestly on both sides', () => {
    const summary = summariseReconcile([
      { id: 'a', ok: true, costUsd: 0.01 },
      failure(404),
      failure(404),
    ]);

    expect(summary).toMatchObject({ attempted: 3, reconciled: 1 });
    expect(summary.failureStatuses).toEqual([{ statusCode: 404, count: 2 }]);
  });

  it('orders ties by status code, so repeated runs read the same', () => {
    const summary = summariseReconcile([failure(500), failure(404)]);

    expect(summary.failureStatuses).toEqual([
      { statusCode: 404, count: 1 },
      { statusCode: 500, count: 1 },
    ]);
  });
});
