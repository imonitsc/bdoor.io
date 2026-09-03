import 'server-only';

import { aiDb, hasAiDatabase } from './db';

/**
 * The §7.3 latency gate, read from the usage ledger.
 *
 * §7.3 names five numbers and requires them to be "separately recorded":
 * retrieval, rerank, model, first-token and completion latency. Only
 * completion latency was ever persisted, so the two first-token targets could
 * not be checked at all and a slow answer could not be attributed to a stage.
 * `ai_usage` now carries all five; this module turns them into the
 * percentiles the gate is written in.
 *
 * Percentiles use nearest-rank on the sorted samples — no interpolation, so a
 * reported p95 is always a latency some real request actually had.
 */

/** The §7.3 release targets, in milliseconds. */
export const LATENCY_TARGETS = {
  firstTokenP75: 2_500,
  firstTokenP95: 5_000,
  answerP75: 12_000,
} as const;

export type LatencyRow = {
  latency_ms: number | null;
  first_token_ms: number | null;
  retrieval_ms: number | null;
  rerank_ms: number | null;
  model_ms: number | null;
};

export type LatencyStat = { p75: number | null; p95: number | null; samples: number };

export type LatencyReport = {
  /** Rows in the window. */
  rows: number;
  /** Rows carrying a first-token mark — the measured population. */
  measured: number;
  firstToken: LatencyStat;
  answer: LatencyStat;
  retrieval: LatencyStat;
  rerank: LatencyStat;
  model: LatencyStat;
};

const EMPTY_STAT: LatencyStat = { p75: null, p95: null, samples: 0 };

export const EMPTY_LATENCY_REPORT: LatencyReport = {
  rows: 0,
  measured: 0,
  firstToken: EMPTY_STAT,
  answer: EMPTY_STAT,
  retrieval: EMPTY_STAT,
  model: EMPTY_STAT,
  rerank: EMPTY_STAT,
};

/** Nearest-rank percentile. `fraction` is 0–1; the samples need not be sorted. */
export function percentile(samples: readonly number[], fraction: number): number | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil(fraction * sorted.length);
  // ceil(0 * n) is 0, and a fraction of 1 must not run off the end.
  const index = Math.min(Math.max(rank, 1), sorted.length) - 1;
  return sorted[index] ?? null;
}

function stat(samples: readonly number[]): LatencyStat {
  return {
    p75: percentile(samples, 0.75),
    p95: percentile(samples, 0.95),
    samples: samples.length,
  };
}

/** Pure: the report for a set of ledger rows. */
export function summariseLatency(rows: readonly LatencyRow[]): LatencyReport {
  const firstToken: number[] = [];
  const answer: number[] = [];
  const retrieval: number[] = [];
  const rerank: number[] = [];
  const model: number[] = [];

  for (const row of rows) {
    // A null is "never measured" and a zero is a real, if implausible,
    // measurement — so the test is against null, not falsiness.
    if (row.first_token_ms !== null) firstToken.push(row.first_token_ms);
    if (row.latency_ms !== null) answer.push(row.latency_ms);
    if (row.retrieval_ms !== null) retrieval.push(row.retrieval_ms);
    if (row.rerank_ms !== null) rerank.push(row.rerank_ms);
    if (row.model_ms !== null) model.push(row.model_ms);
  }

  return {
    rows: rows.length,
    measured: firstToken.length,
    firstToken: stat(firstToken),
    answer: stat(answer),
    retrieval: stat(retrieval),
    rerank: stat(rerank),
    model: stat(model),
  };
}

/**
 * Completed answers only: a failed request's latency is the latency of a
 * failure, and mixing it into the gate would flatter or punish the number
 * without saying anything about how fast answers arrive.
 */
export async function latencyReport(sinceDays = 30): Promise<LatencyReport> {
  if (!hasAiDatabase()) return EMPTY_LATENCY_REPORT;

  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString().slice(0, 10);
  const { data } = await aiDb()
    .from('ai_usage')
    .select('latency_ms, first_token_ms, retrieval_ms, rerank_ms, model_ms')
    .eq('status', 'complete')
    .gte('occurred_on', since)
    .limit(10_000);

  return summariseLatency(data ?? []);
}
