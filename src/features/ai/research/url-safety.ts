import 'server-only';

import { lookup } from 'node:dns/promises';

/**
 * What a URL must survive before anything fetches it.
 *
 * CLAUDE.md §6.7 requires the research fetcher to "block private IP ranges,
 * non-HTTP(S) schemes, user-supplied redirects, oversized files, unsupported
 * MIME types, recursive crawling and cross-domain redirects that are not
 * explicitly approved". The size and MIME halves already lived in the
 * fetcher; the address and scheme halves did not exist anywhere, which is why
 * these predicates are their own module rather than more branches inside it.
 *
 * Everything here is pure except `resolveHost`, so the address classification
 * — the part that is easy to get subtly wrong — is unit-testable without a
 * resolver, a socket or a server.
 *
 * The residual risk this does NOT close is DNS rebinding: the addresses are
 * checked before the request, and Node's global fetch resolves the name again
 * itself, so a name whose answer changes between the two calls could still be
 * connected to. Closing that needs a custom dispatcher with a connect hook,
 * which means a new runtime dependency (§4.2), so it is documented rather than
 * half-implemented. The allowlist is the defence that actually holds there: an
 * attacker would have to control DNS for a government domain.
 */

export type AddressBlock =
  | 'unspecified'
  | 'loopback'
  | 'private'
  | 'link_local'
  | 'carrier_nat'
  | 'benchmarking'
  | 'protocol_assignment'
  | 'documentation'
  | 'multicast'
  | 'reserved'
  | 'discard';

/** 16 bytes for IPv6, 4 for IPv4; null when the literal does not parse. */
export function parseIpv4(literal: string): number[] | null {
  const parts = literal.split('.');
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    octets.push(value);
  }
  return octets;
}

/**
 * IPv6 to 16 bytes, including the `::` elision and a trailing dotted-quad.
 * Deliberately strict: anything it cannot parse confidently is rejected by the
 * caller rather than guessed at.
 */
export function parseIpv6(literal: string): number[] | null {
  const text = literal.replace(/^\[|\]$/g, '');
  if (!/^[0-9a-fA-F:.]+$/.test(text)) return null;

  // A trailing dotted quad ("::ffff:1.2.3.4") is split off and supplies the
  // last four bytes directly; the hextet parser never sees it. Dropping the
  // separating colon can leave a bare "::" that still marks the elision, so
  // it is put back — without it, "::13.1.68.3" would lose its elision and
  // parse as garbage.
  let head = text;
  let tail: number[] = [];
  const lastColon = text.lastIndexOf(':');
  if (lastColon === -1) return null; // a dotted quad alone is not IPv6
  const suffix = text.slice(lastColon + 1);
  if (suffix.includes('.')) {
    const quad = parseIpv4(suffix);
    if (!quad) return null;
    tail = quad;
    head = text.slice(0, lastColon);
    if (head.endsWith(':')) head += ':';
  }

  const elision = head.indexOf('::');
  if (head.indexOf('::', elision + 1) !== -1) return null; // only one '::'

  const toHextets = (segment: string): number[] | null => {
    if (segment === '') return [];
    const out: number[] = [];
    for (const group of segment.split(':')) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
      const value = Number.parseInt(group, 16);
      out.push((value >> 8) & 0xff, value & 0xff);
    }
    return out;
  };

  let bytes: number[];
  if (elision === -1) {
    const all = toHextets(head);
    if (!all) return null;
    bytes = all;
  } else {
    const left = toHextets(head.slice(0, elision));
    const right = toHextets(head.slice(elision + 2));
    if (!left || !right) return null;
    const gap = 16 - tail.length - left.length - right.length;
    if (gap < 0) return null;
    bytes = [...left, ...new Array<number>(gap).fill(0), ...right];
  }

  bytes = [...bytes, ...tail];
  return bytes.length === 16 ? bytes : null;
}

