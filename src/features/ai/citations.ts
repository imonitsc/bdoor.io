/**
 * The claim/citation audit (CLAUDE.md §7.1 step 12, §7.2, §23.2).
 *
 * The prompt already tells the model to cite every factual regulatory claim,
 * and retrieval already numbers the sources it may cite. Nothing checked that
 * the finished answer obeyed. §7.1 puts a "citation-support audit before
 * marking the answer complete" between generation and completion, and §23.2
 * requires that "each material claim is mapped to a supporting section/page";
 * this is that check.
 *
 * Two things it deliberately is not:
 *
 * It is NOT a model call. A second model asked "is this cited?" costs money on
 * every answer, adds latency to the completion budget in §7.3, and can be
 * wrong in the same direction as the first. This is deterministic string work:
 * cheap enough to run always, and its verdict is reproducible in a test.
 *
 * It is NOT an entailment check. Whether the cited passage actually *supports*
 * the sentence is a semantic question this cannot answer — §6.7 step 9 assigns
 * that to the verifier model on high-risk questions. What this establishes is
 * the necessary condition underneath it: a claim that carries no marker at all
 * cannot be supported by anything, and a marker pointing at a source that was
 * never retrieved is fabricated. Both are detectable without reading a word
 * for meaning.
 *
 * Under-reporting is the safe direction and the chosen one. A false accusation
 * against a good answer would train everyone to ignore the signal.
 */

/** `[1]`, `[2][5]`, `[3, 4]` — the citation form the prompt specifies. */
const MARKER = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

/**
 * Signals that a sentence asserts something a customer could act on and be
 * wrong about: money, a proportion, a period, a date, or a duty.
 *
 * Numerals cover Bengali digits as well as ASCII, because a Bangla answer
 * states the same fee in the same place. Obligation *words*, though, are
 * matched in English only — and that is a stated limit rather than an
 * oversight. Writing a Bangla modal list from memory would produce a detector
 * whose errors nobody here can audit, so a Bangla sentence whose only claim
 * signal is a verb of obligation is not flagged. It under-reports; it does not
 * mis-report.
 */
const DIGIT = '[0-9\\u09E6-\\u09EF]';
const CLAIM_SIGNALS: readonly RegExp[] = [
  // A currency amount: BDT 5,000 / Tk 5000 / ৳5,000 / USD 100 / $100
  new RegExp(`(?:BDT|Tk\\.?|৳|USD|\\$|SAR|QAR|AED|SGD|£)\\s*${DIGIT}`, 'i'),
  // A bare amount followed by a money word, the other order round.
  new RegExp(`${DIGIT}[\\d,.\\u09E6-\\u09EF]*\\s*(?:taka|BDT|USD|lakh|crore)`, 'i'),
  // A proportion.
  new RegExp(`${DIGIT}\\s*(?:%|percent|per cent|শতাংশ)`, 'i'),
  // A period or a deadline.
  new RegExp(
    `${DIGIT}+\\s*(?:days?|weeks?|months?|years?|working days?|business days?|দিন|মাস|বছর)`,
    'i',
  ),
  /\b(?:deadline|due date|last date|expires?|expiry|renewal date)\b/i,
  // A named date: 30 November / November 30 / 30-11-2026 / 2026-11-30
  new RegExp(
    `(?:${DIGIT}{1,2}\\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)|(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+${DIGIT}{1,2})`,
    'i',
  ),
  new RegExp(`${DIGIT}{4}-${DIGIT}{2}-${DIGIT}{2}|${DIGIT}{1,2}[/-]${DIGIT}{1,2}[/-]${DIGIT}{4}`),
  // A duty. English only, by design — see the block comment above.
  /\b(?:must|shall|is required to|are required to|you need to|mandatory|obliged to|liable for|penalt(?:y|ies)|fine of)\b/i,
  // A named rate or threshold, which is a number even when the number is absent.
  /\b(?:tax rate|vat rate|minimum tax|turnover tax|threshold|slab|surcharge)\b/i,
];

export type ClaimVerdict = {
  /** The sentence, for tests and the admin trace. Never for a log line. */
  sentence: string;
  /** Citation numbers it carries. */
  markers: number[];
  /** Whether it asserts something actionable. */
  material: boolean;
  /** A material claim carrying at least one valid marker. */
  supported: boolean;
};

export type CitationAudit = {
  claims: ClaimVerdict[];
  materialClaims: number;
  supportedClaims: number;
  /** Material claims with no marker at all. */
  uncitedClaims: number;
  /**
   * Markers naming a source that was never retrieved — a fabricated citation.
   * §7.4 makes this release-blocking, and it is the one finding here that is
   * certainly a defect rather than a heuristic's opinion.
   */
  fabricatedMarkers: number[];
  /** No fabricated markers and every material claim carries one. */
  ok: boolean;
};

