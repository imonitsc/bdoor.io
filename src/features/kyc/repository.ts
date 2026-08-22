import 'server-only';

import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { requireCapability } from '@/lib/auth/session';
import { screeningIsMock } from '@/lib/screening';
import type { Enums } from '@/types/database';

/**
 * Access to the restricted `compliance` schema.
 *
 * That schema is not exposed through the Data API at all, so it can only be
 * reached with the service role. Every function here therefore checks the
 * caller's capability FIRST and only then reaches for the admin client — the
 * capability check is the real boundary, not an afterthought.
 */

export type RiskFlag = {
  id: string;
  code: string;
  severity: string;
  detail: string;
  tippingOffSensitive: boolean;
  raisedAt: string;
  clearedAt: string | null;
};

export type ScreeningResult = {
  id: string;
  checkType: Enums<'kyc_check_type'>;
  provider: string;
  isMock: boolean;
  matched: boolean;
  matchCount: number;
  createdAt: string;
};

export type RestrictedNote = {
  id: string;
  body: string;
  classification: string;
  tippingOffSensitive: boolean;
  createdAt: string;
};

export type ComplianceView = {
  available: boolean;
  screeningIsMock: boolean;
  flags: RiskFlag[];
  screenings: ScreeningResult[];
  notes: RestrictedNote[];
};

export async function getComplianceView(caseId: string): Promise<ComplianceView> {
  await requireCapability('risk.read');

  if (!hasServiceRole()) {
    return {
      available: false,
      screeningIsMock: screeningIsMock(),
      flags: [],
      screenings: [],
      notes: [],
    };
  }

  const admin = createAdminClient();
  const compliance = admin.schema('compliance' as never);

  const [flags, screenings, notes] = await Promise.all([
    compliance
      .from('risk_flags')
      .select('id, code, severity, detail, tipping_off_sensitive, raised_at, cleared_at')
      .eq('case_id', caseId)
      .order('raised_at', { ascending: false }),
    compliance
      .from('screening_results')
      .select('id, check_type, provider, is_mock, matched, match_count, created_at, kyc_case_id')
      .order('created_at', { ascending: false })
      .limit(50),
    compliance
      .from('restricted_case_notes')
      .select('id, body, classification, tipping_off_sensitive, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
  ]);

  type FlagRow = {
    id: string;
    code: string;
    severity: string;
    detail: string;
    tipping_off_sensitive: boolean;
    raised_at: string;
    cleared_at: string | null;
  };
  type ScreeningRow = {
    id: string;
    check_type: Enums<'kyc_check_type'>;
    provider: string;
    is_mock: boolean;
    matched: boolean;
    match_count: number;
    created_at: string;
  };
  type NoteRow = {
    id: string;
    body: string;
    classification: string;
    tipping_off_sensitive: boolean;
    created_at: string;
  };

  return {
    available: true,
    screeningIsMock: screeningIsMock(),
    flags: ((flags.data ?? []) as unknown as FlagRow[]).map((row) => ({
      id: row.id,
      code: row.code,
      severity: row.severity,
      detail: row.detail,
      tippingOffSensitive: row.tipping_off_sensitive,
      raisedAt: row.raised_at,
      clearedAt: row.cleared_at,
    })),
    screenings: ((screenings.data ?? []) as unknown as ScreeningRow[]).map((row) => ({
      id: row.id,
      checkType: row.check_type,
      provider: row.provider,
      isMock: row.is_mock,
      matched: row.matched,
      matchCount: row.match_count,
      createdAt: row.created_at,
    })),
    notes: ((notes.data ?? []) as unknown as NoteRow[]).map((row) => ({
      id: row.id,
      body: row.body,
      classification: row.classification,
      tippingOffSensitive: row.tipping_off_sensitive,
      createdAt: row.created_at,
    })),
  };
}
