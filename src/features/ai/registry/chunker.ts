/**
 * Structure-aware chunking for official documents.
 *
 * Legal text is chunked by its own structure — headings, sections, clauses,
 * schedules, form fields — never by a character count alone. Three rules the
 * tests pin:
 *
 *   1. a provision never loses its heading: every chunk opens with the
 *      heading of the section it came from;
 *   2. a proviso, exception or explanation ("Provided that…", "ব্যাখ্যা…")
 *      never starts a new chunk — it stays with the text it qualifies;
 *   3. page boundaries survive: each chunk carries the page range it covers,
 *      so a citation can say "page 4", not "somewhere in the PDF".
 *
 * Plain prose without recognisable structure degrades gracefully to
 * paragraph-aligned chunks, which is what the previous chunker did.
 *
 * No 'server-only': pure text logic, unit-tested directly.
 */

import { PAGE_BREAK } from './extract';

export type StructuredChunk = {
  content: string;
  heading: string | null;
  sectionRef: string | null;
  pageStart: number | null;
  pageEnd: number | null;
};

/** Target size. Sections up to twice this stay whole: splitting a mid-sized
 * provision loses more than an oversized chunk costs. */
const TARGET_CHARS = 1_400;

const HEADING_PATTERNS = [
  /^#{1,6}\s+\S/, // markdown headings produced by the HTML extractor
  /^(section|ধারা|rule|বিধি|regulation|article|অনুচ্ছেদ|clause|chapter|অধ্যায়|part|schedule|তফসিল|form|ফরম)\s+[0-9০-৯IVXLC]+/i,
  /^[0-9০-৯]{1,3}[.)]\s+\S/, // numbered provision heads: "25. Registration of…"
  /^[A-Z][A-Z0-9 ,&()'-]{5,79}$/, // ALL-CAPS titles
];

/** Text that must never be orphaned from the provision above it. */
const CONTINUATION_PATTERNS = [
  /^provided (that|further|also)/i,
  /^(exception|explanation|proviso|illustration)s?\b[:.]?/i,
  /^শর্ত থাকে যে/, // "provided that"
  /^ব্যাখ্যা/, // "explanation"
  /^(effective|কার্যকর)/i,
  /\b(comes? into force|shall come into (force|effect)|comes? into effect)\b/i,
];

const SECTION_REF_PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/\bS\.?\s?R\.?\s?O\.?\s*(No\.?\s*)?([0-9০-৯][0-9০-৯A-Za-z/-]*)/i, (m) => `SRO ${m[2]}`],
  [/\b(section|ধারা)\s+([0-9০-৯]+[A-Za-z]?)/i, (m) => `Section ${m[2]}`],
  [/\b(rule|বিধি)\s+([0-9০-৯]+[A-Za-z]?)/i, (m) => `Rule ${m[2]}`],
  [/\b(article|অনুচ্ছেদ)\s+([0-9০-৯]+)/i, (m) => `Article ${m[2]}`],
  [/\b(schedule|তফসিল)\s+([0-9০-৯IVXLC]+)/i, (m) => `Schedule ${m[2]}`],
  [/\b(form|ফরম)\s+([A-Za-z0-9০-৯-]+)/i, (m) => `Form ${m[2]}`],
  [/\b(chapter|অধ্যায়)\s+([0-9০-৯IVXLC]+)/i, (m) => `Chapter ${m[2]}`],
  [/^([0-9০-৯]{1,3})[.)]\s+/, (m) => `Clause ${m[1]}`],
];

export function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 120) return false;
  return HEADING_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isContinuationLine(line: string): boolean {
  return CONTINUATION_PATTERNS.some((pattern) => pattern.test(line.trim()));
}

export function sectionRefFrom(heading: string): string | null {
  for (const [pattern, render] of SECTION_REF_PATTERNS) {
    const match = heading.match(pattern);
    if (match) return render(match);
  }
  return null;
}

type Block = { text: string; page: number; heading: boolean; continuation: boolean };

/** Split into paragraph blocks, tracking the page each block starts on. */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let page = 1;
  for (const segment of text.split(PAGE_BREAK)) {
    for (const paragraph of segment.split(/\n\s*\n/)) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;
      // A paragraph can open with a heading line and continue with body text.
      const lines = trimmed.split('\n');
      const first = lines[0] ?? '';
      if (isHeadingLine(first) && lines.length > 1) {
        blocks.push({ text: first.trim(), page, heading: true, continuation: false });
        const rest = lines.slice(1).join('\n').trim();
        if (rest)
          blocks.push({ text: rest, page, heading: false, continuation: isContinuationLine(rest) });
      } else {
        blocks.push({
          text: trimmed,
          page,
          heading: isHeadingLine(trimmed) && lines.length === 1,
          continuation: isContinuationLine(trimmed),
        });
      }
    }
    page += 1;
  }
  return blocks;
}

type Section = { heading: string | null; sectionRef: string | null; blocks: Block[] };

function toSections(blocks: Block[]): Section[] {
  const sections: Section[] = [];
  let current: Section = { heading: null, sectionRef: null, blocks: [] };

  for (const block of blocks) {
    if (block.heading) {
      if (current.blocks.length || current.heading) sections.push(current);
      const heading = block.text.replace(/^#{1,6}\s+/, '').trim();
      current = { heading, sectionRef: sectionRefFrom(heading), blocks: [] };
    } else {
      current.blocks.push(block);
    }
  }
  if (current.blocks.length || current.heading) sections.push(current);
  return sections;
}

function emit(
  chunks: StructuredChunk[],
  section: Section,
  blocks: Block[],
  hadPages: boolean,
): void {
  if (blocks.length === 0 && !section.heading) return;
  const body = blocks.map((block) => block.text).join('\n\n');
  const content = section.heading ? `${section.heading}\n\n${body}`.trim() : body;
  if (!content) return;
  const pages = blocks.map((block) => block.page);
  chunks.push({
    content,
    heading: section.heading,
    sectionRef: section.sectionRef,
    pageStart: hadPages && pages.length ? Math.min(...pages) : null,
    pageEnd: hadPages && pages.length ? Math.max(...pages) : null,
  });
}

export function chunkStructured(text: string, targetChars = TARGET_CHARS): StructuredChunk[] {
  const hadPages = text.includes(PAGE_BREAK);
  const sections = toSections(toBlocks(text));
  const chunks: StructuredChunk[] = [];

  for (const section of sections) {
    const total = section.blocks.reduce((sum, block) => sum + block.text.length, 0);

    // Whole sections stay whole while reasonably sized: a split provision is
    // a misquoted provision.
    if (total <= targetChars * 2) {
      emit(chunks, section, section.blocks, hadPages);
      continue;
    }

    let bucket: Block[] = [];
    let size = 0;
    for (let i = 0; i < section.blocks.length; i += 1) {
      const block = section.blocks[i];
      if (!block) continue;
      const next = section.blocks[i + 1];
      bucket.push(block);
      size += block.text.length;
      // Flush when full — but never right before a proviso/exception, which
      // must stay attached to the text it qualifies.
      if (size >= targetChars && next && !next.continuation) {
        emit(chunks, section, bucket, hadPages);
        bucket = [];
        size = 0;
      }
    }
    emit(chunks, section, bucket, hadPages);
  }

  return chunks;
}
