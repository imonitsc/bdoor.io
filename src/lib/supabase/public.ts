import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Anonymous, cookie-free client for PUBLIC content only.
 *
 * The marketing site reads the published catalog, FAQs and resources — all of
 * which have an `anon` SELECT policy. Using the cookie-bound server client for
 * those reads would opt every marketing page into dynamic rendering (because
 * `cookies()` is a dynamic API) and would leak the visitor's session into a
 * response that is otherwise identical for everyone.
 *
 * This client carries no session, so it can never see more than `anon` can, and
 * pages using it stay statically renderable.
 */
let cached: ReturnType<typeof createSupabaseClient<Database>> | undefined;

export function createPublicClient() {
  cached ??= createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'x-bdoor-client': 'public-catalog' } },
    },
  );
  return cached;
}
