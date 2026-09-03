import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  blockedAddress,
  isIpLiteral,
  normaliseHost,
  parseIpv4,
  parseIpv6,
  resolveHost,
} from '@/features/ai/research/url-safety';
import {
  OFFICIAL_DOMAINS,
  allowlistEntry,
  allowlisted,
  type OfficialDomain,
} from '@/features/ai/research/official-domains';
import { fetchDocument } from '@/features/ai/registry/fetcher';

/**
 * CLAUDE.md §6.7 and §23.2: private-IP blocking, HTTPS validation, redirect
 * chains and the official-domain allowlist.
 *
 * The fetcher cases use IP literals as hosts so nothing here touches a
 * resolver — the suite must pass offline, and a test that silently needs DNS
 * is a test that fails for the wrong reason one day.
 */

describe('address parsing', () => {
  it('reads dotted quads and refuses what is not one', () => {
    expect(parseIpv4('8.8.8.8')).toEqual([8, 8, 8, 8]);
    expect(parseIpv4('255.255.255.255')).toEqual([255, 255, 255, 255]);
    for (const bad of ['8.8.8', '8.8.8.8.8', '256.1.1.1', '8.8.8.a', '', '::1']) {
      expect(parseIpv4(bad), bad).toBeNull();
    }
  });

  it('reads IPv6, including elision and a trailing dotted quad', () => {
    expect(parseIpv6('::1')?.slice(14)).toEqual([0, 1]);
    expect(parseIpv6('::')).toEqual(new Array<number>(16).fill(0));
    expect(parseIpv6('[fd00::1]')?.[0]).toBe(0xfd);
    expect(parseIpv6('::ffff:127.0.0.1')?.slice(10)).toEqual([0xff, 0xff, 127, 0, 0, 1]);
    expect(parseIpv6('2001:0db8:0000:0000:0000:0000:0000:0001')?.slice(0, 4)).toEqual([
      0x20, 0x01, 0x0d, 0xb8,
    ]);
    for (const bad of ['1::2::3', 'zzzz::1', '1.2.3.4', '', '12345::1']) {
      expect(parseIpv6(bad), bad).toBeNull();
    }
  });
});

describe('blockedAddress', () => {
  it('blocks every IPv4 range a public document can never live in', () => {
    const expected: Record<string, string> = {
      '0.0.0.0': 'unspecified',
      '127.0.0.1': 'loopback',
      '10.0.0.1': 'private',
      '172.16.0.1': 'private',
      '172.31.255.254': 'private',
      '192.168.1.1': 'private',
      // The one that matters most: the cloud instance-metadata address, which
      // hands out credentials to anything that can make it an HTTP request.
      '169.254.169.254': 'link_local',
      '100.64.0.1': 'carrier_nat',
      '198.18.0.1': 'benchmarking',
      '192.0.0.1': 'protocol_assignment',
      '203.0.113.5': 'documentation',
      '224.0.0.1': 'multicast',
      '255.255.255.255': 'reserved',
    };
    for (const [address, block] of Object.entries(expected)) {
      expect(blockedAddress(address), address).toBe(block);
    }
  });

  it('leaves genuinely public addresses alone, including the near misses', () => {
    for (const address of ['8.8.8.8', '172.15.0.1', '172.32.0.1', '100.63.255.255', '1.1.1.1']) {
      expect(blockedAddress(address), address).toBeNull();
    }
    expect(blockedAddress('2606:4700:4700::1111')).toBeNull();
  });

  it('blocks IPv6 private space and every way of smuggling IPv4 through it', () => {
    expect(blockedAddress('::1')).toBe('loopback');
    expect(blockedAddress('::')).toBe('unspecified');
    expect(blockedAddress('fd00::1')).toBe('private');
    expect(blockedAddress('fe80::1')).toBe('link_local');
    expect(blockedAddress('ff02::1')).toBe('multicast');
    expect(blockedAddress('2001:db8::1')).toBe('documentation');
    // v4-mapped, v4-compatible and NAT64 all carry a v4 address; each has to
    // face the v4 rules or the whole table above is one notation away from
    // being bypassed.
    expect(blockedAddress('::ffff:127.0.0.1')).toBe('loopback');
    expect(blockedAddress('::ffff:169.254.169.254')).toBe('link_local');
    expect(blockedAddress('::ffff:a9fe:a9fe')).toBe('link_local');
    expect(blockedAddress('::10.0.0.1')).toBe('private');
    expect(blockedAddress('64:ff9b::169.254.169.254')).toBe('link_local');
  });

  it('blocks anything it cannot classify rather than assuming it is fine', () => {
    for (const junk of ['not-an-address', '', '999.999.999.999']) {
      expect(blockedAddress(junk), junk).toBe('reserved');
    }
  });
});

