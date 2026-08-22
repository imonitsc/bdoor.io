# Incident response

A working checklist for the first hours of a suspected security or privacy
incident. It assumes the team is small and that whoever finds the problem is
probably the one who has to act on it.

> **Roles and contact details are placeholders.** BDoor has not published a
> security address or named an incident lead yet; the general contact address
> (`hello@bdoor.io`) is the fallback. Filling these in is on the
> [launch checklist](./LAUNCH-CHECKLIST.md), and doing so before launch is not
> optional — an incident is the wrong time to be deciding who is in charge.

---

## What counts as an incident

Anything in this list. When in doubt, treat it as one — the cost of a false
alarm is an hour; the cost of a missed breach is the business.

- Personal data reached someone who should not have it (a broken RLS policy, a
  mis-scoped signed URL, a document served to the wrong organisation).
- An account was taken over, or credentials were exposed.
- The `SUPABASE_SECRET_KEY`, a payment webhook secret or any other secret leaked
  — including into a log, a screenshot, a commit or a support ticket.
- Malware was found in an uploaded document that had already been shared.
- The database was modified by something other than the application.
- A dependency in use has a known exploited vulnerability.
- Anything that looks like data exfiltration in the access logs.

---

## First 60 minutes

**1. Write it down before you fix it.** Open a timestamped note. Every step
below goes in it as you do it. Reconstructing the timeline afterwards from
memory is how organisations end up unable to answer the only questions that
matter.

**2. Contain, without destroying evidence.**

| Situation        | Do                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Leaked secret    | Rotate it in Supabase / the gateway, then redeploy. Old key first invalid, then removed.                             |
| Account takeover | Revoke the user's sessions in Supabase Auth, force a password reset, require MFA re-enrolment.                       |
| Broken policy    | Push a policy that denies rather than one that allows. A tighter policy that breaks a screen is fine; a leak is not. |
| Malicious upload | Quarantine the document (`document.quarantine`), do not delete it.                                                   |
| Unknown scope    | Disable the affected route or feature flag rather than the whole platform.                                           |

Do **not** delete logs, drop tables, or "clean up" data. `audit_logs`,
`case_status_history` and `document_access_logs` are append-only precisely so
they survive this moment.

**3. Establish scope.** The questions to answer, in this order:

- Which data, which people, which organisations?
- Over what window? (`document_access_logs.created_at`, `audit_logs.created_at`)
- Was it read, or only reachable?
- Is it still happening?

`document_access_logs` records who opened which document version and when.
`audit_logs` records every privileged action with actor, action, target and
origin. Between them, most scoping questions are answerable with SQL.

**4. Decide whether it is still live.** If you cannot say no, keep the
containment in place. A reopened hole is worse than a day of degraded service.

---

## Then

**5. Fix the cause, not the symptom.** A leak through RLS gets a policy fix
_and_ an integration test that a wrong actor is rejected. A leak through a
Server Action gets the `requireCapability()` call _and_ the policy, because the
two layers are meant to be independent.

**6. Notify.** Who and how fast depends on the law that applies and on the
contract — this is a question for counsel, and the answer belongs in this
document once it exists. What is not negotiable: affected people are told what
happened, what data was involved, what BDoor has done, and what they should do.
No minimising language, no "may have potentially been affected" when you know.

**7. Record it.** A data subject request that arrives afterwards must be
answerable. If personal data was involved, open the corresponding
`data_subject_requests` records rather than handling it in email.

**8. Write the postmortem within a week.** Blameless, and specific about the
change that would have prevented it. If the answer is "a test", write the test.

---

## Access that has to be checked afterwards

After any incident involving credentials or a suspicious session:

- [ ] `public.platform_roles` — is every staff role still one you would grant
      today? Remember nobody can grant themselves one, so an unexpected row
      means an admin account was used.
- [ ] `public.organization_memberships` — any membership you do not recognise?
- [ ] `public.partners` — any `verification_status` change you did not make?
      `app.partners_guard()` blocks self-verification, so a change means an
      admin account or the service role was used.
- [ ] `user_security_settings` — any MFA enrolment removed?
- [ ] Supabase Auth — active sessions and API keys.
- [ ] Payment gateway — webhook endpoints and secrets.
- [ ] `webhook_events` / `integration_events` — replayed or duplicated events.

---

## Prevention already in place

Worth knowing what you already have when you are deciding what to add.

- Authorisation is enforced twice: `requireCapability()` and RLS.
- Roles live in their own tables, never in editable user metadata.
- Secrets are server-only; nothing secret carries `NEXT_PUBLIC_`.
- Storage is private, addressed by server-generated canonical paths, served by
  short-lived signed URLs, and every access is logged.
- Uploads are sniffed by magic bytes, not by extension.
- Webhooks are HMAC-verified and idempotent by provider event id.
- Rate limits cover sign-in, sign-up, password reset, MFA verification, contact,
  questionnaire saves, uploads, downloads, invitations and messages.
- Audit and case history are append-only at the database level.
- Security headers (`X-Frame-Options: DENY`, `nosniff`, Referrer-Policy,
  Permissions-Policy, COOP, HSTS in production) are set in `next.config.ts`, and
  the private areas are `no-store` and `noindex`.

## Gaps to close before launch

- Named incident lead and a published security contact address.
- A real malware scanner (`MALWARE_SCAN_PROVIDER` is `mock`, which leaves
  uploads `pending` rather than clearing them).
- Real sanctions/PEP screening (`SCREENING_PROVIDER` is `mock`, and says so in
  the UI).
- Error monitoring wired to `SENTRY_DSN` with alerting someone actually reads.
- A rate-limit store shared across instances if the deployment scales out.
- Dependency vulnerability alerting.
- A rehearsal: walk one scenario end to end before you need to do it for real.
