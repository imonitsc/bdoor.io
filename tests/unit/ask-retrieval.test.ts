import { describe, expect, it, vi } from 'vitest';

/**
 * Regression: supabase-js's `rpc` reads `this.rest` internally, so retrieval
 * must call it bound to its client. The first production deploy of the split
 * retrieval path extracted the bare method and every request degraded to an
 * ungrounded answer ("Cannot read properties of undefined (reading 'rest')",
 * sources: 0). The fake client below throws exactly the way supabase-js does
 * if the method is ever detached again.
 */

class FakeSupabaseClient {
  rest = { search: true };
  calls: string[] = [];
  rpc(fn: string, _args: Record<string, unknown>) {
    // Same shape as supabase-js: an unbound call makes `this` undefined here.
    if (!(this instanceof FakeSupabaseClient)) {
      throw new TypeError("Cannot read properties of undefined (reading 'rest')");
    }
    void this.rest;
    this.calls.push(fn);
    return Promise.resolve({
      data: [
        {
          chunk_id: `chunk-${fn}`,
          source_id: 'source-1',
          title: 'Trade licence guide',
          content: 'Renewal happens at the city corporation.',
          country: 'bd',
          locale: 'en',
          source_type: 'government_reference',
          source_url: null,
          last_reviewed_at: '2026-08-01',
          effective_from: '2026-01-01',
          authority_tier: 2,
          issuing_institution: 'DSCC (sample)',
          reference_number: null,
          section_ref: null,
          page_start: null,
          rank: 1,
        },
      ],
      error: null,
    });
  }
}

const client = new FakeSupabaseClient();

vi.mock('@/features/ai/db', () => ({
  aiDb: () => client,
  hasAiDatabase: () => true,
}));
vi.mock('@/features/ai/embeddings', () => ({
  embedQuery: async () => [0.1, 0.2, 0.3],
}));
vi.mock('@/features/ai/registry/rules', () => ({
  rulesForQuestion: async () => [],
  renderRules: () => '',
}));
vi.mock('@/features/ai/structured', () => ({
  STRUCTURED_SOURCE: { title: 'Pricing (sample)', url: '/pricing', lastReviewed: '2026-08-01' },
  structuredRecordsFor: () => '',
}));

describe('retrieveContext calls the database client the way supabase-js requires', () => {
  it('retrieves chunks through rpc without detaching the method from its client', async () => {
    const { retrieveContext } = await import('@/features/ai/retrieval');
    const result = await retrieveContext('trade licence renewal fee', 'en', 'bd');

    expect(client.calls).toContain('ai_search_keyword');
    expect(client.calls).toContain('ai_search_semantic');
    // The production symptom was empty:true with sources 0 on every request.
    expect(result.empty).toBe(false);
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.sourceIds).toContain('source-1');
  });
});