describe('host handling', () => {
  it('normalises case, the FQDN root dot and IPv6 brackets', () => {
    expect(normaliseHost('NBR.GOV.BD.')).toBe('nbr.gov.bd');
    expect(normaliseHost('[::1]')).toBe('::1');
  });

  it('classifies literals without a resolver, so a literal cannot skip the check', async () => {
    expect(isIpLiteral('169.254.169.254')).toBe(true);
    expect(isIpLiteral('nbr.gov.bd')).toBe(false);

    await expect(resolveHost('169.254.169.254')).resolves.toEqual({
      ok: false,
      block: 'link_local',
    });
    await expect(resolveHost('[::1]')).resolves.toEqual({ ok: false, block: 'loopback' });
    await expect(resolveHost('8.8.8.8')).resolves.toEqual({ ok: true, addresses: ['8.8.8.8'] });
  });
});

describe('the official-domain allowlist', () => {
  it('ships empty, and refuses everything until an owner fills it', () => {
    // A tripwire, not a formality. §3.3 forbids inventing which hosts carry
    // the authority of Bangladeshi law; if this list ever gains an entry it
    // must be because a person approved that entry, and this failing test is
    // where they are made to notice.
    expect(OFFICIAL_DOMAINS).toEqual([]);
    for (const host of ['nbr.gov.bd', 'roc.gov.bd', 'bdoor.io']) {
      expect(allowlisted(host), host).toBe(false);
    }
  });

  it('matches on a label boundary, never a bare suffix', () => {
    const list: OfficialDomain[] = [
      { host: 'nbr.gov.bd', includeSubdomains: true, authority: 'NBR' },
      { host: 'roc.gov.bd', includeSubdomains: false, authority: 'RJSC' },
    ];
    expect(allowlistEntry('nbr.gov.bd', list)?.authority).toBe('NBR');
    expect(allowlistEntry('www.nbr.gov.bd', list)?.authority).toBe('NBR');
    expect(allowlistEntry('NBR.GOV.BD.', list)?.authority).toBe('NBR');
    // The lookalikes an attacker registers.
    expect(allowlistEntry('evil-nbr.gov.bd', list)).toBeUndefined();
    expect(allowlistEntry('nbr.gov.bd.attacker.example', list)).toBeUndefined();
    // Subdomains only where the entry says so.
    expect(allowlistEntry('app.roc.gov.bd', list)).toBeUndefined();
    // An authority is a name; a literal is how a name check gets skipped.
    expect(allowlistEntry('169.254.169.254', list)).toBeUndefined();
    expect(allowlistEntry('', list)).toBeUndefined();
  });
});

/**
 * Fetcher behaviour, with the network stubbed. Each case uses its own host so
 * the module's per-host robots/politeness cache cannot leak between tests.
 */
function stubNetwork(handler: (url: string) => Response): void {
  vi.stubGlobal('fetch', (input: string | URL) => Promise.resolve(handler(String(input))));
}

const OK_ROBOTS = (): Response => new Response('User-agent: *\nAllow: /\n', { status: 200 });

function redirect(to: string, status = 302): Response {
  return new Response(null, { status, headers: { location: to } });
}

