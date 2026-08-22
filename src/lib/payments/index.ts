import 'server-only';

import { serverEnv } from '@/lib/env';
import { MockPaymentProvider } from './mock-provider';
import type { PaymentProvider } from './types';

/**
 * Provider selection.
 *
 * There is no live gateway wired up: BDoor must use a Bangladesh Bank
 * authorised gateway, and that integration needs real merchant credentials and
 * a signed agreement. Adding one means implementing `PaymentProvider` in a new
 * file and registering it here — nothing else in the application changes.
 *
 * See README → "Activating a payment gateway".
 */
export function getPaymentProvider(): PaymentProvider {
  const configured = serverEnv().PAYMENT_PROVIDER;

  switch (configured) {
    case 'mock':
      return new MockPaymentProvider();
    case 'sslcommerz':
    case 'stripe':
      throw new Error(
        `PAYMENT_PROVIDER is set to "${configured}" but no adapter is implemented for it. ` +
          'Implement the PaymentProvider interface in src/lib/payments/ and register it in getPaymentProvider(). ' +
          'Do not ship this configuration to production until the adapter exists and has been tested against the gateway sandbox.',
      );
    default: {
      const exhaustive: never = configured;
      throw new Error(`Unknown payment provider: ${String(exhaustive)}`);
    }
  }
}

export function paymentsAreSandbox(): boolean {
  return serverEnv().PAYMENT_PROVIDER === 'mock';
}

export * from './types';
