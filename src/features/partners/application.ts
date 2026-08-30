import { z } from 'zod';

/**
 * Provider application model (portals spec §7), shared by the client form and
 * the Server Actions so exactly one validation rule exists per field. Error
 * values are translator keys, never Zod prose — the UI passes them through
 * `partnersApply.errors.*`.
 */

export const FIRM_CATEGORIES = [
  'law_firm',
  'advocate',
  'chartered_accountant',
  'tax_vat_practice',
  'company_secretarial',
  'trade_licence_specialist',
  'accounting_payroll',
  'immigration_specialist',
  'overseas_formation_provider',
  'registered_agent',
  'foreign_tax_agent',
  'bank_support_provider',
  'notary_legalisation',
  'translation_provider',
  'consultancy',
  'other',
] as const;
export type FirmCategory = (typeof FIRM_CATEGORIES)[number];

/** The jurisdictions bdoor currently coordinates; matches public.countries. */
export const APPLICATION_JURISDICTIONS = [
  'bangladesh',
  'usa',
  'uk',
  'uae',
  'saudi-arabia',
  'qatar',
  'singapore',
] as const;
export type ApplicationJurisdiction = (typeof APPLICATION_JURISDICTIONS)[number];

/** Which draft policy text the applicant accepted; recorded on submission. */
export const PROVIDER_TERMS_VERSION = 'provider-terms-1.0-2026-08-30';

const requiredText = (max = 400) => z.string().trim().min(2, 'requiredText').max(max, 'tooLong');
const optionalText = (max = 2000) => z.string().trim().max(max, 'tooLong').optional();
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'invalidDate')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const STEP_SCHEMAS = {
  firm: z.object({
    legal_name: requiredText(200),
    trading_name: optionalText(200),
    registration_no: optionalText(120),
    established_on: optionalDate,
    firm_category: z.enum(FIRM_CATEGORIES, { message: 'requiredChoice' }),
    registered_address: requiredText(600),
    operating_address: optionalText(600),
    website: optionalText(300),
    official_email_domain: optionalText(120),
    contact_name: requiredText(200),
    contact_email: z.string().trim().toLowerCase().email('invalidEmail').max(254, 'tooLong'),
    contact_phone: optionalText(40),
    signatory_name: requiredText(200),
  }),
  ownership: z.object({
    // One owner/partner/director per line; parsed into a JSON array server-side.
    owners_text: requiredText(2000),
    related_entities_note: optionalText(2000),
    sanctions_declaration: z.literal(true, { message: 'declarationRequired' }),
    integrity_declaration: z.literal(true, { message: 'declarationRequired' }),
  }),
  standing: z.object({
    regulator_name: requiredText(300),
    licence_no: requiredText(120),
    licence_expires_on: optionalDate,
    disciplinary_declaration: z.literal(true, { message: 'declarationRequired' }),
    indemnity_insurer: optionalText(300),
    indemnity_expires_on: optionalDate,
  }),
  services: z.object({
    requested_categories: z
      .array(z.enum(FIRM_CATEGORIES))
      .min(1, 'requiredChoice')
      .max(FIRM_CATEGORIES.length),
    jurisdictions: z
      .array(z.enum(APPLICATION_JURISDICTIONS))
      .min(1, 'requiredChoice')
      .max(APPLICATION_JURISDICTIONS.length),
    services_note: requiredText(2000),
    languages_text: optionalText(300),
    turnaround_note: optionalText(1000),
    capacity_note: optionalText(1000),
    fee_note: optionalText(1000),
  }),
  controls: z.object({
    conflict_process_note: requiredText(2000),
    complaint_process_note: requiredText(2000),
    security_note: optionalText(2000),
    retention_note: optionalText(2000),
    subcontractors_note: optionalText(2000),
    continuity_note: optionalText(2000),
  }),
  declarations: z.object({
    accuracy_confirmed: z.literal(true, { message: 'declarationRequired' }),
    authority_confirmed: z.literal(true, { message: 'declarationRequired' }),
    terms_accepted: z.literal(true, { message: 'declarationRequired' }),
  }),
} as const;

export type ApplicationStepKey = keyof typeof STEP_SCHEMAS;
export const APPLICATION_STEPS = Object.keys(STEP_SCHEMAS) as readonly ApplicationStepKey[];

export type StepValues<K extends ApplicationStepKey> = z.infer<(typeof STEP_SCHEMAS)[K]>;
export type ApplicationDraftValues = {
  [K in ApplicationStepKey]?: Partial<StepValues<K>>;
};

/**
 * The validation messages the UI knows how to translate; anything else — a
 * Zod default like "Invalid input: expected string" for a wholly missing
 * field — maps to the generic required key, mirroring validateAnswer() in
 * the questionnaire.
 */
const APPLICATION_ERROR_KEYS = new Set([
  'requiredText',
  'tooLong',
  'requiredChoice',
  'invalidEmail',
  'invalidDate',
  'declarationRequired',
]);

export function applicationErrorKey(message: string): string {
  return APPLICATION_ERROR_KEYS.has(message) ? message : 'requiredText';
}

/** The applicant-visible statuses the journey can show. */
export type ProviderApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'needs_information'
  | 'verification_in_progress'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'suspended'
  | 'offboarded';

/**
 * Mirror of app.enforce_provider_application_transition() — the database is
 * authoritative; this map lets the application refuse an illegal transition
 * with a friendly error before the round trip, and the unit suite fails if
 * the two ever drift (tests/unit/provider-application.test.ts reads the
 * migration file and compares).
 */
export const PROVIDER_APPLICATION_TRANSITIONS: Record<
  ProviderApplicationStatus,
  readonly ProviderApplicationStatus[]
> = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_review', 'withdrawn'],
  under_review: ['needs_information', 'verification_in_progress', 'rejected', 'withdrawn'],
  needs_information: ['under_review', 'submitted', 'withdrawn'],
  verification_in_progress: ['approved', 'needs_information', 'rejected', 'withdrawn'],
  approved: ['suspended', 'offboarded'],
  rejected: [],
  withdrawn: [],
  suspended: ['approved', 'offboarded'],
  offboarded: [],
};

export function canTransitionApplication(
  from: ProviderApplicationStatus,
  to: ProviderApplicationStatus,
): boolean {
  return PROVIDER_APPLICATION_TRANSITIONS[from].includes(to);
}

/**
 * `PP-<year>-<6 random digits>` — random for the same reason as customer
 * application references: a sequence would leak volume and let one firm
 * probe for another's reference. Rejection sampling avoids modulo bias.
 */
export function newProviderApplicationReference(now = new Date()): string {
  const RANGE = 1_000_000;
  const LIMIT = Math.floor(2 ** 32 / RANGE) * RANGE;
  let draw: number;
  do {
    draw = crypto.getRandomValues(new Uint32Array(1))[0]!;
  } while (draw >= LIMIT);
  return `PP-${now.getUTCFullYear()}-${String(draw % RANGE).padStart(6, '0')}`;
}

/** Splits a one-per-line textarea into a trimmed, bounded JSON-safe array. */
export function linesToList(value: string, maxItems = 40): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

/** Splits a comma-separated languages field the same way. */
export function commaToList(value: string | undefined, maxItems = 20): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}
