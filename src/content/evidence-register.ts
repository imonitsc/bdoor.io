/**
 * Machine-readable evidence register.
 *
 * Claims with status other than `verified` must not render on public surfaces.
 * Owner/legal review is required before promoting a claim to `verified`.
 */

export type EvidenceStatus = 'draft' | 'verified' | 'expired' | 'withdrawn';

export type EvidenceSourceType =
  'official_website' | 'legislation' | 'owner_approved' | 'partner_verified' | 'internal_review';

export type EvidenceClaim = {
  id: string;
  claimText: { en: string; bn?: string };
  sourceType: EvidenceSourceType;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  lastVerifiedAt?: string;
  reviewer?: string;
  status: EvidenceStatus;
  allowedCountries: string[];
  allowedServices: string[];
};

/** Standing platform positioning — always safe to show (not a regulatory claim). */
export const PLATFORM_POSITIONING: EvidenceClaim = {
  id: 'CLAIM-PLATFORM-001',
  claimText: {
    en: 'bdoor is an independent business setup, administrative-support and professional-coordination platform. Government decisions remain with the responsible authorities.',
    bn: 'bdoor একটি স্বাধীন ব্যবসা সেটআপ, প্রশাসনিক সহায়তা ও পেশাদার সমন্বয় প্ল্যাটফর্ম। সরকারি সিদ্ধান্ত সংশ্লিষ্ট কর্তৃপক্ষের কাছে থাকে।',
  },
  sourceType: 'owner_approved',
  status: 'verified',
  allowedCountries: ['BD', 'US', 'GB', 'AE', 'SG'],
  allowedServices: [],
};

export const EVIDENCE_CLAIMS: EvidenceClaim[] = [
  PLATFORM_POSITIONING,
  {
    id: 'CLAIM-SEC-001',
    claimText: {
      en: 'Customer identity documents are stored in private storage buckets and served through short-lived signed URLs after an authorisation check.',
    },
    sourceType: 'internal_review',
    status: 'verified',
    lastVerifiedAt: '2026-08-28',
    allowedCountries: ['BD'],
    allowedServices: [],
  },
];

/** Returns only claims that may appear on a public page. */
export function verifiedClaimsFor(countryCode?: string, serviceSlug?: string): EvidenceClaim[] {
  return EVIDENCE_CLAIMS.filter((claim) => {
    if (claim.status !== 'verified') return false;
    if (countryCode && claim.allowedCountries.length > 0) {
      if (!claim.allowedCountries.includes(countryCode)) return false;
    }
    if (serviceSlug && claim.allowedServices.length > 0) {
      if (!claim.allowedServices.includes(serviceSlug)) return false;
    }
    return true;
  });
}
