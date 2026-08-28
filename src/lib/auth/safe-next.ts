/**
 * Validates a post-authentication redirect target.
 *
 * Anything that comes back from a `?next=` parameter is attacker-controlled: it
 * arrives in a link, and the whole point of the link is that somebody clicks it
 * while signed in. Handing it to `redirect()` unchecked turns any auth route
 * into an open redirect, which is what makes a phishing page look like it lives
 * on this site.
 *
 * The rule is that the value must be a path on this site and nothing else. A
 * leading `//` is protocol-relative and goes to another host, and a backslash
 * is worth rejecting outright because browsers have historically normalised it
 * to a forward slash, so `/\evil.com` can navigate off-site while passing a
 * naive `startsWith('/')` check.
 *
 * Pure and separate so it can be tested exhaustively, and shared so the four
 * places that need it cannot drift apart.
 */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;
  if (raw.includes('\\')) return fallback;
  return raw;
}
