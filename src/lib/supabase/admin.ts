import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { serverEnv } from '@/lib/env';

/**
 * Service-role client. This BYPASSES Row Level Security.
 *
 * Rules for using it, without exception:
 *   1. Only in a Server Action, Route Handler or server-only module.
 *   2. Only after the caller's permission has already been checked in code.
 *   3. Never for a read that the ordinary user-scoped client could do.
 *
 * Legitimate uses in this codebase: webhook processing (no user session),
 * anonymous questionnaire drafts (no user yet), invitation-token lookup (the
 * invitee cannot select the token hash), and the restricted `compliance` schema.
 */
let cached: ReturnType<typeof createSupabaseClient<Database>> | undefined;

export function createAdminClient() {
  const env = serverEnv();
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      'SUPABASE_SECRET_KEY is not configured. This operation requires the service role.',
    );
  }

  cached ??= createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SECRET_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { 'x-bdoor-client': 'service-role' } },
    },
  );

  return cached;
}

/** True when a service-role key is present, so callers can degrade gracefully. */
export function hasServiceRole(): boolean {
  return Boolean(serverEnv().SUPABASE_SECRET_KEY);
}
