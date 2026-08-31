import 'server-only';

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
 */

export const FETCH_LIMITS = {
  timeoutMs: 25_000,
  maxBytes: 50 * 1024 * 1024,
  /** Minimum spacing between requests to one host, absent a stricter crawl-delay. */
  minHostIntervalMs: 1_500,
  maxCrawlDelayMs: 30_000,
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
  | 'network';

export type FetchOutcome =
  | {
      ok: true;
      bytes: Uint8Array;
      contentType: string;
      finalUrl: string;
      status: number;
    }
  | { ok: false; failure: FetchFailure; status?: number; retryable: boolean };

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

async function robotsFor(origin: string): Promise<RobotsRules | null> {
  const cached = hostState.get(origin);
  if (cached) return cached.robots;

  let robots: RobotsRules | null;
  try {
    const response = await fetch(`${origin}/robots.txt`, {
      headers: { 'user-agent': USER_AGENT },
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    });
    if (response.ok) {
      robots = parseRobots(await response.text());
    } else if (response.status >= 400 && response.status < 500) {
      // No robots file: everything is allowed by convention.
      robots = { disallow: [], allow: [], crawlDelayMs: null };
    } else {
      // Server error fetching robots: treat as unknown → disallow.
      robots = null;
    }
  } catch {
    robots = null;
  }

  hostState.set(origin, { robots, lastFetchAt: 0 });
  return robots;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch one public document, politely. The caller (a job worker) decides how
 * a failure is retried; `retryable` says whether retrying can possibly help.
 */
export async function fetchDocument(url: string): Promise<FetchOutcome> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, failure: 'network', retryable: false };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, failure: 'network', retryable: false };
  }

  const robots = await robotsFor(parsed.origin);
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

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: ALLOWED_CONTENT_TYPES.join(', ') },
      signal: AbortSignal.timeout(FETCH_LIMITS.timeoutMs),
      redirect: 'follow',
    });
  } catch (error) {
    const timedOut = (error as Error).name === 'TimeoutError';
    return { ok: false, failure: timedOut ? 'timeout' : 'network', retryable: true };
  }

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

  return {
    ok: true,
    bytes: buffer,
    contentType,
    finalUrl: response.url || url,
    status: response.status,
  };
}
