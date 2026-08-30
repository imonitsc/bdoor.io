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

export type BudgetDecision = { allowed: true } | { allowed: false; scope: 'daily' | 'monthly' };

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
  if (!hasAiDatabase()) return { allowed: true };

  const limits = budgetLimits();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  try {
    const { data, error } = await aiDb()
      .from('ai_usage')
      .select('occurred_on, estimated_cost_usd')
      .gte('occurred_on', monthStart);

    if (error || !data) return { allowed: true };

    let monthly = 0;
    let daily = 0;
    for (const row of data) {
      const cost = Number(row.estimated_cost_usd) || 0;
      monthly += cost;
      if (row.occurred_on === today) daily += cost;
    }

    if (daily >= limits.dailyUsd) return { allowed: false, scope: 'daily' };
    if (monthly >= limits.monthlyUsd) return { allowed: false, scope: 'monthly' };
    return { allowed: true };
  } catch (error) {
    logger.warn('ai.budget.check_failed', { message: (error as Error).message });
    return { allowed: true };
  }
}
