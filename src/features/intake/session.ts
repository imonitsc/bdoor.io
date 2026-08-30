import 'server-only';

import { cookies } from 'next/headers';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sha256 } from '@/lib/utils/hash';
import { logger } from '@/lib/logger';
import { recordAnalyticsEvent } from '@/lib/analytics';
import { pruneInapplicable, type PartialAnswers, type QuestionKey } from './questions';

/**
 * Questionnaire drafts.
 *
 * Before signup there is no user, so a draft is keyed by a high-entropy value
 * held in an httpOnly cookie. Only the SHA-256 of that value is stored, and the
 * table has no policy that lets the Data API read an anonymous row — drafts are
 * reached exclusively through this module using the service role, after the
 * cookie has been checked. A stolen key cannot be replayed against PostgREST.
 *
 * Once the visitor signs in, `claimSession` attaches the draft to their user id
 * and clears the anonymous key.
 */

const DRAFT_COOKIE = 'bdoor_draft';
const DRAFT_MAX_AGE = 60 * 60 * 24 * 30;

export type DraftSession = {
  id: string;
  answers: PartialAnswers;
  locale: 'en' | 'bn';
  userId: string | null;
  completedAt: string | null;
  /** Set once this draft produced an application; a resubmit returns it. */
  applicationReference: string | null;
};

function newDraftKey(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

async function readDraftKey(): Promise<string | null> {
  const store = await cookies();
  return store.get(DRAFT_COOKIE)?.value ?? null;
}

async function writeDraftKey(key: string): Promise<void> {
  const store = await cookies();
  store.set(DRAFT_COOKIE, key, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DRAFT_MAX_AGE,
  });
}

export async function clearDraftKey(): Promise<void> {
  const store = await cookies();
  store.delete(DRAFT_COOKIE);
}

function rowToSession(
  row: {
    id: string;
    locale: string;
    user_id: string | null;
    completed_at: string | null;
    application_reference?: string | null;
  },
  answers: PartialAnswers,
): DraftSession {
  return {
    id: row.id,
    answers,
    locale: row.locale === 'bn' ? 'bn' : 'en',
    userId: row.user_id,
    completedAt: row.completed_at,
    applicationReference: row.application_reference ?? null,
  };
}

async function loadAnswers(sessionId: string): Promise<PartialAnswers> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('questionnaire_answers')
    .select('question_key, value')
    .eq('session_id', sessionId);

  const answers: PartialAnswers = {};
  for (const row of data ?? []) {
    (answers as Record<string, unknown>)[row.question_key] = row.value;
  }
  return answers;
}

/** Loads the caller's draft, preferring their signed-in session over the cookie. */
export async function getDraftSession(): Promise<DraftSession | null> {
  if (!hasServiceRole()) return null;

  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = (claims?.claims?.sub as string | undefined) ?? null;

  if (userId) {
    const { data } = await admin
      .from('questionnaire_sessions')
      .select('id, locale, user_id, completed_at, application_reference')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return rowToSession(data, await loadAnswers(data.id));
  }

  const key = await readDraftKey();
  if (!key) return null;

  const { data } = await admin
    .from('questionnaire_sessions')
    .select('id, locale, user_id, completed_at, application_reference')
    .eq('anon_key_hash', sha256(key))
    .maybeSingle();

  if (!data) return null;
  return rowToSession(data, await loadAnswers(data.id));
}

export async function ensureDraftSession(locale: 'en' | 'bn'): Promise<DraftSession | null> {
  const existing = await getDraftSession();
  // A session that already produced an application is closed: reusing it
  // would make the idempotent-submit stamp return the OLD reference for a
  // genuinely new application. Start a fresh session instead.
  if (existing && !existing.applicationReference) return existing;
  if (!hasServiceRole()) return null;

  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = (claims?.claims?.sub as string | undefined) ?? null;

  const key = newDraftKey();
  const { data, error } = await admin
    .from('questionnaire_sessions')
    .insert({
      user_id: userId,
      anon_key_hash: userId ? null : sha256(key),
      locale,
    })
    .select('id, locale, user_id, completed_at, application_reference')
    .single();

  if (error || !data) {
    logger.error('intake.create_session_failed', { message: error?.message });
    return null;
  }

  // One funnel event per draft session, at first persistence. No answers have
  // been given yet, so there is nothing personal to attach.
  await recordAnalyticsEvent({
    event: 'application_started',
    idempotencyKey: `application_started:${data.id}`,
    locale,
    properties: { authenticated: userId !== null },
  });

  if (!userId) await writeDraftKey(key);
  return rowToSession(data, {});
}

export async function saveAnswer(
  sessionId: string,
  key: QuestionKey,
  value: unknown,
): Promise<PartialAnswers> {
  const admin = createAdminClient();

  await admin
    .from('questionnaire_answers')
    .upsert(
      { session_id: sessionId, question_key: key, value: value as never },
      { onConflict: 'session_id,question_key' },
    );

  // Changing an earlier answer can make later ones inapplicable. Drop those
  // rather than leaving stale values the recommendation engine would read.
  const answers = await loadAnswers(sessionId);
  const pruned = pruneInapplicable(answers);
  const removed = Object.keys(answers).filter((k) => !(k in pruned));

  if (removed.length > 0) {
    await admin
      .from('questionnaire_answers')
      .delete()
      .eq('session_id', sessionId)
      .in('question_key', removed);
  }

  await admin.from('questionnaire_sessions').update({ current_step: key }).eq('id', sessionId);

  return pruned;
}

/**
 * Stamps the reference of the application a draft produced. From here the
 * session is closed: `loadIntake` renders the confirmation instead of the
 * form, a repeat submit returns this same reference, and `ensureDraftSession`
 * starts a new session for the next application.
 */
export async function markDraftSubmitted(sessionId: string, reference: string): Promise<void> {
  if (!hasServiceRole()) return;
  const { error } = await createAdminClient()
    .from('questionnaire_sessions')
    .update({ application_reference: reference, completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .is('application_reference', null);
  if (error) {
    logger.warn('intake.mark_submitted_failed', { message: error.message });
  }
}

/**
 * Discards the caller's stored draft (hotfix §2 "Start a new application"):
 * the session's answers are deleted server-side and the anonymous draft
 * cookie cleared, so neither this device nor the next load resurrects the
 * old routing. The session row itself may remain — it holds nothing once
 * its answers are gone.
 */
export async function resetDraft(): Promise<void> {
  if (hasServiceRole()) {
    const session = await getDraftSession();
    if (session) {
      const admin = createAdminClient();
      await admin.from('questionnaire_answers').delete().eq('session_id', session.id);
    }
  }
  await clearDraftKey();
}

/** Attaches an anonymous draft to a user after signup or sign-in. */
export async function claimDraftForUser(userId: string): Promise<void> {
  if (!hasServiceRole()) return;
  const key = await readDraftKey();
  if (!key) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from('questionnaire_sessions')
    .update({ user_id: userId, anon_key_hash: null, claimed_at: new Date().toISOString() })
    .eq('anon_key_hash', sha256(key))
    .is('user_id', null);

  if (error) {
    logger.warn('intake.claim_failed', { message: error.message });
    return;
  }
  await clearDraftKey();
}
