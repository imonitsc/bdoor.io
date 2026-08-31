import 'server-only';

import { aiDb, hasAiDatabase } from '../db';
import { transitionSource } from '../knowledge';
import { REGISTRY_SEED } from './registry-seed';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';

/**
 * Registry documents: the versioned record of official Bangladesh documents.
 *
 * The lifecycle is enforced here, not in the UI:
 *
 *   discovered → downloaded → extracted → review_required
 *     → approved → published → superseded / withdrawn
 *
 * Only 'published' feeds the customer-facing corpus, and publication is the
 * one step that writes into `ai_knowledge_sources` — through that table's own
 * legal transitions, so there is exactly one workflow to reason about on the
 * retrieval side. A *proposed* instrument (draft amendment, budget speech)
 * refuses publication outright: it becomes publishable only when a reviewer
 * records, with evidence, that it took effect.
 */

export type DocumentLifecycle = Database['public']['Enums']['ai_registry_lifecycle'];
export type RegistryDocument = Database['public']['Tables']['ai_registry_documents']['Row'];
export type RegistrySource = Database['public']['Tables']['ai_source_registry']['Row'];

export const DOCUMENT_TRANSITIONS: Record<DocumentLifecycle, DocumentLifecycle[]> = {
  discovered: ['downloaded', 'withdrawn'],
  downloaded: ['extracted', 'withdrawn'],
  extracted: ['review_required', 'withdrawn'],
  // A reviewer can send a document back for a fresh fetch, or approve it.
  review_required: ['approved', 'downloaded', 'withdrawn'],
  approved: ['published', 'review_required', 'withdrawn'],
  published: ['superseded', 'withdrawn'],
  superseded: ['withdrawn'],
  // Withdrawn is recoverable only back into review — never straight to published.
  withdrawn: ['review_required'],
};

