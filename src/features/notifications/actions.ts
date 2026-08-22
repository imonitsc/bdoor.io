'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';

export type NotificationState = { status: 'idle' | 'success' | 'error' };

export async function markAllNotificationsRead(): Promise<NotificationState> {
  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', session.userId)
    .is('read_at', null);

  const locale = await getLocale();
  revalidatePath(`/${locale}/app/notifications`);
  revalidatePath(`/${locale}/app`);

  return { status: error ? 'error' : 'success' };
}
