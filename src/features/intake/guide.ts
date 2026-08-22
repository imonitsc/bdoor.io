import type { Recommendation } from './rules';
import type { PartialAnswers } from './questions';

/**
 * The deterministic half of "BDoor Guide".
 *
 * This produces the preliminary checklist and the answer-summary the customer
 * sees. It runs with AI_PROVIDER=disabled and is the only path that can reach
 * the customer without a human in the loop — which is why it says nothing that
 * is not either their own answer echoed back or approved catalog content.
 */

export type ChecklistItem = {
  serviceSlug: string;
  reason: 'recommended' | 'prerequisite' | 'optional';
};

export type GuideSummary = {
  headlineKey: 'local_company' | 'foreign_founder' | 'existing_business' | 'needs_review';
  checklist: ChecklistItem[];
  answerSummary: Array<{ key: string; value: string }>;
  escalateToPartner: boolean;
};

const PREREQUISITES: Record<string, string[]> = {
  'import-registration-certificate': [
    'trade-licence',
    'etin-and-tax-setup',
    'bin-vat-registration',
  ],
  'bin-vat-registration': ['etin-and-tax-setup'],
  'etin-and-tax-setup': [],
  'trade-licence': [],
};

/** Adds any service a recommended service depends on, marked as a prerequisite. */
export function expandWithPrerequisites(serviceSlugs: readonly string[]): ChecklistItem[] {
  const items = new Map<string, ChecklistItem>();

  for (const slug of serviceSlugs) {
    items.set(slug, { serviceSlug: slug, reason: 'recommended' });
  }
  for (const slug of serviceSlugs) {
    for (const prerequisite of PREREQUISITES[slug] ?? []) {
      if (!items.has(prerequisite)) {
        items.set(prerequisite, { serviceSlug: prerequisite, reason: 'prerequisite' });
      }
    }
  }

  return [...items.values()];
}

export function buildGuideSummary(
  answers: PartialAnswers,
  recommendation: Recommendation,
): GuideSummary {
  const headlineKey: GuideSummary['headlineKey'] = recommendation.requiresManualReview
    ? 'needs_review'
    : answers.existing_business === true
      ? 'existing_business'
      : answers.founder_location === 'outside' || answers.foreign_owners === true
        ? 'foreign_founder'
        : 'local_company';

  const answerSummary = Object.entries(answers)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({
      key,
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));

  return {
    headlineKey,
    checklist: expandWithPrerequisites(recommendation.serviceSlugs),
    answerSummary,
    escalateToPartner: recommendation.partnerQuestions.length > 0,
  };
}
