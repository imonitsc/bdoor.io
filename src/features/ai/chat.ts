import 'server-only';

import { gateway, streamText } from 'ai';

import { checkBudget } from './budget';
import {
  ANSWER_MODEL,
  ANSWER_PROVIDER_ORDER,
  LIMITS,
  isSupportedCountry,
  usageTags,
} from './config';
import { classifyUpstreamError, failureMessage, type AiFailure } from './errors';
import { safetyIdentifier } from './identity';
import {
  ensureConversation,
  loadHistory,
  recordAnswer,
  recordUnanswered,
  recordUserMessage,
  type CompletionStatus,
  type Owner,
} from './persistence';
import { messageTelemetry } from './redaction';
import { retrieveContext, type Citation } from './retrieval';
import { classifyScope, outOfScopeReply } from './scope';
import { buildSystemPrompt, PROMPT_VERSION } from './system-prompt';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * The answer pipeline.
 *
 * Order matters and is not an implementation detail:
 *
 *   feature switch → rate limit → length → scope → budget
 *   → conversation row → question row → retrieval → Claude → answer row
 *
 * Everything cheap and refusable happens before anything is spent, and the
 * conversation exists before the model is called so a failure is still
 * recorded. There is no branch in this file that answers from a model other
 * than Claude: if the gateway cannot serve `ANSWER_MODEL` from an Anthropic
 * route, the request fails visibly.
 */

export type ChatRequest = {
  message: string;
  conversationId?: string | null;
  locale: 'en' | 'bn';
  country: string;
  owner: Owner;
};

export type ChatRefusal = {
  ok: false;
  failure: AiFailure | 'out_of_scope';
  message: string;
  conversationId: string | null;
};

export type ChatStream = {
  ok: true;
  conversationId: string;
  citations: Citation[];
  /** Server-Sent-Events body: `text` deltas, then a final `done` frame. */
  stream: ReadableStream<Uint8Array>;
};

export function aiEnabled(): boolean {
  return serverEnv().ASK_BDOOR_AI_ENABLED;
}

const encoder = new TextEncoder();

