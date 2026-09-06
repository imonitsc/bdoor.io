'use server';

import { getLocale } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  importSeedSources,
  indexSource,
  listSources,
  transitionSource,
  type SourceStatus,
} from '@/features/ai/knowledge';
import { seedSources } from '@/features/ai/knowledge-seed';
import { hasBudget, pendingSeedWork } from '@/features/ai/seed-work';
import { recordAudit } from '@/lib/audit';
import { requireCapability } from '@/lib/auth/session';

/**
 * Admin actions for the Ask bdoor AI knowledge base.
 *
 * `content.publish` gates every one of them — the same capability that governs
 * the rest of the published site, because a knowledge source is published
 * content that happens to be read by a model instead of a browser.
 *
 * Note what is absent: there is no action that edits a stored answer, and no
 * action that changes the system rules. Corrections are made by editing the
 * source and re-indexing. An answer is a record of what was said.
 */

export type ActionResult = { ok: true; detail?: string } | { ok: false; error: string };

const STATUSES = ['draft', 'in_review', 'approved', 'published', 'withdrawn'] as const;

const transitionSchema = z.object({
  sourceId: z.string().uuid(),
  status: z.enum(STATUSES),
  note: z.string().max(500).optional(),
});

async function refresh() {
  revalidatePath(`/${await getLocale()}/admin/ai`);
}

export async function transitionKnowledgeSource(input: {
  sourceId: string;
  status: SourceStatus;
  note?: string;
}): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_request' };

  const result = await transitionSource(
    parsed.data.sourceId,
    parsed.data.status,
    session.userId,
    parsed.data.note,
  );

  if (!result.ok) return { ok: false, error: result.reason };

  // Publishing is the moment content becomes customer-visible, so it lands in
  // the platform audit log too, not only in the AI-specific one.
  if (parsed.data.status === 'published') {
    await recordAudit({
      action: 'content.published',
      targetType: 'ai_knowledge_source',
      targetId: parsed.data.sourceId,
      metadata: { surface: 'ask_bdoor_ai' },
    });
  }

  await refresh();
  return { ok: true };
}

/**
 * Embed a published source. Kept separate from publishing on purpose: a
 * publish that silently triggered a paid embedding run would make the review
 * step feel expensive, and a re-index after a typo fix must not require
 * re-publishing.
 */
export async function indexKnowledgeSource(sourceId: string): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  if (!z.string().uuid().safeParse(sourceId).success) {
    return { ok: false, error: 'invalid_request' };
  }

  const result = await indexSource(sourceId, session.userId);
  if (!result.ok) return { ok: false, error: result.detail ?? result.reason };

  await refresh();
  return { ok: true, detail: `${result.chunks}` };
}

/** Import the reviewed site content as drafts. Creates nothing published. */
export async function importKnowledgeSeed(): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  const { created, skipped } = await importSeedSources(session.userId);
  await refresh();
  return { ok: true, detail: `${created}/${skipped}` };
}

/** Room to leave for one source: an embedding round trip plus its writes. */
const SEED_RESERVE_MS = 20_000;
/** Well inside the route's `maxDuration`, leaving time to record and return. */
const SEED_BUDGET_MS = 240_000;

/**
 * Publish and index the reviewed seed sources, in one audited action.
 *
 * The clicking admin is the recorded reviewer for every step — this walks each
 * source through in_review → approved → published rather than shortcutting the
 * workflow, and it touches ONLY sources whose slug comes from the repo's
 * reviewed seed (never a source authored or edited in the admin).
 *
 * It works to a deadline. Indexing costs an embedding round trip plus several
 * writes per source, and the full seed is dozens of them; a single unbounded
 * loop is one platform timeout away from stopping midway with nothing said.
 * So the loop stops cleanly between sources when the budget runs low and
 * reports exactly what is left, and a second click resumes — `pendingSeedWork`
 * recomputes the remaining work from the database each time, so nothing is
 * repeated and nothing is skipped.
 */
export async function publishImportedSeed(): Promise<ActionResult> {
  const session = await requireCapability('content.publish');

  const seedSlugs = seedSources().map((candidate) => candidate.slug);
  const queue = pendingSeedWork(await listSources(), seedSlugs);

  const startedAt = Date.now();
  let published = 0;
  let indexed = 0;
  let failed = 0;
  let processed = 0;

  for (const item of queue) {
    if (!hasBudget(startedAt, Date.now(), SEED_BUDGET_MS, SEED_RESERVE_MS)) break;
    processed += 1;

    let reachedPublished = !item.needsPublish;
    if (item.needsPublish) {
      for (const step of ['in_review', 'approved', 'published'] as const) {
        const moved = await transitionSource(item.id, step, session.userId, 'bulk seed publish');
        if (!moved.ok) {
          failed += 1;
          reachedPublished = false;
          break;
        }
        reachedPublished = step === 'published';
      }
      if (reachedPublished) published += 1;
    }

    if (reachedPublished && item.needsIndex) {
      const result = await indexSource(item.id, session.userId);
      if (result.ok) indexed += 1;
      else failed += 1;
    }
  }

  const remaining = queue.length - processed;

  if (published > 0 || indexed > 0) {
    await recordAudit({
      action: 'content.published',
      targetType: 'ai_knowledge_source',
      targetId: null,
      metadata: { surface: 'ask_bdoor_ai', bulk: true, published, indexed, failed, remaining },
    });
  }

  await refresh();
  return {
    ok: true,
    detail: `${published} published, ${indexed} indexed, ${failed} failed, ${remaining} remaining`,
  };
}
