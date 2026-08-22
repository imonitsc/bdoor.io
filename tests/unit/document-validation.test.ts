import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_BYTES,
  sanitizeFileName,
  sniffMimeType,
  validateUpload,
} from '@/features/documents/validation';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
// A shell script that has been renamed to look like a PDF.
const SCRIPT = new TextEncoder().encode('#!/bin/sh\necho pwned\n');

describe('sniffMimeType', () => {
  it('recognises the formats we accept', () => {
    expect(sniffMimeType(PDF)).toBe('application/pdf');
    expect(sniffMimeType(PNG)).toBe('image/png');
    expect(sniffMimeType(JPEG)).toBe('image/jpeg');
    expect(sniffMimeType(WEBP)).toBe('image/webp');
  });

  it('returns null for anything else', () => {
    expect(sniffMimeType(SCRIPT)).toBeNull();
    expect(sniffMimeType(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe('sanitizeFileName', () => {
  it('strips directory traversal', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('C:\\Users\\me\\nid.pdf')).toBe('nid.pdf');
  });

  it('removes control characters and quoting that could break a header', () => {
    expect(sanitizeFileName('inv\u0000oice"<>.pdf')).toBe('invoice.pdf');
  });

  it('always returns something usable', () => {
    expect(sanitizeFileName('')).toBe('file');
    expect(sanitizeFileName('///')).toBe('file');
  });
});

describe('validateUpload', () => {
  const ok = { bytes: PDF, declaredMimeType: 'application/pdf', fileName: 'a.pdf', byteSize: 1024 };

  it('accepts a genuine PDF', () => {
    const result = validateUpload(ok);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mimeType).toBe('application/pdf');
    expect(result.extension).toBe('pdf');
  });

  it('rejects an empty file', () => {
    expect(validateUpload({ ...ok, byteSize: 0 })).toMatchObject({
      ok: false,
      failure: { code: 'empty' },
    });
  });

  it('rejects a file over the limit', () => {
    expect(validateUpload({ ...ok, byteSize: DEFAULT_MAX_BYTES + 1 })).toMatchObject({
      ok: false,
      failure: { code: 'too_large' },
    });
  });

  it('rejects a script renamed to .pdf, whatever the browser claims', () => {
    const result = validateUpload({
      bytes: SCRIPT,
      declaredMimeType: 'application/pdf',
      fileName: 'invoice.pdf',
      byteSize: SCRIPT.byteLength,
    });
    expect(result).toMatchObject({ ok: false, failure: { code: 'unsupported_type' } });
  });

  it('rejects a real image whose declared type disagrees with its bytes', () => {
    expect(
      validateUpload({ ...ok, bytes: PNG, declaredMimeType: 'application/pdf' }),
    ).toMatchObject({ ok: false, failure: { code: 'type_mismatch' } });
  });

  it('accepts image/jpg as a synonym for image/jpeg', () => {
    expect(
      validateUpload({
        bytes: JPEG,
        declaredMimeType: 'image/jpg',
        fileName: 'p.jpg',
        byteSize: 99,
      }).ok,
    ).toBe(true);
  });

  it('ignores a missing declared type and trusts the bytes', () => {
    expect(validateUpload({ ...ok, declaredMimeType: '' }).ok).toBe(true);
  });
});