function frame(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Cost and provider for one generation.
 *
 * The gateway settles a generation asynchronously, so this is a best-effort
 * lookup that must never delay or fail the customer's answer — it runs after
 * the stream has closed and a miss just leaves the ledger's cost at zero for
 * that row.
 */
async function generationInfo(generationId: string | null) {
  if (!generationId) return null;
  try {
    const info = await gateway.getGenerationInfo({ id: generationId });
    return {
      cost: info.totalCost,
      provider: info.providerName,
      latency: info.generationTime,
    };
  } catch (error) {
    logger.debug('ai.generation_info.miss', { message: (error as Error).message });
    return null;
  }
}

export async function answerQuestion(request: ChatRequest): Promise<ChatStream | ChatRefusal> {
  const locale = request.locale;
  const country = isSupportedCountry(request.country) ? request.country : 'bd';
  const question = request.message.trim();

  const refuse = (failure: AiFailure | 'out_of_scope', message: string): ChatRefusal => ({
    ok: false,
    failure,
    message,
    conversationId: request.conversationId ?? null,
  });

  if (!aiEnabled()) {
    return refuse('disabled', '');
  }

  if (question.length === 0 || question.length > LIMITS.maxMessageChars) {
    return refuse('too_long', '');
  }

  // Scope is checked before the budget so an obvious refusal is free.
  const scope = classifyScope(question);
  if (!scope.inScope) {
    await recordUnanswered({
      conversationId: request.conversationId ?? null,
      question,
      locale,
      country,
      reason: 'out_of_scope',
    });
    return refuse('out_of_scope', outOfScopeReply(locale));
  }

  const budget = await checkBudget();
  if (!budget.allowed) {
    logger.warn('ai.budget.exceeded', { scope: budget.scope });
    return refuse('budget_exceeded', '');
  }

  const conversation = await ensureConversation({
    conversationId: request.conversationId,
    owner: request.owner,
    country,
    locale,
  });

  // History is read before the new question is written, so the model is not
  // handed the question twice.
  const history = await loadHistory(conversation);
  await recordUserMessage(conversation, question);

  const retrieval = await retrieveContext(question, locale, country);
  if (retrieval.empty) {
    await recordUnanswered({
      conversationId: conversation.persisted ? conversation.id : null,
      question,
      locale,
      country,
      reason: 'no_match',
    });
  }

  const system = buildSystemPrompt({
    locale,
    country,
    context: retrieval.context,
    structured: retrieval.structured,
  });

  const user =
    request.owner.kind === 'user'
      ? safetyIdentifier('user', request.owner.userId)
      : safetyIdentifier('anon', request.owner.anonymousSessionId);

  const startedAt = Date.now();

  logger.info('ai.answer.start', {
    conversation: conversation.persisted ? conversation.id : null,
    country,
    locale,
    sources: retrieval.sourceIds.length,
    promptVersion: PROMPT_VERSION,
    // The question itself is never logged: only its shape.
    ...messageTelemetry(question),
  });

  const result = streamText({
    model: ANSWER_MODEL,
    system,
    messages: [...history, { role: 'user' as const, content: question }],
    maxOutputTokens: LIMITS.maxOutputTokens,
    maxRetries: LIMITS.maxRetries,
    abortSignal: AbortSignal.timeout(LIMITS.requestTimeoutMs),
    temperature: 0.2,
    providerOptions: {
      gateway: {
        // Spend attribution and abuse tracing, hashed. Never a raw id.
        user,
        tags: usageTags(country, locale),
        // Claude, from an Anthropic route, or not at all. `only` is what makes
        // "no silent fallback to a non-Claude model" enforceable rather than
        // aspirational: with it set, a total Claude outage is an error the
        // customer is told about, not an answer from a substitute.
        only: [...ANSWER_PROVIDER_ORDER],
        order: [...ANSWER_PROVIDER_ORDER],
        disallowPromptTraining: true,
      },
    },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        frame('meta', { conversationId: conversation.id, citations: retrieval.citations }),
      );

      let answer = '';
      let status: CompletionStatus = 'complete';
      let errorCode: string | null = null;

      try {
        // fullStream, not textStream: the SDK delivers upstream failures as
        // 'error' parts and ends textStream cleanly, which would hand the
        // customer an empty answer marked complete — the silent non-answer
        // this whole pipeline exists to prevent. The e2e outage test caught
        // exactly that.
        for await (const part of result.fullStream) {
          if (part.type === 'text-delta') {
            answer += part.text;
            controller.enqueue(frame('text', { delta: part.text }));
          } else if (part.type === 'error') {
            throw part.error;
          } else if (part.type === 'abort') {
            throw new Error('generation aborted');
          }
        }
        if (answer.length === 0) {
          // Whatever ended the stream without a word was not an answer.
          throw new Error('stream ended without any text');
        }
      } catch (error) {
        status = 'error';
        const failure = classifyUpstreamError(error);
        errorCode = failure;
        logger.error('ai.answer.failed', { failure, conversation: conversation.id });
        // The copy travels with the frame. A stream that dies mid-answer is
        // the one case the client cannot write its own message for — it does
        // not know whether this was an outage, a budget cap or a timeout, and
        // those need different things said.
        controller.enqueue(frame('error', { failure, message: failureMessage(failure, locale) }));
      }

      const latencyMs = Date.now() - startedAt;

      // Usage and metadata resolve once the stream has finished. A rejection
      // here must not break a response the customer has already read.
      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let generationId: string | null = null;

      try {
        const usage = await result.usage;
        inputTokens = usage.inputTokens ?? null;
        outputTokens = usage.outputTokens ?? null;
        const metadata = await result.providerMetadata;
        const raw = metadata?.gateway?.generationId;
        generationId = typeof raw === 'string' ? raw : null;
      } catch {
        // Already reflected in `status`; nothing further to report.
      }

      const info = await generationInfo(generationId);

      const messageId = await recordAnswer(conversation, {
        content: answer,
        sourceIds: retrieval.sourceIds,
        model: ANSWER_MODEL,
        provider: info?.provider ?? null,
        inputTokens,
        outputTokens,
        estimatedCostUsd: info?.cost ?? null,
        latencyMs,
        status,
        errorCode,
        country,
        locale,
      });

      logger.info('ai.answer.finish', {
        conversation: conversation.id,
        status,
        latencyMs,
        inputTokens,
        outputTokens,
        provider: info?.provider ?? null,
      });

      // `messageId` is the row feedback attaches to. It only exists once the
      // answer has been written, which is why it arrives in the final frame
      // rather than in `meta` — a thumbs-down on an answer that was never
      // stored would have nothing to point at.
      controller.enqueue(frame('done', { status, latencyMs, messageId }));
      controller.close();
    },
  });

  return { ok: true, conversationId: conversation.id, citations: retrieval.citations, stream };
}
