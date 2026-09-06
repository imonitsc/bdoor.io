/**
 * What the seed publish still has to do.
 *
 * `publishImportedSeed` walks every reviewed seed source through
 * in_review → approved → published and then indexes it. Indexing is the
 * expensive part: one embedding round trip per source plus several database
 * writes. Across the full seed that is dozens of gateway calls in a single
 * request, which is a length no interactive action should assume it has.
 *
 * Separating "what is left to do" from "do it" is what lets the action work to
 * a deadline: it can stop after any item, report exactly what remains, and
 * resume on the next click without redoing anything. It also makes the
 * decision testable without a database, which the loop itself is not.
 */

export type SeedWorkRow = {
  id: string;
  slug: string;
  status: string;
  indexed_at: string | null;
};

export type SeedWorkItem = {
  id: string;
  slug: string;
  /** Walk it to published first. */
  needsPublish: boolean;
  /** Embed it. True for a source that has never been indexed. */
  needsIndex: boolean;
};

/**
 * The seed sources that still need work, in a stable order.
 *
 * Only slugs from the repository's reviewed seed are eligible — never a source
 * authored or edited in the admin, which is the same restriction the action
 * has always applied. A withdrawn source is left alone: withdrawing is a
 * deliberate act, and quietly republishing it would undo someone's decision.
 */
export function pendingSeedWork(rows: SeedWorkRow[], seedSlugs: Iterable<string>): SeedWorkItem[] {
  const eligible = new Set(seedSlugs);

  return rows
    .filter((row) => eligible.has(row.slug) && row.status !== 'withdrawn')
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      needsPublish: row.status === 'draft',
      needsIndex: row.status === 'draft' || row.indexed_at === null,
    }))
    .filter((item) => item.needsPublish || item.needsIndex)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Whether there is still enough of the budget left to start another source.
 *
 * Checked BEFORE an item rather than after, because stopping cleanly between
 * items is the whole point: a source half-published is a source whose chunks
 * were deleted and not rewritten. `reserveMs` is the room a single source
 * needs — an embedding round trip plus its writes — so the loop never begins
 * one it cannot finish.
 */
export function hasBudget(startedAt: number, now: number, budgetMs: number, reserveMs: number) {
  return now - startedAt + reserveMs <= budgetMs;
}
