import 'server-only';

import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { redactMetadata } from '@/lib/audit/redact';
import { ResendEmailProvider } from './resend';

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
  const env = serverEnv();

  if (env.EMAIL_PROVIDER === 'mock') return new MockEmailProvider();

  if (env.EMAIL_PROVIDER === 'resend') {
    // Env validation already requires both for a non-mock provider; this
    // guard keeps a misconfigured deployment from sending nothing silently.
    if (!env.EMAIL_API_KEY || !env.EMAIL_FROM) {
      throw new Error(
        'EMAIL_PROVIDER=resend requires EMAIL_API_KEY and EMAIL_FROM. ' +
          'Both are server-only; neither may carry a NEXT_PUBLIC_ prefix.',
      );
    }
    return new ResendEmailProvider(env.EMAIL_API_KEY, env.EMAIL_FROM);
  }

  throw new Error(
    `EMAIL_PROVIDER is set to "${env.EMAIL_PROVIDER}" but no adapter is implemented for it. ` +
      'SMTP would need a mail library added as a dependency — a decision for the ' +
      'repository owner. Implement the EmailProvider interface in src/lib/email/ ' +
      'and register it here.',
  );
}

export function emailIsMock(): boolean {
  return serverEnv().EMAIL_PROVIDER === 'mock';
}
