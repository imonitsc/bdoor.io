import 'server-only';

import { createHash } from 'node:crypto';

import { allowlisted, type OfficialDomain } from '../research/official-domains';
import { normaliseHost, resolveHost, type AddressBlock } from '../research/url-safety';
import { logger } from '@/lib/logger';

/**
 * The safe fetcher: the only code that touches an external site.
 *
 * Rules it enforces rather than documents:
 *
 *   - robots.txt is fetched and honoured before any page on a host, and a
 *     disallowed path is a permanent refusal, not a retry.
 *   - one request at a time per host, spaced by at least the crawl delay,
 *     so a batch of jobs cannot hammer a government server.
 *   - it never carries credentials, never fills a login form, never solves a
 *     CAPTCHA: a 401/403 means the document is not publicly available and the
 *     job records exactly that.
 *   - responses are size-capped and content-type checked before a byte is
 *     stored.
 *   - every hop resolves to a public address, and redirects are followed one
 *     at a time so each one faces the same checks as the URL that was asked
 *     for (CLAUDE.md §6.7).
 *
 * That last rule closed a real hole rather than anticipating one. This module
 * fetched with `redirect: 'follow'` and no address check at all, so any host it
 * was ever pointed at could redirect it to `http://169.254.169.254/` — the
 * cloud instance-metadata address — or to a service on the loopback interface,
 * and the bytes would have been stored as a government document. The registry
 * source list is admin-controlled, which made it unreachable in practice, not
 * safe; §6.7's live research would have made it reachable.
 */

export const FETCH_LIMITS = {
  timeoutMs: 25_000,
  maxBytes: 50 * 1024 * 1024,
  /** Minimum spacing between requests to one host, absent a stricter crawl-delay. */
  minHostIntervalMs: 1_500,
  maxCrawlDelayMs: 30_000,
  /** Hops followed before a chain is treated as a loop rather than a move. */
  maxRedirects: 5,
} as const;

export const USER_AGENT = 'bdoor-knowledge/1.0 (+https://bdoor.io/contact; knowledge ingestion)';

export const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export type FetchFailure =
  | 'robots_disallowed'
  | 'not_public' // 401/403: behind auth or refused — never worked around
  | 'not_found'
  | 'http_error'
  | 'timeout'
  | 'too_large'
  | 'unsupported_type'
  | 'network'
  | 'blocked_address' // resolves to a private, loopback or otherwise reserved address
  | 'insecure_transport' // plaintext where the caller requires TLS, or an https→http downgrade
  | 'not_allowlisted' // host is not an approved official domain (§6.7)
  | 'redirect_not_approved' // a cross-site hop the caller never approved
  | 'too_many_redirects';

export type FetchOutcome =
  | {
      ok: true;
      bytes: Uint8Array;
      contentType: string;
      finalUrl: string;
      status: number;
      /** SHA-256 of the exact bytes, for §6.7's content-hash validation. */
      contentHash: string;
      /** False when any hop travelled over plaintext http. */
      secureTransport: boolean;
      /** Every URL requested, in order, ending with the one that answered. */
      chain: string[];
    }
  | { ok: false; failure: FetchFailure; status?: number; retryable: boolean };

/**
 * What a caller is allowed to reach.
 *
 * The defaults are the registry ingestion pipeline's: no allowlist, because
 * the registry itself is the admin-curated list of what may be ingested, and
 * plaintext tolerated, because several seeded authority sites are registered
 * over http and every document they yield stops at `review_required` for a
 * human. Live research (§6.7) passes the strict settings instead: its evidence
 * reaches a customer labelled `official_live` without that human step, so it
 * gets TLS and an allowlist.
 */
export type FetchOptions = {
  /** Refuse plaintext http outright. */
  requireHttps?: boolean;
  /** When supplied, EVERY hop's host must be on it. */
  allowlist?: readonly OfficialDomain[];
  maxRedirects?: number;
};

/** Parsed robots.txt rules for the `*` agent (we do not claim a special one). */
export type RobotsRules = {
  disallow: string[];
  allow: string[];
  crawlDelayMs: number | null;
};

/**
 * Minimal, conservative robots.txt parser. Understands User-agent groups,
 * Allow/Disallow prefixes and Crawl-delay. Wildcard agents apply to us; a
 * group naming another agent does not. On anything unparseable the caller
 * treats the host as disallowed — refusing to crawl is always the safe
 * reading of an ambiguous robots file.
 */
export function parseRobots(text: string): RobotsRules {
  const rules: RobotsRules = { disallow: [], allow: [], crawlDelayMs: null };
  let applies = false;
  let sawAnyAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'user-agent') {
      // A new agent line after rules starts a new group.
      if (sawAnyAgent && (rules.disallow.length || rules.allow.length)) {
        applies = value === '*' || applies;
      } else {
        applies = value === '*';
      }
      sawAnyAgent = true;
      continue;
    }
    if (!applies) continue;
    if (field === 'disallow' && value) rules.disallow.push(value);
    if (field === 'allow' && value) rules.allow.push(value);
    if (field === 'crawl-delay') {
      const seconds = Number(value);
      if (Number.isFinite(seconds) && seconds > 0) {
        rules.crawlDelayMs = Math.min(seconds * 1000, FETCH_LIMITS.maxCrawlDelayMs);
      }
    }
  }
  return rules;
}

