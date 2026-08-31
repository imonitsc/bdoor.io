import 'server-only';

import { z } from 'zod';

import { requireSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * One-time data capture (replacement BI-OS instruction §4.0.1).
 *
 * A business profile fact is never edited: recording a new value closes the
 * current row and inserts a fresh one, so who supplied what, when, and on
 * which evidence survives every correction. Workflows read `currentFacts()`
 * and show the customer the value they are about to reuse — reuse is always
 * visible confirmation, never silent trust (§4.0.1's own rule).
 *
 * Access control is the table's RLS (same tenancy as the companies row); this
 * module runs on the cookie-bound client so a customer can only ever touch
 * their own organisation's facts.
 */

export const factSchema = z.object({
  companyId: z.string().uuid(),
  // Namespaced keys ('registration.rjsc_number', 'address.registered.city')
  // rather than free text, so two workflows cannot invent two spellings of
  // the same fact.
  fieldKey: z.string().regex(/^[a-z][a-z0-9_.]{0,99}$/),
  value: z.string().trim().min(1).max(2_000),
  sourceDocumentId: z.string().uuid().nullish(),
});

export type FactInput = z.infer<typeof factSchema>;

export type ProfileFact = {
  fieldKey: string;
  value: string;
  suppliedAt: string;
  verificationStatus: string;
  sourceDocumentId: string | null;
};

/** The current (unsuperseded) facts for one company, newest key order. */
export async function currentFacts(companyId: string): Promise<ProfileFact[]> {
  const db = await createClient();
  const { data, error } = await db
    .from('business_profile_facts')
    .select('field_key, value, supplied_at, verification_status, source_document_id')
    .eq('company_id', companyId)
    .is('superseded_at', null)
    .order('field_key');

  if (error) {
    logger.warn('companies.facts.read_failed', { code: error.code ?? null });
    return [];
  }
  return (data ?? []).map((row) => ({
    fieldKey: row.field_key,
    value: row.value,
    suppliedAt: row.supplied_at,
    verificationStatus: row.verification_status,
    sourceDocumentId: row.source_document_id,
  }));
}

/**
 * Record a fact, superseding any current value for the same key. Returns
 * false when the write was refused (validation or RLS) — the caller shows an
 * error rather than pretending the fact was saved.
 */
export async function recordFact(input: FactInput): Promise<boolean> {
  const parsed = factSchema.safeParse(input);
  if (!parsed.success) return false;

  const session = await requireSession();
  const db = await createClient();

  const { error: closeError } = await db
    .from('business_profile_facts')
    .update({ superseded_at: new Date().toISOString() })
    .eq('company_id', parsed.data.companyId)
    .eq('field_key', parsed.data.fieldKey)
    .is('superseded_at', null);

  if (closeError) {
    logger.warn('companies.facts.supersede_failed', { code: closeError.code ?? null });
    return false;
  }

  const { error } = await db.from('business_profile_facts').insert({
    company_id: parsed.data.companyId,
    field_key: parsed.data.fieldKey,
    value: parsed.data.value,
    supplied_by: session.userId,
    source_document_id: parsed.data.sourceDocumentId ?? null,
  });

  if (error) {
    logger.warn('companies.facts.write_failed', { code: error.code ?? null });
    return false;
  }
  return true;
}
