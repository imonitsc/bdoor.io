import 'server-only';

import { createHash } from 'node:crypto';

import { serverEnv } from '@/lib/env';

/**
 * Text extraction for ingested official documents.
 *
 * Page boundaries are preserved as form-feed characters (`\f`) between pages,
 * which is what lets a chunk cite "page 4" instead of "somewhere in the PDF".
 * Extraction never invents text: a scanned PDF with no text layer is reported
 * as needing OCR, and OCR itself is an adapter that is disabled by default —
 * the pipeline records the gap rather than guessing at Bangla glyphs.
 */

export const PAGE_BREAK = '\f';

export type Extraction = {
  text: string;
  method: 'html' | 'pdf_text' | 'ocr';
  pageCount: number | null;
  language: 'en' | 'bn' | 'mixed';
  /** True when the byte stream decoded badly — mojibake ratio above threshold. */
  encodingSuspect: boolean;
  ocrApplied: boolean;
};

export type ExtractionFailure = {
  ok: false;
  reason: 'needs_ocr' | 'unsupported' | 'empty' | 'failed';
  detail?: string;
};

export type ExtractionResult = ({ ok: true } & Extraction) | ExtractionFailure;

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Language detection by script, which is what actually matters for retrieval:
 * Bangla text lives in U+0980–U+09FF. Thresholds are generous because
 * official documents mix scripts (English act names inside Bangla prose).
 */
export function detectLanguage(text: string): 'en' | 'bn' | 'mixed' {
  let bangla = 0;
  let latin = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0x0980 && code <= 0x09ff) bangla += 1;
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) latin += 1;
  }
  const letters = bangla + latin;
  if (letters === 0) return 'en';
  const ratio = bangla / letters;
  if (ratio > 0.6) return 'bn';
  if (ratio > 0.08) return 'mixed';
  return 'en';
}

/** Mojibake detector: replacement characters mean the decode lost content. */
export function encodingLooksBroken(text: string): boolean {
  if (text.length === 0) return false;
  let bad = 0;
  for (const char of text) if (char === '�') bad += 1;
  return bad / text.length > 0.005;
}

/**
 * HTML → text, preserving the structure the chunker needs: headings become
 * markdown-style `#` lines, list items keep their bullets, tables keep row
 * boundaries. Scripts, styles, navigation and hidden metadata are dropped —
 * and with them most of the places a hostile page would hide instructions,
 * though the real injection defence is that everything extracted is data
 * behind review, never instructions to a model.
 */
export function htmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ');

  // Headings first, so the block-level strip below cannot eat them.
  text = text.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_, level: string, inner: string) =>
      `\n\n${'#'.repeat(Number(level))} ${inner.replace(/<[^>]+>/g, ' ').trim()}\n\n`,
  );

  text = text
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|li|tr|table|ul|ol|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ');

  // Entities that matter for legal text; anything exotic is left visible.
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));

  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * PDF text layer via unpdf (serverless build of pdf.js). Imported lazily so
 * the library is only loaded inside ingestion jobs, never in a page bundle.
 */
async function pdfToText(bytes: Uint8Array): Promise<{ text: string; pageCount: number }> {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const document = await getDocumentProxy(new Uint8Array(bytes));
  const { totalPages, text } = await extractText(document, { mergePages: false });
  return {
    // Form feeds separate pages, so downstream chunking can carry page numbers.
    text: (text as string[]).map((page) => page.trim()).join(`\n${PAGE_BREAK}\n`),
    pageCount: totalPages,
  };
}

/**
 * OCR adapter boundary. Disabled by default (`AI_OCR_PROVIDER=disabled`):
 * there is no bundled OCR engine, and inventing one silently would put
 * unreviewable text into a legal corpus. When a real provider is configured
 * this is where it plugs in; until then a scanned document is honestly
 * reported as `needs_ocr` and waits for a human or a configured provider.
 */
async function ocrDocument(): Promise<ExtractionResult> {
  return {
    ok: false,
    reason: 'needs_ocr',
    detail:
      'Document has no extractable text layer and AI_OCR_PROVIDER is disabled. ' +
      'Configure an OCR provider or attach text manually in review.',
  };
}

export async function extractDocument(
  bytes: Uint8Array,
  contentType: string,
): Promise<ExtractionResult> {
  try {
    if (contentType === 'text/html' || contentType === 'application/xhtml+xml') {
      const text = htmlToText(new TextDecoder('utf-8').decode(bytes));
      if (!text) return { ok: false, reason: 'empty' };
      return {
        ok: true,
        text,
        method: 'html',
        pageCount: null,
        language: detectLanguage(text),
        encodingSuspect: encodingLooksBroken(text),
        ocrApplied: false,
      };
    }

    if (contentType === 'text/plain') {
      const text = new TextDecoder('utf-8').decode(bytes).trim();
      if (!text) return { ok: false, reason: 'empty' };
      return {
        ok: true,
        text,
        method: 'html',
        pageCount: null,
        language: detectLanguage(text),
        encodingSuspect: encodingLooksBroken(text),
        ocrApplied: false,
      };
    }

    if (contentType === 'application/pdf') {
      const { text, pageCount } = await pdfToText(bytes);
      const meaningful = text.replace(/[\s\f]/g, '');
      if (meaningful.length < 40) {
        // A scanned PDF: pages exist but carry no text layer. OCR territory.
        if (serverEnv().AI_OCR_PROVIDER === 'disabled') return ocrDocument();
        return ocrDocument(); // 'external' has no implementation yet — same honest answer.
      }
      return {
        ok: true,
        text,
        method: 'pdf_text',
        pageCount,
        language: detectLanguage(text),
        encodingSuspect: encodingLooksBroken(text),
        ocrApplied: false,
      };
    }

    // DOC/DOCX/XLS/XLSX are stored for the reviewer but not machine-extracted
    // yet; the review screen serves the original from the private bucket.
    return {
      ok: false,
      reason: 'unsupported',
      detail: `No extractor for ${contentType}; original stored for manual review.`,
    };
  } catch (error) {
    return { ok: false, reason: 'failed', detail: (error as Error).message };
  }
}
