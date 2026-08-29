import { NextResponse, type NextRequest } from 'next/server';
import { paymentsAreSandbox } from '@/lib/payments';

/**
 * Sandbox hosted-checkout stand-in.
 *
 * It exists so the payment journey can be walked end to end without a gateway.
 * It refuses to run unless PAYMENT_PROVIDER is `mock`, and every screen says in
 * plain words that no money moves.
 */
export async function GET(request: NextRequest) {
  if (!paymentsAreSandbox()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const session = params.get('session') ?? '';
  const amount = Number(params.get('amount') ?? 0) / 100;
  const currency = params.get('currency') ?? 'BDT';
  const returnUrl = params.get('return') ?? '/';
  const cancelUrl = params.get('cancel') ?? '/';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Sandbox checkout — bdoor</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center;
         background:#F7F8F5; color:#111827; font-family: system-ui, sans-serif; padding:2rem; }
  main { width:100%; max-width:26rem; background:#fff; border:1px solid #E5E7EB;
         border-radius:16px; padding:1.75rem; box-shadow:0 4px 12px rgb(16 24 40 / .07); }
  h1 { font-size:1.25rem; margin:0 0 .5rem; }
  .banner { background:#FDF4E3; border:1px solid rgba(138,90,0,.25); color:#8A5A00;
            border-radius:12px; padding:.75rem .9rem; font-size:.85rem; line-height:1.5; margin-bottom:1.25rem; }
  dl { display:flex; justify-content:space-between; border-top:1px solid #E5E7EB;
       border-bottom:1px solid #E5E7EB; padding:.9rem 0; margin:0 0 1.25rem; }
  dt { color:#64748B; font-size:.875rem; } dd { margin:0; font-weight:600; }
  form { display:flex; flex-direction:column; gap:.6rem; }
  button, a.cancel { font:inherit; font-weight:500; border-radius:10px; padding:.7rem 1rem;
                     text-align:center; text-decoration:none; cursor:pointer; border:1px solid transparent; }
  button { background:#315EFB; color:#fff; }
  button.fail { background:#fff; color:#C02626; border-color:#C02626; }
  a.cancel { background:#fff; color:#111827; border-color:#D3D8E0; }
  code { font-size:.75rem; color:#64748B; word-break:break-all; }
</style>
</head>
<body>
<main>
  <h1>Sandbox checkout</h1>
  <p class="banner"><strong>No money will move.</strong> This is a development stand-in for a payment
  gateway. Choose an outcome to continue the flow.</p>
  <dl>
    <dt>Amount</dt>
    <dd>${currency} ${amount.toLocaleString('en-BD', { maximumFractionDigits: 2 })}</dd>
  </dl>
  <form method="GET" action="/api/payments/mock/complete">
    <input type="hidden" name="session" value="${session.replace(/"/g, '')}">
    <input type="hidden" name="return" value="${returnUrl.replace(/"/g, '')}">
    <button type="submit" name="outcome" value="paid">Simulate a successful payment</button>
    <button type="submit" name="outcome" value="failed" class="fail">Simulate a failed payment</button>
  </form>
  <p style="margin:.6rem 0 0"><a class="cancel" href="${cancelUrl.replace(/"/g, '')}" style="display:block">Cancel</a></p>
  <p style="margin-top:1rem"><code>${session.replace(/</g, '')}</code></p>
</main>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
