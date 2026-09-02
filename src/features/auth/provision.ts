import 'server-only';

import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { claimDraftForUser } from '@/features/intake/session';
import { POLICY_VERSIONS, recordPolicyConsent } from '@/features/legal/consent';
import { logger } from '@/lib/logger';

/**
 * Finish creating an account the first time its owner proves the address.
 *
 * Password signup does this inline, because `auth.signUp` hands back a user id
 * straight away. A one-time link does not: nothing exists until the link is
 * opened, so the profile row, the questionnaire draft and the consent records
 * are all written here instead.
 *
 * The profile row is the "already provisioned" marker. It is created by
 * whichever path made the account, so a password-mode user arriving to confirm
 * their address finds one and this does nothing — which is what keeps the
 * append-only consent table from gaining a duplicate row every time a link is
 * re-opened.
 */
export async function provisionOnFirstConfirm(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<void> {
  const { data: existing, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    logger.warn('auth.provision_lookup_failed', { code: error.code ?? null });
    return;
  }
  if (existing) return;

  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  const locale = metadata.preferred_locale === 'bn' ? ('bn' as const) : ('en' as const);

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: fullName || (user.email ?? ''),
      email: user.email ?? '',
      preferred_locale: locale,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    // Without a profile the "already provisioned" marker is missing, so a
    // retry would double-record consent. Stop here and let the next visit try
    // again from a clean state.
    logger.error('auth.provision_profile_failed', { code: profileError.code ?? null });
    return;
  }

  await claimDraftForUser(user.id);

  // Only a signup form sets this, and Supabase only applies `options.data`
  // when it creates the user — so this cannot be set on an account that
  // already existed. The VERSIONS come from the server, never from the
  // metadata: a forged flag can still only consent on its own behalf, and
  // never to a version that was not the live one.
  if (metadata.signup_consent !== true) return;

  await recordPolicyConsent({
    consentType: 'terms_of_service',
    policyVersion: POLICY_VERSIONS.terms,
    method: 'signup_checkbox',
    userId: user.id,
    locale,
  });
  await recordPolicyConsent({
    consentType: 'privacy_policy',
    policyVersion: POLICY_VERSIONS.privacy,
    method: 'signup_checkbox',
    userId: user.id,
    locale,
  });
}
