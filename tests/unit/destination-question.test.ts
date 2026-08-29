import { describe, expect, it } from 'vitest';
import {
  DESTINATIONS,
  applicableQuestions,
  stageProgress,
  validateAnswer,
} from '@/features/intake/questions';
import { hardManualReviewReasons } from '@/features/intake/rules';

/**
 * The destination question of the seven-country assessment: asked only when
 * the founder wants to form abroad, offering exactly the six prepared
 * countries plus "not sure" — and never letting an international request
 * bypass manual review, because no international route has a contracted
 * partner yet.
 */
describe('destination_country', () => {
  it('is asked when forming abroad and only then', () => {
    const abroad = applicableQuestions({ help_scope: 'form_abroad' }).map((q) => q.key);
    expect(abroad).toContain('destination_country');

    for (const scope of ['start_bangladesh', 'manage_bangladesh', 'unsure'] as const) {
      const keys = applicableQuestions({ help_scope: scope }).map((q) => q.key);
      expect(keys, scope).not.toContain('destination_country');
    }
  });

  it('offers the six prepared countries plus "unsure"', () => {
    expect([...DESTINATIONS].sort()).toEqual([
      'qatar',
      'saudi_arabia',
      'singapore',
      'uae',
      'uk',
      'unsure',
      'usa',
    ]);
  });

  it('accepts each destination and rejects anything else', () => {
    for (const destination of DESTINATIONS) {
      expect(validateAnswer('destination_country', destination).success).toBe(true);
    }
    const invalid = validateAnswer('destination_country', 'mars');
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error).toBe('requiredChoice');
  });

  it('stays in the about_you stage, so stage progress does not jump', () => {
    const answers = { help_scope: 'form_abroad' as const };
    const index = applicableQuestions(answers).findIndex((q) => q.key === 'destination_country');
    expect(stageProgress(answers, index)).toMatchObject({ current: 1, stage: 'about_you' });
  });

  it('never lets an international destination skip manual review', () => {
    for (const destination of DESTINATIONS) {
      const reasons = hardManualReviewReasons({
        help_scope: 'form_abroad',
        destination_country: destination,
      });
      expect(reasons, destination).toContain('international_formation');
    }
  });
});
