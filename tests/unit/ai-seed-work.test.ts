import { describe, expect, it } from 'vitest';

import { hasBudget, pendingSeedWork, type SeedWorkRow } from '@/features/ai/seed-work';

/**
 * The seed publish queue.
 *
 * These cases exist because the action they serve is the one an owner clicks
 * to make Ask bdoor AI able to cite an authority at all. It walks dozens of
 * sources, each costing an embedding round trip, so it has to be able to stop
 * partway and resume without republishing or re-embedding anything.
 */

function row(over: Partial<SeedWorkRow> = {}): SeedWorkRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'bd-rjsc-incorporation-en',
    status: 'draft',
    indexed_at: null,
    ...over,
  };
}

describe('pendingSeedWork', () => {
  it('queues a draft seed source for both publish and index', () => {
    const [item] = pendingSeedWork([row()], ['bd-rjsc-incorporation-en']);

    expect(item).toMatchObject({ needsPublish: true, needsIndex: true });
  });

  it('queues a published but never-indexed source for index only', () => {
    // Exactly the production state: seeded by SQL, published, indexed_at null.
    const [item] = pendingSeedWork(
      [row({ status: 'published', indexed_at: null })],
      ['bd-rjsc-incorporation-en'],
    );

    expect(item).toMatchObject({ needsPublish: false, needsIndex: true });
  });

  it('leaves finished work out of the queue, which is what makes resume safe', () => {
    const queue = pendingSeedWork(
      [row({ status: 'published', indexed_at: '2026-09-06T06:00:00Z' })],
      ['bd-rjsc-incorporation-en'],
    );

    expect(queue).toEqual([]);
  });

  it('ignores a source whose slug is not in the reviewed repository seed', () => {
    const queue = pendingSeedWork(
      [row({ slug: 'hand-authored-in-admin' })],
      ['bd-rjsc-incorporation-en'],
    );

    expect(queue).toEqual([]);
  });

  it('never republishes a withdrawn source', () => {
    // Withdrawing is a deliberate act. Undoing it in a bulk run would be the
    // action silently overriding a person.
    const queue = pendingSeedWork([row({ status: 'withdrawn' })], ['bd-rjsc-incorporation-en']);

    expect(queue).toEqual([]);
  });

  it('orders stably, so a resumed run continues rather than restarts', () => {
    const rows = [
      row({ id: 'c', slug: 'bd-trade-licence-en' }),
      row({ id: 'a', slug: 'bd-nbr-etin-en' }),
      row({ id: 'b', slug: 'bd-rjsc-incorporation-en' }),
    ];

    expect(
      pendingSeedWork(
        rows,
        rows.map((r) => r.slug),
      ).map((i) => i.slug),
    ).toEqual(['bd-nbr-etin-en', 'bd-rjsc-incorporation-en', 'bd-trade-licence-en']);
  });
});

describe('hasBudget', () => {
  it('starts a source when the reserve still fits', () => {
    expect(hasBudget(0, 100_000, 240_000, 20_000)).toBe(true);
  });

  it('stops before a source it could not finish', () => {
    // 225s spent of 240s, and one source needs 20s: starting it would be cut
    // off mid-index, which deletes chunks it would not get to rewrite.
    expect(hasBudget(0, 225_000, 240_000, 20_000)).toBe(false);
  });

  it('treats the exact boundary as affordable', () => {
    expect(hasBudget(0, 220_000, 240_000, 20_000)).toBe(true);
  });
});
