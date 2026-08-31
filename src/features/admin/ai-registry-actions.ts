'use server';

import { getLocale } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { aiDb, hasAiDatabase } from '@/features/ai/db';
import {
  publishDocument,
  retireDocument,
  seedRegistry,
  transitionDocument,
  type DocumentLifecycle,
} from '@/features/ai/registry/documents';
import { retrieveDiagnostics, type RetrievalDiagnostics } from '@/features/ai/diagnostics';
import { extractRulesDraft, transitionRule, type RuleStatus } from '@/features/ai/registry/rules';
import { retrieveContext, type RetrievalResult } from '@/features/ai/retrieval';
import { recordAudit } from '@/lib/audit';
import { requireCapability } from '@/lib/auth/session';

/**
 * Admin actions for the Bangladesh knowledge registry.
 *
 * `content.publish` gates every one of them, the same capability that governs
 * the rest of published content. Every state change is written to the
 * registry audit trail by the feature module, and publication additionally
 * lands in the platform audit log — publishing official material to the
 * assistant is a publication decision like any other.
 */

export type ActionResult = { ok: true; detail?: string } | { ok: false; error: string };

async function refresh(path: string) {
  revalidatePath(`/${await getLocale()}/admin/ai${path}`);
}

export async function seedSourceRegistry(): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  const { created, skipped } = await seedRegistry(session.userId);
  await refresh('/registry');
  return { ok: true, detail: `${created}/${skipped}` };
}

const registryPatchSchema = z.object({
  registrySourceId: z.string().uuid(),
  enabled: z.boolean().optional(),
  checkFrequencyHours: z.number().int().min(1).max(2_160).optional(),
});

export async function updateRegistrySource(
  input: z.infer<typeof registryPatchSchema>,
): Promise<ActionResult> {
  await requireCapability('content.publish');
  const parsed = registryPatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_request' };
  if (!hasAiDatabase()) return { ok: false, error: 'failed' };

  const patch: { enabled?: boolean; check_frequency_hours?: number } = {};
  if (parsed.data.enabled !== undefined) patch.enabled = parsed.data.enabled;
  if (parsed.data.checkFrequencyHours !== undefined)
    patch.check_frequency_hours = parsed.data.checkFrequencyHours;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await aiDb()
    .from('ai_source_registry')
    .update(patch)
    .eq('id', parsed.data.registrySourceId);
  if (error) return { ok: false, error: 'failed' };
  await refresh('/registry');
  return { ok: true };
}

const documentTransitionSchema = z.object({
  documentId: z.string().uuid(),
  lifecycle: z.enum(['downloaded', 'extracted', 'review_required', 'approved', 'withdrawn']),
  note: z.string().max(500).optional(),
});

export async function transitionRegistryDocument(input: {
  documentId: string;
  lifecycle: DocumentLifecycle;
  note?: string;
}): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  const parsed = documentTransitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_request' };

  const result = await transitionDocument(
    parsed.data.documentId,
    parsed.data.lifecycle,
    session.userId,
    parsed.data.note,
  );
  if (!result.ok) return { ok: false, error: result.reason };
  await refresh('/documents');
  return { ok: true };
}

export async function publishRegistryDocument(documentId: string): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  if (!z.string().uuid().safeParse(documentId).success) {
    return { ok: false, error: 'invalid_request' };
  }

  const result = await publishDocument(documentId, session.userId);
  if (!result.ok) return { ok: false, error: result.reason };

  await recordAudit({
    action: 'content.published',
    targetType: 'ai_registry_document',
    targetId: documentId,
    metadata: { surface: 'ask_bdoor_ai', knowledge_source_id: result.knowledgeSourceId },
  });
  await refresh('/documents');
  return { ok: true, detail: result.knowledgeSourceId };
}

const retireSchema = z.object({
  documentId: z.string().uuid(),
  mode: z.enum(['superseded', 'withdrawn']),
  note: z.string().max(500).optional(),
});

export async function retireRegistryDocument(
  input: z.infer<typeof retireSchema>,
): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  const parsed = retireSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_request' };

  const result = await retireDocument(parsed.data.documentId, parsed.data.mode, session.userId, {
    note: parsed.data.note,
  });
  if (!result.ok) return { ok: false, error: result.reason };

  await recordAudit({
    action: 'content.unpublished',
    targetType: 'ai_registry_document',
    targetId: parsed.data.documentId,
    metadata: { surface: 'ask_bdoor_ai', mode: parsed.data.mode },
  });
  await refresh('/documents');
  return { ok: true };
}

