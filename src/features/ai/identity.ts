import 'server-only';

import { createHash } from 'node:crypto';

import { serverEnv } from '@/lib/env';

/**
 * Identifiers sent to AI Gateway and used for rate limiting.
 *
 * The gateway's `user` field is a safety identifier: it lets abuse be traced to
 * one actor and lets spend be attributed, and it is sent to a third party. So
 * it is a salted hash, never the raw value — an account id or an IP address
 * leaving our infrastructure in cleartext is a privacy problem the feature does
 * not need to have.
 *
 * The salt is the deployment's own secret. Without one the hash is still a
 * one-way function of the input, just not resistant to a dictionary of every
 * IPv4 address, which is why production should set `AI_IDENTITY_SALT`.
 */
function salt(): string {
  const env = serverEnv();
  return env.AI_IDENTITY_SALT ?? env.SUPABASE_SECRET_KEY ?? 'bdoor-ai-local-salt';
}

export function safetyIdentifier(kind: 'user' | 'anon', value: string): string {
  const digest = createHash('sha256').update(`${salt()}:${kind}:${value}`).digest('hex');
  return `${kind}_${digest.slice(0, 32)}`;
}

/**
 * The caller's IP, from the proxy headers Vercel sets. Used for rate limiting
 * only, and hashed before it is used as a key so the limiter's memory is not a
 * list of visitor addresses.
 */
export function callerIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const raw = forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim() || 'unknown';
  return createHash('sha256').update(`${salt()}:ip:${raw}`).digest('hex').slice(0, 32);
}
