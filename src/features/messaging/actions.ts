'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession, isStaff } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rate-limit';
import { hashIdentifier } from '@/lib/utils/hash';
import { RateLimitError } from '@/lib/permissions/errors';
import { logger } from '@/lib/logger';

export type MessageState = { status: 'idle' | 'error' | 'success'; message?: string };

const bodySchema = z.string().trim().min(1, 'empty').max(20_000, 'tooLong');

/**
 * Posts a message into a case thread.
 *
 * Authorship is taken from the session, never the form, and the internal-note
 * flag is only honoured for staff — a customer cannot post a note that hides
 * itself from their own team, and cannot forge one that reads as staff.
 */
export async function sendMessage(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const session = await requireSession();

  try {
    await enforceRateLimit('message.send', hashIdentifier(session.userId));
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const threadId = String(formData.get('threadId') ?? '');
  const parsed = bodySchema.safeParse(formData.get('body'));

  if (!threadId || !parsed.success) {
    return {
      status: 'error',
      message: parsed.success ? 'generic' : parsed.error.issues[0]!.message,
    };
  }

  const staff = isStaff(session);
  const wantsInternal = formData.get('internal') === 'on';

  const supabase = await createClient();
  const { error } = await supabase.from('messages').insert({
    thread_id: threadId,
    author_id: session.userId,
    author_kind: staff
      ? 'staff'
      : session.memberships.some((m) => m.kind === 'partner')
        ? 'partner'
        : 'customer',
    body: parsed.data,
    is_internal_note: staff && wantsInternal,
  });

  if (error) {
    logger.warn('message.send_failed', { message: error.message });
    return { status: 'error', message: 'generic' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/app/messages`);
  return { status: 'success' };
}

export async function markThreadRead(threadId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from('messages')
    .select('id')
    .eq('thread_id', threadId)
    .limit(200);

  if (!messages?.length) return;

  await supabase.from('message_reads').upsert(
    messages.map((m) => ({ message_id: m.id, user_id: session.userId })),
    { onConflict: 'message_id,user_id' },
  );
}
