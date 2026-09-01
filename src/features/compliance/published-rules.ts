import 'server-only';

import { createPublicClient } from '@/lib/supabase/public';

/**
 * Published rules for a jurisdiction, for the public country pages
 * (ROADMAP P5.3 / P1.3: the page stops being the source and becomes a view
 * of it). Runs through the cookie-free public client so country pages stay
 * statically renderable; the `ai_rules_public_read` policy already scopes
 * anon reads to live published rules, and the explicit filters below state
 * the same intent in code.
 *
 * Empty is the normal answer until analysts populate a jurisdiction's
 * corpus — the caller falls back to the human-reviewed guide prose, so the
 * section never renders less than it does today and upgrades rule by rule.
 */
export type PublishedJurisdictionRule = {
  id: string;
  title: string;
  authority: string;
  /** The reviewer's sign-off date, falling back to publication (per-rule). */
  lastReviewed: string | null;
};

export async function publishedRulesForJurisdiction(
  code: string,
): Promise<PublishedJurisdictionRule[]> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const { data } = await createPublicClient()
      .from('ai_structured_rules')
      .select('id, title, responsible_authority, reviewed_at, published_at')
      .eq('status', 'published')
      .eq('jurisdiction_code', code)
      .is('superseded_by_id', null)
      .or(`effective_from.is.null,effective_from.lte.${today}`)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order('title');

    return (data ?? []).map((rule) => {
      const reviewed = rule.reviewed_at ?? rule.published_at;
      return {
        id: rule.id,
        title: rule.title,
        authority: rule.responsible_authority,
        lastReviewed: reviewed ? reviewed.slice(0, 10) : null,
      };
    });
  } catch {
    // A build-time or transient read failure must degrade to the guide
    // prose, never to a broken page.
    return [];
  }
}
