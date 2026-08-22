'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';

export type SettingsState = { status: 'idle' | 'error' | 'success'; message?: string };

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'nameTooShort').max(120),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  preferredLocale: z.enum(['en', 'bn']),
});

export async function updateProfile(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') ?? '',
    preferredLocale: formData.get('preferredLocale'),
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]!.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      preferred_locale: parsed.data.preferredLocale,
    })
    .eq('id', session.userId);

  if (error) return { status: 'error', message: 'generic' };

  revalidatePath(`/${await getLocale()}/app/settings`);
  return { status: 'success', message: 'saved' };
}

/**
 * Records a data-subject request.
 *
 * The request is only ever *recorded* here — no data is exported or erased by
 * this action. Deletion in particular has to be assessed against the AML and
 * financial retention obligations, so it goes to a person.
 */
export async function submitDataRequest(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireSession();
  const requestType = String(formData.get('requestType') ?? '');
  const organizationId = String(formData.get('organizationId') ?? '') || null;

  if (!['export', 'correction', 'deletion', 'restriction'].includes(requestType)) {
    return { status: 'error', message: 'generic' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('data_subject_requests').insert({
    user_id: session.userId,
    organization_id: organizationId,
    request_type: requestType,
    status: 'received',
    detail: String(formData.get('detail') ?? '').slice(0, 2000) || null,
  });

  if (error) return { status: 'error', message: 'generic' };

  await recordAudit({
    action: 'data_request.received',
    targetType: 'data_subject_request',
    organizationId,
    metadata: { requestType },
  });

  return { status: 'success', message: 'dataRequestReceived' };
}
