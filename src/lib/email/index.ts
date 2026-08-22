import 'server-only';

import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { redactMetadata } from '@/lib/audit/redact';

export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain text is required; HTML is optional and must be a rendered template. */
  text: string;
  html?: string;
  replyTo?: string;
  /** Used for the integration_events record so failures are traceable. */
  template: string;
  locale: 'en' | 'bn';
};

export type SendResult = { ok: true; providerId: string } | { ok: false; reason: string };

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<SendResult>;
}

/**
 * Development provider. Logs a redacted summary — never the body, which may
 * contain a customer's case details — and pretends to succeed.
 */
class MockEmailProvider implements EmailProvider {
  readonly name = 'mock';

  async send(message: EmailMessage): Promise<SendResult> {
    logger.info('email.mock_send', {
      ...redactMetadata({ to: message.to, subject: message.subject }),
      template: message.template,
      locale: message.locale,
    });
    return { ok: true, providerId: `mock_${crypto.randomUUID()}` };
  }
}

export function getEmailProvider(): EmailProvider {
  const configured = serverEnv().EMAIL_PROVIDER;

  if (configured === 'mock') return new MockEmailProvider();

  throw new Error(
    `EMAIL_PROVIDER is set to "${configured}" but no adapter is implemented for it. ` +
      'Implement the EmailProvider interface in src/lib/email/ and register it here. ' +
      'Set EMAIL_FROM as well — env validation requires it for any non-mock provider.',
  );
}

export function emailIsMock(): boolean {
  return serverEnv().EMAIL_PROVIDER === 'mock';
}
