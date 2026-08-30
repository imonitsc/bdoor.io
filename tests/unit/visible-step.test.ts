import { describe, expect, it } from 'vitest';
import { QUESTIONS, STAGES, applicableQuestions, stageProgress } from '@/features/intake/questions';

/**
 * The progress caption comes from `stageProgress`, which is monotone ONLY
 * because the QUESTIONS array is declared in stage order. That ordering is an
 * invariant of the data, not the function, so it gets its own test: anyone
 * inserting a question out of stage order re-introduces the regressing
 * counter the go-live release removed (the old `visibleStep` bucket map).
 */
describe('question declaration order', () => {
  it('declares every question in non-decreasing stage order', () => {
    let previous = 0;
    for (const question of QUESTIONS) {
      const stageIndex = STAGES.indexOf(question.section);
      expect(stageIndex, `${question.key} has an unknown section`).toBeGreaterThanOrEqual(0);
      expect(
        stageIndex,
        `${question.key} (${question.section}) is declared before its stage`,
      ).toBeGreaterThanOrEqual(previous);
      previous = stageIndex;
    }
  });

  it('caption names the stage of the question on screen, on both branches', () => {
    for (const answers of [
      { market_scope: 'bangladesh', target_country: 'bangladesh' } as const,
      { market_scope: 'outside', target_country: 'usa' } as const,
    ]) {
      const applicable = applicableQuestions(answers);
      applicable.forEach((question, index) => {
        expect(stageProgress(answers, index).stage).toBe(question.section);
      });
    }
  });

  it('never shows the country picker on the Bangladesh branch', () => {
    const applicable = applicableQuestions({
      market_scope: 'bangladesh',
      target_country: 'bangladesh',
    });
    expect(applicable.map((q) => q.key)).not.toContain('target_country');
  });
});
