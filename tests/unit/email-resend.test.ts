import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResendEmailProvider } from '@/lib/email/resend';
import type { EmailMessage } from '@/lib/email';

/**
 * The adapter that finally puts real mail in front of customers. `fetch` is
 * stubbed throughout — no test may perform a real send — and the cases are
 * the ones that decide whether a failed delivery breaks the action a
 * customer actually asked for.
 */

const MESSAGE: EmailMessage = {
  to: 'founder@example.test',
  subject: 'Your obligations are coming due',
  text: 'Annual return — 2026-09-30',
  template: 'compliance_reminder',
  locale: 'en',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

let provider: ResendEmailProvider;

beforeEach(() => {
  provider = new ResendEmailProvider('re_test_key', 'bdoor <no-reply@bdoor.io>');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ResendEmailProvider', () => {
  it('posts the message and returns the provider id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { id: 'msg_123' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await provider.send(MESSAGE);

    expect(result).toEqual({ ok: true, providerId: 'msg_123' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe('Bearer re_test_key');

    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      from: 'bdoor <no-reply@bdoor.io>',
      to: ['founder@example.test'],
      subject: MESSAGE.subject,
      text: MESSAGE.text,
    });
    // Absent optional fields are omitted rather than sent as null.
    expect(body).not.toHaveProperty('html');
    expect(body).not.toHaveProperty('reply_to');
  });

  it('sends html and reply-to when the message carries them', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { id: 'msg_456' }));
    vi.stubGlobal('fetch', fetchMock);

    await provider.send({ ...MESSAGE, html: '<p>hi</p>', replyTo: 'support@bdoor.io' });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.html).toBe('<p>hi</p>');
    expect(body.reply_to).toBe('support@bdoor.io');
  });

  it('returns a failure rather than throwing on a provider error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(422, { message: 'bad from' })));

    // Callers send mail as a side-effect of a customer action and do not all
    // wrap it; a throw would fail the action over an undelivered message.
    const result = await provider.send(MESSAGE);

    expect(result).toEqual({ ok: false, reason: 'resend_http_422' });
  });

  it('treats a success body with no id as a failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, {})));

    const result = await provider.send(MESSAGE);

    expect(result).toEqual({ ok: false, reason: 'resend_no_id' });
  });

  it('reports a timeout without throwing', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeout));

    expect(await provider.send(MESSAGE)).toEqual({ ok: false, reason: 'timeout' });
  });

  it('reports a network failure without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    expect(await provider.send(MESSAGE)).toEqual({ ok: false, reason: 'network_error' });
  });

  it('never writes the message body to a log line', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { id: 'msg_789' })));
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await provider.send(MESSAGE);

    const logged = info.mock.calls.map((call) => JSON.stringify(call)).join(' ');
    expect(logged).not.toContain(MESSAGE.text);
    expect(logged).not.toContain('founder@example.test');
  });
});