/** Longest-prefix-match, per the robots convention: a more specific Allow wins. */
export function robotsAllows(rules: RobotsRules, path: string): boolean {
  const longestMatch = (patterns: string[]): number =>
    patterns.reduce((best, pattern) => {
      // '*' wildcards are common on gov sites; translate conservatively.
      const regex = new RegExp(
        `^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}`,
      );
      return regex.test(path) ? Math.max(best, pattern.length) : best;
    }, -1);

  const disallowed = longestMatch(rules.disallow);
  if (disallowed === -1) return true;
  return longestMatch(rules.allow) >= disallowed;
}

/** Per-invocation host state. Serverless instances are short-lived, so this is
 * per-batch politeness, not a distributed limiter — the job scheduler's
 * frequency settings are the coarse control. */
const hostState = new Map<string, { robots: RobotsRules | null; lastFetchAt: number }>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

/** Reserved-address classes, mapped to the one failure a caller acts on. */
function addressFailure(block: AddressBlock): FetchFailure {
  return block === 'unspecified' ? 'network' : 'blocked_address';
}

/**
 * Whether a redirect may leave the host it started on.
 *
 * With an allowlist, membership is the whole answer: an approved official
 * domain is approved wherever it appears in the chain. Without one, a hop is
 * approved only within the same site — the same host, or one a label deeper —
 * which still permits the apex↔www and http→https moves government sites
 * actually make, while refusing a hand-off to an unrelated host. Comparing
 * suffixes rather than registrable domains means a hop UP to a shared parent
 * such as `gov.bd` would also pass; that is a hop toward the same government,
 * not away from it, and avoiding it would cost a public-suffix dependency for
 * no security gained.
 */
function redirectApproved(
  from: URL,
  to: URL,
  allowlist: readonly OfficialDomain[] | undefined,
): boolean {
  if (allowlist) return allowlisted(to.hostname, allowlist);
  const source = normaliseHost(from.hostname);
  const target = normaliseHost(to.hostname);
  return source === target || target.endsWith(`.${source}`) || source.endsWith(`.${target}`);
}

type GuardOutcome =
  { ok: true; url: URL } | { ok: false; failure: FetchFailure; retryable: boolean };

/**
 * Every check a URL faces before a socket is opened to it, applied identically
 * to the URL that was asked for and to each redirect target.
 */
async function guard(
  candidate: string,
  options: FetchOptions,
  startedSecure: boolean,
): Promise<GuardOutcome> {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, failure: 'network', retryable: false };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, failure: 'network', retryable: false };
  }
  if (url.protocol === 'http:' && (options.requireHttps || startedSecure)) {
    // Either the caller demands TLS, or the chain began on TLS and is being
    // walked down off it — a downgrade nobody asked for.
    return { ok: false, failure: 'insecure_transport', retryable: false };
  }
  if (options.allowlist && !allowlisted(url.hostname, options.allowlist)) {
    return { ok: false, failure: 'not_allowlisted', retryable: false };
  }

  const verdict = await resolveHost(url.hostname);
  if (!verdict.ok) {
    const failure = addressFailure(verdict.block);
    if (failure === 'blocked_address') {
      logger.warn('ai.fetch.blocked_address', { host: url.host, block: verdict.block });
    }
    return { ok: false, failure, retryable: failure === 'network' };
  }
  return { ok: true, url };
}

/**
 * One request, following redirects by hand so every hop is guarded. Returns
 * the response that was not a redirect, plus the chain that reached it.
 *
 * `startUrl` must already have passed `guard` — both callers hold that: one
 * guards the URL it was given, the other derives robots.txt from an origin
 * that was just guarded.
 */
async function request(
  startUrl: URL,
  options: FetchOptions,
  init: { accept: string; timeoutMs: number },
): Promise<
  | { ok: true; response: Response; chain: string[]; secure: boolean }
  | { ok: false; failure: FetchFailure; status?: number; retryable: boolean }
