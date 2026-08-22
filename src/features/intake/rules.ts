import type { PartialAnswers } from './questions';

/**
 * Deterministic recommendation engine.
 *
 * This is the whole engine. There is no LLM anywhere in this path: rules live
 * in `public.recommendation_rules` so operations can tune them without a
 * deploy, and they are evaluated here against the questionnaire answers.
 *
 * The output is explicitly preliminary. It suggests services, states the
 * assumptions it made, lists what a partner must confirm, and flags anything
 * that has to go to a human before we quote.
 */

export type Condition =
  | { field: string; equals: unknown }
  | { field: string; notEquals: unknown }
  | { field: string; gt: number }
  | { field: string; gte: number }
  | { field: string; lt: number }
  | { field: string; lte: number }
  | { field: string; includes: string }
  | { field: string; isSet: boolean };

export type ConditionGroup =
  | { all: ReadonlyArray<Condition | ConditionGroup> }
  | { any: ReadonlyArray<Condition | ConditionGroup> }
  | { not: Condition | ConditionGroup };

export type RuleOutcome = {
  structure?: string;
  services?: string[];
  assumptions?: string[];
  partnerQuestions?: string[];
  manualReview?: boolean;
  manualReviewReasons?: string[];
};

export type Rule = {
  key: string;
  description: string;
  conditions: ConditionGroup;
  outcome: RuleOutcome;
  priority: number;
};

export type Recommendation = {
  suggestedStructure: string | null;
  serviceSlugs: string[];
  assumptions: string[];
  partnerQuestions: string[];
  requiresManualReview: boolean;
  manualReviewReasons: string[];
  ruleKeysMatched: string[];
  engineVersion: string;
};

export const ENGINE_VERSION = 'rules-1';

function isGroup(node: Condition | ConditionGroup): node is ConditionGroup {
  return 'all' in node || 'any' in node || 'not' in node;
}

function readField(answers: PartialAnswers, field: string): unknown {
  return (answers as Record<string, unknown>)[field];
}

function evaluateCondition(condition: Condition, answers: PartialAnswers): boolean {
  const value = readField(answers, condition.field);

  if ('equals' in condition) return value === condition.equals;
  if ('notEquals' in condition) return value !== condition.notEquals;
  if ('isSet' in condition) return (value !== undefined && value !== null) === condition.isSet;
  if ('includes' in condition) {
    return Array.isArray(value) && value.includes(condition.includes);
  }

  if (typeof value !== 'number') return false;
  if ('gt' in condition) return value > condition.gt;
  if ('gte' in condition) return value >= condition.gte;
  if ('lt' in condition) return value < condition.lt;
  if ('lte' in condition) return value <= condition.lte;

  return false;
}

export function evaluateGroup(group: ConditionGroup, answers: PartialAnswers): boolean {
  if ('all' in group) {
    return group.all.every((node) =>
      isGroup(node) ? evaluateGroup(node, answers) : evaluateCondition(node, answers),
    );
  }
  if ('any' in group) {
    return group.any.some((node) =>
      isGroup(node) ? evaluateGroup(node, answers) : evaluateCondition(node, answers),
    );
  }
  const inner = group.not;
  return !(isGroup(inner) ? evaluateGroup(inner, answers) : evaluateCondition(inner, answers));
}

function pushUnique(target: string[], values: readonly string[] | undefined) {
  if (!values) return;
  for (const value of values) {
    if (!target.includes(value)) target.push(value);
  }
}

/**
 * Rules are applied in priority order (lowest number first). The first rule
 * that names a structure wins, so a high-priority "this needs review" rule can
 * pre-empt a lower-priority default without the default overwriting it.
 */
export function recommend(answers: PartialAnswers, rules: readonly Rule[]): Recommendation {
  const ordered = [...rules].sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key));

  const result: Recommendation = {
    suggestedStructure: null,
    serviceSlugs: [],
    assumptions: [],
    partnerQuestions: [],
    requiresManualReview: false,
    manualReviewReasons: [],
    ruleKeysMatched: [],
    engineVersion: ENGINE_VERSION,
  };

  for (const rule of ordered) {
    if (!evaluateGroup(rule.conditions, answers)) continue;

    result.ruleKeysMatched.push(rule.key);
    const { outcome } = rule;

    if (outcome.structure && result.suggestedStructure === null) {
      result.suggestedStructure = outcome.structure;
    }
    pushUnique(result.serviceSlugs, outcome.services);
    pushUnique(result.assumptions, outcome.assumptions);
    pushUnique(result.partnerQuestions, outcome.partnerQuestions);

    if (outcome.manualReview) {
      result.requiresManualReview = true;
      pushUnique(result.manualReviewReasons, outcome.manualReviewReasons);
    }
  }

  // A structure the founder explicitly chose is respected unless a rule already
  // decided otherwise, but "unsure" is never echoed back as a recommendation.
  if (result.suggestedStructure === null && answers.structure && answers.structure !== 'unsure') {
    result.suggestedStructure = answers.structure;
  }

  // Safety net independent of the configurable rules: these always need a human,
  // whatever the rule table says.
  const hardManualReview = hardManualReviewReasons(answers);
  if (hardManualReview.length > 0) {
    result.requiresManualReview = true;
    pushUnique(result.manualReviewReasons, hardManualReview);
  }

  return result;
}

/**
 * Conditions that must never be auto-approved, regardless of rule configuration.
 * Keeping these in code rather than data is deliberate: an admin editing the
 * rules table cannot accidentally switch them off.
 */
export function hardManualReviewReasons(answers: PartialAnswers): string[] {
  const reasons: string[] = [];

  if (answers.entity_owner === true) {
    reasons.push('corporate_or_trust_owner');
  }
  if (answers.regulated_activity === true) {
    reasons.push('regulated_sector');
  }
  if (typeof answers.foreign_ownership_percent === 'number' && answers.foreign_ownership_percent > 0) {
    reasons.push('foreign_ownership');
  }
  if (answers.structure === 'branch_office' || answers.structure === 'liaison_office') {
    reasons.push('branch_or_liaison_office');
  }
  if (answers.remit_capital === true) {
    reasons.push('inward_capital_remittance');
  }

  return reasons;
}
