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
  /**
   * Present only on recurring packages: the cadence the published figure
   * bills at, mirroring `subscription_plans.billing_period`. Its absence
   * means a one-off fee. A card with a billingPeriod renders a subscribe
   * path, not "Start assessment".
   */
  billingPeriod?: 'month' | 'year';
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
 * How a route operates day to day (immediate-operations instructions §3.3).
 * Every route currently runs `managed_application`: applications are open,
 * a specialist reviews each case, a provider is sourced per case, and a
 * quote is issued only after provider scope and cost are confirmed. A
 * route reaches `online_checkout` only by explicit owner approval once
 * provider, legal, payment and document-security readiness are recorded.
 */
export type RouteMode =
  | 'managed_application'
  | 'provider_review'
  | 'quote_ready'
  | 'online_checkout'
  | 'temporarily_paused';

/**
 * What the public is told about an international route. This is deliberately
 * separate from the internal `status`: internal words like "draft" must
 * never reach a customer. `applications_open` renders as
 * "Applications open — specialist reviewed" — the managed-application
 * operating model the owner activated on 29 Aug 2026.
 */
export type InternationalPublicStatus =
  'applications_open' | 'available' | 'request_quote' | 'register_interest' | 'not_available';

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
   * `publicStatus` may say applications are open only while this is one of
   * `SELLABLE_AVAILABILITY`, and checkout requires `available_online`.
   */
  availability: AvailabilityState;
  /** Day-to-day operating mode. All routes launch as `managed_application`. */
  mode: RouteMode;
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
   * Public price label — a STARTING ESTIMATE, never a checkout total.
   * Present only with `priceApproved` (the owner published these figures in
   * the immediate-operations instructions of 29 Aug 2026) and always
   * rendered with `publicQualifier` beside it.
   */
  publicLabel?: { en: string; bn: string };
  /** Approximate second-currency figure ("About ৳61,400"). */
  publicLabelAlt?: { en: string; bn: string };
  /** The mandatory qualifier that must render with the price. */
  publicQualifier?: { en: string; bn: string };
  summary: { en: string; bn: string };
  disclosures: Array<{ en: string; bn: string }>;
  /**
   * Working fee figures for internal planning and the admin pricing view.
   * Not rendered publicly until `priceApproved` is true.
   */
  feeComponents: PackageFeeComponent[];
};
