import 'server-only';

import { getTranslations } from 'next-intl/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { getEmailProvider } from '@/lib/email';
import { logger } from '@/lib/logger';
import { targetCountrySlug, type Answers, type Objective, type PartialAnswers } from './questions';

/**
 * Application submission (immediate-operations instructions §4/§11).
 *
 * A submitted questionnaire becomes one `public.applications` row, written
 * with the service role — the same anonymous-intake surface as the draft
 * sessions, and the table accepts no other writer. The customer gets a
 * reference and an acknowledgement email; the operations queue reads the
 * row through the staff-only RLS policy.
 */

export type SubmittedApplication = {
  reference: string;
  /** /countries slug, e.g. `saudi-arabia`. */
  countrySlug: string;
  objective: Objective;
  /** False when nothing could be persisted (no database configured). */
  stored: boolean;
};

/**
 * `BD-<year>-<6 random digits>`. Random rather than sequential so a
 * reference cannot be guessed and the sequence cannot leak volume; the
 * database's unique constraint catches the rare collision and the caller
 * retries with a fresh draw.
 */
export function newApplicationReference(now = new Date()): string {
  // Rejection sampling: 2^32 is not a multiple of 10^6, so bare `%` would
  // slightly favour low residues. Redraw values at or above the largest
  // multiple of 10^6 below 2^32 (~0.02% of draws).
  const RANGE = 1_000_000;
  const LIMIT = Math.floor(2 ** 32 / RANGE) * RANGE;
  let draw: number;
  do {
    draw = crypto.getRandomValues(new Uint32Array(1))[0]!;
  } while (draw >= LIMIT);
  return `BD-${now.getUTCFullYear()}-${String(draw % RANGE).padStart(6, '0')}`;
}

export type SubmitInput = {
  answers: PartialAnswers;
  locale: 'en' | 'bn';
  packageSlug?: string;
  sourcePath?: string;
  sessionId?: string;
};

export async function submitApplication(input: SubmitInput): Promise<SubmittedApplication | null> {
  const { answers, locale } = input;
  const complete = answers as Answers;
  const countrySlug = targetCountrySlug(complete.target_country);
  const objective = complete.objective;

  if (!hasServiceRole()) {
    // Local development without a database: the flow stays walkable, the
    // page shows the "nothing is saved" notice it already shows for drafts.
    logger.warn('application.not_stored', { reason: 'no_service_role' });
    return {
      reference: newApplicationReference(),
      countrySlug,
      objective,
      stored: false,
    };
  }

  const admin = createAdminClient();
  const record = {
    country: countrySlug,
    objective,
    locale,
    full_name: complete.full_name,
    email: complete.email,
    phone: complete.phone ? complete.phone : null,
    package_slug: input.packageSlug ?? null,
    source_path: input.sourcePath ?? null,
    answers: answers as never,
    consent_given: complete.consent === true,
    session_id: input.sessionId ?? null,
  };

  // Retry only on a reference collision; anything else falls through to the
  // contact_requests fallback below.
  let lastError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = newApplicationReference();
    const { error } = await admin.from('applications').insert({ ...record, reference });
    if (!error) {
      await sendAcknowledgement(reference, complete.email, countrySlug, locale);
      return { reference, countrySlug, objective, stored: true };
    }
    lastError = error;
    if (error.code !== '23505') break;
  }

  // The table is missing until the owner applies the migration (or the
  // insert failed for another reason). Losing the lead would be worse than
  // an untyped record, so the application lands in contact_requests — which
  // exists in production — using only its original columns.
  logger.error('application.insert_failed', {
    code: lastError?.code,
    message: lastError?.message,
  });

  const reference = newApplicationReference();
  const { error: fallbackError } = await admin.from('contact_requests').insert({
    full_name: complete.full_name,
    email: complete.email,
    phone: complete.phone ? complete.phone : null,
    topic: 'startBusiness',
    message:
      `Application ${reference} (${countrySlug}, objective: ${objective}) — stored via ` +
      'fallback because the applications table was unavailable. Answers are in the ' +
      'questionnaire session' +
      (input.sessionId ? ` ${input.sessionId}` : '') +
      '.',
    locale,
    consent_given: complete.consent === true,
  });

  if (fallbackError) {
    logger.error('application.fallback_failed', {
      code: fallbackError.code,
      message: fallbackError.message,
    });
    return null;
  }

  await sendAcknowledgement(reference, complete.email, countrySlug, locale);
  return { reference, countrySlug, objective, stored: true };
}

/**
 * The immediate acknowledgement (§11.1). Best-effort: a failed email is
 * logged, never surfaced — the application is already stored and the
 * specialist review happens either way.
 */
async function sendAcknowledgement(
  reference: string,
  email: string,
  countrySlug: string,
  locale: 'en' | 'bn',
): Promise<void> {
  try {
    const t = await getTranslations({ locale, namespace: 'start.ack' });
    const tCountry = await getTranslations({ locale, namespace: 'start.questions' });
    const country = tCountry(`target_country.options.${countrySlug.replace(/-/g, '_')}`);
    await getEmailProvider().send({
      to: email,
      subject: t('subject', { reference }),
      text: t('body', { reference, country }),
      template: 'application_acknowledgement',
      locale,
    });
  } catch (error) {
    logger.error('application.ack_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}
