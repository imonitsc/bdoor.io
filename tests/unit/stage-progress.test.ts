import { describe, expect, it } from 'vitest';
import {
  STAGES,
  applicableQuestions,
  stageProgress,
  type PartialAnswers,
} from '@/features/intake/questions';

/**
 * The questionnaire's visible progress is per stage because the question
 * count changes as branching resolves. These tests pin the two properties
 * the old "Step X of Y" model broke: the total never changes, and answering
 * a question never moves the indicator backwards.
 */
describe('stage-based progress', () => {
  it('reports a constant total whatever has been answered', () => {
    const answerSets: PartialAnswers[] = [
      {},
      { business_location: 'bangladesh', objective: 'new' },
      { business_location: 'bangladesh', objective: 'new', founder_location: 'outside' },
      { business_location: 'bangladesh', objective: 'existing' },
      { business_location: 'outside', target_country: 'usa' },
    ];
    for (const answers of answerSets) {
      for (let i = 0; i <= applicableQuestions(answers).length; i += 1) {
        expect(stageProgress(answers, i).total).toBe(STAGES.length);
      }
    }
  });

  it('never moves backwards while walking forward through any branch', () => {
    // Walk the questionnaire answering every question with its first valid
    // option; the stage number must be non-decreasing at every step.
    const answers: PartialAnswers = {};
    let previous = 0;
    for (let guard = 0; guard < 50; guard += 1) {
      const applicable = applicableQuestions(answers);
      const index = applicable.findIndex((q) => answers[q.key] === undefined);
      const progress = stageProgress(answers, index === -1 ? applicable.length : index);
      expect(progress.current, `stage dropped after ${guard} answers`).toBeGreaterThanOrEqual(
        previous,
      );
      previous = progress.current;
      if (index === -1) break;
      const question = applicable[index]!;
      const value =
        question.kind === 'boolean'
          ? false
          : question.kind === 'consent'
            ? true
            : question.kind === 'choice'
              ? (question.options?.[0] ?? '')
              : question.kind === 'number'
                ? 1
                : question.kind === 'country'
                  ? 'BD'
                  : question.kind === 'email'
                    ? 'founder@example.com'
                    : 'Sample answer';
      (answers as Record<string, unknown>)[question.key] = value;
    }
    expect(previous).toBe(STAGES.length + 1);
  });

  it('marks the review step as beyond the last stage', () => {
    const progress = stageProgress({}, applicableQuestions({}).length + 5);
    expect(progress.stage).toBe('review');
    expect(progress.current).toBe(STAGES.length + 1);
  });

  it('every question belongs to a known stage', () => {
    for (const question of applicableQuestions({})) {
      expect(STAGES).toContain(question.section);
    }
  });
});
