import 'server-only';

import { logger } from '@/lib/logger';
import { redactMetadata } from '@/lib/audit/redact';
import type { EmailMessage, EmailProvider, SendResult } from './index';

/**
 * Resend, over its REST API.
 *
 * Deliberately `fetch` rather than the SDK: one POST with a bearer token is
 * the whole integration, and a dependency that ships its own HTTP stack is
 * not worth adding for it.
 *
 * Failure is returned, never thrown. Several callers send mail as a
 * side-effect of a customer action (an invitation, an acknowledgement) and do
 * not wrap the call — a throw there would fail the action the customer
 * actually asked for because a message could not be delivered.
 */

const ENDPOINT = 'https://api.resend.com/emails';

/** A hung provider must not hold a Server Action open. */
const TIMEOUT_MS = 10_000;

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<SendResult> {
    // Recipient and subject are redacted in every log line; the body never
    // appears at all, because it carries case and deadline detail.
    const context = {
      ...redactMetadata({ to: message.to, subject: message.subject }),
      template: message.template,
      locale: message.locale,
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          ...(message.html ? { html: message.html } : {}),
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        // Resend returns a JSON error body; keep the status and its message,
        // which describe the failure without quoting the message content.
        const detail = await response.text().catch(() => '');
        const reason = `resend_http_${response.status}`;
        logger.error('email.send_failed', {
          ...context,
          status: response.status,
          detail: detail.slice(0, 200),
        });
        return { ok: false, reason };
      }

      const body = (await response.json().catch(() => null)) as { id?: string } | null;
      if (!body?.id) {
        logger.error('email.send_no_id', context);
        return { ok: false, reason: 'resend_no_id' };
      }

      logger.info('email.sent', { ...context, providerId: body.id });
      return { ok: true, providerId: body.id };
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      logger.error('email.send_error', {
        ...context,
        reason: timedOut ? 'timeout' : 'network',
      });
      return { ok: false, reason: timedOut ? 'timeout' : 'network_error' };
    }
  }
}
