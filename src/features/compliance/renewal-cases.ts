import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';
import { newApplicationReference } from '@/features/intake/application';
import { ACTIONABLE_STATUSES, DEFAULT_REMINDER_OFFSETS } from './reminders';

/**
 * Renewal-case generation.
 *
 * The published promise (/products/comply): "Renewal cases — a recurring
 * obligation becomes a managed case on the same profile", and "Preparation on
 * request: a specialist takes it up; you approve before anything is filed."
 * Everything below follows from those two sentences.
 *
 * The schema, the RLS, the `metrics_renewal_conversion` view and the admin
 * card for it all shipped with P4; what never existed was anything that
 * creates a `renewal_cases` row — so the take rate read zero by construction.
 * This is the generator, and it is the first code in the app that creates a
 * `case` at all.
 *
 * Three constraints shape it:
 *
 *   - **A generated case is an offer, not work.** It is created in `draft`,
 *     unpriced, with no provider assigned. The view counts `accepted` as a
 *     case that has moved past `draft`, so generating anything further along
 *     would make every offer instantly "accepted" and the take rate
 *     meaningless. Pricing follows KYC review, which is what the case state
 *     machine already models.
 *   - **Idempotent.** `renewal_cases (obligation_id, period_label)` is unique;
 *     a re-run inserts nothing.
 *   - **Subscribers only.** Renewal cases are a bdoor Comply benefit, and
 *     opening unsolicited managed cases for a company that never subscribed
 *     would be an unasked-for offer, not a service.
 *
 * Service role throughout: `cases`, `renewal_cases` and `compliance_obligations`
 * all accept staff writes only, and this runs from a cron with no session.
 */

/**
 * How far ahead of a deadline the offer opens. Deliberately the longest
 * reminder lead: the renewal case appears in the same run as the first
 * reminder about that deadline, so the customer meets one message about it
 * rather than two on different days. A product cadence, not a regulatory fact.
 */
const RENEWAL_LEAD_DAYS = Math.max(...DEFAULT_REMINDER_OFFSETS);

export type RenewalCandidate = {
  obligationId: string;
  organizationId: string;
  companyId: string;
  labelEn: string;
  dueOn: string;
  periodLabel: string;
};

type ObligationRow = {
  id: string;
  organization_id: string;
  company_id: string | null;
  label_en: string;
  due_on: string;
  status: string;
  renewal_case_id: string | null;
};

/**
 * The period an occurrence belongs to, as the unique key pairs with the
 * obligation. The due date itself: unambiguous, stable, and readable in the
 * database without joining anything. A corrected deadline becomes a different
 * period, which is the right behaviour — it is a different filing.
 */
export function renewalPeriodLabel(dueOn: string): string {
  return dueOn;
}

/**
 * Which obligations deserve an offer, given what already has one.
 *
 * Pure, so the decision that creates a customer-visible case can be tested
 * exhaustively. An obligation qualifies when it still needs action, belongs to
 * a company (the promise is "on the same profile"), its deadline is ahead but
 * inside the lead window, and neither the obligation nor the link table
 * already records a case for that period.
 */
export function renewalCandidates(
  obligations: readonly ObligationRow[],
  existingPeriods: ReadonlySet<string>,
  window: { today: string; horizon: string },
): { candidates: RenewalCandidate[]; alreadyOffered: number } {
  const candidates: RenewalCandidate[] = [];
  let alreadyOffered = 0;

  for (const obligation of obligations) {
    if (!obligation.company_id) continue;
    if (!(ACTIONABLE_STATUSES as readonly string[]).includes(obligation.status)) continue;
    // Ahead of the deadline and inside the window. A deadline already passed
    // is not a renewal to offer; it is a conversation to have.
    if (obligation.due_on < window.today) continue;
    if (obligation.due_on > window.horizon) continue;

    const periodLabel = renewalPeriodLabel(obligation.due_on);
    // Either record of an existing offer counts: the obligation's own shortcut
    // column, or the link table. They are two facts and both are checked, so a
    // half-written previous run still cannot produce a second offer.
    if (obligation.renewal_case_id || existingPeriods.has(`${obligation.id}:${periodLabel}`)) {
      alreadyOffered += 1;
      continue;
    }

    candidates.push({
      obligationId: obligation.id,
      organizationId: obligation.organization_id,
      companyId: obligation.company_id,
      labelEn: obligation.label_en,
      dueOn: obligation.due_on,
      periodLabel,
    });
  }

  candidates.sort(
    (a, b) => a.dueOn.localeCompare(b.dueOn) || a.obligationId.localeCompare(b.obligationId),
  );
  return { candidates, alreadyOffered };
}

