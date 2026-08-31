/**
 * Reciprocal-rank fusion, in TypeScript.
 *
 * The SQL hybrid function fused keyword and semantic ranks in one statement,
 * which forced keyword search to wait for the embedding it does not use.
 * The two searches now run as separate functions (keyword starts immediately,
 * semantic as soon as the embedding lands) and this module fuses their ranked
 * candidate lists with the SAME arithmetic the SQL used: 1/(60+rank) per
 * list, plus the additive authority bonus (7 - tier) * 0.002, ordered
 * same-locale-first. The integration parity test holds the two paths equal.
 *
 * Pure and side-effect free so the unit suite can pin the arithmetic.
 */

export type RankedChunk = {
  chunk_id: string;
  source_id: string;
  content: string;
  title: string;
  source_url: string | null;
  country: string;
  locale: 'en' | 'bn';
  source_type: string;
  last_reviewed_at: string | null;
  effective_from: string;
  authority_tier: number | null;
  issuing_institution: string | null;
  reference_number: string | null;
  section_ref: string | null;
  page_start: number | null;
  /** 1-based rank within its own list. */
  rank: number;
};

export type FusedChunk = Omit<RankedChunk, 'rank'> & { score: number };

/** The conventional RRF damping constant, identical to the SQL function. */
const RRF_K = 60;

function authorityBonus(tier: number | null): number {
  return tier === null ? 0 : (7 - tier) * 0.002;
}

export function fuseRankedLists(
  semantic: RankedChunk[],
  keyword: RankedChunk[],
  options: { count: number; locale: 'en' | 'bn' },
): FusedChunk[] {
  const byId = new Map<string, { chunk: RankedChunk; rrf: number }>();

  for (const list of [semantic, keyword]) {
    for (const chunk of list) {
      const contribution = 1 / (RRF_K + chunk.rank);
      const existing = byId.get(chunk.chunk_id);
      if (existing) existing.rrf += contribution;
      else byId.set(chunk.chunk_id, { chunk, rrf: contribution });
    }
  }

  return [...byId.values()]
    .map(({ chunk, rrf }) => ({
      ...chunk,
      score: rrf + authorityBonus(chunk.authority_tier),
    }))
    .sort((a, b) => {
      // Same-language chunks first, never excluding the other language —
      // identical to the SQL ordering.
      const aLocale = a.locale === options.locale ? 1 : 0;
      const bLocale = b.locale === options.locale ? 1 : 0;
      if (aLocale !== bLocale) return bLocale - aLocale;
      return b.score - a.score;
    })
    .slice(0, options.count);
}
