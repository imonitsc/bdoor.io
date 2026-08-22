import { describe, expect, it } from 'vitest';
import {
  ALLOWED_TRANSITIONS,
  CASE_STATUSES,
  canTransition,
  isTerminal,
  needsCustomerAction,
  nextStatuses,
} from '@/features/cases/state-machine';

describe('case state machine', () => {
  it('allows a customer to submit a draft for KYC', () => {
    const result = canTransition('draft', 'awaiting_kyc', 'customer');
    expect(result).toEqual({ ok: true, waitingOn: 'customer' });
  });

  it('refuses a transition that is not in the table', () => {
    expect(canTransition('draft', 'approved', 'staff')).toEqual({
      ok: false,
      reason: 'unknown_transition',
    });
  });

  it('refuses a real transition performed by the wrong actor', () => {
    // A customer cannot mark their own case ready to submit.
    expect(canTransition('documents_required', 'ready_to_submit', 'customer')).toEqual({
      ok: false,
      reason: 'actor_not_permitted',
    });
    // Staff can.
    expect(canTransition('documents_required', 'ready_to_submit', 'staff').ok).toBe(true);
  });

  it('treats closed as terminal and offers nothing from it', () => {
    expect(isTerminal('closed')).toBe(true);
    expect(nextStatuses('closed', 'staff')).toEqual([]);
    expect(canTransition('closed', 'draft', 'staff')).toEqual({
      ok: false,
      reason: 'terminal_state',
    });
  });

  it('derives the waiting reason from the destination status', () => {
    expect(canTransition('kyc_review', 'documents_required', 'staff')).toMatchObject({
      waitingOn: 'customer',
    });
    expect(canTransition('ready_to_submit', 'submitted', 'staff')).toMatchObject({
      waitingOn: 'authority',
    });
    expect(canTransition('documents_required', 'partner_review', 'staff')).toMatchObject({
      waitingOn: 'partner',
    });
    // 'approved' is nobody's turn.
    expect(canTransition('submitted', 'approved', 'staff')).toMatchObject({ waitingOn: 'none' });
  });

  it('a partner cannot cancel a case', () => {
    for (const status of CASE_STATUSES) {
      const cancel = ALLOWED_TRANSITIONS[status].find((t) => t.to === 'cancelled');
      if (cancel) expect(cancel.actors).not.toContain('partner');
    }
  });

  it('every declared status is reachable or terminal', () => {
    const reachable = new Set(['draft']);
    for (const edges of Object.values(ALLOWED_TRANSITIONS)) {
      for (const edge of edges) reachable.add(edge.to);
    }
    for (const status of CASE_STATUSES) {
      expect(reachable.has(status), `${status} is unreachable`).toBe(true);
    }
  });

  it('flags the statuses where the customer is the blocker', () => {
    expect(needsCustomerAction('documents_required')).toBe(true);
    expect(needsCustomerAction('awaiting_payment')).toBe(true);
    // Waiting on an authority is not the customer's move.
    expect(needsCustomerAction('submitted')).toBe(false);
    expect(needsCustomerAction('partner_review')).toBe(false);
  });
});
