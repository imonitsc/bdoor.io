export type PackageSegment = 'new_business' | 'existing_business';

export type PackageStatus = 'draft' | 'published' | 'coming_soon' | 'retired';

export type TaxTreatment = 'pending_review' | 'inclusive' | 'exclusive' | 'not_applicable';

export type FeeLayer =
  | 'platform_service_fee'
  | 'government_fee_estimate'
  | 'partner_professional_fee'
  | 'third_party_cost'
  | 'tax'
  | 'refundable_deposit'
  | 'discount';

export type PackageCurrency = 'BDT' | 'USD' | 'GBP' | 'AED' | 'SGD';

export type PackageFeeComponent = {
  layer: FeeLayer;
  label: { en: string; bn: string };
  amountMinor: number;
  currency: PackageCurrency;
  isEstimate: boolean;
  isRefundable: boolean;
  payee: 'bdoor' | 'government_authority' | 'partner_firm' | 'third_party';
  taxTreatment: TaxTreatment;
  sourceUrl?: string;
  reviewedAt?: string;
  notes?: { en: string; bn: string };
};

export type PackageVersion = {
  version: number;
  effectiveFrom: string;
  status: PackageStatus;
  checkoutEnabled: boolean;
  publicLabel: { en: string; bn: string };
  summary: { en: string; bn: string };
  inclusions: Array<{ en: string; bn: string }>;
  exclusions: Array<{ en: string; bn: string }>;
  limits: Array<{ en: string; bn: string }>;
  feeComponents: PackageFeeComponent[];
  assumptions: Array<{ en: string; bn: string }>;
};

export type ServicePackage = {
  slug: string;
  segment: PackageSegment;
  jurisdictionCode: string;
  sortOrder: number;
  name: { en: string; bn: string };
  /** Homepage shows at most five inclusions; full list stored here. */
  versions: PackageVersion[];
};

export type InternationalOffer = {
  slug: string;
  countryCode: string;
  route: { en: string; bn: string };
  status: PackageStatus;
  checkoutEnabled: boolean;
  publicLabel: { en: string; bn: string };
  summary: { en: string; bn: string };
  disclosures: Array<{ en: string; bn: string }>;
  feeComponents: PackageFeeComponent[];
};
