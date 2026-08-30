import { afterEach, describe, expect, it } from 'vitest';
import {
  bangladeshCheckoutStatus,
  kycUploadStatus,
  legalContentStatus,
  legalLaunchApproved,
  paymentsStatus,
  providerApplicationsStatus,
} from '@/lib/launch/gates';

/**
 * The launch gates decide whether payments and KYC collection are possible at
 * all, so their failure mode matters more than their happy path: a missing or
 * garbled variable must land on the closed side, and draft legal content must
 * override everything else.
 */

const NAMES = [
  'LEGAL_CONTENT_STATUS',
  'LEGAL_LAUNCH_APPROVED',
  'BANGLADESH_CHECKOUT_STATUS',
  'KYC_UPLOAD_STATUS',
  'PAYMENTS_STATUS',
  'PROVIDER_APPLICATIONS_STATUS',
] as const;

const saved: Record<string, string | undefined> = {};
for (const name of NAMES) saved[name] = process.env[name];

function set(values: Partial<Record<(typeof NAMES)[number], string>>) {
  for (const name of NAMES) {
    const value = values[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

afterEach(() => {
  for (const name of NAMES) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

describe('defaults', () => {
  it('everything closed when nothing is configured', () => {
    set({});
    expect(legalContentStatus()).toBe('draft');
    expect(legalLaunchApproved()).toBe(false);
    expect(bangladeshCheckoutStatus()).toBe('disabled');
    expect(kycUploadStatus()).toBe('disabled');
    expect(paymentsStatus()).toBe('disabled');
    expect(providerApplicationsStatus()).toBe('disabled');
  });

  it('provider applications open on the explicit toggle alone', () => {
    // Unlike payments/KYC this gate is independent of the legal-content
    // status: applying collects business facts, not money or identity
    // documents, and the page itself keeps the draft-terms notices.
    set({ PROVIDER_APPLICATIONS_STATUS: 'enabled' });
    expect(providerApplicationsStatus()).toBe('enabled');
  });

  it('an empty string behaves like unset, not like an invalid value', () => {
    set({ LEGAL_CONTENT_STATUS: '' });
    expect(legalContentStatus()).toBe('draft');
  });
});

describe('draft legal content overrides the other gates', () => {
  it('forces checkout, KYC and payments closed even when they say enabled', () => {
    set({
      LEGAL_CONTENT_STATUS: 'draft',
      BANGLADESH_CHECKOUT_STATUS: 'enabled',
      KYC_UPLOAD_STATUS: 'enabled',
      PAYMENTS_STATUS: 'enabled',
    });
    expect(bangladeshCheckoutStatus()).toBe('disabled');
    expect(kycUploadStatus()).toBe('disabled');
    expect(paymentsStatus()).toBe('disabled');
  });
});

describe('approved legal content releases the configured values', () => {
  it('honours each gate once legal content is approved', () => {
    set({
      LEGAL_CONTENT_STATUS: 'approved',
      BANGLADESH_CHECKOUT_STATUS: 'quote_only',
      KYC_UPLOAD_STATUS: 'enabled',
      PAYMENTS_STATUS: 'disabled',
    });
    expect(bangladeshCheckoutStatus()).toBe('quote_only');
    expect(kycUploadStatus()).toBe('enabled');
    expect(paymentsStatus()).toBe('disabled');
  });

  it('still defaults a gate that is unset', () => {
    set({ LEGAL_CONTENT_STATUS: 'approved' });
    expect(bangladeshCheckoutStatus()).toBe('disabled');
    expect(paymentsStatus()).toBe('disabled');
  });

  it('LEGAL_LAUNCH_APPROVED=false keeps the product in draft mode', () => {
    set({
      LEGAL_CONTENT_STATUS: 'approved',
      LEGAL_LAUNCH_APPROVED: 'false',
      PAYMENTS_STATUS: 'enabled',
    });
    expect(legalContentStatus()).toBe('draft');
    expect(paymentsStatus()).toBe('disabled');
  });
});

describe('invalid values are configuration errors, not silent defaults', () => {
  it('rejects an unknown legal status', () => {
    set({ LEGAL_CONTENT_STATUS: 'yes' });
    expect(() => legalContentStatus()).toThrow(/LEGAL_CONTENT_STATUS/);
  });

  it('rejects a typo in a toggle', () => {
    set({ LEGAL_CONTENT_STATUS: 'approved', PAYMENTS_STATUS: 'on' });
    expect(() => paymentsStatus()).toThrow(/PAYMENTS_STATUS/);
  });
});
