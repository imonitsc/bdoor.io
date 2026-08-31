import { describe, expect, it } from 'vitest';

import {
  chunkStructured,
  isContinuationLine,
  isHeadingLine,
  sectionRefFrom,
} from '@/features/ai/registry/chunker';
import { PAGE_BREAK } from '@/features/ai/registry/extract';

/**
 * Structure-aware chunking. The three promises the indexer makes to the
 * citation system: a provision keeps its heading, a proviso stays with the
 * text it qualifies, and page boundaries survive into the chunk rows.
 */

const ACT = [
  '## Section 25. Registration of companies',
  'Every company shall be registered with the Registrar within the prescribed period.',
  'The application shall be accompanied by the memorandum and articles.',
  'Provided that a company formed before the commencement of this Act shall be treated as registered.',
  '',
  '## Section 26. Fees',
  'The registration fee shall be as set out in Schedule II.',
].join('\n\n');

describe('heading and reference detection', () => {
  it('recognises legal structure in English and Bangla', () => {
    expect(isHeadingLine('## Section 25. Registration')).toBe(true);
    expect(isHeadingLine('Section 25')).toBe(true);
    expect(isHeadingLine('ধারা ২৫')).toBe(true);
    expect(isHeadingLine('SCHEDULE II — FEES')).toBe(true);
    expect(isHeadingLine('25. Renewal of trade licence')).toBe(true);
    expect(isHeadingLine('The fee shall be paid to the city corporation.')).toBe(false);
  });

  it('extracts section references, SRO numbers and forms', () => {
    expect(sectionRefFrom('Section 25. Registration of companies')).toBe('Section 25');
    expect(sectionRefFrom('S.R.O. No. 255-Law/2024')).toBe('SRO 255-Law/2024');
    expect(sectionRefFrom('Schedule II — Fees')).toBe('Schedule II');
    expect(sectionRefFrom('Form IX: Consent of director')).toBe('Form IX');
    expect(sectionRefFrom('General information page')).toBeNull();
  });

  it('treats provisos, exceptions and effective-date lines as continuations', () => {
    expect(isContinuationLine('Provided that no fee shall apply to a re-submission.')).toBe(true);
    expect(isContinuationLine('Explanation: for the purposes of this section…')).toBe(true);
    expect(isContinuationLine('শর্ত থাকে যে, পুনরায় দাখিলের ক্ষেত্রে ফি লাগবে না।')).toBe(true);
    expect(isContinuationLine('This section shall come into force on 1 July 2026.')).toBe(true);
    expect(isContinuationLine('The Registrar shall issue a certificate.')).toBe(false);
  });
});

describe('chunkStructured', () => {
  it('keeps every chunk attached to its section heading', () => {
    const chunks = chunkStructured(ACT);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const chunk of chunks) {
      expect(chunk.heading).toMatch(/^Section \d+/);
      expect(chunk.content.startsWith(chunk.heading ?? '')).toBe(true);
    }
    expect(chunks[0]?.sectionRef).toBe('Section 25');
  });

  it('never separates a provision from its proviso', () => {
    // Force tiny chunks so the splitter is tempted to break before the proviso.
    const long = [
      '## Section 108. Withholding at source',
      'a'.repeat(300),
      'b'.repeat(300),
      'Provided that no deduction shall be made where the payment does not exceed the threshold.',
      'c'.repeat(300),
    ].join('\n\n');
    const chunks = chunkStructured(long, 250);
    const withProviso = chunks.find((chunk) => chunk.content.includes('Provided that'));
    expect(withProviso).toBeDefined();
    // The proviso must share its chunk with the paragraph it qualifies.
    expect(withProviso?.content).toContain('b'.repeat(300));
  });

  it('carries page ranges from form-feed boundaries', () => {
    const paged = [
      '## Section 1. Short title',
      'This Act may be cited as the Sample Act.',
      PAGE_BREAK,
      '## Section 2. Fees',
      'The fee is set out in the Schedule.',
    ].join('\n\n');
    const chunks = chunkStructured(paged);
    expect(chunks[0]?.pageStart).toBe(1);
    const second = chunks.find((chunk) => chunk.sectionRef === 'Section 2');
    expect(second?.pageStart).toBe(2);
  });

  it('degrades to paragraph chunks for unstructured prose', () => {
    const prose = Array.from({ length: 6 }, (_, i) =>
      `Paragraph ${i} about running a business. `.repeat(8),
    ).join('\n\n');
    const chunks = chunkStructured(prose, 600);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.heading).toBeNull();
      expect(chunk.pageStart).toBeNull();
    }
  });

  it('keeps a mid-sized section whole rather than splitting a provision', () => {
    const section = ['## Rule 4. Renewal', 'x'.repeat(900), 'y'.repeat(900)].join('\n\n');
    const chunks = chunkStructured(section, 1_400);
    expect(chunks).toHaveLength(1);
  });
});
