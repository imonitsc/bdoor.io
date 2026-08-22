'use server';

import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { contactSchema } from './schema';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/rate-limit';
import { hashIdentifier } from '@/lib/utils/hash';
import { RateLimitError } from '@/lib/permissions/errors';
import { logger } from '@/lib/logger';

export type ContactState = {
  status: 'idle' | 'success' | 'error';
  fieldErrors?: Record<string, string>;
  formError?: string;
};

/**
 * Public, unauthenticated form.
 *
 * Defences, in order: a honeypot field, a per-IP rate limit, Zod validation,
 * and a service-role insert (the table has no anon INSERT policy, so the Data
 * API cannot be posted to directly).
 */
export async function submitContactRequest(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    topic: formData.get('topic'),
    message: formData.get('message'),
    consent: formData.get('consent') === 'on',
    website: formData.get('website') ?? '',
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    // A filled honeypot is reported as success: telling a bot it was caught
    // just teaches it to try again.
    if (fieldErrors.website) return { status: 'success' };
    return { status: 'error', fieldErrors };
  }

  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for') ?? '';
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';

  try {
    await enforceRateLimit('contact.submit', hashIdentifier(ip));
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { status: 'error', formError: 'rateLimited' };
    }
    throw error;
  }

  if (!hasServiceRole()) {
    logger.warn('contact.no_service_role');
    return { status: 'error', formError: 'unavailable' };
  }

  const locale = await getLocale();

  const { error } = await createAdminClient()
    .from('contact_requests')
    .insert({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      topic: parsed.data.topic,
      message: parsed.data.message,
      locale: locale === 'bn' ? 'bn' : 'en',
      consent_given: true,
    });

  if (error) {
    logger.error('contact.insert_failed', { message: error.message });
    return { status: 'error', formError: 'unavailable' };
  }

  return { status: 'success' };
}
