import 'server-only';

import { headers } from 'next/headers';
import type { Enums } from '@/types/database';
import { POLICY_VERSIONS } from '@/content/legal/documents';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { hashIdentifier } from '@/lib/utils/hash';
import { logger } from '@/lib/logger';

/**
 * Durable record of a policy acceptance in `public.consent_records`.
 *
 * Best-effort by design: consent is already enforced by the form (the schema
 * refuses an unticked box), so a failed insert must not roll back a signup or
 * an application — but it must be loud in the logs. The row stores WHO (user
 * id when one exists), WHAT (consent type + the exact policy version shown),
 * WHEN (created_at), WHERE FROM (hashed IP and user agent — never the raw
 * values) and HOW (`method`). Uses the service role because the moment of
 * acceptance often has no authenticated session yet (signup, anonymous
 * application).
 */
export type ConsentMethod = 'signup_checkbox' | 'application_consent' | 'quote_acceptance';

export async function recordPolicyConsent(entry: {
  consentType: Enums<'consent_type'>;
  policyVersion: string;
  method: ConsentMethod;
  userId?: string | null;
  organizationId?: string | null;
  caseId?: string | null;
  locale: 'en' | 'bn';
}): Promise<void> {
  if (!hasServiceRole()) return;

  try {
    const headerList = await headers();
    const ip = (headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
    const userAgent = headerList.get('user-agent') ?? 'unknown';

    const { error } = await createAdminClient()
      .from('consent_records')
      .insert({
        user_id: entry.userId ?? null,
        organization_id: entry.organizationId ?? null,
        case_id: entry.caseId ?? null,
        consent_type: entry.consentType,
        policy_version: entry.policyVersion,
        locale: entry.locale,
        granted: true,
        ip_hash: hashIdentifier(ip),
        user_agent_hash: hashIdentifier(userAgent),
        method: entry.method,
      });

    if (error) {
      logger.error('consent.record_failed', {
        consentType: entry.consentType,
        method: entry.method,
        code: error.code ?? null,
      });
    }
  } catch (error) {
    logger.error('consent.record_threw', {
      consentType: entry.consentType,
      method: entry.method,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}

export { POLICY_VERSIONS };