export type RenewalGenerationReport = {
  /** Obligations inside the window for subscribed organisations. */
  considered: number;
  /** Renewal cases created this run. */
  offered: number;
  /** Candidates that already had a case (idempotent no-ops). */
  alreadyOffered: number;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export async function generateRenewalCases(
  admin: SupabaseClient<Database>,
  options: { now?: Date; limit?: number } = {},
): Promise<RenewalGenerationReport> {
  const now = options.now ?? new Date();
  const today = isoDate(now);
  const horizon = isoDate(addDays(now, RENEWAL_LEAD_DAYS));
  const limit = options.limit ?? 200;
  const report: RenewalGenerationReport = { considered: 0, offered: 0, alreadyOffered: 0 };

  // Subscribers only: an active Comply subscription is what a renewal case is
  // a benefit of.
  const { data: subscriptions, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('organization_id')
    .eq('status', 'active');

  if (subscriptionError) {
    logger.error('renewals.subscriptions_failed', { message: subscriptionError.message });
    return report;
  }

  const organizationIds = [...new Set((subscriptions ?? []).map((row) => row.organization_id))];
  if (organizationIds.length === 0) return report;

  const { data: obligationRows, error: obligationError } = await admin
    .from('compliance_obligations')
    .select('id, organization_id, company_id, label_en, due_on, status, renewal_case_id')
    .in('organization_id', organizationIds)
    .in('status', [...ACTIONABLE_STATUSES])
    .gte('due_on', today)
    .lte('due_on', horizon)
    .order('due_on')
    .limit(limit);

  if (obligationError) {
    logger.error('renewals.obligations_failed', { message: obligationError.message });
    return report;
  }

  const obligations = (obligationRows ?? []) as ObligationRow[];
  report.considered = obligations.length;
  if (obligations.length === 0) return report;

  // What already has an offer, so a re-run is a no-op rather than a race.
  const { data: existingRows, error: existingError } = await admin
    .from('renewal_cases')
    .select('obligation_id, period_label')
    .in(
      'obligation_id',
      obligations.map((row) => row.id),
    );

  if (existingError) {
    logger.error('renewals.existing_failed', { message: existingError.message });
    return report;
  }

  const existingPeriods = new Set(
    (existingRows ?? []).map((row) => `${row.obligation_id}:${row.period_label}`),
  );

  const { candidates, alreadyOffered } = renewalCandidates(obligations, existingPeriods, {
    today,
    horizon,
  });
  report.alreadyOffered = alreadyOffered;

  for (const candidate of candidates) {
    const caseId = await insertDraftCase(admin, candidate);
    if (!caseId) continue;

    const { error: linkError } = await admin.from('renewal_cases').insert({
      obligation_id: candidate.obligationId,
      case_id: caseId,
      period_label: candidate.periodLabel,
    });

    if (linkError) {
      // A concurrent run won the unique key. The case we just created is an
      // unreferenced draft belonging to nothing, so remove it rather than
      // leaving a phantom offer in the customer's workspace. There is no
      // multi-statement transaction available through this client, so the
      // compensating delete is the correction.
      const { error: cleanupError } = await admin
        .from('cases')
        .delete()
        .eq('id', caseId)
        .eq('status', 'draft');

      if (cleanupError) {
        logger.error('renewals.orphan_case', {
          caseId,
          obligationId: candidate.obligationId,
          message: cleanupError.message,
        });
      }
      if (linkError.code === '23505') {
        report.alreadyOffered += 1;
      } else {
        logger.error('renewals.link_failed', {
          obligationId: candidate.obligationId,
          message: linkError.message,
        });
      }
      continue;
    }

    // The obligation's own shortcut to its case. Kept consistent with the link
    // row; a failure here leaves the offer intact and is loud rather than
    // silent, because the workspace reads this column to show it.
    const { error: stampError } = await admin
      .from('compliance_obligations')
      .update({ renewal_case_id: caseId })
      .eq('id', candidate.obligationId)
      .is('renewal_case_id', null);

    if (stampError) {
      logger.error('renewals.stamp_failed', {
        obligationId: candidate.obligationId,
        caseId,
        message: stampError.message,
      });
    }

    report.offered += 1;
  }

  return report;
}

/**
 * The draft case behind one offer.
 *
 * The reference is random rather than sequential for the reason the intake
 * generator documents: a sequence leaks how much work the platform is doing.
 * The unique constraint catches the rare collision and we redraw.
 */
async function insertDraftCase(
  admin: SupabaseClient<Database>,
  candidate: RenewalCandidate,
): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await admin
      .from('cases')
      .insert({
        organization_id: candidate.organizationId,
        company_id: candidate.companyId,
        reference: newApplicationReference(),
        // The rule's own reviewed title. Bengali analyst copy for rules is
        // still backlog, so this stays as published rather than machine
        // translated.
        title: candidate.labelEn,
        status: 'draft',
      })
      .select('id')
      .single();

    if (!error && data) return data.id;
    if (error?.code !== '23505') {
      logger.error('renewals.case_insert_failed', {
        obligationId: candidate.obligationId,
        message: error?.message ?? 'no row',
      });
      return null;
    }
  }

  logger.error('renewals.reference_exhausted', { obligationId: candidate.obligationId });
  return null;
}
