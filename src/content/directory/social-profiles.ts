import type { SocialProfile } from '@/features/directory/types';

/**
 * Official profiles. None are `active` until the owner records a live URL
 * and sets verified. The footer and Organisation schema render only those.
 */
export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  { network: 'facebook', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'linkedin', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'instagram', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'youtube', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'x', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'tiktok', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'threads', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'whatsapp', handle: null, url: null, status: 'inactive', verified: false },
  { network: 'google_business', handle: null, url: null, status: 'inactive', verified: false },
];

export function publicSocialProfiles(): SocialProfile[] {
  return SOCIAL_PROFILES.filter((row) => row.status === 'active' && row.verified && row.url);
}
