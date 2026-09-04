import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * CLAUDE.md §4.1 requires `AI_MAX_RETRIEVAL_CHUNKS` and `AI_REQUEST_TIMEOUT_MS`
 * to be environment configuration. They were declared, validated, and resolved
 * by `answerLimits()` — which nothing called. Every consumer read a mirrored
 * constant instead, so setting either variable in Vercel changed nothing and
 * reported nothing.
 *
 * Nothing failed, because no test connected a variable to a consumer: the
 * config had a unit test, the consumers had unit tests, and the wire between
 * them had none. These assertions run the real retrieval path with the
 * variable set and read what it actually sent, so the wire itself is covered.
 */

const ROWS = [chunk('chunk-a', 1), chunk('chunk-b', 2), chunk('chunk-c', 3), chunk('chunk-d', 4)];

function chunk(id: string, rank: number) {
  return {
    chunk_id: id,
    source_id: `source-${id}`,
    title: `Sample source ${id}`,
    content: 'Trade licence renewal happens at the city corporation.',
    country: 'bd',
    locale: 'en',
    source_type: 'government_reference',
    source_url: 'https://example.gov.bd/',
    last_reviewed_at: '2026-08-01',
    effective_from: '2026-01-01',
    authority_tier: 2,
    issuing_institution: 'Sample authority',
    reference_number: null,
    section_ref: null,
    page_start: null,
    rank,
  };
}

/** Records the arguments, which is the whole point: the value has to arrive. */
class RecordingClient {
  rest = { search: true };
  args: Record<string, unknown>[] = [];
  rpc(_fn: string, args: Record<string, unknown>) {
    this.args.push(args);
    return Promise.resolve({ data: ROWS, error: null });
  }
}

async function retrievalWith(chunks: string): Promise<{
  client: RecordingClient;
  result: Awaited<ReturnType<typeof import('@/features/ai/retrieval').retrieveContext>>;
}> {
  vi.resetModules();
  process.env.AI_MAX_RETRIEVAL_CHUNKS = chunks;

  const client = new RecordingClient();
  vi.doMock('@/features/ai/db', () => ({ aiDb: () => client, hasAiDatabase: () => true }));
  vi.doMock('@/features/ai/embeddings', () => ({ embedQuery: async () => [0.1, 0.2, 0.3] }));
  vi.doMock('@/features/ai/registry/rules', () => ({
    rulesForQuestion: async () => [],
    renderRules: () => '',
  }));
  vi.doMock('@/features/ai/structured', () => ({
    STRUCTURED_SOURCE: { title: 'Pricing (sample)', url: '/pricing', lastReviewed: '2026-08-01' },
    structuredRecordsFor: () => '',
  }));

  const { retrieveContext } = await import('@/features/ai/retrieval');
  const result = await retrieveContext('trade licence renewal fee', 'en', 'bd');
  return { client, result };
}

afterEach(() => {
  delete process.env.AI_MAX_RETRIEVAL_CHUNKS;
  vi.resetModules();
  vi.doUnmock('@/features/ai/db');
  vi.doUnmock('@/features/ai/embeddings');
  vi.doUnmock('@/features/ai/registry/rules');
  vi.doUnmock('@/features/ai/structured');
});

describe('the §4.1 answer limits reach the code that uses them', () => {
  it('sizes the candidate pool from AI_MAX_RETRIEVAL_CHUNKS', async () => {
    // 25 * 4 = 100, which is above the floor of 40, so the configured value is
    // the only thing that can produce it. The default of 8 gives 40 — equal to
    // the floor — so a test at or below 10 would pass against the constant and
    // prove nothing.
    const { client } = await retrievalWith('25');

    expect(client.args.length).toBeGreaterThan(0);
    for (const args of client.args) expect(args.candidate_count).toBe(100);
  });

  it('keeps the configured limits out of the constant table', async () => {
    // AI_REQUEST_TIMEOUT_MS is wired the same way, in chat.ts, but exercising
    // it needs a stubbed model stream and is not covered behaviourally here —
    // so this asserts the structural property that made the bug possible
    // instead: the moment either limit is mirrored back into LIMITS as a
    // "default", a consumer can read the mirror and the variable goes quiet
    // again. Absence is what keeps the compiler on the right side.
    const { LIMITS } = await import('@/features/ai/config');

    expect(LIMITS).not.toHaveProperty('retrievalCount');
    expect(LIMITS).not.toHaveProperty('requestTimeoutMs');
  });

  it('cuts the retrieved set to AI_MAX_RETRIEVAL_CHUNKS', async () => {
    // Four candidate rows, a configured cut of two: two survive. Against the
    // hardcoded 8 all four would.
    const { result } = await retrievalWith('2');

    const retrieved = result.citations.filter((c) => c.url !== '/pricing');
    expect(retrieved).toHaveLength(2);
  });
});
