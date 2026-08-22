import type { Enums } from '@/types/database';

export type CaseStatus = Enums<'case_status'>;
export type WaitingOn = Enums<'case_waiting_on'>;
export type ActorKind = 'customer' | 'staff' | 'partner' | 'system';

export const CASE_STATUSES: readonly CaseStatus[] = [
  'draft',
  'awaiting_kyc',
  'kyc_review',
  'quote_ready',
  'awaiting_acceptance',
  'awaiting_payment',
  'documents_required',
  'partner_review',
  'ready_to_submit',
  'submitted',
  'authority_query',
  'customer_action_required',
  'approved',
  'rejected',
  'closed',
  'cancelled',
] as const;

export const TERMINAL_STATUSES: readonly CaseStatus[] = ['closed', 'cancelled'] as const;

/**
 * Mirrors `public.case_status_transitions`. The database enforces the same
 * table via a trigger; this copy lets the UI disable impossible actions and
 * lets us unit-test the machine without a database.
 *
 * Keep the two in step — `tests/integration/case-transitions.test.ts` asserts it.
 */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<CaseStatus, ReadonlyArray<{ to: CaseStatus; actors: readonly ActorKind[] }>>
> = {
  draft: [
    { to: 'awaiting_kyc', actors: ['customer', 'staff'] },
    { to: 'cancelled', actors: ['customer', 'staff'] },
  ],
  awaiting_kyc: [
    { to: 'kyc_review', actors: ['customer', 'staff'] },
    { to: 'cancelled', actors: ['staff'] },
  ],
  kyc_review: [
    { to: 'quote_ready', actors: ['staff'] },
    { to: 'documents_required', actors: ['staff'] },
    { to: 'rejected', actors: ['staff'] },
    { to: 'awaiting_kyc', actors: ['staff'] },
  ],
  quote_ready: [
    { to: 'awaiting_acceptance', actors: ['staff'] },
    { to: 'cancelled', actors: ['staff'] },
  ],
  awaiting_acceptance: [
    { to: 'awaiting_payment', actors: ['customer', 'staff'] },
    { to: 'quote_ready', actors: ['staff'] },
    { to: 'cancelled', actors: ['customer', 'staff'] },
  ],
  awaiting_payment: [
    { to: 'documents_required', actors: ['staff', 'system'] },
    { to: 'ready_to_submit', actors: ['staff', 'system'] },
    { to: 'cancelled', actors: ['staff'] },
  ],
  documents_required: [
    { to: 'partner_review', actors: ['staff'] },
    { to: 'ready_to_submit', actors: ['staff'] },
    { to: 'customer_action_required', actors: ['staff'] },
    { to: 'cancelled', actors: ['staff'] },
  ],
  partner_review: [
    { to: 'ready_to_submit', actors: ['staff', 'partner'] },
    { to: 'documents_required', actors: ['staff', 'partner'] },
    { to: 'customer_action_required', actors: ['staff', 'partner'] },
  ],
  ready_to_submit: [
    { to: 'submitted', actors: ['staff', 'partner'] },
    { to: 'documents_required', actors: ['staff'] },
  ],
  submitted: [
    { to: 'authority_query', actors: ['staff', 'partner'] },
    { to: 'approved', actors: ['staff', 'partner'] },
    { to: 'rejected', actors: ['staff', 'partner'] },
  ],
  authority_query: [
    { to: 'customer_action_required', actors: ['staff', 'partner'] },
    { to: 'submitted', actors: ['staff', 'partner'] },
    { to: 'rejected', actors: ['staff'] },
  ],
  customer_action_required: [
    { to: 'documents_required', actors: ['staff'] },
    { to: 'partner_review', actors: ['staff'] },
    { to: 'submitted', actors: ['staff', 'partner'] },
    { to: 'cancelled', actors: ['staff'] },
  ],
  approved: [{ to: 'closed', actors: ['staff'] }],
  rejected: [
    { to: 'closed', actors: ['staff'] },
    { to: 'documents_required', actors: ['staff'] },
  ],
  closed: [],
  cancelled: [{ to: 'closed', actors: ['staff'] }],
};

/** What the case is blocked on while in a given status, if anything. */
const IMPLIED_WAITING: Partial<Record<CaseStatus, WaitingOn>> = {
  awaiting_kyc: 'customer',
  awaiting_acceptance: 'customer',
  awaiting_payment: 'payment',
  documents_required: 'customer',
  customer_action_required: 'customer',
  partner_review: 'partner',
  submitted: 'authority',
  authority_query: 'authority',
};

export type TransitionCheck =
  | { ok: true; waitingOn: WaitingOn }
  | { ok: false; reason: 'unknown_transition' | 'actor_not_permitted' | 'terminal_state' };

export function canTransition(from: CaseStatus, to: CaseStatus, actor: ActorKind): TransitionCheck {
  if (TERMINAL_STATUSES.includes(from) && from === 'closed') {
    return { ok: false, reason: 'terminal_state' };
  }

  const edge = ALLOWED_TRANSITIONS[from].find((t) => t.to === to);
  if (!edge) return { ok: false, reason: 'unknown_transition' };
  if (!edge.actors.includes(actor)) return { ok: false, reason: 'actor_not_permitted' };

  return { ok: true, waitingOn: IMPLIED_WAITING[to] ?? 'none' };
}

export function nextStatuses(from: CaseStatus, actor: ActorKind): CaseStatus[] {
  return ALLOWED_TRANSITIONS[from].filter((t) => t.actors.includes(actor)).map((t) => t.to);
}

export function isTerminal(status: CaseStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Statuses where the customer is the one holding things up. */
export function needsCustomerAction(status: CaseStatus): boolean {
  return (
    status === 'awaiting_kyc' ||
    status === 'awaiting_acceptance' ||
    status === 'awaiting_payment' ||
    status === 'documents_required' ||
    status === 'customer_action_required'
  );
}

export const STATUS_TONE: Record<
  CaseStatus,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  draft: 'neutral',
  awaiting_kyc: 'warning',
  kyc_review: 'info',
  quote_ready: 'info',
  awaiting_acceptance: 'warning',
  awaiting_payment: 'warning',
  documents_required: 'warning',
  partner_review: 'info',
  ready_to_submit: 'info',
  submitted: 'info',
  authority_query: 'warning',
  customer_action_required: 'warning',
  approved: 'success',
  rejected: 'danger',
  closed: 'neutral',
  cancelled: 'neutral',
};
