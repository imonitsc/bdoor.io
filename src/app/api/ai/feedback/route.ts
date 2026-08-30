import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { aiEnabled } from '@/features/ai/chat';
import { aiDb, hasAiDatabase } from '@/features/ai/db';
import { callerIp } from '@/features/ai/identity';
import { redactSensitive } from '@/features/ai/redaction';
import { logger } from '@/lib/logger';

/**
 * Answer feedback.
 *
 * A thumbs-down is the cheapest signal there is that a knowledge source is
 * wrong or missing, so it is worth collecting even from anonymous visitors.
 * The free-text reason is redacted like every other customer-written string,
 * because "this is wrong, my TIN is 123..." is a message people actually send.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  messageId: z.string().uuid(),
  conversationId: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(-1)]),
  reason: z.string().max(500).optional(),
});

const seen = new Map<string, number>();

export async function POST(request: NextRequest) {
  if (!aiEnabled() || !hasAiDatabase()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // Light abuse guard: one submission per message, plus a per-IP ceiling.
  const ip = callerIp(request.headers);
  const now = Date.now();
  const key = `${ip}:${parsed.data.messageId}`;
  if ((seen.get(key) ?? 0) > now - 60_000) {
    return NextResponse.json({ ok: true });
  }
  seen.set(key, now);
  if (seen.size > 10_000) {
    for (const [k, at] of seen) if (at < now - 3_600_000) seen.delete(k);
  }

  const reason = parsed.data.reason ? redactSensitive(parsed.data.reason).text : null;

  // The unique index on `message_id` makes a resubmission a conflict rather
  // than a second vote; either way the customer sees success.
  const { error } = await aiDb().from('ai_feedback').insert({
    message_id: parsed.data.messageId,
    conversation_id: parsed.data.conversationId,
    rating: parsed.data.rating,
    reason,
  });

  if (error && error.code !== '23505') {
    logger.warn('ai.feedback.write_failed', { code: error.code ?? null });
  }

  return NextResponse.json({ ok: true });
}
