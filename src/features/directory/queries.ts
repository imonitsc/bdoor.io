import 'server-only';

import { cache } from 'react';
import { AUTHORITIES } from '@/content/directory/authorities';
import { COUNTRIES } from '@/content/directory/countries';
import { publicEvidenceClaims, EVIDENCE_CLAIMS } from '@/content/directory/evidence';
import { INDUSTRIES } from '@/content/directory/industries';
import { publicSocialProfiles, SOCIAL_PROFILES } from '@/content/directory/social-profiles';
import type {
  AuthorityRecord,
  CountryRecord,
  EvidenceClaim,
  IndustryRecord,
  SocialProfile,
} from './types';

export type DirectorySource = 'snapshot' | 'database';

/**
 * Directory reads. The committed TypeScript modules are the source of truth
 * for public pages (same idea as the catalogue snapshot). A later admin UI
 * can write to the tables; until then we do not pretend the database is
 * populated in preview builds without credentials.
 */
export const getCountries = cache(
  async (): Promise<{ data: CountryRecord[]; source: DirectorySource }> => {
    return { data: [...COUNTRIES], source: 'snapshot' };
  },
);

export const getIndustries = cache(
  async (): Promise<{ data: IndustryRecord[]; source: DirectorySource }> => {
    return { data: [...INDUSTRIES], source: 'snapshot' };
  },
);

export const getAuthorities = cache(
  async (): Promise<{ data: AuthorityRecord[]; source: DirectorySource }> => {
    return { data: [...AUTHORITIES], source: 'snapshot' };
  },
);

export async function getCountry(slug: string): Promise<CountryRecord | null> {
  const { data } = await getCountries();
  return data.find((row) => row.slug === slug) ?? null;
}

export async function getIndustry(slug: string): Promise<IndustryRecord | null> {
  const { data } = await getIndustries();
  return data.find((row) => row.slug === slug) ?? null;
}

export async function getAuthority(slug: string): Promise<AuthorityRecord | null> {
  const { data } = await getAuthorities();
  return data.find((row) => row.slug === slug) ?? null;
}

export function getPublicEvidence(): EvidenceClaim[] {
  return publicEvidenceClaims();
}

export function getPublicSocial(): SocialProfile[] {
  return publicSocialProfiles();
}

/** Test helper: the full registers, including hidden draft rows. */
export function getEvidenceRegisterForTests(): readonly EvidenceClaim[] {
  return EVIDENCE_CLAIMS;
}

export function getSocialRegisterForTests(): readonly SocialProfile[] {
  return SOCIAL_PROFILES;
}
