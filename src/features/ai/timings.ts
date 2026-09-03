import 'server-only';

import { logger } from '@/lib/logger';

/**
 * Pipeline instrumentation for Ask bdoor AI.
 *
 * One requestId, one timestamp per stage, one log line at the end. The stages
 * are the eleven the performance work is measured against; a stage that never
 * ran is simply absent, which is itself information (the greeting fast path
 * skips six of them). Nothing here ever logs message content — only shape.
 */

export const PIPELINE_STAGES = [
  'received',
  'checks', // authentication + rate limits done
  'classified', // scope / greeting classification done
  'embedding', // query embedding ready
  'keyword', // keyword retrieval done
  'vector', // vector retrieval done
  'fused', // result fusion done
  'model_start', // streamText called
  'first_token',
  'completed', // stream finished
  'persisted', // conversation + usage rows written
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type Timings = {
  requestId: string;
  mark: (stage: PipelineStage) => void;
  /** ms since request start for a stage, or null if it never ran. */
  at: (stage: PipelineStage) => number | null;
  /** Emit the single summary log line. Call once, in a finally. */
  flush: (context: Record<string, string | number | boolean | null>) => void;
};

export function startTimings(): Timings {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const marks = new Map<PipelineStage, number>();
  marks.set('received', 0);
  let flushed = false;

  return {
    requestId,
    mark(stage) {
      // First mark wins: first_token is marked per chunk, and re-marking a
      // stage would silently overwrite the number that matters.
      if (!marks.has(stage)) marks.set(stage, Math.round(performance.now() - startedAt));
    },
    at(stage) {
      return marks.get(stage) ?? null;
    },
    flush(context) {
      if (flushed) return;
      flushed = true;
      const stages: Record<string, number> = {};
      for (const [stage, ms] of marks) stages[stage] = ms;
      logger.info('ai.pipeline.timings', { requestId, ...context, ...stages });
    },
  };
}

/**
 * The four per-stage durations §7.3 requires to be separately recorded.
 *
 * Derived from the marks rather than timed again, so the numbers on the row
 * and the numbers in the log line can never disagree. Every value is a
 * duration in milliseconds, or null when a boundary is missing — the greeting
 * and out-of-scope fast paths legitimately skip most stages, and a null says
 * "this stage never ran" rather than pretending it took no time.
 */
export type StageDurations = {
  /** Request start to first streamed token. */
  firstTokenMs: number | null;
  /** Classification to the end of retrieval. */
  retrievalMs: number | null;
  /** End of retrieval to fused result set. */
  rerankMs: number | null;
  /** Model call start to stream end. */
  modelMs: number | null;
};

/** The later of two marks, ignoring the ones that never ran. */
function latest(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

/** A duration, or null if either boundary is missing or they are out of order. */
function span(from: number | null, to: number | null): number | null {
  if (from === null || to === null) return null;
  const ms = to - from;
  return ms >= 0 ? ms : null;
}

export function stageDurations(timings: Pick<Timings, 'at'>): StageDurations {
  const { at } = timings;
  // Keyword and vector retrieval run in parallel, so retrieval ends at
  // whichever finished last — summing the two legs would double-count.
  const retrievalEnd = latest(at('keyword'), at('vector'));
  return {
    firstTokenMs: at('first_token'),
    retrievalMs: span(at('classified'), retrievalEnd),
    rerankMs: span(retrievalEnd, at('fused')),
    modelMs: span(at('model_start'), at('completed')),
  };
}
