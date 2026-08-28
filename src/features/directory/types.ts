import type { Locale } from '@/features/catalog/types';

export type Localized = { en: string; bn: string };

export type OperationalStatus = 'active' | 'pilot' | 'coming_soon';

export type EvidenceStatus = 'draft' | 'verified' | 'expired' | 'withdrawn';

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

export type CountryRecord = {
  code: string;
  slug: string;
  name: Localized;
  summary: Localized;
  operationalStatus: OperationalStatus;
  isFlagship: boolean;
  sortOrder: number;
};

export type IndustryRecord = {
  slug: string;
  name: Localized;
  summary: Localized;
  relatedCategorySlugs: string[];
  operationalStatus: OperationalStatus;
  sortOrder: number;
};

export type AuthorityRecord = {
  slug: string;
  name: Localized;
  role: Localized;
  officialUrl: string | null;
  urlVerified: boolean;
  relatedCategorySlugs: string[];
  operationalStatus: OperationalStatus;
  sortOrder: number;
};

export type EvidenceClaim = {
  id: string;
  text: Localized;
  status: EvidenceStatus;
  public: boolean;
};

export type SocialProfile = {
  network: SocialNetwork;
  handle: string | null;
  url: string | null;
  status: 'reserved' | 'verified' | 'active' | 'inactive';
  verified: boolean;
};

export type FinderIntent = {
  id: string;
  label: Localized;
  href: string;
};

export function pickLocalized(value: Localized, locale: Locale): string {
  return locale === 'bn' ? value.bn : value.en;
}
