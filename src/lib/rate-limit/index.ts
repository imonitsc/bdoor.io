import 'server-only';

import { RateLimitError } from '@/lib/permissions/errors';
import { serverEnv } from '@/lib/env';

/**
 * Fixed-window rate limiter.
 *
 * The in-memory store is correct for a single instance and is deliberately the
 * default: it is better than nothing and has no infrastructure cost. On a
 * multi-instance deployment, swap `store` for a Redis/Upstash implementation of
 * the same two-method interface — every call site already goes through
 * `enforceRateLimit`, so nothing else changes. See README → Rate limiting.
 */
export interface RateLimitStore {
  increment(key: string, windowSeconds: number): Promise<{ count: number; resetAt: number }>;
  reset(key: string): Promise<void>;
}

class MemoryStore implements RateLimitStore {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string, windowSeconds: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const bucket = { count: 1, resetAt: now + windowSeconds * 1000 };
      this.buckets.set(key, bucket);
      this.sweep(now);
      return bucket;
    }

    existing.count += 1;
    return existing;
  }

  async reset(key: string) {
    this.buckets.delete(key);
  }

  private sweep(now: number) {
    if (this.buckets.size < 5000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

const store: RateLimitStore = new MemoryStore();

export type RateLimitRule = { limit: number; windowSeconds: number };

/** Tuned so a real person never hits them and a script does, quickly. */
export const RATE_LIMITS = {
  'auth.sign_in': { limit: 8, windowSeconds: 300 },
  'auth.sign_up': { limit: 5, windowSeconds: 3600 },
  'auth.password_reset': { limit: 5, windowSeconds: 3600 },
  'auth.mfa_verify': { limit: 10, windowSeconds: 300 },
  'contact.submit': { limit: 3, windowSeconds: 3600 },
  'questionnaire.save': { limit: 120, windowSeconds: 3600 },
  'document.upload': { limit: 60, windowSeconds: 3600 },
  'document.download': { limit: 120, windowSeconds: 3600 },
  'invitation.send': { limit: 20, windowSeconds: 3600 },
  'message.send': { limit: 60, windowSeconds: 3600 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitKey = keyof typeof RATE_LIMITS;

export async function enforceRateLimit(rule: RateLimitKey, identifier: string): Promise<void> {
  if (serverEnv().RATE_LIMIT_DISABLED) return;

  const { limit, windowSeconds } = RATE_LIMITS[rule];
  const { count, resetAt } = await store.increment(`${rule}:${identifier}`, windowSeconds);

  if (count > limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)));
  }
}

export async function resetRateLimit(rule: RateLimitKey, identifier: string): Promise<void> {
  await store.reset(`${rule}:${identifier}`);
}
