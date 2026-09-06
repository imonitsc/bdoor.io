import { describe, expect, it } from 'vitest';

import { summariseCorpus, type CorpusSourceRow } from '@/features/ai/corpus-health';

/**
 * The corpus-health summary.
 *
 * These cases are written from the state production was actually found in on
 * 6 September 2026 — 19 published sources, every one with a null authority
 * tier, 25 chunks and not a single embedding — because that state produced no
 * error anywhere and answered every question. A test that only covers the
 * healthy corpus would have passed throughout.
 */

function source(over: Partial<CorpusSourceRow> = {}): CorpusSourceRow {
  return {
    slug: 'bdoor-services-bangladesh-en',
    status: 'published',
    indexed_at: '2026-08-30T16:41:24Z',
    authority_tier: null,
    ...over,
  };
}

describe('summariseCorpus', () => {
  it('reports a dead vector leg when a published corpus has no embeddings', () => {
    const health = summariseCorpus(
      [source({ slug: 'a' }), source({ slug: 'b' })],
      { total: 25, embedded: 0 },
      [],
    );

    expect(health.vectorLegDead).toBe(true);
    expect(health.chunks).toBe(25);
    expect(health.embeddedChunks).toBe(0);
  });

  it('does not call the vector leg dead when there is no published corpus at all', () => {
    // An unseeded deployment and a broken vector leg both have zero
    // embeddings. Reporting them the same way sends the reader after the
    // wrong fault, so the flag requires a published corpus to exist first.
    const health = summariseCorpus([source({ status: 'draft' })], { total: 0, embedded: 0 }, []);

    expect(health.vectorLegDead).toBe(false);
    expect(health.publishedSources).toBe(0);
  });

  it('clears the flag as soon as one chunk is embedded', () => {
    const health = summariseCorpus([source()], { total: 25, embedded: 1 }, []);

    expect(health.vectorLegDead).toBe(false);
  });

  it('reports that no answer can cite an authority when every tier is null', () => {
    const health = summariseCorpus(
      [source({ slug: 'a' }), source({ slug: 'b' })],
      { total: 25, embedded: 25 },
      [],
    );

    expect(health.noOfficialSource).toBe(true);
    expect(health.officialSources).toBe(0);
  });

  it('counts a tiered source as official and clears the flag', () => {
    const health = summariseCorpus(
      [source({ slug: 'a' }), source({ slug: 'bd-rjsc-incorporation-en', authority_tier: 3 })],
      { total: 25, embedded: 25 },
      [],
    );

    expect(health.noOfficialSource).toBe(false);
    expect(health.officialSources).toBe(1);
  });

  it('ignores an unpublished tiered source, because retrieval does', () => {
    const health = summariseCorpus(
      [source({ slug: 'a' }), source({ slug: 'b', status: 'draft', authority_tier: 3 })],
      { total: 25, embedded: 25 },
      [],
    );

    expect(health.noOfficialSource).toBe(true);
    expect(health.officialSources).toBe(0);
  });

  it('names reviewed seed slugs that have no row at all', () => {
    const health = summariseCorpus(
      [source({ slug: 'bdoor-services-bangladesh-en' })],
      {
        total: 1,
        embedded: 1,
      },
      ['bdoor-services-bangladesh-en', 'bd-rjsc-incorporation-en', 'bd-nbr-etin-en'],
    );

    expect(health.missingSeedSlugs).toEqual(['bd-rjsc-incorporation-en', 'bd-nbr-etin-en']);
  });

  it('counts a draft row as present, since importing it again would not help', () => {
    const health = summariseCorpus(
      [source({ slug: 'bd-rjsc-incorporation-en', status: 'draft' })],
      { total: 0, embedded: 0 },
      ['bd-rjsc-incorporation-en'],
    );

    expect(health.missingSeedSlugs).toEqual([]);
  });

  it('counts published sources that were never indexed', () => {
    const health = summariseCorpus(
      [
        source({ slug: 'a', indexed_at: null }),
        source({ slug: 'b', indexed_at: null }),
        source({ slug: 'c' }),
      ],
      { total: 25, embedded: 25 },
      [],
    );

    expect(health.unindexedSources).toBe(2);
  });
});
