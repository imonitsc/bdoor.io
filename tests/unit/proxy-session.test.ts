import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * The proxy runs on every request, so a throw here is a total outage rather
 * than a degraded feature — including on the marketing pages the README says
 * work with no database. This is the regression that timed out the E2E suite.
 */
afterEach(() => {
  vi.unstubAllEnvs();
});

function request(path = '/en'): NextRequest {
  return new NextRequest(new URL(path, 'http://127.0.0.1:3000'));
}

describe('updateSession without Supabase credentials', () => {
  it('reports the caller as signed out instead of throwing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', undefined);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', undefined);

    const { response, userId } = await updateSession(request());

    expect(userId).toBeNull();
    expect(response).toBeDefined();
  });

  it('treats a blank variable as absent', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '   ');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');

    await expect(updateSession(request())).resolves.toMatchObject({ userId: null });
  });

  it('needs both variables, not just one', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', undefined);

    await expect(updateSession(request())).resolves.toMatchObject({ userId: null });
  });
});