/**
 * Split into sentences without breaking on the abbreviations and numbers that
 * fill regulatory prose — "Tk 5,000." and "s. 184" must not each become a
 * sentence, or every claim would arrive pre-shredded and uncited.
 */
export function splitSentences(text: string): string[] {
  const withoutMarkdown = text
    .replace(/```[\s\S]*?```/g, ' ') // fenced code is not prose
    .replace(/^\s*[#>|-]+\s*/gm, ''); // headings, quotes, table rules, bullets

  const out: string[] = [];
  let current = '';
  const chars = [...withoutMarkdown];

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i] ?? '';
    current += char;
    if (char !== '.' && char !== '?' && char !== '!' && char !== '।' && char !== '\n') {
      continue;
    }
    const next = chars[i + 1] ?? '';
    // A digit either side of a full stop is a decimal or a numbered reference.
    const previous = chars[i - 1] ?? '';
    if (char === '.' && /\d/.test(previous) && /\d/.test(next)) continue;
    // An abbreviation is not the end of a sentence. Regulatory prose is full
    // of them — "s. 184", "r. 12", "No. 7", "Pvt. Ltd." — and splitting there
    // detaches the section reference from the claim it supports.
    if (char === '.' && endsWithAbbreviation(current)) continue;
    // A closing bracket after the stop belongs to the sentence: "… fee.[2]"
    if (next === '[') continue;
    if (next && !/\s/.test(next) && char !== '\n') continue;
    if (current.trim()) out.push(current.trim());
    current = '';
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/**
 * Abbreviations that take a full stop mid-sentence. A single letter is always
 * treated as one: in this corpus "s." and "r." are section and rule
 * references, never the end of anything.
 */
const ABBREVIATIONS: ReadonlySet<string> = new Set([
  's',
  'ss',
  'r',
  'no',
  'nos',
  'art',
  'arts',
  'cl',
  'sec',
  'secs',
  'para',
  'paras',
  'sch',
  'vs',
  'ltd',
  'pvt',
  'co',
  'inc',
  'etc',
  'eg',
  'ie',
  'mr',
  'mrs',
  'ms',
  'dr',
]);

function endsWithAbbreviation(current: string): boolean {
  const match = /(?:^|[\s("'])([A-Za-z]{1,5})\.$/.exec(current);
  const word = match?.[1];
  if (!word) return false;
  return word.length === 1 || ABBREVIATIONS.has(word.toLowerCase());
}

export function markersIn(sentence: string): number[] {
  const found: number[] = [];
  for (const match of sentence.matchAll(MARKER)) {
    for (const part of (match[1] ?? '').split(',')) {
      const value = Number(part.trim());
      if (Number.isInteger(value) && value > 0) found.push(value);
    }
  }
  return [...new Set(found)];
}

export function isMaterialClaim(sentence: string): boolean {
  // A question is the model asking, not asserting.
  if (/\?\s*$/.test(sentence.trim())) return false;
  return CLAIM_SIGNALS.some((signal) => signal.test(sentence));
}

/**
 * Audit one finished answer against the sources it was given.
 *
 * `citationCount` is how many numbered sources retrieval put in the prompt;
 * markers above it name a source that does not exist.
 */
export function auditCitations(answer: string, citationCount: number): CitationAudit {
  const claims: ClaimVerdict[] = [];
  const fabricated = new Set<number>();

  for (const sentence of splitSentences(answer)) {
    const markers = markersIn(sentence);
    for (const marker of markers) {
      if (marker > citationCount) fabricated.add(marker);
    }
    const valid = markers.filter((marker) => marker <= citationCount);
    const material = isMaterialClaim(sentence);
    claims.push({ sentence, markers, material, supported: material && valid.length > 0 });
  }

  const materialClaims = claims.filter((claim) => claim.material).length;
  const supportedClaims = claims.filter((claim) => claim.supported).length;
  const fabricatedMarkers = [...fabricated].sort((a, b) => a - b);

  return {
    claims,
    materialClaims,
    supportedClaims,
    uncitedClaims: materialClaims - supportedClaims,
    fabricatedMarkers,
    ok: fabricatedMarkers.length === 0 && materialClaims === supportedClaims,
  };
}

/**
 * The audit as a log payload: counts only.
 *
 * §17 forbids logging question text or answer content, and a sentence pulled
 * out of an answer is answer content. The counts say whether to go and look;
 * the admin answer trace, which is access-controlled, is where the sentences
 * belong.
 */
export function auditTelemetry(audit: CitationAudit): Record<string, number | boolean> {
  return {
    materialClaims: audit.materialClaims,
    supportedClaims: audit.supportedClaims,
    uncitedClaims: audit.uncitedClaims,
    fabricatedMarkers: audit.fabricatedMarkers.length,
    ok: audit.ok,
  };
}
