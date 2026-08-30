import 'server-only';

import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';

/**
 * Database access for Ask bdoor AI.
 *
 * The service role is used deliberately, and only from server-only modules
 * under `src/features/ai`: the assistant writes conversations, messages and
 * usage rows that no browser role may write (there is no insert policy for
 * `anon` or `authenticated` on any of them, by design). Every read it performs
 * is either public knowledge or has already been permission-checked by the
 * caller.
 *
 * The service role bypasses RLS, which is why the retrieval function repeats
 * the `access_scope = 'public'` and liveness filters inside its own body
 * rather than relying on the policies. A filter that lives only in a policy is
 * not a filter on this path.
 */
export function aiDb() {
  return createAdminClient();
}

/** False in local development without a service key; the feature degrades rather than throwing. */
export function hasAiDatabase(): boolean {
  return hasServiceRole();
}

/** One row from `public.ai_search_knowledge`. */
export type RetrievedChunk = {
  chunk_id: string;
  source_id: string;
  content: string;
  title: string;
  source_url: string | null;
  country: string;
  locale: 'en' | 'bn';
  source_type: string;
  last_reviewed_at: string | null;
  effective_from: string;
  score: number;
};
