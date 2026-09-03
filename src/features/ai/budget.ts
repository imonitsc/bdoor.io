import 'server-only';

import { aiDb, hasAiDatabase } from './db';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Spend guard.
 *
 * AI Gateway budgets are the real enforcement — they are checked by the
 * gateway before every request and reject with HTTP 402 once exceeded. They
 * are configured per team, project and key, not in code:
 *
 *   vercel ai-gateway budgets set project bdoor-io --limit 40 --refresh-period daily
 *   vercel ai-gateway budgets set team --limit 600 --refresh-period monthly
 *
 * This is the second line: a cap the application enforces from its own usage
 * ledger, before spending anything. It exists because a gateway budget is a
 * soft cap checked at the start of a request, and because a runaway loop
 * should be stopped by the thing that is looping.
 */

/**
 * Whether the ledger could actually see spend.
 *
 * `missing` means the period contains answers and not one of them recorded a
 * cost — which is not the same as costing nothing, and must not be reported as
 * "under budget" with a straight face. It has been the real state of this
 * system since the first answer on 30 August 2026: `estimated_cost_usd` was 0
 * on every row, so the sum below was always 0 and the guard always passed.
 */
export type CostVisibility = 'ok' | 'no_answers' | 'missing';

export type BudgetDecision =
  | { allowed: true; costVisibility: CostVisibility }
  | { allowed: false; scope: 'daily' | 'monthly' };

export type SpendRow = { occurred_on: string; estimated_cost_usd: number | string | null };

export type SpendSummary = {
  daily: number;
  monthly: number;
  answers: number;
  answersWithCost: number;
  visibility: CostVisibility;
};

/**
 * Total the ledger, and say whether it could see anything.
 *
 * Pure, so the distinction that matters — no spend versus no data — is
 * testable without a database. A row whose cost is null or zero counts as an
 * answer with no cost attached; a period full of those is the `missing` case.
 */
export function summariseSpend(rows: readonly SpendRow[], today: string): SpendSummary {
  let daily = 0;
  let monthly = 0;
  let answersWithCost = 0;

  for (const row of rows) {
    const cost = Number(row.estimated_cost_usd) || 0;
    if (cost > 0) answersWithCost += 1;
    monthly += cost;
    if (row.occurred_on === today) daily += cost;
  }

  const visibility: CostVisibility =
    rows.length === 0 ? 'no_answers' : answersWithCost === 0 ? 'missing' : 'ok';

  return { daily, monthly, answers: rows.length, answersWithCost, visibility };
}

export function budgetLimits() {
  const env = serverEnv();
  return { dailyUsd: env.AI_DAILY_BUDGET_USD, monthlyUsd: env.AI_MONTHLY_BUDGET_USD };
}

/**
 * Sums today's and this month's recorded cost. Deliberately fails open on a
 * database error: losing the ledger should not take the assistant down, and the
 * gateway budget still bounds the damage.
 */
export async function checkBudget(now = new Date()): Promise<BudgetDecision> {
  if (!hasAiDatabase()) return { allowed: true, costVisibility: 'no_answers' };

  const limits = budgetLimits();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  try {
    const { data, error } = await aiDb()
      .from('ai_usage')
      .select('occurred_on, estimated_cost_usd')
      .gte('occurred_on', monthStart);

    if (error || !data) return { allowed: true, costVisibility: 'no_answers' };

    const spend = summariseSpend(data, today);

    if (spend.daily >= limits.dailyUsd) return { allowed: false, scope: 'daily' };
    if (spend.monthly >= limits.monthlyUsd) return { allowed: false, scope: 'monthly' };

    if (spend.visibility === 'missing') {
      // Loud, because the alternative is what actually happened: a guard
      // summing zeros and reporting "under budget" for five days while nobody
      // knew its input was gone.
      //
      // It still allows the answer. Failing closed here would take Ask down
      // entirely on a telemetry fault, and the gateway budget — the first line
      // described above — is the cap that actually rejects with a 402. This
      // guard's job is to notice, and until now it could not.
      logger.warn('ai.budget.cost_data_missing', {
        answers: spend.answers,
        monthlyUsd: limits.monthlyUsd,
        dailyUsd: limits.dailyUsd,
      });
    }

    return { allowed: true, costVisibility: spend.visibility };
  } catch (error) {
    logger.warn('ai.budget.check_failed', { message: (error as Error).message });
    return { allowed: true, costVisibility: 'no_answers' };
  }
}
