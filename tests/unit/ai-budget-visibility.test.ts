import { describe, expect, it } from 'vitest';
import { summariseSpend, type SpendRow } from '@/features/ai/budget';

/**
 * The distinction this file exists for: **no spend** and **no spend data** are
 * not the same state, and reporting the second as the first is what let the
 * guard pass for five days while its input was gone.
 *
 * Found by writing the §24 evidence report: `ai_usage.estimated_cost_usd` was
 * 0 on all 27 rows production had ever written, so `checkBudget` summed zeros
 * and reported "under budget" with complete confidence.
 */

const TODAY = '2026-09-03';
const row = (occurred_on: string, cost: number | string | null): SpendRow => ({
  occurred_on,
  estimated_cost_usd: cost,
});

describe('summariseSpend', () => {
  it('reports no_answers for an empty period, which is genuinely nothing spent', () => {
    expect(summariseSpend([], TODAY)).toEqual({
      daily: 0,
      monthly: 0,
      answers: 0,
      answersWithCost: 0,
      visibility: 'no_answers',
    });
  });

  it('reports missing when the period has answers and not one carries a cost', () => {
    // The production state on 3 September 2026, in miniature.
    const rows = [row(TODAY, 0), row(TODAY, 0), row('2026-09-01', 0)];
    const spend = summariseSpend(rows, TODAY);
    expect(spend.visibility).toBe('missing');
    expect(spend.answers).toBe(3);
    expect(spend.answersWithCost).toBe(0);
    expect(spend.monthly).toBe(0);
  });

  it('treats a null cost as an answer with no cost, not as a zero-cost answer', () => {
    expect(summariseSpend([row(TODAY, null)], TODAY).visibility).toBe('missing');
  });

  it('reports ok as soon as one answer carries a real cost', () => {
    const spend = summariseSpend([row(TODAY, 0), row(TODAY, '0.0042')], TODAY);
    expect(spend.visibility).toBe('ok');
    expect(spend.answersWithCost).toBe(1);
    expect(spend.monthly).toBeCloseTo(0.0042, 6);
  });

  it('separates today from the rest of the month', () => {
    const spend = summariseSpend(
      [row(TODAY, '1.50'), row('2026-09-01', '2.25'), row('2026-09-02', '0.25')],
      TODAY,
    );
    expect(spend.daily).toBeCloseTo(1.5, 6);
    expect(spend.monthly).toBeCloseTo(4.0, 6);
  });

  it('reads numeric strings, because the ledger column is numeric and arrives as text', () => {
    const spend = summariseSpend([row(TODAY, '0.123456')], TODAY);
    expect(spend.monthly).toBeCloseTo(0.123456, 6);
    expect(spend.visibility).toBe('ok');
  });

  it('does not let unparseable junk masquerade as spend', () => {
    // `Number('abc') || 0` is 0, so the row counts as an answer without a cost
    // rather than silently contributing NaN to the total.
    const spend = summariseSpend([row(TODAY, 'not-a-number' as unknown as string)], TODAY);
    expect(spend.monthly).toBe(0);
    expect(spend.visibility).toBe('missing');
    expect(Number.isNaN(spend.monthly)).toBe(false);
  });

  it('still totals correctly when only some answers carry a cost', () => {
    // The state right after a partial fix: visibility is ok, but the total is
    // an undercount. `answersWithCost` is what says so.
    const spend = summariseSpend([row(TODAY, '1.00'), row(TODAY, 0), row(TODAY, 0)], TODAY);
    expect(spend.visibility).toBe('ok');
    expect(spend.answers).toBe(3);
    expect(spend.answersWithCost).toBe(1);
    expect(spend.daily).toBeCloseTo(1.0, 6);
  });
});
