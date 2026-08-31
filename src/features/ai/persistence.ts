import 'server-only';

import { LIMITS } from './config';
import { aiDb, hasAiDatabase } from './db';
import type { Database } from '@/types/database';
import { messageTelemetry, redactSensitive } from './redaction';
import { logger } from '@/lib/logger';

/**
 * Conversation, message and usage persistence.
 *
 * Ordering is the point of this module. The conversation row is created
 * *before* the model is called, so an answer that fails halfway — a timeout, a
 * dropped stream, a budget rejection — still has a home to be recorded
 * against. A transcript that only exists for successful answers is a
 * transcript that hides exactly the cases worth reviewing.
 *
 * Everything written here has been through `redactSensitive` first.
 */

/**
 * `public.ai_completion_status`, taken from the generated schema rather than
 * restated. A hand-written copy of an enum drifts, and the drift only shows up
 * as a failed insert on the unhappy path — which is the path that matters here.
 */
export type CompletionStatus = Database['public']['Enums']['ai_completion_status'];

export type Owner =
  { kind: 'user'; userId: string } | { kind: 'anonymous'; anonymousSessionId: string };

export type ConversationRef = { id: string; persisted: boolean };

function retentionInstant(now = new Date()): string {
  const at = new Date(now);
  at.setUTCDate(at.getUTCDate() + LIMITS.retentionDays);
  return at.toISOString();
}

/**
 * Find or create the conversation. Called before the model, always.
 *
 * `persisted: false` is a working degradation, not an error: local development
 * without a service key still answers questions, it just does not keep them.
 */
export async function ensureConversation(input: {
  conversationId?: string | null;
  owner: Owner;
  country: string;
  locale: 'en' | 'bn';
}): Promise<ConversationRef> {
  if (!hasAiDatabase()) {
    return { id: input.conversationId ?? crypto.randomUUID(), persisted: false };
  }

  const db = aiDb();

  if (input.conversationId) {
    // Ownership is re-checked on every turn rather than trusted from the
    // client: the conversation id travels in the request body, so a guessed id
    // must not be enough to append to — or read — someone else's thread.
    const query = db.from('ai_conversations').select('id').eq('id', input.conversationId);

    const scoped =
      input.owner.kind === 'user'
        ? query.eq('user_id', input.owner.userId)
        : query.eq('anonymous_session_id', input.owner.anonymousSessionId);

    const { data, error } = await scoped.maybeSingle();
    if (!error && data) return { id: data.id, persisted: true };
  }

  const { data, error } = await db
    .from('ai_conversations')
    .insert({
      user_id: input.owner.kind === 'user' ? input.owner.userId : null,
      anonymous_session_id:
        input.owner.kind === 'anonymous' ? input.owner.anonymousSessionId : null,
      country: input.country,
      locale: input.locale,
      delete_after: retentionInstant(),
    })
    .select('id');

  const row = data?.[0];
  if (error || !row) {
    logger.warn('ai.conversation.create_failed', { code: error?.code ?? null });
    return { id: crypto.randomUUID(), persisted: false };
  }

  return { id: row.id, persisted: true };
}

/** The customer's question, redacted. Written before the model is called. */
export async function recordUserMessage(
  conversation: ConversationRef,
  content: string,
): Promise<string | null> {
  if (!conversation.persisted) return null;

  const { text } = redactSensitive(content);
  const { data, error } = await aiDb()
    .from('ai_messages')
    .insert({
      conversation_id: conversation.id,
      role: 'user',
      content: text,
      status: 'complete',
    })
    .select('id');

  if (error) {
    logger.warn('ai.message.user_write_failed', {
      code: error.code ?? null,
      ...messageTelemetry(content),
    });
    return null;
  }
  return data?.[0]?.id ?? null;
}

export type AnswerRecord = {
  content: string;
  sourceIds: string[];
  model: string;
  /** Which role served this answer, and at what risk class (§6.2 tagging).
   *  Optional so the model-free fast paths default to the plain answer role. */
  modelRole?: string;
  riskClass?: string;
  failoverCount?: number;
  provider?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCostUsd?: number | null;
  latencyMs: number;
  status: CompletionStatus;
  errorCode?: string | null;
  country: string;
  locale: 'en' | 'bn';
};

