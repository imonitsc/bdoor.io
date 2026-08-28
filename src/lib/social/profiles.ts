/**
 * Verified social profile configuration.
 *
 * Only profiles with status `active` and a verified URL may appear in the
 * footer, structured data or marketing surfaces.
 */

export type SocialProfileStatus = 'reserved' | 'verified' | 'active' | 'inactive';

export type SocialNetwork =
  'facebook' | 'linkedin' | 'instagram' | 'whatsapp' | 'youtube' | 'tiktok' | 'x' | 'threads';

export type SocialProfile = {
  network: SocialNetwork;
  handle: string;
  url: string | null;
  status: SocialProfileStatus;
  locale: 'en' | 'bn' | 'all';
  lastVerifiedAt: string | null;
  displayPermission: boolean;
};

/**
 * Owner must verify URLs and set status to `active` before public display.
 * Handles follow the preferred order from docs/marketing/social-profile-setup.md.
 */
export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    network: 'linkedin',
    handle: '@bdoorhq',
    url: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'facebook',
    handle: '@bdoorhq',
    url: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'instagram',
    handle: '@bdoorhq',
    url: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'x',
    handle: '@bdoorhq',
    url: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
  {
    network: 'youtube',
    handle: '@bdoorhq',
    url: null,
    status: 'reserved',
    locale: 'all',
    lastVerifiedAt: null,
    displayPermission: false,
  },
];

/** Profiles safe to render in footer or JSON-LD `sameAs`. */
export function activeSocialProfiles(): SocialProfile[] {
  return SOCIAL_PROFILES.filter((p) => p.status === 'active' && p.displayPermission && p.url);
}

/** Organisation `sameAs` URLs for structured data — verified active only. */
export function organizationSameAs(): string[] {
  return activeSocialProfiles().map((p) => p.url!);
}
