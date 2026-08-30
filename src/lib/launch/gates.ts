import 'server-only';

/**
 * Launch gates.
 *
 * These decide what the product may truthfully offer. Payments, checkout and
 * identity/KYC uploads still default to the most conservative value so a
 * missing variable can never open a regulated flow.
 *
 * The legal suite was published as version 1.0 on the owner's release
 * instruction (30 Aug 2026), so `LEGAL_CONTENT_STATUS` now defaults to
 * `approved`: the policies render without a draft banner and are indexable.
 * Setting `LEGAL_CONTENT_STATUS=draft` or `LEGAL_LAUNCH_APPROVED=false`
 * remains the kill switch and forces everything back to draft posture.
 * Payments and KYC additionally depend on their own variables below, which
 * still default to `disabled` — publishing policies opens no chargeable or
 * identity-collecting flow by itself.
 *
 * A value outside the allowed set is treated as a configuration error, not
 * silently coerced: it throws at first read, which surfaces in the boot
 * completeness check rather than as a permissive default in production.
 */

const LEGAL_STATUSES = ['draft', 'approved'] as const;
const CHECKOUT_STATUSES = ['disabled', 'quote_only', 'enabled'] as const;
const TOGGLES = ['disabled', 'enabled'] as const;
const BOOLISH = ['true', 'false', '1', '0', 'yes', 'no'] as const;

export type LegalContentStatus = (typeof LEGAL_STATUSES)[number];
export type CheckoutStatus = (typeof CHECKOUT_STATUSES)[number];
export type Toggle = (typeof TOGGLES)[number];

function read<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  if ((allowed as readonly string[]).includes(raw)) return raw as T;
  throw new Error(`${name}=${JSON.stringify(raw)} is not one of: ${allowed.join(', ')}`);
}

/**
 * Owner-facing alias for the legal launch gate. Defaults to false. When set
 * to true it still cannot open payments/KYC unless LEGAL_CONTENT_STATUS is
 * also `approved` — both must agree.
 */
export function legalLaunchApproved(): boolean {
  const raw = process.env.LEGAL_LAUNCH_APPROVED;
  if (raw === undefined || raw === '') return false;
  if (!(BOOLISH as readonly string[]).includes(raw)) {
    throw new Error(
      `LEGAL_LAUNCH_APPROVED=${JSON.stringify(raw)} is not one of: ${BOOLISH.join(', ')}`,
    );
  }
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export function legalContentStatus(): LegalContentStatus {
  const status = read('LEGAL_CONTENT_STATUS', LEGAL_STATUSES, 'approved');
  // When LEGAL_LAUNCH_APPROVED is explicitly set to false, keep the product
  // in draft mode even if LEGAL_CONTENT_STATUS was flipped early. When the
  // alias is unset, LEGAL_CONTENT_STATUS alone decides (existing behaviour).
  const alias = process.env.LEGAL_LAUNCH_APPROVED;
  if (alias !== undefined && alias !== '' && !legalLaunchApproved()) return 'draft';
  return status;
}

export function bangladeshCheckoutStatus(): CheckoutStatus {
  // Checkout can never be more open than the legal content allows, whatever
  // the variable says: draft terms means nothing is chargeable.
  const configured = read('BANGLADESH_CHECKOUT_STATUS', CHECKOUT_STATUSES, 'disabled');
  return legalContentStatus() === 'draft' ? 'disabled' : configured;
}

export function kycUploadStatus(): Toggle {
  const configured = read('KYC_UPLOAD_STATUS', TOGGLES, 'disabled');
  return legalContentStatus() === 'draft' ? 'disabled' : configured;
}

export function paymentsStatus(): Toggle {
  const configured = read('PAYMENTS_STATUS', TOGGLES, 'disabled');
  return legalContentStatus() === 'draft' ? 'disabled' : configured;
}

/**
 * Provider applications (partner portals spec §20). Open by default since the
 * owner's release instruction (30 Aug 2026): the multi-step /partners/apply
 * flow collects business information rather than identity documents, and
 * every submission still goes through admin verification before a provider
 * can receive a case. PROVIDER_APPLICATIONS_STATUS=disabled remains the kill
 * switch; while disabled, the page renders the enquiry fallback and the
 * server actions refuse — the gate is enforced server-side, not cosmetically.
 */
export function providerApplicationsStatus(): Toggle {
  return read('PROVIDER_APPLICATIONS_STATUS', TOGGLES, 'enabled');
}

/**
 * Whether the public site may make operational claims — "Open now",
 * "available today" and their kin. While the legal documents are drafts the
 * platform takes no payments and collects no identity documents, so a page
 * saying a service is available today would contradict the legal pages'
 * own draft status. Pages read this and render enquiry-led copy
 * ("accepting enquiries", assessment, register interest) instead; the
 * operational copy returns automatically when the owner flips the legal
 * gate after documented review.
 */
export function operationalClaimsAllowed(): boolean {
  return legalContentStatus() === 'approved';
}
