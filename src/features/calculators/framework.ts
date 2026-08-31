/**
 * Deterministic calculators (BI-OS §4.5).
 *
 * Every number a customer sees from a calculator comes from versioned code
 * with named sources — the model may *explain* a calculation but never
 * creates the figure. A definition therefore carries what an auditor needs:
 * a stable id, a version that changes whenever a figure or formula does, the
 * date the rule applies from, and the sources every threshold came from.
 * `defineCalculator` refuses a definition missing any of that, so an
 * unsourced calculator cannot be registered by accident.
 *
 * No 'server-only': pure logic, exercised directly by the unit fixtures.
 */

export type CalculatorSource = {
  title: string;
  /** Site-relative or official URL where the figures can be checked. */
  url?: string;
  lastReviewed: string;
};

export type CalculatorDefinition<Input, Output> = {
  id: string;
  /** Bumped whenever a figure, threshold or formula changes — never edited in place. */
  version: string;
  effectiveFrom: string;
  sources: readonly CalculatorSource[];
  compute: (input: Input) => Output;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function defineCalculator<Input, Output>(
  definition: CalculatorDefinition<Input, Output>,
): CalculatorDefinition<Input, Output> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(definition.id)) {
    throw new Error(`calculator id "${definition.id}" must be a kebab-case slug`);
  }
  if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(definition.version)) {
    throw new Error(
      `calculator ${definition.id}: version must be date.revision, e.g. 2026-08-31.1`,
    );
  }
  if (!ISO_DATE.test(definition.effectiveFrom)) {
    throw new Error(`calculator ${definition.id}: effectiveFrom must be an ISO date`);
  }
  if (definition.sources.length === 0) {
    throw new Error(`calculator ${definition.id} must cite at least one source`);
  }
  for (const source of definition.sources) {
    if (!ISO_DATE.test(source.lastReviewed)) {
      throw new Error(`calculator ${definition.id}: source "${source.title}" needs a review date`);
    }
  }
  return Object.freeze({ ...definition, sources: Object.freeze([...definition.sources]) });
}
