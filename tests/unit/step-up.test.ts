import { describe, expect, it } from 'vitest';
import {
  ALL_CAPABILITIES,
  STEP_UP_CAPABILITIES,
  organizationCapabilities,
  platformCapabilities,
  requiresStepUp,
  type Capability,
} from '@/lib/permissions/roles';

/**
 * Step-up marks the operations where the damage from a stolen session is worst.
 * The database carries the same list in permission_catalog.requires_aal2 and
 * the integration suite fails if they disagree; this covers the code side.
 */
describe('requiresStepUp', () => {
  it('demands a second factor for the destructive and irreversible operations', () => {
    for (const capability of [
      'kyc.decide',
      'refund.approve',
      'quote.approve',
      'payment.reconcile',
      'risk.write',
      'document.quarantine',
      'partner.verify',
      'user.manage',
      'settings.manage',
    ] as const) {
      expect(requiresStepUp(capability), capability).toBe(true);
    }
  });

  it('does not demand one for ordinary reads and drafts', () => {
    for (const capability of [
      'case.read.own',
      'case.create',
      'quote.read',
      'quote.prepare',
      'document.upload',
      'payment.read',
      'kyc.read',
      'audit.read',
    ] as const) {
      expect(requiresStepUp(capability), capability).toBe(false);
    }
  });

  it('names only real capabilities', () => {
    // A typo here would silently stop protecting something rather than fail.
    for (const capability of STEP_UP_CAPABILITIES) {
      expect(ALL_CAPABILITIES).toContain(capability);
    }
  });

  it('covers every capability that approves, decides or reconciles', () => {
    // A blunt check on the shape of the key, so a future capability named in
    // this family has to be considered rather than quietly added.
    const shouldStepUp = ALL_CAPABILITIES.filter((key) =>
      /\.(decide|approve|reconcile|quarantine|verify)$/.test(key),
    );
    for (const capability of shouldStepUp) {
      expect(requiresStepUp(capability), capability).toBe(true);
    }
  });

  it('asks nothing extra of a customer or a partner', () => {
    // No organisation role holds a step-up capability, so an ordinary customer
    // never meets a challenge in the middle of their own work.
    const orgHeld = organizationCapabilities([
      'customer_owner',
      'customer_member',
      'partner_owner',
      'partner_staff',
    ]);
    for (const capability of orgHeld) {
      expect(requiresStepUp(capability), capability).toBe(false);
    }
  });

  it('is reachable by the platform roles that hold it', () => {
    // Every step-up capability belongs to someone, or the marking protects
    // nothing.
    const platformHeld = platformCapabilities([
      'case_manager',
      'compliance_officer',
      'finance',
      'admin',
      'super_admin',
    ]);
    for (const capability of STEP_UP_CAPABILITIES) {
      expect(platformHeld.has(capability as Capability), capability).toBe(true);
    }
  });
});
