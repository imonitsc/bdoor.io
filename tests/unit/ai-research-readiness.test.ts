import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The live-research boundary, and why it is shut.
 *
 * §6.7's research path needs three owner decisions this codebase may not make
 * for itself: turning it on, naming a search tool from the current Gateway
 * catalogue (§4.1 forbids hardcoding one), and saying which hosts carry the
 * authority of Bangladeshi law (§3.3 forbids inventing that). Until all three
 * exist the provider resolves to null and the assistant answers from the
 * reviewed ledger.
 *
 * serverEnv() caches per module instance, so each case rebuilds the graph.
 */

async function moduleWith(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('@/features/ai/research/provider');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('researchReadiness', () => {
  it('reports every blocker at once, so an operator sees the whole gap', async () => {
    const { researchReadiness } = await moduleWith({});
    const readiness = researchReadiness();

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toEqual(['disabled', 'no_search_tool', 'empty_allowlist']);
  });

  it('still reports the empty allowlist once the flag and tool are set', async () => {
    // The flag is the easy half. The allowlist is the half that decides whether
    // a fetched page counts as official, and it ships empty on purpose.
    const { researchReadiness } = await moduleWith({
      AI_WEB_RESEARCH_ENABLED: 'true',
      AI_WEB_SEARCH_TOOL: 'some-tool',
    });
    const readiness = researchReadiness();

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toEqual(['empty_allowlist']);
    expect(readiness.allowlistedDomains).toBe(0);
  });

  it('records the policy version a run would be made under', async () => {
    const { researchReadiness } = await moduleWith({ AI_OFFICIAL_DOMAIN_POLICY_VERSION: '3' });

    expect(researchReadiness().policyVersion).toBe('3');
  });
});

describe('resolveWebResearchProvider', () => {
  it('returns null today, and null is the ledger-only answer', async () => {
    const { resolveWebResearchProvider } = await moduleWith({});

    expect(resolveWebResearchProvider()).toBeNull();
  });

  it('returns null when the flag is on but nothing else is', async () => {
    const { resolveWebResearchProvider } = await moduleWith({ AI_WEB_RESEARCH_ENABLED: 'true' });

    expect(resolveWebResearchProvider()).toBeNull();
  });
});
