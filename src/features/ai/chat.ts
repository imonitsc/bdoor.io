import 'server-only';

import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  gateway,
  streamText,
  type UIMessageStreamWriter,
} from 'ai';

import { checkBudget } from './budget';
import { LIMITS, isSupportedCountry, usageTags } from './config';
import { classifyUpstreamError, failureMessage, type AiFailure } from './errors';
import { answerRoute, classifyRisk, providerLockFor } from './models';
import { FAST_PATH_MODEL, greetingReply, isGreeting } from './fast-path';
import { actionsFor } from './follow-ups';
import { safetyIdentifier } from './identity';
import {
  ensureConversation,
  loadHistory,
  recordAnswer,
  recordUnanswered,
  recordUserMessage,
  type CompletionStatus,
  type ConversationRef,
  type Owner,
} from './persistence';
import { messageTelemetry } from './redaction';
import { retrieveContext } from './retrieval';
import { classifyScope, outOfScopeReply } from './scope';
import { buildSystemPrompt, PROMPT_VERSION } from './system-prompt';
import type { Timings } from './timings';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * The answer pipeline, as an AI SDK UI-message stream.
 *
 * The response starts streaming the moment the route's cheap checks pass:
 * every later refusal (scope, budget, upstream failure) arrives as stream
 * content with honest copy, so the customer always sees an acknowledgement
 * within the first network round-trip. Truthful stage parts — understanding /
 * sources / answering — are written only when that work actually begins.
 *
 * Latency order (the design, not an accident):
 *
 *   classify (sync, free)
 *   ├─ greeting → canned reply, no retrieval, no model, no gateway spend
 *   ├─ out of scope → bilingual decline, no model
 *   └─ else: budget check ∥ conversation+history ∥ retrieval
 *            (keyword fires immediately; embedding+vector beside it)
 *        → streamText the moment retrieval lands
 *        → persistence during/after completion, never before first token
 *
 * Models are resolved per request through the role registry (models.ts):
 * a question's risk class picks the answer or expert chain, and failover
 * walks the chain explicitly — each slug locked to its own vendor's routes,
 * every hop counted and logged, the same prompt and citation contract on
 * every model. If the whole chain is down, the request fails visibly.
 */

export type ChatRequest = {
  message: string;
  conversationId?: string | null;
  locale: 'en' | 'bn';
  country: string;
  owner: Owner;
  timings: Timings;
};

export function aiEnabled(): boolean {
  return serverEnv().ASK_BDOOR_AI_ENABLED;
}

/** Data parts the client renders. Names are part of the wire contract. */
type StagePart = { stage: 'understanding' | 'sources' | 'answering' };
type FinalPart = {
  /** The UI message these actions belong to — the id sent on `start`. */
  uiMessageId: string;
  conversationId: string | null;
  messageId: string | null;
  followUps: string[];
  startProcess: boolean;
};
type FailurePart = {
  uiMessageId: string;
  failure: AiFailure | 'out_of_scope';
  message: string;
};

type Writer = UIMessageStreamWriter;

function writeStage(writer: Writer, stage: StagePart['stage']) {
  writer.write({ type: 'data-stage', data: { stage }, transient: true });
}

/** Stream a complete text answer that was not model-generated. */
function writeText(writer: Writer, text: string) {
  const id = crypto.randomUUID();
  writer.write({ type: 'text-start', id });
  writer.write({ type: 'text-delta', id, delta: text });
  writer.write({ type: 'text-end', id });
}

/**
 * Cost and provider for one generation. Best-effort, after the stream — the
 * gateway settles asynchronously and a miss just leaves cost at zero.
 */
async function generationInfo(generationId: string | null) {
  if (!generationId) return null;
  try {
    const info = await gateway.getGenerationInfo({ id: generationId });
    return { cost: info.totalCost, provider: info.providerName };
  } catch (error) {
    logger.debug('ai.generation_info.miss', { message: (error as Error).message });
    return null;
  }
}

