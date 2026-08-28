# Operations runbook

Running BDoor day to day. Cost figures are public list prices researched on
28 August 2026 — snapshots, not quotes. Re-check before purchasing.

---

## Platform cost baseline

| Service             | Plan                           |       Published starting price | Note                                                                                                     |
| ------------------- | ------------------------------ | -----------------------------: | -------------------------------------------------------------------------------------------------------- |
| GitHub              | Free, or Team for branch rules | US$0 / US$4 per user per month | Verify promotional and renewal terms                                                                     |
| Vercel              | Pro                            |                    US$20/month | Includes US$20 usage credit; overages possible                                                           |
| Supabase            | Pro                            |               From US$25/month | Compute credit for one Micro project; add-ons separate                                                   |
| **Baseline**        |                                |               **≈US$45/month** | Before email, monitoring, scanning, SMS, extra environments, storage/egress, PITR, taxes                 |
| Sentry              | Developer / Team               |             US$0 / US$26/month | Free during development                                                                                  |
| Transactional email | Resend or approved SMTP        |             Free tier or usage | Production auth mail needs custom SMTP, not Supabase default                                             |
| SSLCOMMERZ          | Basic                          |               ৳25,500 one-time | Published 2.5% per standard transaction, 3.5% AMEX. Reconfirm contract, VAT, settlement and refund terms |

Also budget: domain renewal, legal review, accounting review, AML/KYC
screening, malware scanning, SMS/WhatsApp, support, storage growth, backups,
chargebacks.

Keep spend caps and alerts enabled on Vercel and Supabase. Alert at 50%, 75%,
90% and 100% of the approved monthly budget.

---

## Daily

- Failed webhooks and unprocessed `payment_events`.
- Documents stuck in `pending` scan state.
- `document_requests` past `due_on`.
- Open `authority_queries` approaching `respond_by`.
- KYC cases in `manual_review`.
- 5xx rate and authentication spikes.

## Weekly

- Unreconciled payments: `status = 'paid' and reconciled_at is null`.
- Services whose `next_review_due` has passed — a stale official fee must not
  be quoted as verified.
- `compliance_reminders` due but unsent.
- Dependabot pull requests.
- Supabase advisors (currently clean: 0 findings).

## Monthly

- Spend against budget on all vendors.
- Backup restore rehearsal.
- Access review: `platform_roles` and partner memberships. Revoke leavers.
- Retention sweep against `document_retention_rules`.

---

## Incidents

`docs/INCIDENT-RESPONSE.md` is the procedure. Summary:

1. Contain — take the affected path out of service rather than debugging live.
2. Preserve evidence: `audit_logs`, `document_access_logs` and
   `payment_events` are append-only and must not be "cleaned up".
3. Assess whether personal data was reached. If so, the notification clock in
   `docs/LEGAL_LAUNCH_CHECKLIST.md` applies.
4. Fix forward. Roll back code in Vercel; prefer a forward migration for data.
5. Write it up. Record what a check would have caught and add it.

### Site returns 500 on every request

Almost always a boot failure, not application code. Check Vercel runtime logs
for `instrumentation hook`. `productionEnvProblems()` names every missing
variable at once. Remember `NEXT_PUBLIC_*` needs a fresh build, not a cache-reusing
redeploy — see `docs/DEPLOYMENT.md`.

### Payment succeeded for the customer but not for us

The gateway redirect never proves payment. Look for the `payment_events` row for
that `(provider, event_id)`. No row means the webhook never arrived — replay it
from the provider dashboard; the unique index makes replay a no-op. Never mark a
payment paid by hand to make a customer happy; use the manual-reconciliation
path so there is evidence.

### A document was uploaded but cannot be downloaded

Expected when `MALWARE_SCAN_PROVIDER=mock`: the mock never marks a file clean,
so it stays `pending`. This is deliberate — the UI must not pretend a file was
scanned. Configuring a real scanner is a launch blocker.

---

## Things that are not automated

Honest list. Each is manual today:

- Compliance reminders have no scheduler. `compliance_reminders` rows are
  created but nothing sends them; `CRON_SECRET` is reserved for the job endpoint.
- No transactional outbox. A notification side-effect that fails is lost.
- Retention rules are recorded but no job enforces them.
- No uptime monitoring or alerting beyond Vercel's defaults.
- Rate limiting is in-process: it resets on deploy and is per-instance.
