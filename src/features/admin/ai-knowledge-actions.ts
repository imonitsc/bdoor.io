'use server';

import { getLocale } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  importSeedSources,
  indexSource,
  transitionSource,
  type SourceStatus,
} from '@/features/ai/knowledge';
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
