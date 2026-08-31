import type { Enums } from '@/types/database';

type ObligationStatus = Enums<'obligation_status'>;

/**
 * Obligation grouping (replacement BI-OS instruction §4.8).
 *
 * The instruction's vocabulary is eight groups: Due now, Upcoming, Awaiting
 * information, Under review, Filed, Accepted, Overdue, Not applicable. The
 * platform's obligation model can honestly populate six of them today; the
 * two it cannot are deliberately absent rather than approximated:
 *
 * - "Awaiting information" and the Filed/Accepted split need filing-workflow
 *   states (a request for documents, a submission event, an authority
 *   acknowledgement) that do not exist yet. A completed obligation is shown
 *   as Completed — claiming an authority "accepted" something bdoor never
 *   tracked being filed would be exactly the kind of implied official status
 *   §4.8 forbids.
 *
 * Grouping is by status AND date: a row still marked 'upcoming' whose due
 * date has arrived belongs in Due now — the customer plans by the calendar,
 * not by how recently a background job ran.
 */

export const OBLIGATION_GROUPS = [
  'due_now',
  'upcoming',
  'under_review',
  'overdue',
  'completed',
  'not_applicable',
] as const;

export type ObligationGroup = (typeof OBLIGATION_GROUPS)[number];

export function obligationGroup(status: ObligationStatus, dueOn: Date, now: Date): ObligationGroup {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'waived':
      return 'not_applicable';
    case 'in_progress':
      return 'under_review';
    case 'overdue':
      return 'overdue';
    case 'due':
    case 'upcoming': {
      const due = Date.UTC(dueOn.getUTCFullYear(), dueOn.getUTCMonth(), dueOn.getUTCDate());
      const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      if (due < today) return 'overdue';
      // Due within two weeks is "due now" — the window in which a customer
      // must actually act, matching the reminder cadence's short leads.
      return due - today <= 14 * 86_400_000 ? 'due_now' : 'upcoming';
    }
  }
}

export function groupObligations<T extends { status: ObligationStatus; due_on: string }>(
  obligations: readonly T[],
  now: Date,
): Array<{ group: ObligationGroup; items: T[] }> {
  const buckets = new Map<ObligationGroup, T[]>(OBLIGATION_GROUPS.map((group) => [group, []]));
  for (const obligation of obligations) {
    buckets
      .get(obligationGroup(obligation.status, new Date(obligation.due_on), now))
      ?.push(obligation);
  }
  return OBLIGATION_GROUPS.map((group) => ({ group, items: buckets.get(group) ?? [] })).filter(
    (bucket) => bucket.items.length > 0,
  );
}
