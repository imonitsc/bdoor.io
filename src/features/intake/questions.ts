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

/**
 * The application is country-first (immediate-operations instructions §4.1):
 * the seven operating countries, Bangladesh first, no "not sure" — a visitor
 * who has not chosen a country is choosing one here. Keys mirror the
 * /countries slugs (snake-cased for the translator); `targetCountrySlug`
 * converts back. Every international target goes to manual review — see
 * `hardManualReviewReasons` — because a specialist reviews each case before
 * a provider is appointed.
 */
export const TARGET_COUNTRIES = [
  'bangladesh',
  'usa',
  'uk',
  'uae',
  'saudi_arabia',
  'qatar',
  'singapore',
] as const;

export type TargetCountry = (typeof TARGET_COUNTRIES)[number];

/** The /countries path segment for a `target_country` answer. */
export function targetCountrySlug(key: TargetCountry): string {
  return key.replace(/_/g, '-');
}

/** Reverse of `targetCountrySlug`, for validating a ?country= parameter. */
export function targetCountryFromSlug(slug: string): TargetCountry | undefined {
  const key = slug.replace(/-/g, '_');
  return TARGET_COUNTRIES.find((c) => c === key);
}

/** What the applicant wants to do in the chosen country (§4.1 step 2). */
export const OBJECTIVES = ['new', 'existing', 'expand', 'unsure'] as const;

export type Objective = (typeof OBJECTIVES)[number];

/**
 * First assessment question (65/35 master §13): where the visitor needs help.
 * Bangladesh new/existing can skip the country + objective questions; the
 * other two still ask which country (and, for unsure, the objective).
 */
export const HELP_SCOPES = [
  'bangladesh_new',
  'bangladesh_existing',
  'international',
  'unsure',
] as const;

export type HelpScope = (typeof HELP_SCOPES)[number];

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
  .length(2, 'requiredChoice')
  .regex(/^[A-Za-z]{2}$/, 'requiredChoice')
  .transform((v) => v.toUpperCase());

export const answersSchema = z.object({
  help_scope: z.enum(HELP_SCOPES, { message: 'requiredChoice' }),
  target_country: z.enum(TARGET_COUNTRIES, { message: 'requiredChoice' }),
  objective: z.enum(OBJECTIVES, { message: 'requiredChoice' }),
  founder_location: z.enum(FOUNDER_LOCATIONS, { message: 'requiredChoice' }),
  nationality: country,
  residence: country,
  activity: z.string().trim().min(15, 'tooShort').max(1000, 'tooLong'),
  location: z.string().trim().min(2, 'requiredText').max(120, 'tooLong'),
  structure: z.enum(STRUCTURES, { message: 'requiredChoice' }),
  owner_count: z
    .number({ message: 'invalidNumber' })
    .int('invalidNumber')
    .min(1, 'minOwners')
    .max(200, 'tooLong'),
  director_count: z
    .number({ message: 'invalidNumber' })
    .int('invalidNumber')
    .min(1, 'invalidNumber')
    .max(200, 'tooLong'),
  foreign_owners: z.boolean({ message: 'requiredChoice' }),
  entity_owner: z.boolean({ message: 'requiredChoice' }),
  foreign_ownership_percent: z
    .number({ message: 'invalidNumber' })
    .min(0, 'percentRange')
    .max(100, 'percentRange'),
  remit_capital: z.boolean({ message: 'requiredChoice' }),
  founder_will_work: z.boolean({ message: 'requiredChoice' }),
  import_export: z.enum(IMPORT_EXPORT, { message: 'requiredChoice' }),
  hire_employees: z.boolean({ message: 'requiredChoice' }),
  regulated_activity: z.boolean({ message: 'requiredChoice' }),
  need_address: z.boolean({ message: 'requiredChoice' }),
  start_window: z.enum(START_WINDOWS, { message: 'requiredChoice' }),
  existing_business: z.boolean({ message: 'requiredChoice' }),
  existing_registrations: z.array(z.enum(EXISTING_REGISTRATIONS, { message: 'requiredChoice' })),
  need_visa: z.boolean({ message: 'requiredChoice' }),
  need_banking: z.boolean({ message: 'requiredChoice' }),
  notes: z.string().trim().max(1000, 'tooLong'),
  full_name: z.string().trim().min(2, 'requiredText').max(120, 'tooLong'),
  email: z.string().trim().toLowerCase().email('invalidEmail').max(254, 'tooLong'),
  phone: z.string().trim().max(32, 'tooLong'),
  consent: z.literal(true, { message: 'consentRequired' }),
});

