import { z } from 'zod';

/**
 * The guided questionnaire.
 *
 * Each step declares:
 *   - a Zod schema used identically on the client and in the Server Action,
 *   - a `shouldAsk` predicate so branching lives with the question, and
 *   - a `whyKey` pointing at the "Why we ask" copy in the translation files.
 *
 * Nothing here is customer-facing copy: labels come from `start.questions.*`.
 */

export const FOUNDER_LOCATIONS = ['bangladesh', 'outside'] as const;
export const STRUCTURES = [
  'private_limited',
  'one_person',
  'partnership',
  'sole_proprietorship',
  'branch_office',
  'liaison_office',
  'unsure',
] as const;
export const IMPORT_EXPORT = ['none', 'import', 'export', 'both'] as const;
export const START_WINDOWS = ['immediately', 'one_to_three', 'three_to_six', 'exploring'] as const;
export const EXISTING_REGISTRATIONS = [
  'rjsc',
  'trade_license',
  'etin',
  'bin_vat',
  'irc',
  'erc',
  'bida',
] as const;

const country = z
  .string()
  .trim()
  .length(2, 'invalidCountry')
  .regex(/^[A-Za-z]{2}$/, 'invalidCountry')
  .transform((v) => v.toUpperCase());

export const answersSchema = z.object({
  founder_location: z.enum(FOUNDER_LOCATIONS),
  nationality: country,
  residence: country,
  activity: z.string().trim().min(15, 'tooShort').max(1000, 'tooLong'),
  location: z.string().trim().min(2, 'requiredText').max(120, 'tooLong'),
  structure: z.enum(STRUCTURES),
  owner_count: z.number().int('invalidNumber').min(1, 'minOwners').max(200, 'tooLong'),
  director_count: z.number().int('invalidNumber').min(1, 'invalidNumber').max(200, 'tooLong'),
  foreign_owners: z.boolean(),
  entity_owner: z.boolean(),
  foreign_ownership_percent: z.number().min(0, 'percentRange').max(100, 'percentRange'),
  remit_capital: z.boolean(),
  founder_will_work: z.boolean(),
  import_export: z.enum(IMPORT_EXPORT),
  hire_employees: z.boolean(),
  regulated_activity: z.boolean(),
  need_address: z.boolean(),
  start_window: z.enum(START_WINDOWS),
  existing_business: z.boolean(),
  existing_registrations: z.array(z.enum(EXISTING_REGISTRATIONS)),
});

export type Answers = z.infer<typeof answersSchema>;
export type PartialAnswers = Partial<Answers>;
export type QuestionKey = keyof Answers;

export type QuestionKind = 'choice' | 'boolean' | 'text' | 'textarea' | 'number' | 'country' | 'multi';

export type QuestionDefinition = {
  key: QuestionKey;
  section: 'about_you' | 'the_business' | 'ownership' | 'operations' | 'timing';
  kind: QuestionKind;
  options?: readonly string[];
  /** Renders the "Why we ask" disclosure. Required for anything sensitive. */
  showWhy: boolean;
  shouldAsk: (answers: PartialAnswers) => boolean;
  schema: z.ZodTypeAny;
};

const always = () => true;

