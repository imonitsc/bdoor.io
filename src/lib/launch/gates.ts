import 'server-only';

/**
 * Launch gates.
 *
 * These decide what the product may truthfully offer, and they default to the
 * most conservative value so a missing variable can never open a gate. The
 * legal documents are working drafts, so until the owner flips
 * `LEGAL_CONTENT_STATUS=approved` (and `LEGAL_LAUNCH_APPROVED=true`) after
 * documented professional review:
 *
 *   - payments stay off (`startCheckout` refuses),
 *   - identity/KYC document uploads stay off (`uploadDocument` refuses the
 *     identity categories),
 *   - the legal pages carry the draft banner and are not indexed.
 *
 * A value outside the allowed set is treated as a configuration error, not
 * silently coerced: it throws at first read, which surfaces in the boot
 * completeness check rather than as a permissive default in production.
 *
 * Flipping a gate in the environment is necessary but not sufficient for a
 * production launch — the release procedure in docs/LEGAL_REVIEW_CHECKLIST.md
 * still applies, and the approved legal text has to actually exist first.
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
  const status = read('LEGAL_CONTENT_STATUS', LEGAL_STATUSES, 'draft');
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