export function canTransitionDocument(from: DocumentLifecycle, to: DocumentLifecycle): boolean {
  return DOCUMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

async function auditRegistry(entry: {
  registrySourceId?: string | null;
  registryDocumentId?: string | null;
  ruleId?: string | null;
  action: string;
  from?: string | null;
  to?: string | null;
  actorId?: string | null;
  note?: string | null;
}) {
  const { error } = await aiDb()
    .from('ai_registry_audit_log')
    .insert({
      registry_source_id: entry.registrySourceId ?? null,
      registry_document_id: entry.registryDocumentId ?? null,
      rule_id: entry.ruleId ?? null,
      action: entry.action,
      from_state: entry.from ?? null,
      to_state: entry.to ?? null,
      actor_id: entry.actorId ?? null,
      note: entry.note ?? null,
    });
  if (error) logger.warn('ai.registry.audit_failed', { code: error.code ?? null });
}

/**
 * Seed the source registry. Insert-if-missing by code: an institution a human
 * has edited (frequency, URL, enabled flag) is never overwritten by a re-run.
 */
export async function seedRegistry(actorId: string): Promise<{ created: number; skipped: number }> {
  if (!hasAiDatabase()) return { created: 0, skipped: 0 };
  const db = aiDb();

  const { data: existing } = await db.from('ai_source_registry').select('code').limit(500);
  const known = new Set((existing ?? []).map((row) => row.code));

  let created = 0;
  let skipped = 0;
  for (const seed of REGISTRY_SEED) {
    if (known.has(seed.code)) {
      skipped += 1;
      continue;
    }
    const { data, error } = await db
      .from('ai_source_registry')
      .insert({
        code: seed.code,
        institution: seed.institution,
        institution_bn: seed.institutionBn ?? null,
        kind: seed.kind,
        base_url: seed.baseUrl,
        authority_tier: seed.authorityTier,
        topics: seed.topics,
        check_frequency_hours: seed.checkFrequencyHours,
        notes: seed.notes ?? null,
        created_by: actorId,
      })
      .select('id');
    if (error) {
      logger.warn('ai.registry.seed_failed', { code: error.code ?? null, source: seed.code });
      continue;
    }
    created += 1;
    await auditRegistry({
      registrySourceId: data?.[0]?.id ?? null,
      action: 'registry_created',
      actorId,
      note: `seeded ${seed.code}`,
    });
  }
  return { created, skipped };
}

export async function listRegistry(): Promise<RegistrySource[]> {
  if (!hasAiDatabase()) return [];
  const { data } = await aiDb()
    .from('ai_source_registry')
    .select('*')
    .order('authority_tier', { ascending: true })
    .order('institution', { ascending: true })
    .limit(200);
  return data ?? [];
}

export async function listDocuments(filter?: {
  lifecycle?: DocumentLifecycle;
  registrySourceId?: string;
}): Promise<RegistryDocument[]> {
  if (!hasAiDatabase()) return [];
  let query = aiDb()
    .from('ai_registry_documents')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(300);
  if (filter?.lifecycle) query = query.eq('lifecycle', filter.lifecycle);
  if (filter?.registrySourceId) query = query.eq('registry_source_id', filter.registrySourceId);
  const { data } = await query;
  return data ?? [];
}

export async function getDocument(id: string): Promise<RegistryDocument | null> {
  if (!hasAiDatabase()) return null;
  const { data } = await aiDb()
    .from('ai_registry_documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data;
}

/**
 * Record a newly discovered document. Idempotent on canonical URL: a document
 * already tracked (in any state that is not superseded/withdrawn) is not
 * rediscovered, so the gazette crawler can re-list a page it has seen at no
 * cost.
 */
export async function registerDiscoveredDocument(input: {
  registrySourceId: string;
  issuingInstitution: string;
  sourceKind: string;
  officialTitle: string;
  canonicalUrl: string;
  referenceNumber?: string | null;
  language?: 'en' | 'bn' | 'mixed';
  authorityTier: number;
  topics?: Database['public']['Enums']['ai_topic'][];
  jurisdiction?: string;
  createdBy?: string | null;
}): Promise<{ id: string; created: boolean } | null> {
  if (!hasAiDatabase()) return null;
  const db = aiDb();

  const { data: existing } = await db
    .from('ai_registry_documents')
    .select('id, lifecycle')
    .eq('canonical_url', input.canonicalUrl)
    .not('lifecycle', 'in', '("superseded","withdrawn")')
    .limit(1);

  const known = existing?.[0];
  if (known) return { id: known.id, created: false };

  const { data, error } = await db
    .from('ai_registry_documents')
    .insert({
      registry_source_id: input.registrySourceId,
      issuing_institution: input.issuingInstitution,
      source_kind: input.sourceKind,
      official_title: input.officialTitle,
      canonical_url: input.canonicalUrl,
      reference_number: input.referenceNumber ?? null,
      language: input.language ?? 'en',
      authority_tier: input.authorityTier,
      topics: input.topics ?? [],
      jurisdiction: input.jurisdiction ?? 'national',
      lifecycle: 'discovered',
      created_by: input.createdBy ?? null,
    })
    .select('id');

  if (error || !data?.[0]) {
    logger.warn('ai.registry.discover_failed', { code: error?.code ?? null });
    return null;
  }

  await auditRegistry({
    registrySourceId: input.registrySourceId,
    registryDocumentId: data[0].id,
    action: 'document_discovered',
    note: input.canonicalUrl,
  });
  return { id: data[0].id, created: true };
}

/**
 * Move a document through its lifecycle. Publication and withdrawal have side
 * effects on the customer-facing corpus, handled below in publishDocument /
 * retireDocument — this function refuses to shortcut them.
 */
export async function transitionDocument(
  id: string,
  to: DocumentLifecycle,
  actorId: string,
  note?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasAiDatabase()) return { ok: false, reason: 'failed' };
  const document = await getDocument(id);
  if (!document) return { ok: false, reason: 'not_found' };
  if (!canTransitionDocument(document.lifecycle, to)) {
    return { ok: false, reason: 'illegal_transition' };
  }
  // Publication is not a plain status flip: use publishDocument, which writes
  // the knowledge source. Same for retiring a published document.
  if (to === 'published') return { ok: false, reason: 'use_publish' };
  if (document.lifecycle === 'published') return { ok: false, reason: 'use_retire' };

  const patch: Database['public']['Tables']['ai_registry_documents']['Update'] = { lifecycle: to };
  if (to === 'approved') {
    patch.reviewed_by = actorId;
    patch.reviewed_at = new Date().toISOString();
  }

  const { error } = await aiDb().from('ai_registry_documents').update(patch).eq('id', id);
  if (error) return { ok: false, reason: 'failed' };

  await auditRegistry({
    registryDocumentId: id,
    registrySourceId: document.registry_source_id,
    action: 'lifecycle_changed',
    from: document.lifecycle,
    to,
    actorId,
    note: note ?? null,
  });
  return { ok: true };
}

/**
 * Publish an approved document into the retrievable corpus.
 *
 * Creates (or updates) the linked `ai_knowledge_sources` row from the
 * reviewed extracted text and walks it through that table's own legal
 * transitions — in_review, approved, published — under the publishing
 * reviewer's identity. One deliberate refusal: a document whose currency is
 * 'proposed' cannot be published. A proposal becomes publishable only after a
 * reviewer records evidence it took effect and flips the currency.
 *
 * Publishing does not index. Embedding is a separate, paid step, exactly as
 * it is for every other knowledge source.
 */
export async function publishDocument(
  id: string,
  actorId: string,
): Promise<{ ok: true; knowledgeSourceId: string } | { ok: false; reason: string }> {
  if (!hasAiDatabase()) return { ok: false, reason: 'failed' };
  const db = aiDb();
  const document = await getDocument(id);
  if (!document) return { ok: false, reason: 'not_found' };
  if (document.lifecycle !== 'approved') return { ok: false, reason: 'not_approved' };
  if (document.currency === 'proposed') return { ok: false, reason: 'proposed_not_publishable' };
  if (!document.extracted_text || document.extracted_text.trim().length === 0) {
    return { ok: false, reason: 'no_extracted_text' };
  }

  let knowledgeSourceId = document.knowledge_source_id;

  if (knowledgeSourceId) {
    // Re-publication after an edit: refresh the body and metadata; the index
    // is cleared so stale chunks cannot be retrieved under the new text.
    const { error } = await db
      .from('ai_knowledge_sources')
      .update({
        title: document.official_title,
        body: document.extracted_text,
        source_url: document.canonical_url,
        effective_from: document.effective_date ?? new Date().toISOString().slice(0, 10),
        expires_on: document.expiry_date,
        authority_tier: document.authority_tier,
        topics: document.topics,
        issuing_institution: document.issuing_institution,
        reference_number: document.reference_number,
        publication_date: document.publication_date,
        indexed_at: null,
        review_due_on: document.review_due_on,
      })
      .eq('id', knowledgeSourceId);
    if (error) return { ok: false, reason: 'failed' };
  } else {
    const { data, error } = await db
      .from('ai_knowledge_sources')
      .insert({
        slug: `bd-reg-${document.id.slice(0, 8)}`,
        title: document.official_title,
        country: 'bd',
        locale: document.language === 'bn' ? 'bn' : 'en',
        source_type: 'government_reference',
        source_url: document.canonical_url,
        body: document.extracted_text,
        effective_from: document.effective_date ?? new Date().toISOString().slice(0, 10),
        expires_on: document.expiry_date,
        review_due_on: document.review_due_on,
        status: 'draft',
        access_scope: 'public',
        authority_tier: document.authority_tier,
        topics: document.topics,
        issuing_institution: document.issuing_institution,
        reference_number: document.reference_number,
        publication_date: document.publication_date,
        registry_document_id: document.id,
        created_by: actorId,
      })
      .select('id');
    if (error || !data?.[0]) return { ok: false, reason: 'failed' };
    knowledgeSourceId = data[0].id;
  }

  // Walk the knowledge workflow one legal step at a time under the reviewer's
  // identity. The registry review chain (review_required → approved →
  // published, each by a person) is the review these steps record.
  const current = await db
    .from('ai_knowledge_sources')
    .select('status')
    .eq('id', knowledgeSourceId)
    .maybeSingle();
  const steps: Array<'in_review' | 'approved' | 'published'> =
    current.data?.status === 'published'
      ? []
      : current.data?.status === 'approved'
        ? ['published']
        : current.data?.status === 'in_review'
          ? ['approved', 'published']
          : ['in_review', 'approved', 'published'];
  for (const step of steps) {
    const moved = await transitionSource(knowledgeSourceId, step, actorId, 'registry publication');
    if (!moved.ok) return { ok: false, reason: `knowledge_${moved.reason}` };
  }

  const { error: markError } = await db
    .from('ai_registry_documents')
    .update({
      lifecycle: 'published',
      published_by: actorId,
      published_at: new Date().toISOString(),
      knowledge_source_id: knowledgeSourceId,
    })
    .eq('id', id);
  if (markError) return { ok: false, reason: 'failed' };

  await auditRegistry({
    registryDocumentId: id,
    registrySourceId: document.registry_source_id,
    action: 'document_published',
    from: 'approved',
    to: 'published',
    actorId,
  });

  return { ok: true, knowledgeSourceId };
}

/**
 * Retire a published document: supersede (a newer version replaced it) or
 * withdraw (it should never have been served). Both immediately withdraw the
 * linked knowledge source, which deletes its chunks — an answer must never
 * cite a document that has been pulled.
 */
export async function retireDocument(
  id: string,
  mode: 'superseded' | 'withdrawn',
  actorId: string,
  options?: { replacedById?: string; note?: string },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasAiDatabase()) return { ok: false, reason: 'failed' };
  const db = aiDb();
  const document = await getDocument(id);
  if (!document) return { ok: false, reason: 'not_found' };
  if (document.lifecycle !== 'published') return { ok: false, reason: 'not_published' };

  if (document.knowledge_source_id) {
    const withdrawn = await transitionSource(
      document.knowledge_source_id,
      'withdrawn',
      actorId,
      `registry document ${mode}`,
    );
    if (!withdrawn.ok) return { ok: false, reason: `knowledge_${withdrawn.reason}` };
  }

  const { error } = await db
    .from('ai_registry_documents')
    .update({
      lifecycle: mode,
      currency: mode,
      replaced_by_id: options?.replacedById ?? document.replaced_by_id,
    })
    .eq('id', id);
  if (error) return { ok: false, reason: 'failed' };

  await auditRegistry({
    registryDocumentId: id,
    registrySourceId: document.registry_source_id,
    action: mode === 'superseded' ? 'document_superseded' : 'document_withdrawn',
    from: 'published',
    to: mode,
    actorId,
    note: options?.note ?? null,
  });
  return { ok: true };
}
