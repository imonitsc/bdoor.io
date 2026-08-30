import 'server-only';

import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { recordAnalyticsEvent } from '@/lib/analytics';

/**
 * Marks sent quote versions as viewed the first time the customer's billing
 * page renders them (§8 "viewed" — a timestamp on the issued version, not a
 * lifecycle state; see docs/fundable-baseline.md).
 *
 * Runs with the service role because `quote_versions` is writable only by
 * finance under RLS, and the viewer is a customer. The `.is('viewed_at',
 * null)` guard keeps the stamp first-view-only, and the returned rows are the
 * ones actually stamped, so the funnel event fires once per version.
 */
export async function markQuoteVersionsViewed(
  versionIds: readonly string[],
  organizationId: string,
  actorEmail: string | null,
): Promise<void> {
  if (!hasServiceRole() || versionIds.length === 0) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from('quote_versions')
    .update({ viewed_at: new Date().toISOString() })
    .in('id', versionIds as string[])
    .is('viewed_at', null)
    .not('sent_at', 'is', null)
    .select('id');

  for (const row of data ?? []) {
    await recordAnalyticsEvent({
      event: 'quote_viewed',
      idempotencyKey: `quote_viewed:${row.id}`,
      actorEmail,
      organizationId,
      quoteVersionId: row.id,
    });
  }
}
