/**
 * Verified social profiles for footer / Organisation sameAs.
 *
 * Only `active` rows with an explicit URL may render. Handles stay reserved
 * until the owner confirms control (docs/launch/owner-action-register.md O-14).
 */

export type SocialNetwork =
  | 'facebook'
  | 'linkedin'
  | 'instagram'
  | 'youtube'
  | 'x'
  | 'tiktok'
  | 'threads'
  | 'whatsapp'
  | 'google_business';

export type SocialProfileStatus = 'reserved' | 'verified' | 'active' | 'inactive';

export type SocialProfile = {
  network: SocialNetwork;
  handle: string;
  publicUrl: string | null;
  status: SocialProfileStatus;
  locale: 'en' | 'bn' | 'all';
  lastVerifiedAt: string | null;
  displayPermission: boolean;
};

export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  {
    network: 'facebook',
    handle: '@bdoorhq',
    publicUrl: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'linkedin',
    handle: '@bdoorhq',
    publicUrl: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'instagram',
    handle: '@bdoorhq',
    publicUrl: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'youtube',
    handle: '@bdoorhq',
    publicUrl: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'x',
    handle: '@bdoorhq',
    publicUrl: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'whatsapp',
    handle: 'bdoor',
    publicUrl: null,
    status: 'inactive',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
] as const;

/** Profiles safe to render in the footer or structured data. */
export function activeSocialProfiles(): SocialProfile[] {
  return SOCIAL_PROFILES.filter(
    (p) =>
      p.status === 'active' &&
      p.displayPermission &&
      Boolean(p.publicUrl) &&
      Boolean(p.lastVerifiedAt),
  );
}

export function organisationSameAs(): string[] {
  return activeSocialProfiles()
    .map((p) => p.publicUrl!)
    .filter(Boolean);
}