export type Answers = z.infer<typeof answersSchema>;
export type PartialAnswers = Partial<Answers>;
export type QuestionKey = keyof Answers;

export type QuestionKind =
  | 'choice'
  | 'boolean'
  | 'text'
  | 'textarea'
  | 'number'
  | 'country'
  | 'multi'
  | 'email'
  | 'phone'
  | 'consent';

export type QuestionDefinition = {
  key: QuestionKey;
  section: 'about_you' | 'the_business' | 'ownership' | 'operations' | 'timing' | 'contact';
  kind: QuestionKind;
  options?: readonly string[];
  /** Renders the "Why we ask" disclosure. Required for anything sensitive. */
  showWhy: boolean;
  /**
   * Whether `start.questions.<key>.help` exists. Declared rather than probed:
   * the translator has no "does this key exist" API, so a missing lookup would
   * render the raw key path into the page.
   */
  hasHelp?: boolean;
  /** May be submitted empty; the input renders without `required`. */
  optional?: boolean;
  shouldAsk: (answers: PartialAnswers) => boolean;
  schema: z.ZodTypeAny;
};

const always = () => true;

/**
 * Branch predicates. The two paths after country + objective (§4.2/§4.5):
 * Bangladesh gets the full operating-market question set; an international
 * target gets the shorter specialist-review subset, because the provider
 * confirms the rest per case and nothing beyond it is needed to review.
 */
const isBangladesh = (a: PartialAnswers) => a.target_country === 'bangladesh';
const isInternational = (a: PartialAnswers) =>
  a.target_country !== undefined && a.target_country !== 'bangladesh';
/**
 * "Managing an existing business" either directly (objective) or via the
 * follow-up question a "not sure" answer triggers. "Expand" means forming
 * something new in the target country, so it takes the new-business path.
 */
const managesExistingBusiness = (a: PartialAnswers) =>
  a.objective === 'existing' || (a.objective === 'unsure' && a.existing_business === true);

/** Derive country/objective implied by the master help_scope question. */
export function answersImpliedByHelpScope(scope: HelpScope): PartialAnswers {
  switch (scope) {
    case 'bangladesh_new':
      return { help_scope: scope, target_country: 'bangladesh', objective: 'new' };
    case 'bangladesh_existing':
      return { help_scope: scope, target_country: 'bangladesh', objective: 'existing' };
    case 'international':
      return { help_scope: scope };
    case 'unsure':
      return { help_scope: scope };
  }
}

/** Reverse of answersImpliedByHelpScope for URL presets. */
export function helpScopeFromPreset(
  country?: TargetCountry,
  objective?: Objective,
): HelpScope | undefined {
  if (country === 'bangladesh' && objective === 'existing') return 'bangladesh_existing';
  if (country === 'bangladesh') return 'bangladesh_new';
  if (country) return 'international';
  return undefined;
}

