import 'server-only';

import { OFFICIAL_DOMAINS, officialDomainPolicyVersion } from './official-domains';
import type { GenericQuery } from './search-query';
import { serverEnv } from '@/lib/env';

/**
 * The boundary between bdoor and an external search tool.
 *
 * §4.1 requires the search tool sit behind "a server-side `WebResearchProvider`
 * adapter" and forbids hardcoding a provider into the domain layer: the tool is
 * owner-approved configuration read from the current Gateway catalogue. Which
 * tool that will be is an open §26 blocker, so no adapter exists yet and
 * `resolveWebResearchProvider` returns null.
 *
 * What exists is the shape of the hole, and that is the part worth having
 * first. `search` takes a `GenericQuery` and nothing else, so the adapter the
 * owner's choice eventually brings cannot be wired up in a way that sends the
 * customer's question — the redaction requirement is discharged by the type
 * system before the adapter is written, rather than being a rule its author has
 * to remember. Attaching a tool later is implementing this interface; it is not
 * a redesign, and it cannot quietly widen what leaves the building.
 */

export type WebSearchHit = {
  readonly url: string;
  readonly title: string;
  /**
   * The engine's snippet. Discovery only: §6.7 step 4 and §23.2 both say a
   * snippet cannot support a claim, so nothing downstream may cite this — the
   * exact official page has to be fetched.
   */
  readonly snippet: string;
};

export type WebResearchProvider = {
  /** The Gateway tool identifier this adapter speaks to, for the trace. */
  readonly tool: string;
  search(
    query: GenericQuery,
    options: { limit: number; signal?: AbortSignal },
  ): Promise<WebSearchHit[]>;
};

/**
 * Why live research cannot run.
 *
 * Codes rather than sentences: the admin renders these through i18n like every
 * other string (§20), and a test that matched on English prose would pass or
 * fail on the wording rather than on the state.
 */
export type ResearchBlocker =
  /** `AI_WEB_RESEARCH_ENABLED` is false. */
  | 'disabled'
  /** No search tool selected — §4.1 forbids this module choosing one. */
  | 'no_search_tool'
  /** The official-domain allowlist is empty — no host counts as official. */
  | 'empty_allowlist';

export type ResearchReadiness = {
  readonly ready: boolean;
  /** In the order an operator would resolve them. */
  readonly blockers: readonly ResearchBlocker[];
  readonly policyVersion: string;
  readonly allowlistedDomains: number;
};

/**
 * What still stands between the current configuration and a live research run.
 *
 * Surfaced in the admin so the gap is a state an operator can read rather than
 * a silence they have to infer. Every blocker here is a decision §26 reserves
 * to the owner; none of them is something this codebase may choose for itself.
 */
export function researchReadiness(): ResearchReadiness {
  const env = serverEnv();
  const blockers: ResearchBlocker[] = [];

  if (!env.AI_WEB_RESEARCH_ENABLED) blockers.push('disabled');
  if (!env.AI_WEB_SEARCH_TOOL) blockers.push('no_search_tool');
  if (OFFICIAL_DOMAINS.length === 0) blockers.push('empty_allowlist');

  return {
    ready: blockers.length === 0,
    blockers,
    policyVersion: officialDomainPolicyVersion(),
    allowlistedDomains: OFFICIAL_DOMAINS.length,
  };
}

/**
 * The configured provider, or null.
 *
 * Null whenever anything is missing, and null is the answer today. Failing
 * closed matters more here than in most gates: the fallback for "no live
 * research" is the reviewed ledger, which is the slower but safer evidence
 * path, whereas the fallback for a half-configured research run would be
 * fetching from the open web without an allowlist to say what is official.
 */
export function resolveWebResearchProvider(): WebResearchProvider | null {
  if (!researchReadiness().ready) return null;

  // Unreachable until an owner-approved adapter is registered here. It throws
  // rather than returning null so a future misconfiguration surfaces as a
  // failed request in a trace, not as an answer that silently skipped research
  // it was configured to do.
  throw new Error('web research is configured but no adapter is registered');
}
