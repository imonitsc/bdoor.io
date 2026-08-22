import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * One-way hashes for values we must be able to compare but never read back:
 * invitation tokens, questionnaire draft keys, IP addresses in audit records.
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** A per-deployment salt keeps hashed IPs from being reversible by rainbow table. */
function pepper(): string {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'bdoor-dev';
}

export function hashIdentifier(value: string): string {
  return sha256(`${pepper()}::${value}`);
}

export function generateToken(bytes = 32): { token: string; hash: string } {
  const token = randomBytes(bytes).toString('base64url');
  return { token, hash: sha256(token) };
}

export function safeCompareHash(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Tokenises an identity number so duplicates can be detected without the
 * schema ever holding a readable passport or NID number.
 */
export function tokenizeIdentifier(documentType: string, value: string): string {
  const normalized = value.replace(/[\s-]/g, '').toUpperCase();
  return sha256(`${pepper()}::${documentType}::${normalized}`);
}