function pdf(body: string): Response {
  return new Response(body, { status: 200, headers: { 'content-type': 'application/pdf' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchDocument address and transport guards', () => {
  it('refuses the instance-metadata address outright, before any request', async () => {
    const calls: string[] = [];
    stubNetwork((url) => {
      calls.push(url);
      return pdf('secrets');
    });

    await expect(fetchDocument('http://169.254.169.254/latest/meta-data/')).resolves.toEqual({
      ok: false,
      failure: 'blocked_address',
      retryable: false,
    });
    // Not merely rejected — never dialled.
    expect(calls).toEqual([]);
  });

  it('refuses loopback and private literals the same way', async () => {
    stubNetwork(() => pdf('x'));
    for (const url of ['http://127.0.0.1:9000/admin', 'http://[::1]/', 'http://10.1.2.3/x']) {
      const outcome = await fetchDocument(url);
      expect(outcome.ok, url).toBe(false);
      if (!outcome.ok) expect(outcome.failure, url).toBe('blocked_address');
    }
  });

  it('refuses a redirect toward the metadata address', async () => {
    stubNetwork((url) => {
      if (url.endsWith('/robots.txt')) return OK_ROBOTS();
      if (url === 'https://93.184.216.34/doc.pdf') return redirect('http://169.254.169.254/');
      return pdf('never reached');
    });

    // Two independent gates stand in front of this hop and the outer one
    // answers first: the target is a different host, which no caller approved.
    // The address check behind it is what catches a host that only becomes
    // private once it is resolved.
    await expect(fetchDocument('https://93.184.216.34/doc.pdf')).resolves.toMatchObject({
      ok: false,
      failure: 'redirect_not_approved',
    });
  });

  it('refuses an https→http downgrade even when the caller allowed plaintext', async () => {
    stubNetwork((url) => {
      if (url.endsWith('/robots.txt')) return OK_ROBOTS();
      if (url.startsWith('https://93.184.216.35/')) return redirect('http://93.184.216.35/doc.pdf');
      return pdf('plaintext');
    });

    await expect(fetchDocument('https://93.184.216.35/doc.pdf')).resolves.toEqual({
      ok: false,
      failure: 'insecure_transport',
      retryable: false,
    });
  });

  it('refuses plaintext outright when the caller requires TLS', async () => {
    stubNetwork(() => pdf('x'));
    await expect(
      fetchDocument('http://93.184.216.36/doc.pdf', { requireHttps: true }),
    ).resolves.toEqual({ ok: false, failure: 'insecure_transport', retryable: false });
  });

  it('refuses a non-HTTP scheme', async () => {
    stubNetwork(() => pdf('x'));
    for (const url of ['file:///etc/passwd', 'ftp://93.184.216.37/x', 'gopher://x/']) {
      const outcome = await fetchDocument(url);
      expect(outcome.ok, url).toBe(false);
      if (!outcome.ok) expect(outcome.failure, url).toBe('network');
    }
  });
});

describe('fetchDocument redirect and allowlist handling', () => {
  it('refuses a hop to an unrelated host, and allows one within the same site', async () => {
    stubNetwork((url) => {
      if (url.endsWith('/robots.txt')) return OK_ROBOTS();
      if (url === 'https://93.184.216.38/doc.pdf') return redirect('https://8.8.8.8/doc.pdf');
      return pdf('elsewhere');
    });
    await expect(fetchDocument('https://93.184.216.38/doc.pdf')).resolves.toMatchObject({
      ok: false,
      failure: 'redirect_not_approved',
    });
  });

  it('stops a redirect loop instead of following it forever', async () => {
    stubNetwork((url) => {
      if (url.endsWith('/robots.txt')) return OK_ROBOTS();
      return redirect('https://93.184.216.39/again.pdf');
    });
    await expect(fetchDocument('https://93.184.216.39/doc.pdf')).resolves.toEqual({
      ok: false,
      failure: 'too_many_redirects',
      retryable: false,
    });
  });

  it('refuses every host when an allowlist is supplied and the host is not on it', async () => {
    stubNetwork(() => pdf('x'));
    await expect(
      fetchDocument('https://93.184.216.40/doc.pdf', {
        allowlist: [{ host: 'nbr.gov.bd', includeSubdomains: true, authority: 'NBR' }],
      }),
    ).resolves.toEqual({ ok: false, failure: 'not_allowlisted', retryable: false });
  });

  it('returns the bytes, their hash and the chain that reached them', async () => {
    stubNetwork((url) => {
      if (url.endsWith('/robots.txt')) return OK_ROBOTS();
      if (url === 'https://93.184.216.41/doc.pdf') return redirect('https://93.184.216.41/v2.pdf');
      return pdf('official text');
    });

    const outcome = await fetchDocument('https://93.184.216.41/doc.pdf');
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(new TextDecoder().decode(outcome.bytes)).toBe('official text');
    expect(outcome.contentType).toBe('application/pdf');
    expect(outcome.secureTransport).toBe(true);
    expect(outcome.chain).toEqual([
      'https://93.184.216.41/doc.pdf',
      'https://93.184.216.41/v2.pdf',
    ]);
    expect(outcome.finalUrl).toBe('https://93.184.216.41/v2.pdf');
    // SHA-256 of "official text", so a later comparison is against the bytes
    // and not against whatever the site says its document is called.
    expect(outcome.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('records plaintext transport rather than pretending the bytes were authenticated', async () => {
    stubNetwork((url) => (url.endsWith('/robots.txt') ? OK_ROBOTS() : pdf('law text')));
    const outcome = await fetchDocument('http://93.184.216.42/act.pdf');
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.secureTransport).toBe(false);
  });

  it('still honours robots.txt, and does not crawl a host whose rules it cannot read', async () => {
    stubNetwork((url) =>
      url.endsWith('/robots.txt')
        ? new Response('User-agent: *\nDisallow: /private/\n', { status: 200 })
        : pdf('x'),
    );
    await expect(fetchDocument('https://93.184.216.43/private/x.pdf')).resolves.toMatchObject({
      ok: false,
      failure: 'robots_disallowed',
      retryable: false,
    });

    stubNetwork((url) =>
      url.endsWith('/robots.txt') ? new Response('', { status: 500 }) : pdf('x'),
    );
    await expect(fetchDocument('https://93.184.216.44/x.pdf')).resolves.toMatchObject({
      ok: false,
      failure: 'robots_disallowed',
      retryable: true,
    });
  });
});
