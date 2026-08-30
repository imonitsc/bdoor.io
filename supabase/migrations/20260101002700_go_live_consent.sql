-- =============================================================================
-- Go-live release (owner instruction, 30 Aug 2026): policy consent recording
-- and idempotent questionnaire submission.
--
-- Three additive columns, no behaviour change for existing rows:
--   1. consent_records.method — how the consent was captured (signup checkbox,
--      application consent question, quote acceptance …). The table always
--      recorded who/what/when; this records how.
--   2. applications.consent_policy_version — the privacy-policy version shown
--      next to the consent question the applicant ticked.
--   3. questionnaire_sessions.application_reference — stamped on successful
--      submission so a resubmit of the same draft returns the SAME reference
--      instead of creating a second application (idempotent submit).
--
-- Rollback: drop the three columns.
-- =============================================================================

alter table public.consent_records
  add column if not exists method text;

comment on column public.consent_records.method is
  'How the consent was captured, e.g. signup_checkbox, application_consent, quote_acceptance.';

alter table public.applications
  add column if not exists consent_policy_version text;

comment on column public.applications.consent_policy_version is
  'Version of the privacy policy shown beside the consent question at submission.';

alter table public.questionnaire_sessions
  add column if not exists application_reference text;

comment on column public.questionnaire_sessions.application_reference is
  'Reference of the application this draft produced; present means already submitted, and a repeat submit returns it unchanged.';
