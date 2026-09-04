import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * §7.1 step 10 — "refuse or narrow the answer if evidence is insufficient" —
 * and §23.2 — "empty/low-confidence retrieval refuses safely".
 *
 * Retrieval already knew when it had found nothing: `retrieveContext` returns
 * `empty: true`. `chat.ts` recorded that as an unanswered question and then
 * called the model anyway, with an empty context block. The only thing between
 * a customer and an ungrounded legal answer was a sentence in the system
 * prompt asking the model to behave, and a prompt instruction is not a gate.
 *
 * These assertions run the real `streamAnswer` and read the stream it
 * produces. The one that matters is the second: the model must never be
 * reached. A refusal that still pays for a generation is not a refusal.
 */

const streamText = vi.fn(() => {
  throw new Error('the model must not be called when retrieval found nothing');
});

let retrievalEmpty = true;

vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  streamText,
}));
vi.mock('@/features/ai/retrieval', () => ({
  retrieveContext: async () => ({
    context: '',
    structured: '',
    citations: [],
    sourceIds: [],
    ruleIds: [],
    complyTrack: null,
    empty: retrievalEmpty,
  }),
  ruleCitations: () => [],
}));
vi.mock('@/features/ai/persistence', () => ({
  ensureConversation: async () => ({ id: 'conv-1', persisted: false }),
  loadHistory: async () => [],
  recordUserMessage: async () => undefined,
  recordAnswer: async () => 'msg-1',
  recordUnanswered: vi.fn(async () => undefined),
  recordCitations: async () => undefined,
}));
vi.mock('@/features/ai/budget', () => ({
  checkBudget: async () => ({ allowed: true, scope: null }),
}));

async function ask(question: string): Promise<string> {
  const { streamAnswer } = await import('@/features/ai/chat');
  const { startTimings } = await import('@/features/ai/timings');

  const response = streamAnswer({
    message: question,
    locale: 'en',
    country: 'bd',
    owner: { kind: 'anonymous', anonymousSessionId: 'anon-session-1' },
    timings: startTimings(),
  });

  return await response.text();
}

afterEach(() => {
  streamText.mockClear();
  retrievalEmpty = true;
});

describe('an in-scope question the corpus does not cover', () => {
  it('is declined, not answered', async () => {
    const body = await ask('what is the VAT treatment of bonded warehouse scrap in Bangladesh');

    expect(body).toContain('no_evidence');
    // The customer is told why, and pointed somewhere useful — not shown an
    // error that invites a retry which cannot succeed.
    expect(body).toContain('approved official source');
  });

  it('never reaches the model', async () => {
    await ask('what is the VAT treatment of bonded warehouse scrap in Bangladesh');

    expect(streamText).not.toHaveBeenCalled();
  });

  it('still answers when retrieval found something', async () => {
    // The gate must not be a blanket refusal. With evidence present the
    // request proceeds to the model — here that throws, which is exactly the
    // proof that the path was taken.
    retrievalEmpty = false;

    const body = await ask('how do I register a company in Bangladesh');

    expect(streamText).toHaveBeenCalled();
    expect(body).not.toContain('no_evidence');
  });
});
