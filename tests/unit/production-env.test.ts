import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `productionEnvProblems()` decides whether the server refuses to boot, and
 * `isProduction` is captured at module load — so each case stubs the
 * environment it means to describe and re-imports the module.
 *
 * `vi.stubEnv` rather than assignment: `NODE_ENV` is typed read-only.
 */
async function problemsWith(env: Record<string, string | undefined>): Promise<string[]> {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  const mod = await import('@/lib/env');
  return mod.productionEnvProblems();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const COMPLETE = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example_key',
  SUPABASE_SECRET_KEY: 'sb_secret_example_key',
};

describe('productionEnvProblems', () => {
  it('reports nothing outside production', async () => {
    expect(await problemsWith({ ...COMPLETE, NODE_ENV: 'test' })).toEqual([]);
  });

  it('reports nothing when production is fully configured', async () => {
    expect(await problemsWith(COMPLETE)).toEqual([]);
  });

  it('catches a missing public Supabase URL', async () => {
    const problems = await problemsWith({ ...COMPLETE, NEXT_PUBLIC_SUPABASE_URL: undefined });
    expect(problems.join('\n')).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('treats a blank public variable as missing', async () => {
    // An empty field in the Vercel dashboard is a defined empty string.
    const problems = await problemsWith({
      ...COMPLETE,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '   ',
    });
    expect(problems.join('\n')).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  });

  it('names every missing variable at once, not one per deploy', async () => {
    // The outage this guards against was diagnosed one variable at a time,
    // because the public pair was never checked alongside the secret key.
    const problems = await problemsWith({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      SUPABASE_SECRET_KEY: undefined,
    });

    expect(problems).toHaveLength(3);
    const joined = problems.join('\n');
    expect(joined).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(joined).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(joined).toContain('SUPABASE_SECRET_KEY');
  });
});