export function streamAnswer(request: ChatRequest): Response {
  const { timings } = request;
  const locale = request.locale;
  const country = isSupportedCountry(request.country) ? request.country : 'bd';
  const question = request.message.trim();
  const startedAt = Date.now();

  const stream = createUIMessageStream({
    onError: (error) => {
      logger.error('ai.answer.stream_error', { message: (error as Error)?.message });
      return failureMessage('unknown', locale);
    },
    execute: async ({ writer }) => {
      // The assistant message's UI id is minted here so the metadata parts
      // written later can name the message they belong to.
      const uiMessageId = crypto.randomUUID();
      writer.write({ type: 'start', messageId: uiMessageId });
      writeStage(writer, 'understanding');

      // -- Classification: free, synchronous, before anything is spent. -----
      const greeting = isGreeting(question);
      const scope = greeting ? { inScope: true } : classifyScope(question);
      timings.mark('classified');

      if (greeting) {
        // "hi" earns an instant answer, not a Singapore round-trip.
        writeText(writer, greetingReply(locale));
        timings.mark('completed');
        const conversation = await ensureConversation({
          conversationId: request.conversationId,
          owner: request.owner,
          country,
          locale,
        });
        await recordUserMessage(conversation, question);
        const messageId = await recordAnswer(conversation, {
          content: greetingReply(locale),
          sourceIds: [],
          model: FAST_PATH_MODEL,
          latencyMs: Date.now() - startedAt,
          status: 'complete',
          country,
          locale,
        });
        timings.mark('persisted');
        const final: FinalPart = {
          uiMessageId,
          conversationId: conversation.persisted ? conversation.id : null,
          messageId,
          followUps: actionsFor(question, locale).followUps,
          startProcess: false,
        };
        writer.write({ type: 'data-final', data: final });
        writer.write({ type: 'finish' });
        timings.flush({ path: 'greeting', country, locale, status: 'complete' });
        return;
      }

      if (!scope.inScope) {
        // A decline is a successful, complete answer — simply not one the
        // model was paid to write.
        const message = outOfScopeReply(locale);
        const failure: FailurePart = { uiMessageId, failure: 'out_of_scope', message };
        writer.write({ type: 'data-failure', data: failure });
        writeText(writer, message);
        writer.write({ type: 'finish' });
        timings.mark('completed');
        await recordUnanswered({
          conversationId: request.conversationId ?? null,
          question,
          locale,
          country,
          reason: 'out_of_scope',
        });
        timings.flush({ path: 'out_of_scope', country, locale, status: 'refused' });
        return;
      }

      // -- The paid path. Budget, conversation and retrieval run beside each
      // other; nothing waits on anything it does not need. ------------------
      writeStage(writer, 'sources');

      const budgetPromise = checkBudget();
      const conversationPromise: Promise<{
        conversation: ConversationRef;
        history: { role: 'user' | 'assistant'; content: string }[];
      }> = ensureConversation({
        conversationId: request.conversationId,
        owner: request.owner,
        country,
        locale,
      }).then(async (conversation) => ({ conversation, history: await loadHistory(conversation) }));
      const retrievalPromise = retrieveContext(question, locale, country, {
        timings,
        // Identical first-turn public questions (the suggestion buttons) may
        // share a cached retrieval; anything with history never does.
        cacheable: !request.conversationId,
      });

      const budget = await budgetPromise;
      if (!budget.allowed) {
        logger.warn('ai.budget.exceeded', { scope: budget.scope });
        const message = failureMessage('budget_exceeded', locale);
        writer.write({
          type: 'data-failure',
          data: { uiMessageId, failure: 'budget_exceeded', message } satisfies FailurePart,
        });
        writeText(writer, message);
        writer.write({ type: 'finish' });
        timings.flush({ path: 'budget_refused', country, locale, status: 'refused' });
        return;
      }

      const [{ conversation, history }, retrieval] = await Promise.all([
        conversationPromise,
        retrievalPromise,
      ]);

      // The question row is written while the model runs, not before it —
      // awaited only at the end so a crash cannot lose it silently.
      const userMessagePromise = recordUserMessage(conversation, question);
      const backgroundWrites: Promise<unknown>[] = [userMessagePromise];

      if (retrieval.empty) {
        backgroundWrites.push(
          recordUnanswered({
            conversationId: conversation.persisted ? conversation.id : null,
            question,
            locale,
            country,
            reason: 'no_match',
          }),
        );
      }

      writer.write({ type: 'data-citations', data: { citations: retrieval.citations } });
      writeStage(writer, 'answering');

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

      // Risk class picks the chain (§6.2): high-risk tax/customs/FX/licensing
      // questions route to the expert chain, everything else to the answer
      // chain. The classifier is deterministic and free — the "router" role.
      const risk = classifyRisk(question);
      const route = answerRoute(risk);

      logger.info('ai.answer.start', {
        requestId: timings.requestId,
        conversation: conversation.persisted ? conversation.id : null,
        country,
        locale,
        sources: retrieval.sourceIds.length,
        promptVersion: PROMPT_VERSION,
        role: route.role,
        risk,
        // The question itself is never logged: only its shape.
        ...messageTelemetry(question),
      });

      let status: CompletionStatus = 'complete';
      let errorCode: string | null = null;
      let failurePart: FailurePart | null = null;

      type Attempt = {
        text: string;
        inputTokens: number | null;
        outputTokens: number | null;
        generationId: string | null;
        failure: AiFailure | null;
      };

      // One generation against one slug. `only` locks the gateway to the
      // slug's own vendor (Anthropic slugs may also come via Bedrock/Vertex —
      // the same model under resale), so a failure here is a real model
      // failure, never quietly answered by someone else's model.
      const attemptModel = (model: string, timeoutMs: number) =>
        new Promise<Attempt>((resolve) => {
          const result = streamText({
            model,
            system,
            messages: [...history, { role: 'user' as const, content: question }],
            maxOutputTokens: LIMITS.maxOutputTokens,
            maxRetries: LIMITS.maxRetries,
            abortSignal: AbortSignal.timeout(timeoutMs),
            providerOptions: {
              gateway: {
                // Spend attribution and abuse tracing, hashed. Never a raw id.
                user,
                tags: usageTags(country, locale, { role: route.role, risk }),
                only: providerLockFor(model),
                order: providerLockFor(model),
                disallowPromptTraining: true,
              },
            },
            onChunk: () => {
              timings.mark('first_token');
            },
            onError: ({ error }) => {
              const failure = classifyUpstreamError(error);
              logger.error('ai.answer.failed', {
                requestId: timings.requestId,
                failure,
                role: route.role,
                conversation: conversation.id,
              });
              resolve({
                text: '',
                inputTokens: null,
                outputTokens: null,
                generationId: null,
                failure,
              });
            },
            onFinish: ({ text, usage, providerMetadata }) => {
              const raw = providerMetadata?.gateway?.generationId;
              resolve({
                text,
                inputTokens: usage.inputTokens ?? null,
                outputTokens: usage.outputTokens ?? null,
                generationId: typeof raw === 'string' ? raw : null,
                failure: null,
              });
            },
          });

          // The customer's stream: text deltas the moment they exist. The
          // start/finish frames are ours, so this merge sends neither — and
          // error parts are withheld too: a failed attempt that streamed no
          // text is followed by the next model in the chain, and a final
          // failure travels as a data-failure part with honest copy. Leaking
          // the raw error part would paint a failure banner over an answer
          // the next model went on to give.
          writer.merge(
            result
              .toUIMessageStream({ sendStart: false, sendFinish: false, onError: () => '' })
              .pipeThrough(
                new TransformStream({
                  transform(part, controller) {
                    if ((part as { type?: string }).type !== 'error') controller.enqueue(part);
                  },
                }),
              ),
          );
        });

      // Walk the chain (§6.1 automatic fallback). Only before the first
      // visible word — once any text has streamed, a retry would duplicate
      // it — and inside the single request budget, so a chain never
      // multiplies the wall-clock ceiling. Every hop is counted and logged;
      // the prompt and citation contract are identical on every model.
      timings.mark('model_start');
      let failoverCount = 0;
      let modelUsed = '';
      let outcome: Attempt = {
        text: '',
        inputTokens: null,
        outputTokens: null,
        generationId: null,
        failure: 'unknown',
      };
      for (const model of route.chain) {
        const remainingMs = LIMITS.requestTimeoutMs - (Date.now() - startedAt);
        if (modelUsed !== '' && remainingMs < 2_000) break;
        if (modelUsed !== '') {
          failoverCount += 1;
          logger.warn('ai.answer.failover', {
            requestId: timings.requestId,
            failure: outcome.failure,
            hop: failoverCount,
          });
        }
        modelUsed = model;
        outcome = await attemptModel(model, Math.max(remainingMs, 1_000));
        if (outcome.failure === null || outcome.text.length > 0) break;
      }

      if (outcome.failure) {
        status = 'error';
        errorCode = outcome.failure;
        const message = failureMessage(outcome.failure, locale);
        failurePart = { uiMessageId, failure: outcome.failure, message };
        // The TERMINAL failure — the whole chain exhausted — does surface as
        // a stream error part: that is what makes the client's retry
        // affordance appear. Only mid-chain errors are withheld above.
        writer.write({ type: 'error', errorText: JSON.stringify({ message }) });
      }
      timings.mark('completed');

      if (failurePart) {
        // The upstream failure copy travels as data too, so the client can
        // offer the specialist path prominently.
        writer.write({ type: 'data-failure', data: failurePart });
      }
      if (status === 'complete' && outcome.text.length === 0) {
        // Whatever ended the stream without a word was not an answer.
        status = 'error';
        errorCode = 'unknown';
        writer.write({
          type: 'data-failure',
          data: { uiMessageId, failure: 'unknown', message: failureMessage('unknown', locale) },
        });
      }

      const latencyMs = Date.now() - startedAt;
      const info = status === 'complete' ? await generationInfo(outcome.generationId) : null;

      const messageId = await recordAnswer(conversation, {
        content: outcome.text,
        sourceIds: retrieval.sourceIds,
        model: modelUsed,
        modelRole: route.role,
        riskClass: risk,
        failoverCount,
        provider: info?.provider ?? null,
        inputTokens: outcome.inputTokens,
        outputTokens: outcome.outputTokens,
        estimatedCostUsd: info?.cost ?? null,
        latencyMs,
        status,
        errorCode,
        country,
        locale,
      });
      await Promise.allSettled(backgroundWrites);
      timings.mark('persisted');

      const actions = actionsFor(question, locale);
      const final: FinalPart = {
        uiMessageId,
        conversationId: conversation.persisted ? conversation.id : null,
        messageId,
        followUps: actions.followUps,
        // Never offer to start a process off a failed answer.
        startProcess: status === 'complete' && actions.startProcess,
      };
      writer.write({ type: 'data-final', data: final });
      writer.write({ type: 'finish' });

      logger.info('ai.answer.finish', {
        requestId: timings.requestId,
        conversation: conversation.id,
        status,
        latencyMs,
        inputTokens: outcome.inputTokens,
        outputTokens: outcome.outputTokens,
        provider: info?.provider ?? null,
        role: route.role,
        risk,
        failoverCount,
      });
      timings.flush({
        path: 'answer',
        country,
        locale,
        status,
        sources: retrieval.sourceIds.length,
      });
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'Cache-Control': 'no-cache, no-store, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Robots-Tag': 'noindex',
    },
  });
}
