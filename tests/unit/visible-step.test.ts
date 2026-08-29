import { describe, expect, it } from 'vitest';
import {
  answersImpliedByMarketScope,
  applicableQuestions,
  marketScopeFromPreset,
  visibleStep,
  type PartialAnswers,
} from '@/features/intake/questions';

describe('market scope routing', () => {
  it('implies Bangladesh as target_country for the Bangladesh scope', () => {
    expect(answersImpliedByMarketScope('bangladesh')).toEqual({
      market_scope: 'bangladesh',
      target_country: 'bangladesh',
    });
  });

  it('does not imply a country for Outside Bangladesh', () => {
    expect(answersImpliedByMarketScope('outside')).toEqual({ market_scope: 'outside' });
  });

  it('maps presets to the correct market scope', () => {
    expect(marketScopeFromPreset('bangladesh')).toBe('bangladesh');
    expect(marketScopeFromPreset('usa')).toBe('outside');
    expect(marketScopeFromPreset(undefined)).toBeUndefined();
  });

  it('asks for country only after Outside Bangladesh', () => {
    const outside = applicableQuestions({ market_scope: 'outside' }).map((q) => q.key);
    expect(outside[0]).toBe('market_scope');
    expect(outside).toContain('target_country');

    const bangladesh = applicableQuestions({
      market_scope: 'bangladesh',
      target_country: 'bangladesh',
    }).map((q) => q.key);
    // target_country is answered (implied), so next customer-facing branch is objective.
    expect(bangladesh).toContain('objective');
  });
});

describe('visible step progress', () => {
  it('labels the first screen as Location', () => {
    expect(visibleStep({}, 0)).toEqual({ current: 1, total: 6, labelKey: 'location' });
  });

  it('labels Bangladesh business stage on step 2', () => {
    const answers: PartialAnswers = {
      market_scope: 'bangladesh',
      target_country: 'bangladesh',
    };
    const index = applicableQuestions(answers).findIndex((q) => q.key === 'objective');
    expect(visibleStep(answers, index).labelKey).toBe('business_stage');
    expect(visibleStep(answers, index).current).toBe(2);
  });

  it('labels international country selection on step 2', () => {
    const answers: PartialAnswers = { market_scope: 'outside' };
    const index = applicableQuestions(answers).findIndex((q) => q.key === 'target_country');
    expect(visibleStep(answers, index)).toEqual({
      current: 2,
      total: 6,
      labelKey: 'country',
    });
  });

  it('keeps a constant total of six across branches', () => {
    const sets: PartialAnswers[] = [
      {},
      { market_scope: 'bangladesh', target_country: 'bangladesh', objective: 'new' },
      { market_scope: 'outside', target_country: 'usa', objective: 'new' },
    ];
    for (const answers of sets) {
      for (let i = 0; i <= applicableQuestions(answers).length; i += 1) {
        expect(visibleStep(answers, i).total).toBe(6);
      }
    }
  });
});
