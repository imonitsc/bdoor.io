'use server';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { recordAnalyticsEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { generateObligationsForOrganization } from './generate';
import { trackCompanySchema } from './track-schema';

export type TrackCompanyState = { status: 'idle' | 'error'; message?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The existing-entity Comply entry (ROADMAP P2): add the company the
 * customer already runs and generate its obligations calendar from the
 * published rules corpus. No formation flow, no specialist.
 *
 * The insert runs through the user-scoped client, so `companies_org_member`
 * RLS is the enforcement — this action only ever names the caller's own
 * organisation. Generation runs with the service role afterwards because
 * obligation inserts are staff-only under RLS; it is idempotent, so a retry
 * or the next subscription activation adds nothing twice.
 */
export async function trackCompany(
  _previous: TrackCompanyState,
  formData: FormData,
): Promise<TrackCompanyState> {
  const session = await requireSession();

  const membership = session.memberships.find((entry) => entry.kind === 'customer');
  if (!membership) return { status: 'error', message: 'generic' };

  const parsed = trackCompanySchema.safeParse({
    legalName: String(formData.get('legalName') ?? ''),
    structure: String(formData.get('structure') ?? ''),
    sector: String(formData.get('sector') ?? ''),
    incorporationDate: String(formData.get('incorporationDate') ?? ''),
    registrationNo: String(formData.get('registrationNo') ?? ''),
    etin: String(formData.get('etin') ?? ''),
    bin: String(formData.get('bin') ?? ''),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'generic' };
  }

  // The rule that led here, carried through so the page can keep showing
  // what the customer asked to track. Never anything but a uuid.
  const rawRule = String(formData.get('trackRuleId') ?? '');
  const trackRuleId = UUID.test(rawRule) ? rawRule : null;

  const supabase = await createClient();
  const { data: created, error: insertError } = await supabase
    .from('companies')
    .insert({
      organization_id: membership.organizationId,
      legal_name: parsed.data.legalName,
      structure: parsed.data.structure,
      sector: parsed.data.sector ?? null,
      incorporation_date: parsed.data.incorporationDate ?? null,
      registration_no: parsed.data.registrationNo ?? null,
      etin: parsed.data.etin ?? null,
      bin: parsed.data.bin ?? null,
      // The customer is telling us about a company that already exists;
      // 'incorporated' is this schema's word for that.
      status: 'incorporated',
    })
    .select('id')
    .maybeSingle();

  if (insertError || !created) {
    // The one duplicate worth naming: the registration number is unique
    // across the platform, so a collision usually means the company is
    // already tracked (possibly by another workspace).
    if (insertError?.code === '23505') {
      return { status: 'error', message: 'registrationExists' };
    }
    logger.error('comply.track_company_failed', { message: insertError?.message });
    return { status: 'error', message: 'generic' };
  }

  // The calendar is the deliverable. Generation failing must not lose the
  // company row the customer just created — it is logged loudly and the
  // next generation pass (subscription activation) is idempotent.
  if (hasServiceRole()) {
    try {
      await generateObligationsForOrganization(createAdminClient(), membership.organizationId);
    } catch (error) {
      logger.error('comply.track_generation_failed', {
        organizationId: membership.organizationId,
        message: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  await recordAnalyticsEvent({
    event: 'comply_company_tracked',
    idempotencyKey: `comply_company_tracked:${created.id}`,
    actorEmail: session.email,
    organizationId: membership.organizationId,
    properties: { structure: parsed.data.structure, fromRule: trackRuleId !== null },
  });

  await recordAudit({
    action: 'company.tracked',
    targetType: 'company',
    targetId: created.id,
    organizationId: membership.organizationId,
    metadata: { structure: parsed.data.structure, trackRuleId },
  });

  const locale = await getLocale();
  redirect(
    `/${locale}/app/compliance${trackRuleId ? `?track=${trackRuleId}&tracked=1` : '?tracked=1'}`,
  );
}
