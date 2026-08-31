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