/**
 * The answer plus its usage row, written together after the stream finishes.
 *
 * `ai_usage` duplicates the numbers already on the message on purpose: it is
 * the ledger the budget check sums, and it survives a conversation being
 * deleted for retention or at the customer's request. Deleting a transcript
 * must not erase the record that money was spent.
 */
export async function recordAnswer(
  conversation: ConversationRef,
  answer: AnswerRecord,
): Promise<string | null> {
  if (!conversation.persisted) return null;

  const db = aiDb();
  const { text } = redactSensitive(answer.content);

  const { data, error } = await db
    .from('ai_messages')
    .insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: text,
      source_ids: answer.sourceIds,
      model: answer.model,
      input_tokens: answer.inputTokens ?? null,
      output_tokens: answer.outputTokens ?? null,
      estimated_cost_usd: answer.estimatedCostUsd ?? null,
      latency_ms: answer.latencyMs,
      status: answer.status,
      error_code: answer.errorCode ?? null,
    })
    .select('id');

  if (error) {
    logger.warn('ai.message.answer_write_failed', { code: error.code ?? null });
  }

  const { error: usageError } = await db.from('ai_usage').insert({
    conversation_id: conversation.id,
    model: answer.model,
    model_role: answer.modelRole ?? 'answer',
    risk_class: answer.riskClass ?? 'standard',
    failover_count: answer.failoverCount ?? 0,
    provider: answer.provider ?? null,
    country: answer.country,
    locale: answer.locale,
    input_tokens: answer.inputTokens ?? 0,
    output_tokens: answer.outputTokens ?? 0,
    estimated_cost_usd: answer.estimatedCostUsd ?? 0,
    latency_ms: answer.latencyMs,
    status: answer.status,
    error_code: answer.errorCode ?? null,
  });

  if (usageError) {
    logger.warn('ai.usage.write_failed', { code: usageError.code ?? null });
  }

  return data?.[0]?.id ?? null;
}

/**
 * A question the knowledge base could not answer.
 *
 * This is the feature's improvement loop: an unanswered question is a missing
 * knowledge source, and the admin screen works from this table. The question
 * is redacted like everything else.
 */
export async function recordUnanswered(input: {
  conversationId: string | null;
  question: string;
  locale: 'en' | 'bn';
  country: string;
  reason: 'no_match' | 'expired_only' | 'out_of_scope' | 'low_confidence';
}): Promise<void> {
  if (!hasAiDatabase()) return;

  const { text } = redactSensitive(input.question);
  const { error } = await aiDb().from('ai_unanswered_questions').insert({
    conversation_id: input.conversationId,
    question: text,
    locale: input.locale,
    country: input.country,
    reason: input.reason,
  });

  if (error) logger.warn('ai.unanswered.write_failed', { code: error.code ?? null });
}

/**
 * History replayed to the model. Capped, oldest trimmed, and read from the
 * redacted store rather than from the client — the browser does not get to
 * decide what the model believes was said earlier.
 */
export async function loadHistory(
  conversation: ConversationRef,
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  if (!conversation.persisted) return [];

  const { data, error } = await aiDb()
    .from('ai_messages')
    .select('role, content, status, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(LIMITS.maxHistoryMessages);

  if (error || !data) return [];

  return data
    .filter((row) => row.status === 'complete')
    .reverse()
    .map((row) => ({ role: row.role, content: row.content }));
}

/**
 * Customer-initiated deletion. Messages and feedback cascade; the usage ledger
 * does not, because its conversation reference is `on delete set null`.
 */
export async function deleteConversation(id: string, owner: Owner): Promise<boolean> {
  if (!hasAiDatabase()) return false;

  const query = aiDb().from('ai_conversations').delete().eq('id', id);
  const scoped =
    owner.kind === 'user'
      ? query.eq('user_id', owner.userId)
      : query.eq('anonymous_session_id', owner.anonymousSessionId);

  const { error } = await scoped;
  if (error) {
    logger.warn('ai.conversation.delete_failed', { code: error.code ?? null });
    return false;
  }
  return true;
}
