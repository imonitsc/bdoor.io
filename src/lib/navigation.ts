/**
 * Route tables. Keeping these here means the header, footer, sitemap and
 * breadcrumbs cannot drift apart, and a route rename is one edit.
 */

export const MARKETING_ROUTES = {
  home: '/',
  start: '/start',
  services: '/services',
  industries: '/industries',
  countries: '/countries',
  authorities: '/authorities',
  foreignFounders: '/foreign-founders',
  pricing: '/pricing',
  howItWorks: '/how-it-works',
  partners: '/partners',
  partnersApply: '/partners/apply',
  resources: '/resources',
  ask: '/ask',
  about: '/about',
  contact: '/contact',
  login: '/login',
  signup: '/signup',
  privacy: '/privacy',
  terms: '/terms',
  refundPolicy: '/refund-policy',
  amlKycPolicy: '/aml-kyc-policy',
  legalDisclaimer: '/legal-disclaimer',
  cookiePolicy: '/cookie-policy',
  legal: '/legal',
  complaints: '/complaints',
  acceptableUse: '/acceptable-use',
  providerDisclosure: '/provider-disclosure',
  electronicConsent: '/electronic-consent',
} as const;

export const APP_ROUTES = {
  dashboard: '/app',
  start: '/app/start',
  applications: '/app/applications',
  companies: '/app/companies',
  documents: '/app/documents',
  billing: '/app/billing',
  compliance: '/app/compliance',
  messages: '/app/messages',
  notifications: '/app/notifications',
  team: '/app/team',
  settings: '/app/settings',
  security: '/app/security',
  onboarding: '/app/onboarding',
} as const;

export const PARTNER_ROUTES = {
  dashboard: '/partner',
  cases: '/partner/cases',
  tasks: '/partner/tasks',
  documents: '/partner/documents',
  team: '/partner/team',
  organization: '/partner/organization',
  security: '/partner/security',
} as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin',
  applications: '/admin/applications',
  leads: '/admin/leads',
  cases: '/admin/cases',
  kyc: '/admin/kyc',
  partners: '/admin/partners',
  services: '/admin/services',
  pricing: '/admin/pricing',
  documents: '/admin/documents',
  compliance: '/admin/compliance',
  finance: '/admin/finance',
  content: '/admin/content',
  ai: '/admin/ai',
  users: '/admin/users',
  audit: '/admin/audit',
  settings: '/admin/settings',
} as const;

/**
 * Primary destinations (production-fix 29 Aug 2026): Start, Services,
 * Pricing, Resources. Countries stay in the footer only — not the header.
 * Partners, how-it-works and company pages remain in the drawer and footer.
 */
export const HEADER_LINKS = [
  { href: MARKETING_ROUTES.start, labelKey: 'nav.startShort' },
  { href: MARKETING_ROUTES.services, labelKey: 'nav.services' },
  { href: MARKETING_ROUTES.pricing, labelKey: 'nav.pricing' },
  { href: MARKETING_ROUTES.resources, labelKey: 'nav.resources' },
] as const;

/** Shown in the mobile/tablet drawer under the five primary destinations. */
export const DRAWER_SECONDARY_LINKS = [
  { href: MARKETING_ROUTES.howItWorks, labelKey: 'nav.howItWorks' },
  { href: MARKETING_ROUTES.partners, labelKey: 'nav.partners' },
  { href: MARKETING_ROUTES.foreignFounders, labelKey: 'nav.foreignFounders' },
  { href: MARKETING_ROUTES.industries, labelKey: 'nav.industries' },
  { href: MARKETING_ROUTES.about, labelKey: 'nav.about' },
  { href: MARKETING_ROUTES.contact, labelKey: 'nav.contact' },
] as const;

/** Three footer groups plus legal/contact — not one group per site area. */
export const FOOTER_BANGLADESH_LINKS = [
  { href: '/services?category=company-formation', labelKey: 'footer.links.formation' },
  { href: '/services?category=licences', labelKey: 'footer.links.licences' },
  { href: '/services?category=tax-vat', labelKey: 'footer.links.tax' },
  { href: '/services?category=compliance', labelKey: 'footer.links.compliance' },
  { href: MARKETING_ROUTES.foreignFounders, labelKey: 'nav.foreignFounders' },
  { href: MARKETING_ROUTES.industries, labelKey: 'nav.industries' },
] as const;

export const FOOTER_COUNTRY_LINKS = [
  { href: MARKETING_ROUTES.countries, labelKey: 'footer.links.countriesOverview' },
  { href: '/countries/usa', labelKey: 'footer.links.unitedStates' },
  { href: '/countries/uk', labelKey: 'footer.links.unitedKingdom' },
  { href: '/countries/uae', labelKey: 'footer.links.uae' },
  { href: '/countries/saudi-arabia', labelKey: 'footer.links.saudiArabia' },
  { href: '/countries/qatar', labelKey: 'footer.links.qatar' },
  { href: '/countries/singapore', labelKey: 'footer.links.singapore' },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: MARKETING_ROUTES.about, labelKey: 'nav.about' },
  { href: MARKETING_ROUTES.howItWorks, labelKey: 'nav.howItWorks' },
  { href: MARKETING_ROUTES.pricing, labelKey: 'nav.packages' },
  { href: MARKETING_ROUTES.partners, labelKey: 'nav.partners' },
  { href: MARKETING_ROUTES.resources, labelKey: 'nav.resources' },
  { href: MARKETING_ROUTES.contact, labelKey: 'nav.contact' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: MARKETING_ROUTES.legal, labelKey: 'legal.index' },
  { href: MARKETING_ROUTES.terms, labelKey: 'legal.terms' },
  { href: MARKETING_ROUTES.privacy, labelKey: 'legal.privacy' },
  { href: MARKETING_ROUTES.refundPolicy, labelKey: 'legal.refund' },
  { href: MARKETING_ROUTES.amlKycPolicy, labelKey: 'legal.amlKyc' },
  { href: MARKETING_ROUTES.legalDisclaimer, labelKey: 'legal.disclaimer' },
  { href: MARKETING_ROUTES.cookiePolicy, labelKey: 'legal.cookies' },
  { href: MARKETING_ROUTES.complaints, labelKey: 'legal.complaints' },
  { href: MARKETING_ROUTES.acceptableUse, labelKey: 'legal.acceptableUse' },
  { href: MARKETING_ROUTES.providerDisclosure, labelKey: 'legal.providerDisclosure' },
  { href: MARKETING_ROUTES.electronicConsent, labelKey: 'legal.electronicConsent' },
] as const;

/** Public routes included in the sitemap, with their change priority. */
export const SITEMAP_ROUTES: ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
}> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/start', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/industries', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/countries', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/countries/bangladesh', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/countries/usa', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/countries/uk', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/countries/uae', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/countries/saudi-arabia', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/countries/qatar', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/countries/singapore', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/authorities', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/foreign-founders', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/how-it-works', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/partners', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/partners/apply', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/resources', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/legal', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/aml-kyc-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal-disclaimer', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cookie-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/complaints', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/acceptable-use', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/provider-disclosure', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/electronic-consent', priority: 0.3, changeFrequency: 'yearly' },
];