> {
  const limit = options.maxRedirects ?? FETCH_LIMITS.maxRedirects;
  const startedSecure = startUrl.protocol === 'https:';
  let current = startUrl;
  let secure = startedSecure;
  const chain: string[] = [];

  for (let hop = 0; hop <= limit; hop += 1) {
    chain.push(current.toString());
    if (current.protocol === 'http:') secure = false;

    let response: Response;
    try {
      response = await fetch(current, {
        headers: { 'user-agent': USER_AGENT, accept: init.accept },
        signal: AbortSignal.timeout(init.timeoutMs),
        redirect: 'manual',
        // Nothing this fetcher reaches is ours, and nothing it sends should
        // identify a customer: no cookies, no credentials, ever.
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
    } catch (error) {
      const timedOut = (error as Error).name === 'TimeoutError';
      return { ok: false, failure: timedOut ? 'timeout' : 'network', retryable: true };
    }

    if (!REDIRECT_STATUSES.has(response.status)) {
      return { ok: true, response, chain, secure };
    }

    const location = response.headers.get('location');
    if (!location) {
      return { ok: false, failure: 'http_error', status: response.status, retryable: false };
    }

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      return { ok: false, failure: 'network', retryable: false };
    }
    if (!redirectApproved(current, next, options.allowlist)) {
      logger.warn('ai.fetch.redirect_not_approved', { from: current.host, to: next.host });
      return { ok: false, failure: 'redirect_not_approved', retryable: false };
    }

    const checked = await guard(next.toString(), options, startedSecure);
    if (!checked.ok) return checked;
    current = checked.url;
  }

  return { ok: false, failure: 'too_many_redirects', retryable: false };
}

async function robotsFor(origin: URL, options: FetchOptions): Promise<RobotsRules | null> {
  const cached = hostState.get(origin.origin);
  if (cached) return cached.robots;

  let robots: RobotsRules | null;
  // robots.txt is fetched under the same guards, minus the robots check
  // itself — asking a site's rules for permission to read its rules is the
  // one request the convention exempts.
  const outcome = await request(new URL('/robots.txt', origin), options, {
    accept: 'text/plain',
    timeoutMs: 10_000,
  });

  if (!outcome.ok) {
    robots = null;
  } else if (outcome.response.ok) {
    try {
      robots = parseRobots(await outcome.response.text());
    } catch {
      robots = null;
    }
  } else if (outcome.response.status >= 400 && outcome.response.status < 500) {
    // No robots file: everything is allowed by convention.
    robots = { disallow: [], allow: [], crawlDelayMs: null };
  } else {
    // Server error fetching robots: treat as unknown → disallow.
    robots = null;
  }

  hostState.set(origin.origin, { robots, lastFetchAt: 0 });
  return robots;
}

/**
 * Fetch one public document, politely. The caller (a job worker) decides how
 * a failure is retried; `retryable` says whether retrying can possibly help.
 */
export async function fetchDocument(
  url: string,
  options: FetchOptions = {},
): Promise<FetchOutcome> {
  const checked = await guard(url, options, false);
  if (!checked.ok) return { ok: false, failure: checked.failure, retryable: checked.retryable };
  const parsed = checked.url;

  const robots = await robotsFor(parsed, options);
  if (robots === null) {
    // Could not establish what the site permits — do not crawl it blind.
    return { ok: false, failure: 'robots_disallowed', retryable: true };
  }
  if (!robotsAllows(robots, parsed.pathname)) {
    logger.info('ai.ingest.robots_disallowed', { host: parsed.host });
    return { ok: false, failure: 'robots_disallowed', retryable: false };
  }

  // Politeness spacing per host.
  const state = hostState.get(parsed.origin);
  const interval = Math.max(robots.crawlDelayMs ?? 0, FETCH_LIMITS.minHostIntervalMs);
  if (state && state.lastFetchAt > 0) {
    const wait = state.lastFetchAt + interval - Date.now();
    if (wait > 0) await sleep(wait);
  }
  if (state) state.lastFetchAt = Date.now();

  const outcome = await request(parsed, options, {
    accept: ALLOWED_CONTENT_TYPES.join(', '),
    timeoutMs: FETCH_LIMITS.timeoutMs,
  });
  if (!outcome.ok) return outcome;
  const { response, chain, secure } = outcome;

  if (response.status === 401 || response.status === 403) {
    // Behind authentication or refused. We never bypass access controls —
    // the document is recorded as not publicly retrievable.
    return { ok: false, failure: 'not_public', status: response.status, retryable: false };
  }
  if (response.status === 404 || response.status === 410) {
    return { ok: false, failure: 'not_found', status: response.status, retryable: false };
  }
  if (!response.ok) {
    return { ok: false, failure: 'http_error', status: response.status, retryable: true };
  }

  const contentType = (response.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
  if (!ALLOWED_CONTENT_TYPES.some((allowed) => contentType === allowed)) {
    return { ok: false, failure: 'unsupported_type', status: response.status, retryable: false };
  }

  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > FETCH_LIMITS.maxBytes) {
    return { ok: false, failure: 'too_large', status: response.status, retryable: false };
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength > FETCH_LIMITS.maxBytes) {
    return { ok: false, failure: 'too_large', status: response.status, retryable: false };
  }

  if (!secure) {
    // Not a refusal here: the registry path tolerates plaintext and a human
    // reviews everything it produces. It is recorded so the reviewer, and any
    // later evidence-state decision, knows the bytes arrived unauthenticated.
    logger.info('ai.fetch.plaintext_transport', { host: parsed.host });
  }

  return {
    ok: true,
    bytes: buffer,
    contentType,
    finalUrl: response.url || chain[chain.length - 1] || url,
    status: response.status,
    contentHash: createHash('sha256').update(buffer).digest('hex'),
    secureTransport: secure,
    chain,
  };
}
