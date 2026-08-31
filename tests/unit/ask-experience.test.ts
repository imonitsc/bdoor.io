import { describe, expect, it } from 'vitest';

import { FAST_PATH_MODEL, greetingReply, isGreeting } from '@/features/ai/fast-path';
import { actionsFor } from '@/features/ai/follow-ups';
import { fuseRankedLists, type RankedChunk } from '@/features/ai/fusion';
import { PIPELINE_STAGES } from '@/features/ai/timings';

/**
 * The Ask bdoor AI experience pipeline: the greeting fast path stays narrow,
 * the TypeScript fusion reproduces the SQL arithmetic exactly, follow-ups and
 * CTAs are deterministic and truthful, and the instrumentation covers the
 * eleven measured stages.
 */

describe('the greeting fast path', () => {
  it('recognises greetings and thanks in both languages', () => {
    for (const text of [
      'hi',
      'Hello!',
      'hey there'.slice(0, 3),
      'good morning',
      'assalamu alaikum',
      'salam',
      'হাই',
      'হ্যালো',
      'আসসালামু আলাইকুম',
      'thanks',
      'ধন্যবাদ',
    ]) {
      expect(isGreeting(text), text).toBe(true);
    }
  });

  it('never swallows a real question', () => {
    for (const text of [
      'hi, how do I register a company?',
      'hello — what does a trade licence cost?',
      'hi there can you help me with VAT',
      'What is a TIN?',
      'হ্যালো, কোম্পানি নিবন্ধন কীভাবে করব?',
      '',
    ]) {
      expect(isGreeting(text), text).toBe(false);
    }
  });

  it('replies in the customer’s language and invites a business question', () => {
    expect(greetingReply('en')).toMatch(/company registration/i);
    expect(greetingReply('bn')).toContain('কোম্পানি নিবন্ধন');
  });

  it('records a model name that names no vendor', () => {
    expect(FAST_PATH_MODEL).toMatch(/^bdoor\//);
    expect(FAST_PATH_MODEL).not.toMatch(/openai|anthropic|google|meta|mistral/i);
  });
});

function chunk(overrides: Partial<RankedChunk> & { chunk_id: string; rank: number }): RankedChunk {
  return {
    source_id: 's1',
    content: 'body',
    title: 'title',
    source_url: null,
    country: 'bd',
    locale: 'en',
    source_type: 'guide',
    last_reviewed_at: null,
    effective_from: '2020-01-01',
    authority_tier: null,
    issuing_institution: null,
    reference_number: null,
    section_ref: null,
    page_start: null,
    ...overrides,
  };
}

describe('reciprocal-rank fusion', () => {
  it('sums 1/(60+rank) across lists, exactly like the SQL did', () => {
    const fused = fuseRankedLists(
      [chunk({ chunk_id: 'a', rank: 1 }), chunk({ chunk_id: 'b', rank: 2 })],
      [chunk({ chunk_id: 'b', rank: 1 }), chunk({ chunk_id: 'c', rank: 2 })],
      { count: 8, locale: 'en' },
    );
    const byId = Object.fromEntries(fused.map((entry) => [entry.chunk_id, entry.score]));
    expect(byId.a).toBeCloseTo(1 / 61, 10);
    expect(byId.b).toBeCloseTo(1 / 62 + 1 / 61, 10);
    expect(byId.c).toBeCloseTo(1 / 62, 10);
    // Both-list membership outranks either single hit.
    expect(fused[0]?.chunk_id).toBe('b');
  });

  it('applies the additive authority bonus without letting it outrank relevance', () => {
    // Tied keyword ranks: the gazette (tier 1) must win the tie…
    const tied = fuseRankedLists(
      [],
      [
        chunk({ chunk_id: 'guide', rank: 1, authority_tier: 5 }),
        chunk({ chunk_id: 'gazette', rank: 1, authority_tier: 1 }),
      ],
      { count: 8, locale: 'en' },
    );
    expect(tied[0]?.chunk_id).toBe('gazette');

    // …but a guide that matches BOTH searches beats a gazette that only the
    // embedding thought was nearby: two-list membership carries more weight
    // than the whole tier spread, so authority orders comparable matches and
    // never resurrects an irrelevant document.
    const relevant = fuseRankedLists(
      [
        chunk({ chunk_id: 'guide', rank: 1, authority_tier: 5 }),
        chunk({ chunk_id: 'gazette', rank: 2, authority_tier: 1 }),
      ],
      [chunk({ chunk_id: 'guide', rank: 1, authority_tier: 5 })],
      { count: 8, locale: 'en' },
    );
    expect(relevant[0]?.chunk_id).toBe('guide');
  });

  it('puts same-language chunks first and honours the count', () => {
    const fused = fuseRankedLists(
      [
        chunk({ chunk_id: 'en1', rank: 1, locale: 'en' }),
        chunk({ chunk_id: 'bn1', rank: 2, locale: 'bn' }),
        chunk({ chunk_id: 'en2', rank: 3, locale: 'en' }),
      ],
      [],
      { count: 2, locale: 'bn' },
    );
    expect(fused).toHaveLength(2);
    expect(fused[0]?.chunk_id).toBe('bn1');
  });
});

describe('answer actions', () => {
  it('offers topic follow-ups in the customer’s language', () => {
    const en = actionsFor('How do I renew my trade licence?', 'en');
    expect(en.followUps.length).toBeGreaterThan(0);
    expect(en.followUps.join(' ')).toMatch(/trade licence/i);

    const bn = actionsFor('আমি কীভাবে ট্রেড লাইসেন্স নবায়ন করব?', 'bn');
    expect(bn.followUps.join(' ')).toContain('ট্রেড লাইসেন্স');
  });

  it('offers "start this process" only for work the /start journey covers', () => {
    expect(actionsFor('How do I register a company in Bangladesh?', 'en').startProcess).toBe(true);
    expect(actionsFor('Do I need an IRC to import?', 'en').startProcess).toBe(true);
    // Labour-law advice is not an application bdoor can open from /start.
    expect(actionsFor('What are the maternity leave rules for my staff?', 'en').startProcess).toBe(
      false,
    );
  });

  it('falls back to safe generic next steps when no topic is detected', () => {
    const generic = actionsFor('Tell me about bdoor', 'en');
    expect(generic.followUps).toHaveLength(3);
    expect(generic.startProcess).toBe(false);
  });
});

describe('pipeline instrumentation', () => {
  it('covers the eleven measured stages, in order', () => {
    expect(PIPELINE_STAGES).toEqual([
      'received',
      'checks',
      'classified',
      'embedding',
      'keyword',
      'vector',
      'fused',
      'model_start',
      'first_token',
      'completed',
      'persisted',
    ]);
  });
});
