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

/**
 * How a displayed price is to be read. `fixed` and `from` may be shown as
 * figures; `estimated` must say so next to the figure; `quote_required`
 * means no figure is published at all.
 */
export type PriceType = 'fixed' | 'from' | 'estimated' | 'quote_required';

export type PackageVersion = {
  version: number;
  effectiveFrom: string;
  status: PackageStatus;
  checkoutEnabled: boolean;
  priceType: PriceType;
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

/**
 * What the public is told about an international route. This is deliberately
 * separate from the internal `status`: a route can be well into preparation
 * internally while the only honest public statement is "register interest".
 * Internal words like "draft" must never reach a customer.
 */
export type InternationalPublicStatus =
  'available' | 'request_quote' | 'register_interest' | 'not_available';

export type InternationalOffer = {
  slug: string;
  countryCode: string;
  /** Stable path segment for the country page, e.g. `united-states`. */
  countrySlug: string;
  route: { en: string; bn: string };
  /** Internal readiness. Never rendered to customers. */
  status: PackageStatus;
  /** What visitors see. Prices render only when `priceApproved` is true. */
  publicStatus: InternationalPublicStatus;
  /** The owner has an approved provider agreement for this route. */
  providerApproved: boolean;
  /** The owner has approved the public price sheet for this route. */
  priceApproved: boolean;
  checkoutEnabled: boolean;
  /**
   * Public price label. Only present once `priceApproved` is true — while a
   * route is register-interest there is nothing truthful to print.
   */
  publicLabel?: { en: string; bn: string };
  summary: { en: string; bn: string };
  disclosures: Array<{ en: string; bn: string }>;
  /**
   * Working fee figures for internal planning and the admin pricing view.
   * Not rendered publicly until `priceApproved` is true.
   */
  feeComponents: PackageFeeComponent[];
};
