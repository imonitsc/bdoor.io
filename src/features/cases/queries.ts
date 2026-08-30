import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { milestoneProgress } from './progress';
import { estimateCompletion, type EstimateResult } from './deadlines';
import type { CaseStatus, WaitingOn } from './state-machine';
import type { Enums } from '@/types/database';

export type CaseSummary = {
  id: string;
  reference: string;
  title: string;
  status: CaseStatus;
  waitingOn: WaitingOn;
  organizationId: string;
  organizationName: string;
  openedAt: string;
  updatedAt: string;
  progress: { completed: number; total: number; percent: number };
  estimate: EstimateResult;
  openActions: number;
};

type CaseRow = {
  id: string;
  reference: string;
  title: string;
  status: CaseStatus;
  waiting_on: WaitingOn;
  waiting_since: string | null;
  elapsed_days_banked: number;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  opened_at: string;
  updated_at: string;
  organization_id: string;
  organizations: { name: string } | null;
  case_milestones: Array<{ status: Enums<'milestone_status'>; weight: number }>;
  document_requests: Array<{ id: string; status: Enums<'document_status'> }>;
};

const CASE_SELECT = `
  id, reference, title, status, waiting_on, waiting_since, elapsed_days_banked,
  estimated_days_min, estimated_days_max, opened_at, updated_at, organization_id,
  organizations(name),
  case_milestones(status, weight),
  document_requests(id, status)
`;

function toSummary(row: CaseRow, now: Date): CaseSummary {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    status: row.status,
    waitingOn: row.waiting_on,
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? '',
    openedAt: row.opened_at,
    updatedAt: row.updated_at,
    progress: milestoneProgress(row.case_milestones ?? []),
    estimate: estimateCompletion({
      elapsedDaysBanked: row.elapsed_days_banked,
      estimatedDaysMin: row.estimated_days_min,
      estimatedDaysMax: row.estimated_days_max,
      waitingOn: row.waiting_on,
      waitingSince: row.waiting_since ? new Date(row.waiting_since) : null,
      now,
      openedAt: new Date(row.opened_at),
    }),
    openActions: (row.document_requests ?? []).filter(
      (r) => r.status === 'requested' || r.status === 'replacement_requested',
    ).length,
  };
}

/**
 * Cases the caller can see. RLS decides which rows come back — this query does
 * not filter by organization, because doing so in the client would be a second,
 * weaker copy of the rule that already exists in the database.
 */
export const listCases = cache(
  async (options?: { includeClosed?: boolean }): Promise<CaseSummary[]> => {
    const supabase = await createClient();
    let query = supabase
      .from('cases')
      .select(CASE_SELECT)
      .order('updated_at', { ascending: false });

    if (!options?.includeClosed) {
      query = query.not('status', 'in', '("closed","cancelled")');
    }

    const { data, error } = await query;
    if (error || !data) return [];

    const now = new Date();
    return (data as unknown as CaseRow[]).map((row) => toSummary(row, now));
  },
);

export const getCaseSummary = cache(async (caseId: string): Promise<CaseSummary | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cases')
    .select(CASE_SELECT)
    .eq('id', caseId)
    .maybeSingle();

  if (error || !data) return null;
  return toSummary(data as unknown as CaseRow, new Date());
});

export type CaseDetail = {
  summary: CaseSummary;
  services: Array<{ serviceId: string; name: string; isPrimary: boolean }>;
  milestones: Array<{
    id: string;
    code: string;
    labelEn: string;
    labelBn: string;
    ownerKind: string;
    status: Enums<'milestone_status'>;
    dueOn: string | null;
    completedAt: string | null;
  }>;
  documentRequests: Array<{
    id: string;
    labelEn: string;
    labelBn: string;
    status: Enums<'document_status'>;
    dueOn: string | null;
    isMandatory: boolean;
  }>;
  partner: {
    assignmentId: string;
    organizationName: string;
    status: Enums<'assignment_status'>;
    authorized: boolean;
    conflictResult: string | null;
    disclosedAt: string | null;
  } | null;
  submissions: Array<{
    id: string;
    authorityName: string;
    submissionType: string;
    referenceNo: string | null;
    submittedOn: string;
    outcome: string | null;
  }>;
  history: Array<{
    id: string;
    toStatus: CaseStatus;
    fromStatus: CaseStatus | null;
    publicNote: string | null;
    actorKind: string;
    createdAt: string;
  }>;
};

