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
import { submitApplication, type SubmittedApplication } from './application';
import {
  applicableQuestions,
  answersImpliedByMarketScope,
  asQuestionKey,
  firstUnansweredIndex,
  isComplete,
  validateAnswer,
  type MarketScope,
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
  submitted?: SubmittedApplication;
  unavailable?: boolean;
  /** Validated ?package= slug the visitor arrived from, if any. */
  packageSlug?: string;
  /** Path (with query) of the /start URL that seeded any preset answers. */
  sourcePath?: string;
};

/** Pre-seeded answers from validated /start query parameters. */
export type IntakePreset = {
  answers: PartialAnswers;
  packageSlug?: string;
  sourcePath?: string;
};

async function rateLimitKey(): Promise<string> {
  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
  return hashIdentifier(ip);
}

/** Reads the current draft for the initial render. */
export async function loadIntake(preset?: IntakePreset): Promise<IntakeState> {
  const session = await getDraftSession();
  const answers = { ...session?.answers } as PartialAnswers;

  // Preset answers (a validated ?country=/&objective=) fill gaps only: a
  // saved draft answer always wins over a link parameter, so following a
  // country CTA never silently rewrites an application in progress. The
  // write target is always the canonical key from the question model, never
  // the incoming string — no query parameter can name a property here.
  for (const [key, value] of Object.entries(preset?.answers ?? {})) {
    const qk = asQuestionKey(key);
    if (qk !== undefined && answers[qk] === undefined) {
      (answers as Record<string, unknown>)[qk] = value;
    }
  }

  return {
    answers,
    index: firstUnansweredIndex(answers),
    total: applicableQuestions(answers).length,
    unavailable: session === null,
    packageSlug: preset?.packageSlug,
    sourcePath: preset?.sourcePath,
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

  if (intent === 'submit') {
    const rawAnswers = formData.get('answers');
    if (typeof rawAnswers === 'string' && rawAnswers.length > 0) {
      try {
        const parsed = JSON.parse(rawAnswers) as Record<string, unknown>;
        const clientAnswers: PartialAnswers = { ...previous.answers };
        for (const [rawKey, rawValue] of Object.entries(parsed)) {
          const qk = asQuestionKey(rawKey);
          if (qk === undefined) continue;
          const revalidated = validateAnswer(qk, rawValue);
          if (!revalidated.success) continue;
          (clientAnswers as Record<string, unknown>)[qk] = revalidated.data;
        }
        return submitIntakeApplication({
          ...previous,
          answers: clientAnswers,
        });
      } catch {
        // Fall through to previous.answers if the client payload is malformed.
      }
    }
    return submitIntakeApplication(previous);
  }

  const key = asQuestionKey(String(formData.get('questionKey') ?? ''));
  if (!key) return { ...previous, error: 'generic' };

  const raw = formData.getAll('value');
  const kind = String(formData.get('kind') ?? 'text');

  let value: unknown;
  switch (kind) {
    case 'boolean':
      value = raw[0] === 'true';
      break;
    case 'consent':
      // An unchecked checkbox submits nothing at all.
      value = raw.includes('true');
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
    let answers = { ...previous.answers, [key]: validation.data } as PartialAnswers;
    if (key === 'market_scope') {
      answers = { ...answers, ...answersImpliedByMarketScope(validation.data as MarketScope) };
    }
    return {
      ...previous,
      answers,
      index: firstUnansweredIndex(answers),
      total: applicableQuestions(answers).length,
      unavailable: true,
      fieldError: undefined,
      error: undefined,
    };
  }

  let answers = await saveAnswer(session.id, key, validation.data);

  // Production-fix: Bangladesh / Outside implies target_country when BD.
  if (key === 'market_scope') {
    const implied = answersImpliedByMarketScope(validation.data as MarketScope);
    for (const [impliedKey, impliedValue] of Object.entries(implied)) {
      const qk = asQuestionKey(impliedKey);
      if (qk === undefined || qk === 'market_scope' || impliedValue === undefined) continue;
      answers = await saveAnswer(session.id, qk, impliedValue);
    }
  }

  // Preset answers seeded from the /start URL live only in the action state
  // until now; persist any that are still applicable and unstored so a
  // reload keeps the chosen country. The applicability check matters: after
  // an earlier answer changes, `saveAnswer` prunes answers that stopped
  // applying, and this loop must not quietly resurrect them.
  // Action state makes a round trip through the client, so every key is
  // resolved to its canonical form and every value re-validated before it
  // is stored — nothing client-shaped names a property or reaches the
  // database as-is.
  const applicable = new Set(applicableQuestions(answers).map((q) => q.key));
  for (const [presetKey, presetValue] of Object.entries(previous.answers)) {
    const qk = asQuestionKey(presetKey);
    if (qk === undefined || qk === key || answers[qk] !== undefined || !applicable.has(qk)) {
      continue;
    }
    const revalidated = validateAnswer(qk, presetValue);
    if (!revalidated.success) continue;
    answers = await saveAnswer(session.id, qk, revalidated.data);
  }

  return {
    ...previous,
    answers,
    index: firstUnansweredIndex(answers),
    total: applicableQuestions(answers).length,
    fieldError: undefined,
    error: undefined,
  };
}

async function submitIntakeApplication(previous: IntakeState): Promise<IntakeState> {
  if (!isComplete(previous.answers)) {
    return { ...previous, index: firstUnansweredIndex(previous.answers), error: 'incomplete' };
  }

  try {
    await enforceRateLimit('application.submit', await rateLimitKey());
  } catch (error) {
    if (error instanceof RateLimitError) return { ...previous, error: 'rateLimited' };
    throw error;
  }

  const session = await getDraftSession();
  const locale = (await getLocale()) === 'bn' ? 'bn' : 'en';

  try {
    const submitted = await submitApplication({
      answers: previous.answers,
      locale,
      packageSlug: previous.packageSlug,
      sourcePath: previous.sourcePath,
      sessionId: session?.id,
    });
    if (!submitted) return { ...previous, error: 'generic' };

    // A Bangladesh application still gets the preliminary recommendation the
    // operating market supports; an international one goes straight to the
    // specialist queue, so running the Bangladesh rules would only mislead.
    let recommendation: Recommendation | undefined;
    if (previous.answers.target_country === 'bangladesh') {
      recommendation = session
        ? await generateRecommendation(session.id, previous.answers)
        : recommend(previous.answers, await loadRules());
    }

    return { ...previous, submitted, recommendation, error: undefined, fieldError: undefined };
  } catch (error) {
    logger.error('intake.submit_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { ...previous, error: 'generic' };
  }
}

/**
 * Non-blocking background persist for ordinary Next/Back navigation.
 * Does not return navigation state — the client advances immediately and
 * only uses this to keep the server draft in sync when a session exists.
 */
export async function persistAnswerBackground(
  key: QuestionKey,
  value: unknown,
): Promise<{ ok: true } | { ok: false; reason: 'validation' | 'unavailable' | 'rateLimited' }> {
  const validation = validateAnswer(key, value);
  if (!validation.success) return { ok: false, reason: 'validation' };

  try {
    await enforceRateLimit('questionnaire.save', await rateLimitKey());
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, reason: 'rateLimited' };
    throw error;
  }

  const locale = (await getLocale()) === 'bn' ? 'bn' : 'en';
  const session = await ensureDraftSession(locale);
  if (!session) return { ok: false, reason: 'unavailable' };

  let answers = await saveAnswer(session.id, key, validation.data);
  if (key === 'market_scope') {
    const implied = answersImpliedByMarketScope(validation.data as MarketScope);
    for (const [impliedKey, impliedValue] of Object.entries(implied)) {
      const qk = asQuestionKey(impliedKey);
      if (qk === undefined || qk === 'market_scope' || impliedValue === undefined) continue;
      answers = await saveAnswer(session.id, qk, impliedValue);
    }
  }
  void answers;
  return { ok: true };
}
