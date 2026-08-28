/**
 * Evidence register — the gate for public claims.
 *
 * Unverified / draft / expired / withdrawn claims must never render on
 * marketing surfaces. Keep the JSON file as the editable source of truth for
 * content reviewers; this module is the typed runtime filter.
 */

import raw from '../../../content/evidence-register/claims.json';

export type EvidenceClaimStatus = 'draft' | 'verified' | 'expired' | 'withdrawn';

export type EvidenceClaim = {
  id: string;
  claimText: string;
  sourceType: string;
  officialSourceUrl: string | null;
  sourcePublishedAt: string | null;
  lastVerifiedAt: string | null;
  reviewer: string | null;
  status: EvidenceClaimStatus;
  countries: string[];
  services: string[];
  mayRenderPublicly: boolean;
  notes?: string;
};

const claims = raw.claims as EvidenceClaim[];

export function allEvidenceClaims(): readonly EvidenceClaim[] {
  return claims;
}

/**
 * Claims that are safe to show on a public page today.
 * Expired verified claims are treated as blocked until re-verified.
 */
export function publicEvidenceClaims(opts?: {
  country?: string;
  service?: string;
  asOf?: Date;
}): EvidenceClaim[] {
  const asOf = opts?.asOf ?? new Date();
  const asOfDay = asOf.toISOString().slice(0, 10);

  return claims.filter((claim) => {
    if (!claim.mayRenderPublicly) return false;
    if (claim.status !== 'verified') return false;
    if (!claim.lastVerifiedAt) return false;
    // Soft expiry: if a claim carries lastVerifiedAt more than 366 days ago,
    // treat it as needing review even before status flips to expired.
    const ageMs = asOf.getTime() - Date.parse(`${claim.lastVerifiedAt}T00:00:00Z`);
    if (Number.isFinite(ageMs) && ageMs > 366 * 24 * 60 * 60 * 1000) return false;
    if (claim.lastVerifiedAt > asOfDay) return false;
    if (opts?.country && claim.countries.length > 0 && !claim.countries.includes(opts.country)) {
      return false;
    }
    if (opts?.service && claim.services.length > 0 && !claim.services.includes(opts.service)) {
      return false;
    }
    return true;
  });
}

export function getEvidenceClaim(id: string): EvidenceClaim | undefined {
  return claims.find((c) => c.id === id);
}
