import 'server-only';

import { gateway } from 'ai';

import { aiDb } from './db';
import { describeGatewayFailure, type GatewayFailureShape } from './gateway-error';
import { logger } from '@/lib/logger';

/**
 * Looking the cost up again, long after the request that earned it.
 *
 * The in-request lookup has never succeeded. #92 recorded the status code and
 * #95 retried on it; the answer served at 05:24 UTC on 7 September logged
 * `statusCode 404, attempts 3` — the retry ran and the generation still was
 * not there 1.2 seconds after the stream ended.
 *
 * Three 404s inside 1.2 seconds do not say WHICH problem this is. Either the
 * gateway settles more slowly than that, or the generation is never
 * retrievable under this id at all. Those need different fixes and the
 * difference is not visible from inside the request, which is the whole
 * reason this exists: run the same lookup minutes or hours later, from a
 * place with no deadline, and the answer distinguishes them. A row that
 * reconciles proves a slow settle. A row that still 404s hours later proves
 * the id is not the way to this data, and sends us to a different endpoint
 * rather than to a longer retry.
 *
 * So this is an experiment that happens to also be the fix if the experiment
 * comes out the friendly way. It is deliberately manual: a fourth guess at
 * this defect is not worth a scheduled job, and `CRON_SECRET` is unset in
 * production anyway, so a cron would not run.
 *
 * One attempt per row. The retry schedule in `generation-info.ts` exists to
 * outrun a settle measured in milliseconds; here the elapsed time is already
 * minutes, and if that is not enough another 1.2 seconds will not help.
 */

export type ReconcileOutcome =
  | { id: string; ok: true; costUsd: number }
  | { id: string; ok: false; failure: GatewayFailureShape };

export type ReconcileSummary = {
  /** Rows examined. */
  attempted: number;
  /** Rows that now carry a cost. */
  reconciled: number;
  /** Total recovered, for the operator to sanity-check against expectation. */
  recoveredUsd: number;
  /**
   * Distinct status codes seen on failure, most frequent first. This is the
   * finding: all-404 hours later means the id is not the route to this data.
   */
  failureStatuses: { statusCode: number | null; count: number }[];
};

/** Pure, so the reporting is testable without a gateway or a database. */
export function summariseReconcile(outcomes: readonly ReconcileOutcome[]): ReconcileSummary {
  const counts = new Map<number | null, number>();
  let reconciled = 0;
  let recoveredUsd = 0;

  for (const outcome of outcomes) {
    if (outcome.ok) {
      reconciled += 1;
      recoveredUsd += outcome.costUsd;
      continue;
    }
    const status = outcome.failure.statusCode;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  const failureStatuses = [...counts.entries()]
    .map(([statusCode, count]) => ({ statusCode, count }))
    .sort((a, b) => b.count - a.count || (a.statusCode ?? 0) - (b.statusCode ?? 0));

  return { attempted: outcomes.length, reconciled, recoveredUsd, failureStatuses };
}

type PendingRow = { id: string; generation_id: string | null };

/**
 * Retry the cost lookup for recent answers that still carry no cost.
 *
 * Only rows with a stored `generation_id` and `estimated_cost_usd = 0` are
 * eligible — the partial index matches exactly that predicate. Rows written
 * before the column existed can never be reconciled; their ids are gone.
 */
export async function reconcileCosts(limit = 20): Promise<ReconcileSummary> {
  const db = aiDb();

  const { data, error } = await db
    .from('ai_usage')
    .select('id, generation_id')
    .not('generation_id', 'is', null)
    .eq('estimated_cost_usd', 0)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('ai.cost_reconcile.read_failed', { code: error.code ?? null });
    return { attempted: 0, reconciled: 0, recoveredUsd: 0, failureStatuses: [] };
  }

  const rows = (data ?? []) as PendingRow[];
  const outcomes: ReconcileOutcome[] = [];

  for (const row of rows) {
    if (!row.generation_id) continue;
    try {
      const info = await gateway.getGenerationInfo({ id: row.generation_id });
      const costUsd = info.totalCost ?? 0;

      const { error: writeError } = await db
        .from('ai_usage')
        .update({ estimated_cost_usd: costUsd, provider: info.providerName ?? null })
        .eq('id', row.id);

      if (writeError) {
        logger.warn('ai.cost_reconcile.write_failed', { code: writeError.code ?? null });
        continue;
      }
      outcomes.push({ id: row.id, ok: true, costUsd });
    } catch (error) {
      outcomes.push({ id: row.id, ok: false, failure: describeGatewayFailure(error) });
    }
  }

  const summary = summariseReconcile(outcomes);
  logger.info('ai.cost_reconcile.run', {
    attempted: summary.attempted,
    reconciled: summary.reconciled,
    failureStatuses: summary.failureStatuses,
  });

  return summary;
}
