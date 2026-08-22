import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_ROLES,
  PLATFORM_ROLES,
  isCustomerRole,
  isPartnerRole,
  organizationCapabilities,
  platformCapabilities,
  requiresMfa,
} from '@/lib/permissions/roles';

describe('platform capabilities', () => {
  it('lets a case manager run a case but not decide KYC', () => {
    const caps = platformCapabilities(['case_manager']);
    expect(caps.has('case.transition')).toBe(true);
    expect(caps.has('case.assign_partner')).toBe(true);
    expect(caps.has('kyc.decide')).toBe(false);
    expect(caps.has('risk.write')).toBe(false);
  });

  it('does not let finance make a compliance decision', () => {
    const caps = platformCapabilities(['finance']);
    expect(caps.has('payment.reconcile')).toBe(true);
    expect(caps.has('refund.approve')).toBe(true);
    expect(caps.has('kyc.decide')).toBe(false);
    expect(caps.has('kyc.read')).toBe(false);
    expect(caps.has('risk.read')).toBe(false);
  });

  it('does not let compliance quietly move money', () => {
    const caps = platformCapabilities(['compliance_officer']);
    expect(caps.has('kyc.decide')).toBe(true);
    expect(caps.has('risk.write')).toBe(true);
    expect(caps.has('payment.reconcile')).toBe(false);
    expect(caps.has('refund.approve')).toBe(false);
  });

  it('withholds the two most sensitive capabilities from a plain admin', () => {
    const admin = platformCapabilities(['admin']);
    expect(admin.has('kyc.decide')).toBe(false);
    expect(admin.has('refund.approve')).toBe(false);

    const superAdmin = platformCapabilities(['super_admin']);
    expect(superAdmin.has('kyc.decide')).toBe(true);
    expect(superAdmin.has('refund.approve')).toBe(true);
  });

  it('unions the capabilities of multiple roles', () => {
    const caps = platformCapabilities(['finance', 'compliance_officer']);
    expect(caps.has('payment.reconcile')).toBe(true);
    expect(caps.has('kyc.decide')).toBe(true);
  });

  it('grants nothing to a user with no role', () => {
    expect(platformCapabilities([]).size).toBe(0);
  });
});

describe('organization capabilities', () => {
  it('only lets an owner accept a quote', () => {
    expect(organizationCapabilities(['customer_owner']).has('quote.accept')).toBe(true);
    expect(organizationCapabilities(['customer_member']).has('quote.accept')).toBe(false);
  });

  it('never gives a partner customer-side capabilities', () => {
    for (const role of ['partner_owner', 'partner_staff'] as const) {
      const caps = organizationCapabilities([role]);
      expect(caps.has('quote.accept')).toBe(false);
      expect(caps.has('case.create')).toBe(false);
      expect(caps.has('payment.read')).toBe(false);
    }
  });

  it('only lets a partner owner respond to an assignment', () => {
    expect(organizationCapabilities(['partner_owner']).has('partner.respond_assignment')).toBe(
      true,
    );
    expect(organizationCapabilities(['partner_staff']).has('partner.respond_assignment')).toBe(
      false,
    );
  });

  it('never lets any organization role verify a partner', () => {
    for (const role of ORGANIZATION_ROLES) {
      expect(organizationCapabilities([role]).has('partner.verify')).toBe(false);
    }
  });
});

describe('MFA requirements', () => {
  it('requires MFA for every platform role', () => {
    for (const role of PLATFORM_ROLES) {
      expect(requiresMfa([role], [])).toBe(true);
    }
  });

  it('requires MFA for partner staff, who handle other people documents', () => {
    expect(requiresMfa([], ['partner_owner'])).toBe(true);
    expect(requiresMfa([], ['partner_staff'])).toBe(true);
  });

  it('does not force MFA on an ordinary customer', () => {
    expect(requiresMfa([], ['customer_owner'])).toBe(false);
    expect(requiresMfa([], ['customer_member'])).toBe(false);
  });
});

describe('role classification', () => {
  it('separates customer and partner roles cleanly', () => {
    for (const role of ORGANIZATION_ROLES) {
      expect(isCustomerRole(role)).toBe(!isPartnerRole(role));
    }
  });
});
