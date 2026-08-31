import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { streamAnswer, aiEnabled } from '@/features/ai/chat';
import { LIMITS, SUPPORTED_COUNTRIES } from '@/features/ai/config';
import { failureMessage, failureStatus } from '@/features/ai/errors';
import { callerIp } from '@/features/ai/identity';
import { startTimings } from '@/features/ai/timings';
import { createClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Ask bdoor AI — the streaming answer endpoint.
 *
 * Server-only by construction. The AI Gateway credential is read by the SDK
 * from the environment inside this process (Vercel OIDC in deployed
 * environments, `AI_GATEWAY_API_KEY` for local development only); no token,
 * Supabase secret or service-role key is ever included in a response.
 *
 * Node runtime, not edge: the pipeline uses node:crypto for the hashed safety
 * identifier and the service-role client for persistence.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// The Supabase project lives in ap-southeast-1, and this handler makes
// several database round-trips per answer. Running the function beside the
// database (Vercel sin1 = Singapore) turns each ~230ms cross-Pacific hop into
// single-digit milliseconds; the dashboard's function-region setting is the
// authoritative control and should match.
export const preferredRegion = 'sin1';

const bodySchema = z.object({
  message: z.string().min(1).max(LIMITS.maxMessageChars),
  conversationId: z.string().uuid().nullish(),
  locale: z.enum(['en', 'bn']).default('en'),
  country: z.enum(SUPPORTED_COUNTRIES).default('bd'),
  /**
   * A random id the browser holds for an anonymous visitor. It identifies a
   * chat thread, nothing else: it is never joined to a customer record and is
   * hashed before it leaves this process.
   */
  anonymousSessionId: z.string().min(8).max(64).optional(),
});

/**
 * Rate limiting.
 *
 * Two windows, both keyed on a hashed IP: a burst window that a person will
 * never reach and a script reaches in seconds, and a daily ceiling that bounds
 * what one source can cost. Deliberately implemented here rather than through
 * `RATE_LIMITS`, because those keys are a reviewed constant and this endpoint's
 * limits belong with the rest of the AI limits.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function overLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1_000 });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return false;
  }

  existing.count += 1;
  return existing.count > limit;
}

function refusal(failure: Parameters<typeof failureStatus>[0], locale: 'en' | 'bn') {
  return NextResponse.json(
    { error: failure, message: failureMessage(failure, locale) },
    { status: failureStatus(failure) },
  );
}

export async function POST(request: NextRequest) {
  const timings = startTimings();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    // The rejected body is never echoed: it may contain the customer's text.
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { message, conversationId, locale, country, anonymousSessionId } = parsed.data;

  if (!aiEnabled()) return refusal('disabled', locale);

  // RATE_LIMIT_DISABLED is the repository-wide local/test switch and is never
  // set in production; this limiter honours it like every other one does.
  const limiterOn = !serverEnv().RATE_LIMIT_DISABLED;

  const ip = callerIp(request.headers);
  if (
    limiterOn &&
    (overLimit(`ai:min:${ip}`, LIMITS.perIpPerMinute, 60) ||
      overLimit(`ai:day:${ip}`, LIMITS.perIpPerDay, 86_400))
  ) {
    logger.warn('ai.rate_limited', { scope: 'ip' });
    return refusal('rate_limited', locale);
  }

  // A signed-in customer owns their conversations; everyone else gets an
  // anonymous thread. Note what is *not* read here: nothing about the user
  // beyond their id reaches the assistant, and no case, document or KYC record
  // is loaded on any path.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const owner = user
    ? ({ kind: 'user', userId: user.id } as const)
    : anonymousSessionId
      ? ({ kind: 'anonymous', anonymousSessionId } as const)
      : null;

  if (!owner) {
    return NextResponse.json({ error: 'session_required' }, { status: 400 });
  }

  if (
    limiterOn &&
    overLimit(`ai:conv:${conversationId ?? ip}`, LIMITS.perConversationPerHour, 3_600)
  ) {
    logger.warn('ai.rate_limited', { scope: 'conversation' });
    return refusal('rate_limited', locale);
  }

  timings.mark('checks');

  // Everything from here streams. Scope declines, budget refusals and
  // upstream failures arrive as stream content with honest copy, so the
  // customer sees an acknowledgement within one round-trip, always.
  return streamAnswer({ message, conversationId, locale, country, owner, timings });
}