export async function extractRulesFromDocument(documentId: string): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  if (!z.string().uuid().safeParse(documentId).success) {
    return { ok: false, error: 'invalid_request' };
  }
  const result = await extractRulesDraft(documentId, session.userId);
  if (!result.ok) return { ok: false, error: result.reason };
  await refresh('/rules');
  return { ok: true, detail: `${result.created}` };
}

const ruleTransitionSchema = z.object({
  ruleId: z.string().uuid(),
  status: z.enum(['draft', 'in_review', 'approved', 'published', 'superseded', 'withdrawn']),
  note: z.string().max(500).optional(),
});

export async function transitionStructuredRule(input: {
  ruleId: string;
  status: RuleStatus;
  note?: string;
}): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  const parsed = ruleTransitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_request' };

  const result = await transitionRule(
    parsed.data.ruleId,
    parsed.data.status,
    session.userId,
    parsed.data.note,
  );
  if (!result.ok) return { ok: false, error: result.reason };

  if (parsed.data.status === 'published') {
    await recordAudit({
      action: 'content.published',
      targetType: 'ai_structured_rule',
      targetId: parsed.data.ruleId,
      metadata: { surface: 'ask_bdoor_ai' },
    });
  }
  await refresh('/rules');
  return { ok: true };
}

/**
 * A reviewer's assertion that the fee figure matches the instrument — or the
 * withdrawal of that assertion. Recorded with the reviewer's identity in the
 * registry audit trail; the publication gate reads this flag.
 */
export async function setRuleFeeVerified(input: {
  ruleId: string;
  verified: boolean;
}): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  if (!z.string().uuid().safeParse(input.ruleId).success) {
    return { ok: false, error: 'invalid_request' };
  }
  if (!hasAiDatabase()) return { ok: false, error: 'failed' };
  const db = aiDb();

  const { error } = await db
    .from('ai_structured_rules')
    .update({ government_fee_verified: input.verified })
    .eq('id', input.ruleId);
  if (error) return { ok: false, error: 'failed' };

  await db.from('ai_registry_audit_log').insert({
    rule_id: input.ruleId,
    action: 'rule_updated',
    actor_id: session.userId,
    note: input.verified ? 'government fee verified' : 'government fee verification withdrawn',
  });
  await refresh('/rules');
  return { ok: true };
}

export async function resolveChangeAlert(alertId: string): Promise<ActionResult> {
  const session = await requireCapability('content.publish');
  if (!z.string().uuid().safeParse(alertId).success) {
    return { ok: false, error: 'invalid_request' };
  }
  if (!hasAiDatabase()) return { ok: false, error: 'failed' };
  const db = aiDb();

  const { error } = await db
    .from('ai_source_change_alerts')
    .update({ resolved_at: new Date().toISOString(), resolved_by: session.userId })
    .eq('id', alertId)
    .is('resolved_at', null);
  if (error) return { ok: false, error: 'failed' };

  await db.from('ai_registry_audit_log').insert({
    action: 'alert_resolved',
    actor_id: session.userId,
    note: alertId,
  });
  await refresh('/documents');
  return { ok: true };
}

const testQuerySchema = z.object({
  question: z.string().min(3).max(500),
  locale: z.enum(['en', 'bn']),
  country: z.string().min(2).max(6),
});

export type RetrievalTestResult =
  | { ok: true; result: Pick<RetrievalResult, 'context' | 'structured' | 'citations' | 'empty'> }
  | { ok: false; error: string };

/**
 * The retrieval testing console: run the real retrieval pipeline for a
 * question and show exactly what the model would be handed. No model call —
 * this costs an embedding, not an answer.
 */
export async function runRetrievalTest(input: {
  question: string;
  locale: 'en' | 'bn';
  country: string;
}): Promise<RetrievalTestResult> {
  await requireCapability('content.publish');
  const parsed = testQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_request' };

  try {
    const result = await retrieveContext(
      parsed.data.question,
      parsed.data.locale,
      parsed.data.country,
    );
    return {
      ok: true,
      result: {
        context: result.context,
        structured: result.structured,
        citations: result.citations,
        empty: result.empty,
      },
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export type RetrievalDiagnosticResult =
  { ok: true; diagnostics: RetrievalDiagnostics } | { ok: false; error: string };

/**
 * The "why" behind a retrieval: every candidate with its per-list ranks and
 * score components, and the sources that look relevant but can never be
 * retrieved (not published, published-but-not-indexed, or restricted).
 */
export async function runRetrievalDiagnostic(input: {
  question: string;
  locale: 'en' | 'bn';
  country: string;
}): Promise<RetrievalDiagnosticResult> {
  await requireCapability('content.publish');
  const parsed = testQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_request' };

  try {
    const diagnostics = await retrieveDiagnostics(
      parsed.data.question,
      parsed.data.locale,
      parsed.data.country,
    );
    return { ok: true, diagnostics };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
