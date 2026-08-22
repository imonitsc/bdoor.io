'use server';

import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { hashIdentifier } from '@/lib/utils/hash';
import { RateLimitError } from '@/lib/permissions/errors';
import { logger } from '@/lib/logger';
import { ensureDraftSession, getDraftSession, saveAnswer } from './session';
import { generateRecommendation, loadRules } from './recommendation';
import { recommend } from './rules';
import {
  applicableQuestions,
  firstUnansweredIndex,
  isComplete,
  validateAnswer,
  type PartialAnswers,
  type QuestionKey,
} from './questions';
import type { Recommendation } from './rules';

export type IntakeState = {
  answers: PartialAnswers;
  index: number;
  total: number;
  error?: string;
  fieldError?: string;
  recommendation?: Recommendation;
  unavailable?: boolean;
};

async function rateLimitKey(): Promise<string> {
  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
  return hashIdentifier(ip);
}

/** Reads the current draft for the initial render. */
export async function loadIntake(): Promise<IntakeState> {
  const session = await getDraftSession();
  const answers = session?.answers ?? {};
  return {
    answers,
    index: firstUnansweredIndex(answers),
    total: applicableQuestions(answers).length,
    unavailable: session === null,
  };
}

/**
 * One action handles every questionnaire intent — answering, stepping back and
 * generating the recommendation — so a single `useActionState` owns the whole
 * flow. Separate actions would each hold their own copy of the answers and
 * would immediately drift apart.
 */
export async function intakeAction(
  previous: IntakeState,
  formData: FormData,
): Promise<IntakeState> {
  const intent = String(formData.get('intent') ?? 'answer');

  if (intent === 'back') {
    const requested = Number(formData.get('index') ?? 0);
    const total = applicableQuestions(previous.answers).length;
    const index = Number.isFinite(requested) ? Math.max(0, Math.min(requested, total)) : 0;
    return { ...previous, index, fieldError: undefined, error: undefined };
  }

  if (intent === 'generate') {
    return generateIntakeRecommendation(previous);
  }

  const key = formData.get('questionKey') as QuestionKey | null;
  if (!key) return { ...previous, error: 'generic' };

  const raw = formData.getAll('value');
  const kind = String(formData.get('kind') ?? 'text');

  let value: unknown;
  switch (kind) {
    case 'boolean':
      value = raw[0] === 'true';
      break;
    case 'number':
      value = raw[0] === '' || raw[0] === undefined ? Number.NaN : Number(raw[0]);
      break;
    case 'multi':
      value = raw.map(String);
      break;
    default:
      value = raw[0] === undefined ? '' : String(raw[0]);
  }

  const validation = validateAnswer(key, value);
  if (!validation.success) {
    return { ...previous, fieldError: validation.error };
  }

  try {
    await enforceRateLimit('questionnaire.save', await rateLimitKey());
  } catch (error) {
    if (error instanceof RateLimitError) return { ...previous, error: 'rateLimited' };
    throw error;
  }

  const locale = (await getLocale()) === 'bn' ? 'bn' : 'en';
  const session = await ensureDraftSession(locale);

  if (!session) {
    // No service role configured: keep the flow usable in-memory so the
    // questionnaire can still be walked through, and say so.
    const answers = { ...previous.answers, [key]: validation.data } as PartialAnswers;
    return {
      answers,
      index: firstUnansweredIndex(answers),
      total: applicableQuestions(answers).length,
      unavailable: true,
    };
  }

  const answers = await saveAnswer(session.id, key, validation.data);

  return {
    answers,
    index: firstUnansweredIndex(answers),
    total: applicableQuestions(answers).length,
  };
}

async function generateIntakeRecommendation(previous: IntakeState): Promise<IntakeState> {
  if (!isComplete(previous.answers)) {
    return { ...previous, index: firstUnansweredIndex(previous.answers), error: 'incomplete' };
  }

  const session = await getDraftSession();

  try {
    // Without a stored session we still run the engine — only the audit
    // record is missing, and the customer sees exactly the same guidance.
    const recommendation = session
      ? await generateRecommendation(session.id, previous.answers)
      : recommend(previous.answers, await loadRules());

    return { ...previous, recommendation };
  } catch (error) {
    logger.error('intake.recommendation_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { ...previous, error: 'generic' };
  }
}
