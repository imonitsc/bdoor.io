/**
 * The event taxonomy (docs/EVENT_TAXONOMY.md). The check constraint on
 * `public.analytics_events.event_name` carries the same list;
 * `tests/unit/analytics-taxonomy.test.ts` parses the migration and fails if
 * the two drift. Adding an event means adding it in both places.
 */
export const ANALYTICS_EVENTS = [
  'application_started',
  'application_submitted',
  'contact_submitted',
  'provider_application_submitted',
  'provider_application_approved',
  'provider_assignment_accepted',
  'quote_issued',
  'quote_viewed',
  'quote_accepted',
  'payment_confirmed',
  'case_completed',
  'subscription_started',
  'subscription_renewed',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/**
 * Actors whose activity is test traffic, not traction (§13.7). Matching is on
 * the actor's email only to set the flag — the address itself is never stored
 * on an event. `(sample)` is the seed-data suffix the repository already uses.
 */
export const ANALYTICS_TEST_EMAIL_PATTERNS: readonly RegExp[] = [
  /@example\.(?:com|org|net|test)$/i,
  /\+bdoor-test@/i,
  /\(sample\)/i,
];

export function isTestActorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ANALYTICS_TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(email));
}