export const QUESTIONS: readonly QuestionDefinition[] = [
  {
    key: 'help_scope',
    section: 'about_you',
    kind: 'choice',
    options: HELP_SCOPES,
    showWhy: true,
    // Always applicable so pruneInapplicable never drops the master first answer.
    shouldAsk: always,
    schema: answersSchema.shape.help_scope,
  },
  {
    key: 'target_country',
    section: 'about_you',
    kind: 'choice',
    options: TARGET_COUNTRIES,
    showWhy: true,
    shouldAsk: (a) => {
      // Keep a derived/preset answer in the applicable set so prune cannot drop it.
      if (a.target_country !== undefined) return true;
      return (
        a.help_scope === 'international' || a.help_scope === 'unsure' || a.help_scope === undefined
      );
    },
    schema: answersSchema.shape.target_country,
  },
  {
    key: 'objective',
    section: 'about_you',
    kind: 'choice',
    options: OBJECTIVES,
    showWhy: true,
    shouldAsk: (a) => {
      if (a.objective !== undefined) return true;
      return (
        a.help_scope === 'international' || a.help_scope === 'unsure' || a.help_scope === undefined
      );
    },
    schema: answersSchema.shape.objective,
  },
  {
    key: 'founder_location',
    section: 'about_you',
    kind: 'choice',
    options: FOUNDER_LOCATIONS,
    hasHelp: true,
    showWhy: true,
    shouldAsk: isBangladesh,
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
    // In Bangladesh only worth asking separately when the founder is not
    // there; for an international application it is always material.
    shouldAsk: (a) => (isBangladesh(a) && a.founder_location === 'outside') || isInternational(a),
    schema: answersSchema.shape.residence,
  },
  {
    key: 'existing_business',
    section: 'the_business',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: (a) => isBangladesh(a) && a.objective === 'unsure',
    schema: answersSchema.shape.existing_business,
  },
  {
    key: 'existing_registrations',
    section: 'the_business',
    kind: 'multi',
    options: EXISTING_REGISTRATIONS,
    showWhy: true,
    shouldAsk: (a) => isBangladesh(a) && managesExistingBusiness(a),
    schema: answersSchema.shape.existing_registrations,
  },
  {
    key: 'activity',
    section: 'the_business',
    kind: 'textarea',
    hasHelp: true,
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.activity,
  },
  {
    key: 'location',
    section: 'the_business',
    kind: 'text',
    hasHelp: true,
    showWhy: true,
    shouldAsk: isBangladesh,
    schema: answersSchema.shape.location,
  },
  {
    key: 'structure',
    section: 'the_business',
    kind: 'choice',
    options: STRUCTURES,
    showWhy: true,
    shouldAsk: (a) => isBangladesh(a) && !managesExistingBusiness(a),
    schema: answersSchema.shape.structure,
  },
  {
    key: 'owner_count',
    section: 'ownership',
    kind: 'number',
    showWhy: true,
    shouldAsk: (a) => isInternational(a) || (isBangladesh(a) && !managesExistingBusiness(a)),
    schema: answersSchema.shape.owner_count,
  },
  {
    key: 'director_count',
    section: 'ownership',
    kind: 'number',
    showWhy: true,
    // Directors are a company concept; a proprietorship has none.
    shouldAsk: (a) =>
      isBangladesh(a) &&
      !managesExistingBusiness(a) &&
      a.structure !== 'sole_proprietorship' &&
      a.structure !== 'partnership',
    schema: answersSchema.shape.director_count,
  },
  {
    key: 'foreign_owners',
    section: 'ownership',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: isBangladesh,
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
    shouldAsk: (a) =>
      isBangladesh(a) && (a.foreign_owners === true || a.founder_location === 'outside'),
    schema: answersSchema.shape.foreign_ownership_percent,
  },
  {
    key: 'remit_capital',
    section: 'ownership',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: (a) =>
      isBangladesh(a) && (a.foreign_owners === true || a.founder_location === 'outside'),
    schema: answersSchema.shape.remit_capital,
  },
  {
    key: 'founder_will_work',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: (a) => isBangladesh(a) && a.founder_location === 'outside',
    schema: answersSchema.shape.founder_will_work,
  },
  {
    key: 'import_export',
    section: 'operations',
    kind: 'choice',
    options: IMPORT_EXPORT,
    showWhy: true,
    shouldAsk: isBangladesh,
    schema: answersSchema.shape.import_export,
  },
  {
    key: 'hire_employees',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: isBangladesh,
    schema: answersSchema.shape.hire_employees,
  },
  {
    key: 'regulated_activity',
    section: 'operations',
    kind: 'boolean',
    hasHelp: true,
    showWhy: true,
    shouldAsk: isBangladesh,
    schema: answersSchema.shape.regulated_activity,
  },
  {
    key: 'need_address',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: (a) => isBangladesh(a) && !managesExistingBusiness(a),
    schema: answersSchema.shape.need_address,
  },
  {
    key: 'need_visa',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: isInternational,
    schema: answersSchema.shape.need_visa,
  },
  {
    key: 'need_banking',
    section: 'operations',
    kind: 'boolean',
    showWhy: true,
    shouldAsk: isInternational,
    schema: answersSchema.shape.need_banking,
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
  {
    key: 'notes',
    section: 'timing',
    kind: 'textarea',
    showWhy: false,
    optional: true,
    shouldAsk: isInternational,
    schema: answersSchema.shape.notes,
  },
  // The contact stage (§4.5): who the acknowledgement and specialist review
  // go to. Deliberately the last stage — everything before it works without
  // any personal detail — and deliberately NO identity documents: passports,
  // NIDs and the like are never collected at application time.
  {
    key: 'full_name',
    section: 'contact',
    kind: 'text',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.full_name,
  },
  {
    key: 'email',
    section: 'contact',
    kind: 'email',
    showWhy: true,
    shouldAsk: always,
    schema: answersSchema.shape.email,
  },
  {
    key: 'phone',
    section: 'contact',
    kind: 'phone',
    showWhy: false,
    optional: true,
    shouldAsk: always,
    schema: answersSchema.shape.phone,
  },
  {
    key: 'consent',
    section: 'contact',
    kind: 'consent',
    showWhy: false,
    shouldAsk: always,
    schema: answersSchema.shape.consent,
  },
] as const;

/** The questions that apply given what has been answered so far. */
export function applicableQuestions(answers: PartialAnswers): QuestionDefinition[] {
  return QUESTIONS.filter((q) => q.shouldAsk(answers));
}

/**
 * The five stages of the questionnaire, in order. Progress is presented per
 * stage, never as "question X of Y": conditional questions legitimately
 * appear and disappear as answers arrive, so a question count makes the
 * visible progress jump (Step 1 of 16 → Step 3 of 15) and look broken. The
 * stage a question belongs to never changes, so the stage indicator only
 * ever moves when the founder actually crosses a stage boundary.
 */
export const STAGES = [
  'about_you',
  'the_business',
  'ownership',
  'operations',
  'timing',
  'contact',
] as const;

export type Stage = (typeof STAGES)[number];

export type StageProgress = {
  /** 1-based stage number; at review this is STAGES.length + 1. */
  current: number;
  total: number;
  stage: Stage | 'review';
};

/** Stable stage-based progress for the question at `index` (review beyond). */
export function stageProgress(answers: PartialAnswers, index: number): StageProgress {
  const question = applicableQuestions(answers)[index];
  if (!question) {
    return { current: STAGES.length + 1, total: STAGES.length, stage: 'review' };
  }
  const stageIndex = STAGES.indexOf(question.section);
  return { current: stageIndex + 1, total: STAGES.length, stage: question.section };
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

/**
 * The validation messages the UI knows how to translate. Anything else — a Zod
 * default like "Invalid option: expected one of ..." — is mapped to a generic
 * key, because feeding raw library prose to the translator renders the message
 * itself as a missing key in the page.
 */
const VALIDATION_KEYS = new Set([
  'requiredChoice',
  'requiredText',
  'tooShort',
  'tooLong',
  'invalidNumber',
  'percentRange',
  'minOwners',
  'invalidEmail',
  'consentRequired',
]);

export function validateAnswer(key: QuestionKey, value: unknown) {
  const question = QUESTIONS.find((q) => q.key === key);
  if (!question) return { success: false as const, error: 'requiredText' };

  const result = question.schema.safeParse(value);
  if (result.success) return { success: true as const, data: result.data };

  const message = result.error.issues[0]?.message ?? '';
  const fallback =
    question.kind === 'consent'
      ? 'consentRequired'
      : question.kind === 'choice' || question.kind === 'boolean' || question.kind === 'multi'
        ? 'requiredChoice'
        : 'requiredText';

  return { success: false as const, error: VALIDATION_KEYS.has(message) ? message : fallback };
}
