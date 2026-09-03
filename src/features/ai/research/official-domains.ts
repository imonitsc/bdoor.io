import 'server-only';

import { normaliseHost } from './url-safety';
import { serverEnv } from '@/lib/env';

/**
 * The official-domain allowlist (CLAUDE.md §6.7, §16.4).
 *
 * Live research searches and opens official sources; this names which hosts
 * count as official. It is versioned because §6.7 requires every fetch to
 * record the policy it was made under, so an answer can be re-judged later
 * against the rules that were in force when it was given rather than the rules
 * in force when someone asks.
 *
 * IT SHIPS EMPTY, AND THAT IS THE POINT.
 *
 * Which domains carry the authority of Bangladeshi law is a regulatory fact,
 * and §3.3 forbids creating one from model memory: "No legal, tax, VAT,
 * licensing, filing, investment, import/export, port, tourism, company,
 * individual-tax or government-process fact may be created from model memory."
 * A host that looks plausible is not evidence that it is the authority's, and
 * an allowlist assembled from recollection would launder a guess into the one
 * place the pipeline trusts absolutely. So the list is a data decision for the
 * owner and a knowledge reviewer, and until they make it `allowlisted()`
 * refuses every host — the safe direction for a gate to fail.
 *
 * This is NOT the registry of sources already being ingested. Those live in
 * `ai_source_registry`, are created by an authorised admin, and every document
 * they produce stops at `review_required` before a human publishes it. This
 * allowlist governs the other path: pages opened during a live research run,
 * whose evidence state is `official_live` and which reach a customer without
 * that human step. The weaker the review, the stricter the gate.
 */

export type OfficialDomain = {
  /** The registrable host, lower-case and without a trailing dot. */
  readonly host: string;
  /** Whether `*.host` is covered, or only the host itself. */
  readonly includeSubdomains: boolean;
  /** The authority this host belongs to, as named in the source ledger. */
  readonly authority: string;
};

export const OFFICIAL_DOMAINS: readonly OfficialDomain[] = [];

export function officialDomainPolicyVersion(): string {
  return serverEnv().AI_OFFICIAL_DOMAIN_POLICY_VERSION;
}

/**
 * The entry covering a host, or undefined.
 *
 * Matching is on a label boundary, never a bare suffix: `nbr.gov.bd` must not
 * admit `evil-nbr.gov.bd`, and a subdomain entry admits `www.nbr.gov.bd` only
 * through the leading dot. An IP literal never matches — an authority is a
 * name, and a literal is how a name check gets skipped.
 */
export function allowlistEntry(
  hostname: string,
  allowlist: readonly OfficialDomain[] = OFFICIAL_DOMAINS,
): OfficialDomain | undefined {
  const host = normaliseHost(hostname);
  if (host.length === 0) return undefined;
  return allowlist.find((entry) => {
    const candidate = normaliseHost(entry.host);
    if (host === candidate) return true;
    return entry.includeSubdomains && host.endsWith(`.${candidate}`);
  });
}

export function allowlisted(
  hostname: string,
  allowlist: readonly OfficialDomain[] = OFFICIAL_DOMAINS,
): boolean {
  return allowlistEntry(hostname, allowlist) !== undefined;
}