export async function getCaseDetail(caseId: string): Promise<CaseDetail | null> {
  const summary = await getCaseSummary(caseId);
  if (!summary) return null;

  const supabase = await createClient();

  const [services, milestones, requests, assignment, submissions, history] = await Promise.all([
    supabase
      .from('case_services')
      .select('service_id, name_snapshot, is_primary')
      .eq('case_id', caseId),
    supabase
      .from('case_milestones')
      .select('id, code, label_en, label_bn, owner_kind, status, due_on, completed_at')
      .eq('case_id', caseId)
      .order('sort_order'),
    supabase
      .from('document_requests')
      .select('id, label_en, label_bn, status, due_on, is_mandatory')
      .eq('case_id', caseId)
      .order('created_at'),
    supabase
      .from('case_partner_assignments')
      .select(
        'id, status, customer_authorized_at, conflict_check_result, disclosed_at, ' +
          'organizations!case_partner_assignments_partner_org_id_fkey(name)',
      )
      .eq('case_id', caseId)
      .in('status', ['offered', 'accepted'])
      .maybeSingle(),
    supabase
      .from('authority_submissions')
      .select('id, authority_name, submission_type, reference_no, submitted_on, outcome')
      .eq('case_id', caseId)
      .order('submitted_on', { ascending: false }),
    // The customer-safe projection: internal notes are not in this view.
    supabase
      .from('case_status_history_public')
      .select('id, from_status, to_status, public_note, actor_kind, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
  ]);

  type AssignmentRow = {
    id: string;
    status: Enums<'assignment_status'>;
    customer_authorized_at: string | null;
    conflict_check_result: string | null;
    disclosed_at: string | null;
    organizations: { name: string } | null;
  };
  const assignmentRow = assignment.data as unknown as AssignmentRow | null;

  return {
    summary,
    services: (services.data ?? []).map((s) => ({
      serviceId: s.service_id,
      name: s.name_snapshot,
      isPrimary: s.is_primary,
    })),
    milestones: (milestones.data ?? []).map((m) => ({
      id: m.id,
      code: m.code,
      labelEn: m.label_en,
      labelBn: m.label_bn,
      ownerKind: m.owner_kind,
      status: m.status,
      dueOn: m.due_on,
      completedAt: m.completed_at,
    })),
    documentRequests: (requests.data ?? []).map((r) => ({
      id: r.id,
      labelEn: r.label_en,
      labelBn: r.label_bn,
      status: r.status,
      dueOn: r.due_on,
      isMandatory: r.is_mandatory,
    })),
    partner: assignmentRow
      ? {
          assignmentId: assignmentRow.id,
          organizationName: assignmentRow.organizations?.name ?? '',
          status: assignmentRow.status,
          authorized: Boolean(assignmentRow.customer_authorized_at),
          conflictResult: assignmentRow.conflict_check_result,
          disclosedAt: assignmentRow.disclosed_at,
        }
      : null,
    submissions: (submissions.data ?? []).map((s) => ({
      id: s.id,
      authorityName: s.authority_name,
      submissionType: s.submission_type,
      referenceNo: s.reference_no,
      submittedOn: s.submitted_on,
      outcome: s.outcome,
    })),
    history: (history.data ?? []).map((h) => ({
      id: h.id!,
      toStatus: h.to_status as CaseStatus,
      fromStatus: (h.from_status as CaseStatus | null) ?? null,
      publicNote: h.public_note,
      actorKind: h.actor_kind ?? 'staff',
      createdAt: h.created_at!,
    })),
  };
}
