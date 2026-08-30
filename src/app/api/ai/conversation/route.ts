import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { aiEnabled } from '@/features/ai/chat';
import { deleteConversation } from '@/features/ai/persistence';
import { createClient } from '@/lib/supabase/server';

/**
 * Conversation deletion, at the customer's request.
 *
 * Ownership is proved by the session for a signed-in customer and by holding
 * the anonymous session id for everyone else — the same id that created the
 * thread. The usage ledger survives deletion by design: `ai_usage` references
 * the conversation with `on delete set null`, so removing a transcript removes
 * what was said without erasing the record that money was spent.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  anonymousSessionId: z.string().min(8).max(64).optional(),
});

export async function DELETE(request: NextRequest) {
  if (!aiEnabled()) return NextResponse.json({ ok: false }, { status: 503 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const owner = user
    ? ({ kind: 'user', userId: user.id } as const)
    : parsed.data.anonymousSessionId
      ? ({ kind: 'anonymous', anonymousSessionId: parsed.data.anonymousSessionId } as const)
      : null;

  if (!owner) return NextResponse.json({ error: 'session_required' }, { status: 400 });

  const deleted = await deleteConversation(parsed.data.conversationId, owner);
  return NextResponse.json({ ok: deleted });
}
