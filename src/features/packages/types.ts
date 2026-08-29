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

export type PackageCurrency = 'BDT' | 'USD' | 'GBP' | 'AED' | 'SAR' | 'QAR' | 'SGD';

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
 * Where a route stands operationally, from research through to online sale.
 * The order is the launch ladder itself: a route climbs one state at a time
 * and may only be *sold as available* in the last two — `available_by_quote`
 * once a contracted partner's scope, wholesale price and refund rule are
 * signed, `available_online` once checkout has also survived a pilot case.
 * Everything earlier is honest only as "register interest".
 */
export type AvailabilityState =
  | 'research_only'
  | 'partner_sourcing'
  | 'partner_pilot'
  | 'available_by_quote'
  | 'available_online'
  | 'paused';

/** Availability states in which the public may be told a route is available. */
export const SELLABLE_AVAILABILITY: readonly AvailabilityState[] = [
  'available_by_quote',
  'available_online',
];

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
  /**
   * Operational position on the launch ladder. Never rendered to customers;
   * `publicStatus` may say "available" only while this is one of
   * `SELLABLE_AVAILABILITY`, and checkout requires `available_online`.
   */
  availability: AvailabilityState;
  /** What visitors see. Prices render only when `priceApproved` is true. */
  publicStatus: InternationalPublicStatus;
  /** The owner has an approved provider agreement for this route. */
  providerApproved: boolean;
  /** The owner has approved the public price sheet for this route. */
  priceApproved: boolean;
  checkoutEnabled: boolean;
  /**
   * Screened markets (Saudi Arabia, Qatar) never get a buy-style call to
   * action: the public step is an eligibility check, and a quotation exists
   * only after a partner-approved review.
   */
  eligibilityLed?: boolean;
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
