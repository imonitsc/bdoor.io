import { z } from 'zod';

import { SECTORS } from './sectors';

/**
 * Adding an existing company to the workspace (ROADMAP P2 "track this for
 * your company"). One schema for the client form and the server action.
 * Error values are translation keys, never prose — the UI passes them to
 * the translator.
 */

/** companies.structure check constraint, verbatim. */
export const COMPANY_STRUCTURES = [
  'private_limited',
  'one_person',
  'partnership',
  'sole_proprietorship',
  'branch_office',
  'liaison_office',
] as const;

export type CompanyStructure = (typeof COMPANY_STRUCTURES)[number];

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Identifier shape (P3): permissive on purpose. Registry formats are
 * regulatory facts and an over-strict pattern here would lock a real company
 * out of its own calendar, so validation stops at "plausibly an identifier".
 */
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const identifier = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .min(2, 'identifierInvalid')
    .max(40, 'identifierInvalid')
    .regex(/^[A-Za-z0-9/\- .]+$/, 'identifierInvalid')
    .optional(),
);

export const trackCompanySchema = z.object({
  legalName: z.string().trim().min(2, 'nameTooShort').max(200, 'nameTooLong'),
  structure: z.enum(COMPANY_STRUCTURES, { message: 'structureInvalid' }),
  /** Empty = unknown: sector-scoped rules surface "may apply" (never silent). */
  sector: z.preprocess(blankToUndefined, z.enum(SECTORS, { message: 'sectorInvalid' }).optional()),
  /** BD identifiers (CLAUDE.md §6): RJSC number, e-TIN, BIN/VAT. */
  registrationNo: identifier,
  etin: identifier,
  bin: identifier,
  // Optional: an existing company usually knows its incorporation date, and
  // the P1 anniversary rules need it — but its absence only narrows the
  // generated calendar, it never blocks tracking.
  incorporationDate: z
    .string()
    .trim()
    .regex(isoDate, 'dateInvalid')
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'dateInvalid')
    .refine((value) => value <= new Date().toISOString().slice(0, 10), 'dateInFuture')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type TrackCompanyInput = z.infer<typeof trackCompanySchema>;