export const QUESTIONS: readonly QuestionDefinition[] = [
  {
    key: 'founder_location',
    section: 'about_you',
    kind: 'choice',
    options: FOUNDER_LOCATIONS,
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.founder_location,
  },
  {
    key: 'nationality',
    section: 'about_you',
    kind: 'country',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.nationality,
  },
  {
    key: 'residence',
    section: 'about_you',
    kind: 'country',
    showWhy: true,
    // Only worth asking separately when the founder is not in Bangladesh.
    shouldAsk: (a) => a.founder_location === 'outside',
    schema: answersSchema.shape.residence,
  },
  {
    key: 'existing_business',
    section: 'the_business',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.existing_business,
  },
  {
    key: 'existing_registrations',
    section: 'the_business',
    kind: 'multi',
    options: EXISTING_REGISTRATIONS,
    showWhy: true,
    shouldAsk: (a) => a.existing_business === true,
    schema: answersSchema.shape.existing_registrations,
  },
  {
    key: 'activity',
    section: 'the_business',
    kind: 'textarea',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.activity,
  },
  {
    key: 'location',
    section: 'the_business',
    kind: 'text',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.location,
  },
  {
    key: 'structure',
    section: 'the_business',
    kind: 'choice',
    options: STRUCTURES,
    showWhy: true,
    shouldAsk: (a) => a.existing_business !== true,
    schema: answersSchema.shape.structure,
  },
  {
    key: 'owner_count',
    section: 'ownership',
    kind: 'number',
    showWhy: true,
    shouldAsk: (a) => a.existing_business !== true,
    schema: answersSchema.shape.owner_count,
  },
  {
    key: 'director_count',
    section: 'ownership',
    kind: 'number',
    showWhy: true,
    // Directors are a company concept; a proprietorship has none.
    shouldAsk: (a) =>
      a.existing_business !== true &&
      a.structure !== 'sole_proprietorship' &&
      a.structure !== 'partnership',
    schema: answersSchema.shape.director_count,
  },
  {
    key: 'foreign_owners',
    section: 'ownership',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.foreign_owners,
  },
  {
    key: 'entity_owner',
    section: 'ownership',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.entity_owner,
  },
  {
    key: 'foreign_ownership_percent',
    section: 'ownership',
    kind: 'number',
    showWhy: true,
    shouldAsk: (a) => a.foreign_owners === true || a.founder_location === 'outside',
    schema: answersSchema.shape.foreign_ownership_percent,
  },
  {
    key: 'remit_capital',
    section: 'ownership',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: (a) => a.foreign_owners === true || a.founder_location === 'outside',
    schema: answersSchema.shape.remit_capital,
  },
  {
    key: 'founder_will_work',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: (a) => a.founder_location === 'outside',
    schema: answersSchema.shape.founder_will_work,
  },
  {
    key: 'import_export',
    section: 'operations',
    kind: 'choice',
    options: IMPORT_EXPORT,
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.import_export,
  },
  {
    key: 'hire_employees',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.hire_employees,
  },
  {
    key: 'regulated_activity',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.regulated_activity,
  },
  {
    key: 'need_address',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: (a) => a.existing_business !== true,
    schema: answersSchema.shape.need_address,
  },
  {
    key: 'start_window',
    section: 'timing',
    kind: 'choice',
    options: START_WINDOWS,
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.start_window,
  },
] as const;

/** The questions that apply given what has been answered so far. */
export function applicableQuestions(answers: PartialAnswers): QuestionDefinition[] {
  return QUESTIONS.filter((q) => q.shouldAsk(answers));
}

export function questionAt(answers: PartialAnswers, index: number): QuestionDefinition | undefined {
  return applicableQuestions(answers)[index];
}

/** Index of the first applicable question with no answer yet. */
export function firstUnansweredIndex(answers: PartialAnswers): number {
  const applicable = applicableQuestions(answers);
  const idx = applicable.findIndex((q) => answers[q.key] === undefined);
  return idx === -1 ? applicable.length : idx;
}

export function isComplete(answers: PartialAnswers): boolean {
  return applicableQuestions(answers).every((q) => answers[q.key] !== undefined);
}

/**
 * Drops answers that are no longer applicable after an earlier answer changed.
 * Without this a founder who switches from "outside Bangladesh" to "in
 * Bangladesh" would keep a stale residence answer that the engine still reads.
 */
export function pruneInapplicable(answers: PartialAnswers): PartialAnswers {
  const applicable = new Set(applicableQuestions(answers).map((q) => q.key));
  const out: PartialAnswers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (applicable.has(key as QuestionKey)) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export function validateAnswer(key: QuestionKey, value: unknown) {
  const question = QUESTIONS.find((q) => q.key === key);
  if (!question) return { success: false as const, error: 'unknownQuestion' };
  const result = question.schema.safeParse(value);
  return result.success
    ? { success: true as const, data: result.data }
    : { success: false as const, error: result.error.issues[0]?.message ?? 'requiredText' };
}