function blockedIpv4(octets: number[]): AddressBlock | null {
  const [a = 0, b = 0, c = 0] = octets;
  if (a === 0) return 'unspecified'; // 0.0.0.0/8
  if (a === 127) return 'loopback';
  if (a === 10) return 'private';
  if (a === 172 && b >= 16 && b <= 31) return 'private';
  if (a === 192 && b === 168) return 'private';
  if (a === 169 && b === 254) return 'link_local'; // includes 169.254.169.254
  if (a === 100 && b >= 64 && b <= 127) return 'carrier_nat';
  if (a === 198 && (b === 18 || b === 19)) return 'benchmarking';
  if (a === 192 && b === 0 && c === 0) return 'protocol_assignment';
  if (a === 192 && b === 0 && c === 2) return 'documentation';
  if (a === 198 && b === 51 && c === 100) return 'documentation';
  if (a === 203 && b === 0 && c === 113) return 'documentation';
  if (a >= 224 && a <= 239) return 'multicast';
  if (a >= 240) return 'reserved'; // includes 255.255.255.255
  return null;
}

function blockedIpv6(bytes: number[]): AddressBlock | null {
  const [b0 = 0, b1 = 0, b2 = 0, b3 = 0] = bytes;
  const isZero = (from: number, to: number): boolean =>
    bytes.slice(from, to).every((byte) => byte === 0);

  // IPv4-mapped (::ffff:0:0/96), IPv4-compatible (::/96) and NAT64
  // (64:ff9b::/96) all carry a v4 address that must face the v4 rules.
  if (isZero(0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) {
    return blockedIpv4(bytes.slice(12));
  }
  if (isZero(0, 12)) {
    if (bytes.slice(12).every((byte) => byte === 0)) return 'unspecified';
    if (isZero(12, 15) && bytes[15] === 1) return 'loopback';
    return blockedIpv4(bytes.slice(12));
  }
  if (b0 === 0x00 && b1 === 0x64 && b2 === 0xff && b3 === 0x9b) {
    return blockedIpv4(bytes.slice(12));
  }

  if (b0 === 0x01 && isZero(1, 8)) return 'discard'; // 100::/64
  if ((b0 & 0xfe) === 0xfc) return 'private'; // fc00::/7 unique local
  if (b0 === 0xfe && (b1 & 0xc0) === 0x80) return 'link_local'; // fe80::/10
  if (b0 === 0xff) return 'multicast';
  if (b0 === 0x20 && b1 === 0x01 && b2 === 0x0d && b3 === 0xb8) return 'documentation';
  return null;
}

/**
 * Why one address may not be connected to, or null when it is a public one.
 * Unparseable input is blocked as `reserved`: an address we cannot classify is
 * one we cannot vouch for.
 */
export function blockedAddress(address: string): AddressBlock | null {
  const v4 = parseIpv4(address);
  if (v4) return blockedIpv4(v4);
  const v6 = parseIpv6(address);
  if (v6) return blockedIpv6(v6);
  return 'reserved';
}

/** `nbr.gov.bd.` and `NBR.GOV.BD` are the same host; `[::1]` loses its brackets. */
export function normaliseHost(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
}

export function isIpLiteral(host: string): boolean {
  return parseIpv4(host) !== null || parseIpv6(host) !== null;
}

export type HostVerdict = { ok: true; addresses: string[] } | { ok: false; block: AddressBlock };

/**
 * Resolve a host and refuse it unless EVERY answer is a public address. All,
 * not any: a name that returns one public and one loopback address is a
 * rebinding attempt, and connecting to whichever the stack prefers is exactly
 * the failure mode being defended against.
 *
 * An IP literal skips the resolver and is classified directly, so
 * `http://169.254.169.254/` cannot slip past by never being a name.
 */
export async function resolveHost(host: string): Promise<HostVerdict> {
  const normalised = normaliseHost(host);

  if (isIpLiteral(normalised)) {
    const block = blockedAddress(normalised);
    return block ? { ok: false, block } : { ok: true, addresses: [normalised] };
  }

  let answers: { address: string }[];
  try {
    answers = await lookup(normalised, { all: true });
  } catch {
    // NXDOMAIN, SERVFAIL, or no answer at all: nothing to connect to.
    return { ok: false, block: 'unspecified' };
  }
  if (answers.length === 0) return { ok: false, block: 'unspecified' };

  for (const { address } of answers) {
    const block = blockedAddress(address);
    if (block) return { ok: false, block };
  }
  return { ok: true, addresses: answers.map((answer) => answer.address) };
}
