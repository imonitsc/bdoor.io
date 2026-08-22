'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Whether there is a signed-in user, resolved in the browser.
 *
 * Used only to choose between "Sign in" and "Workspace" in the marketing
 * header. It starts as `false` so the statically-rendered HTML is identical for
 * everyone — no private data is ever gated on this, and the real authorization
 * boundary is the proxy plus Row Level Security.
 */
export function useIsSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return signedIn;
}
