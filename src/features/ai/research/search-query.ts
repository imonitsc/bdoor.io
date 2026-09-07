import 'server-only';

import { REGISTRY_SEED } from '../registry/registry-seed';
import { detectTopics, type Topic } from '../registry/taxonomy';
import { type TargetCountry } from '@/features/intake/questions';

/**
 * The query that may leave the building.
 *
 * CLAUDE.md §6.7 step 1: "Redact names, IDs, contact details, addresses,
 * financial values and case details from the outgoing search query. Search a
 * generic legal question, never the customer's dossier."
 *
 * `redactSensitive` does not satisfy this and was never meant to. It masks
 * identifiers in a sentence that is otherwise preserved, which is right for a
 * transcript store — the question stays readable and the identifiers do not.
 * But an outgoing search is a different threat: "can Rahman Textiles Ltd at 14
 * Gulshan Avenue reclaim VAT on the 4.2 crore machine we imported last March"
 * survives every rule in that module untouched. A person, a place, a sum and a
 * case detail, handed to a third party. Masking is a denylist, and a denylist
 * cannot enumerate the ways a customer describes their own business.
 *
 * So this builds the query instead of cleaning it. The question is read only to
 * DECIDE things — which topics it touches — and never to supply text. Every
 * word of the output comes from `TOPICS` (fixed in code and mirrored by the
 * `ai_topic` database enum) and from `REGISTRY_SEED` (the reviewed list of
 * official institutions). There is no code path from the customer's characters
 * to the outgoing string, which is a property a test can hold us to rather than
 * a promise a reviewer has to re-check on every change.
 *
 * The phrasing is deliberately mechanical — a topic's own name plus the
 * institutions that own it. It is not tuned for any particular search engine
 * because no search tool has been selected yet (§26 owner blocker), and tuning
 * it against an imagined one would be fitting to a guess. A knowledge reviewer
 * should revisit the wording once the tool is chosen; the safety property above
 * must survive that revision.
 */

/**
 * A real symbol, not a phantom type: the object carries it, so building a
 * `GenericQuery` needs no cast, and it is not exported, so nothing outside this
 * module can build one.
 */
const GENERIC_QUERY: unique symbol = Symbol('bdoor.generic-query');

/**
 * A search string cleared for transmission to an external tool.
 *
 * The brand is unforgeable outside this module: `WebResearchProvider.search`
 * accepts nothing else, so "just pass the question through" is a type error
 * rather than a code review someone has to catch.
 */
export type GenericQuery = {
  readonly [GENERIC_QUERY]: true;
  /**
   * The text to send. Every character originates in `TOPICS`, `REGISTRY_SEED`
   * or `TARGET_COUNTRIES` — none of it in the question or in any other
   * caller-supplied string.
   */
  readonly text: string;
  readonly topics: readonly Topic[];
  readonly jurisdiction: TargetCountry;
  /** Institutions the query names, most authoritative first. */
  readonly authorities: readonly string[];
};

/** More than this and the query stops being a query and becomes a list. */
const MAX_AUTHORITIES = 3;

/**
 * Tier 6 is secondary material. §6.7 searches official domains first, and §6.2
 * forbids a secondary source establishing a duty, rate, fee or deadline, so
 * naming one in the query would be steering the search toward evidence that
 * cannot support an answer.
 */
const LOWEST_OFFICIAL_TIER = 5;

/** An enum member's own name in plain words. Claims nothing and invents nothing. */
function words(member: string): string {
  return member.replace(/_/g, ' ');
}

/**
 * Institution names for a topic, most authoritative first.
 *
 * Ties break on `code` so the same question always produces the same query —
 * an unstable query would make research traces impossible to compare and
 * caching impossible to reason about.
 */
export function authoritiesFor(topics: readonly Topic[]): string[] {
  const wanted = new Set(topics);

  return (
    REGISTRY_SEED.filter(
      (entry) =>
        entry.authorityTier <= LOWEST_OFFICIAL_TIER &&
        entry.topics.some((topic) => wanted.has(topic)),
    )
      .sort((a, b) => a.authorityTier - b.authorityTier || a.code.localeCompare(b.code))
      .slice(0, MAX_AUTHORITIES)
      // The reviewed name, verbatim. An earlier draft stripped the parenthetical
      // as a gloss for human readers; it is usually the part a search would
      // match on — "Bangladesh Government Press (Bangladesh Gazette)" loses the
      // word Gazette — and rewriting reviewed text to suit a search engine is
      // the wrong direction of travel regardless.
      .map((entry) => entry.institution)
  );
}

/**
 * A generic query for a customer question, or null when there is none to build.
 *
 * Null when no topic was recognised. That is the safe direction: with no topic
 * there is nothing generic to search for, and the only remaining way to search
 * would be to send the customer's own words — exactly what §6.7 forbids. The
 * caller answers from the ledger or declines; it does not get to fall back.
 */
export function genericQuery(
  question: string,
  jurisdiction: TargetCountry = 'bangladesh',
): GenericQuery | null {
  const topics = detectTopics(question);
  if (topics.length === 0) return null;

  const authorities = authoritiesFor(topics);
  const text = [...topics.map(words), ...authorities, words(jurisdiction)].join(' ');

  return { [GENERIC_QUERY]: true, text, topics, jurisdiction, authorities };
}
