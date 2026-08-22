import type { Enums } from '@/types/database';

export type Locale = 'en' | 'bn';

export type ServiceCategory = {
  id: string;
  slug: string;
  name: { en: string; bn: string };
  summary: { en: string; bn: string };
  icon: string | null;
  sortOrder: number;
};

export type ServiceFeeComponent = {
  category: Enums<'quote_item_category'>;
  label: { en: string; bn: string };
  payee: Enums<'payee_type'>;
  amountBdt: number | null;
  isEstimate: boolean;
  isRefundable: boolean;
  taxTreatment: 'inclusive' | 'exclusive' | 'not_applicable';
  /** Present only when an admin recorded a verified figure. */
  reviewedAt: string | null;
};

export type ServiceRequirement = {
  code: string;
  label: { en: string; bn: string };
  help: { en: string; bn: string } | null;
  appliesTo: string;
  isMandatory: boolean;
};

export type ServiceMilestone = {
  code: string;
  label: { en: string; bn: string };
  ownerKind: 'bdoor' | 'customer' | 'partner' | 'authority';
  typicalDays: number | null;
  weight: number;
};

export type Service = {
  id: string;
  slug: string;
  categorySlug: string;
  name: { en: string; bn: string };
  summary: { en: string; bn: string };
  whoFor: { en: string; bn: string } | null;
  included: { en: string[]; bn: string[] };
  notIncluded: { en: string[]; bn: string[] };
  eligibility: { en: string; bn: string } | null;
  authorityName: { en: string; bn: string } | null;
  startingFeeBdt: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  /** A time estimate is only ever displayed when this is set. */
  timeReviewedAt: string | null;
  requiresPartner: boolean;
  isRegulated: boolean;
  status: Enums<'publication_status'>;
  sortOrder: number;
  requirements: ServiceRequirement[];
  milestones: ServiceMilestone[];
  feeComponents: ServiceFeeComponent[];
};

export type Faq = {
  id: string;
  serviceSlug: string | null;
  question: { en: string; bn: string };
  answer: { en: string; bn: string };
  isGlobal: boolean;
  isComplianceSensitive: boolean;
  lastReviewedAt: string | null;
  sortOrder: number;
};

export type ResourcePage = {
  slug: string;
  kind: 'resource' | 'legal' | 'page';
  title: { en: string; bn: string };
  excerpt: { en: string; bn: string } | null;
  body: { en: string; bn: string };
  lastReviewedAt: string | null;
  nextReviewDue: string | null;
  publishedAt: string | null;
  readingMinutes: number | null;
};

export type CatalogSource = 'database' | 'snapshot';

export function pick<T>(value: { en: T; bn: T } | null | undefined, locale: Locale): T | null {
  if (!value) return null;
  return locale === 'bn' ? value.bn : value.en;
}

/** A time estimate that has not been reviewed is never shown. */
export function displayableEstimate(service: Service): { min: number; max: number; reviewedAt: string } | null {
  if (
    service.estimatedDaysMin === null ||
    service.estimatedDaysMax === null ||
    service.timeReviewedAt === null
  ) {
    return null;
  }
  return {
    min: service.estimatedDaysMin,
    max: service.estimatedDaysMax,
    reviewedAt: service.timeReviewedAt,
  };
}

/** A government fee is only shown when an admin entered a verified, sourced figure. */
export function displayableFee(component: ServiceFeeComponent): number | null {
  if (component.amountBdt === null) return null;
  if (component.category === 'government_fee_estimate' && component.reviewedAt === null) return null;
  return component.amountBdt;
}
