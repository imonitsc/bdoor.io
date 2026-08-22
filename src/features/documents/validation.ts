/**
 * Upload validation.
 *
 * The browser's reported MIME type and the file extension are both attacker
 * controlled, so they are treated as hints. `sniffMimeType` reads the magic
 * bytes and that is what decides.
 */

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const EXTENSION_FOR_MIME: Record<AllowedMimeType, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;

export type ValidationFailure =
  | { code: 'empty' }
  | { code: 'too_large'; maxBytes: number; actualBytes: number }
  | { code: 'unsupported_type'; detected: string | null }
  | { code: 'type_mismatch'; declared: string; detected: AllowedMimeType }
  | { code: 'name_too_long' };

export type ValidationResult =
  | { ok: true; mimeType: AllowedMimeType; extension: string; safeFileName: string }
  | { ok: false; failure: ValidationFailure };

/** Reads the leading bytes and returns the real type, or null if unrecognised. */
export function sniffMimeType(bytes: Uint8Array): AllowedMimeType | null {
  if (bytes.length < 12) return null;

  const startsWith = (sig: readonly number[], offset = 0) =>
    sig.every((byte, i) => bytes[offset + i] === byte);

  // %PDF
  if (startsWith([0x25, 0x50, 0x44, 0x46])) return 'application/pdf';
  // JPEG start-of-image plus marker
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  // PNG signature
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // RIFF....WEBP
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }

  return null;
}

/** Control characters, quotes and path separators are stripped from the name. */
const UNSAFE_NAME_CHARS = new RegExp('[\\u0000-\\u001f\\u007f"<>|:*?]', 'g');

export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'file';
  const cleaned = base.replace(UNSAFE_NAME_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  return cleaned.length > 0 ? cleaned : 'file';
}

export function validateUpload(params: {
  bytes: Uint8Array;
  declaredMimeType: string;
  fileName: string;
  byteSize: number;
  maxBytes?: number;
}): ValidationResult {
  const maxBytes = params.maxBytes ?? DEFAULT_MAX_BYTES;

  if (params.byteSize <= 0) return { ok: false, failure: { code: 'empty' } };
  if (params.byteSize > maxBytes) {
    return { ok: false, failure: { code: 'too_large', maxBytes, actualBytes: params.byteSize } };
  }
  if (params.fileName.length > 255) return { ok: false, failure: { code: 'name_too_long' } };

  const detected = sniffMimeType(params.bytes);
  if (!detected) return { ok: false, failure: { code: 'unsupported_type', detected: null } };

  // A JPEG uploaded as image/jpg is fine; a script renamed to .pdf is not.
  const declared = params.declaredMimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  const declaredNormalized = declared === 'image/jpg' ? 'image/jpeg' : declared;
  if (declaredNormalized && declaredNormalized !== detected) {
    return { ok: false, failure: { code: 'type_mismatch', declared: declaredNormalized, detected } };
  }

  return {
    ok: true,
    mimeType: detected,
    extension: EXTENSION_FOR_MIME[detected],
    safeFileName: sanitizeFileName(params.fileName),
  };
}
