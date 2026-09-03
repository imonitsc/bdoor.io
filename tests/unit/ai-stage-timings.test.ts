import { describe, expect, it } from 'vitest';
import {
  LATENCY_TARGETS,
  percentile,
  summariseLatency,
  type LatencyRow,
} from '@/features/ai/latency';
import { stageDurations, type PipelineStage } from '@/features/ai/timings';

/**
 * §7.3 requires retrieval, rerank, model, first-token and completion latency
 * to be "separately recorded". Completion latency was the only one persisted;
 * these four durations are derived from the marks the pipeline already sets,
 * so the row and the log line can never disagree.
 *
 * The cases that matter are the missing ones: a fast path that skips six
 * stages must produce nulls, not zeros, because zero would say the stage ran
 * instantly and drag every percentile down.
 */

const marks = (values: Partial<Record<PipelineStage, number>>) => ({
  at: (stage: PipelineStage) => values[stage] ?? null,
});

describe('stageDurations', () => {
  it('measures a full answer end to end', () => {
    expect(
      stageDurations(
        marks({
          received: 0,
          checks: 10,
          classified: 20,
          embedding: 120,
          keyword: 300,
          vector: 450,
          fused: 500,
          model_start: 520,
          first_token: 1_800,
          completed: 9_000,
          persisted: 9_100,
        }),
      ),
    ).toEqual({
      firstTokenMs: 1_800,
      // classified (20) → the later of keyword (300) and vector (450).
      retrievalMs: 430,
      rerankMs: 50,
      modelMs: 8_480,
    });
  });

  it('counts parallel retrieval legs once, taking whichever finished last', () => {
    const keywordSlower = stageDurations(
      marks({ classified: 100, keyword: 900, vector: 400, fused: 950 }),
    );
    expect(keywordSlower.retrievalMs).toBe(800);
    expect(keywordSlower.rerankMs).toBe(50);
  });

  it('still measures retrieval when only one leg ran', () => {
    expect(stageDurations(marks({ classified: 100, vector: 500 })).retrievalMs).toBe(400);
    expect(stageDurations(marks({ classified: 100, keyword: 500 })).retrievalMs).toBe(400);
  });

  it('returns nulls for the greeting fast path rather than zeros', () => {
    expect(stageDurations(marks({ received: 0, classified: 3, completed: 5 }))).toEqual({
      firstTokenMs: null,
      retrievalMs: null,
      rerankMs: null,
      modelMs: null,
    });
  });

  it('records first-token latency even when the stream never completed', () => {
    const durations = stageDurations(
      marks({
        classified: 20,
        keyword: 300,
        vector: 300,
        fused: 320,
        model_start: 330,
        first_token: 1_400,
      }),
    );
    expect(durations.firstTokenMs).toBe(1_400);
    // No `completed` mark: the model duration is unknown, not zero.
    expect(durations.modelMs).toBeNull();
  });

  it('reports null rather than a negative when marks arrive out of order', () => {
    // Should not happen — the marker is monotonic — but a negative duration in
    // the ledger would silently corrupt every percentile computed from it.
    expect(stageDurations(marks({ model_start: 900, completed: 400 })).modelMs).toBeNull();
  });

  it('treats a zero-length stage as measured, not missing', () => {
    expect(stageDurations(marks({ classified: 50, keyword: 50, fused: 50 }))).toMatchObject({
      retrievalMs: 0,
      rerankMs: 0,
    });
  });
});

const row = (values: Partial<LatencyRow>): LatencyRow => ({
  latency_ms: null,
  first_token_ms: null,
  retrieval_ms: null,
  rerank_ms: null,
  model_ms: null,
  ...values,
});

describe('percentile', () => {
  it('has nothing to report for an empty sample', () => {
    expect(percentile([], 0.75)).toBeNull();
  });

  it('reports the one sample it has rather than an average of none', () => {
    expect(percentile([1_400], 0.75)).toBe(1_400);
    expect(percentile([1_400], 0.95)).toBe(1_400);
  });

  it('uses nearest rank, so every reported number is a latency that happened', () => {
    const samples = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1_000];
    expect(percentile(samples, 0.75)).toBe(800);
    expect(percentile(samples, 0.95)).toBe(1_000);
    expect(percentile(samples, 0.5)).toBe(500);
  });

  it('does not run off either end of the sample', () => {
    expect(percentile([5, 1, 3], 1)).toBe(5);
    expect(percentile([5, 1, 3], 0)).toBe(1);
  });
});

describe('summariseLatency', () => {
  it('counts each stage only over the rows that measured it', () => {
    const report = summariseLatency([
      row({ latency_ms: 9_000, first_token_ms: 1_800, retrieval_ms: 400, model_ms: 8_000 }),
      row({ latency_ms: 14_000, first_token_ms: 3_100, retrieval_ms: 900, model_ms: 12_500 }),
      // A row from before stage timings existed: it still has a total.
      row({ latency_ms: 11_000 }),
    ]);
    expect(report.rows).toBe(3);
    expect(report.measured).toBe(2);
    expect(report.answer.samples).toBe(3);
    expect(report.firstToken.samples).toBe(2);
    expect(report.rerank.samples).toBe(0);
    expect(report.rerank.p75).toBeNull();
  });

  it('keeps a genuine zero out of the "never measured" bucket', () => {
    const report = summariseLatency([row({ rerank_ms: 0 })]);
    expect(report.rerank.samples).toBe(1);
    expect(report.rerank.p75).toBe(0);
  });

  it('states the §7.3 targets the panel measures against', () => {
    // Pinned so a target cannot drift away from the requirement quietly.
    expect(LATENCY_TARGETS).toEqual({
      firstTokenP75: 2_500,
      firstTokenP95: 5_000,
      answerP75: 12_000,
    });
  });
});
