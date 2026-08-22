import { createHmac } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { paymentsAreSandbox } from '@/lib/payments';
import { serverEnv } from '@/lib/env';
import { absoluteUrl } from '@/lib/site';

/**
 * Sandbox "gateway callback".
 *
 * Rather than writing the payment directly, this signs a webhook exactly as a
 * real gateway would and posts it to our own webhook endpoint. That means the
 * signature-verification and idempotency paths are exercised in development,
 * not just in production.
 */
export async function GET(request: NextRequest) {
  if (!paymentsAreSandbox()) return new NextResponse('Not found', { status: 404 });

  const params = request.nextUrl.searchParams;
  const session = params.get('session') ?? '';
  const outcome = params.get('outcome') === 'paid' ? 'paid' : 'failed';
  const rawReturn = params.get('return') ?? '/';
  const secret = serverEnv().PAYMENT_WEBHOOK_SECRET;

  if (secret && session) {
    const body = JSON.stringify({
      event_id: `evt_${session}_${outcome}`,
      event_type: outcome === 'paid' ? 'payment.succeeded' : 'payment.failed',
      session_id: session,
    });

    try {
      await fetch(absoluteUrl('/api/payments/webhook'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-bdoor-signature': createHmac('sha256', secret).update(body, 'utf8').digest('hex'),
        },
        body,
      });
    } catch {
      // The redirect below still happens; the payment simply stays pending,
      // which is exactly what a real dropped callback looks like.
    }
  }

  // Only ever redirect to a path on this site.
  const target = new URL(rawReturn, request.nextUrl.origin);
  target.searchParams.set('payment', outcome === 'paid' ? 'success' : 'failed');
  if (target.origin !== request.nextUrl.origin) {
    return NextResponse.redirect(new URL('/', request.nextUrl.origin));
  }

  return NextResponse.redirect(target);
}
