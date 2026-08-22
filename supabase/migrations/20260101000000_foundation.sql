-- =============================================================================
-- BDoor — foundation: extensions, private helper schema, shared enums.
--
-- Design rules that hold across every migration in this project:
--   * Row Level Security is enabled on EVERY table in `public`.
--   * Authorization NEVER reads auth.users.raw_user_meta_data. Roles live in
--     server-controlled tables (`platform_roles`, `organization_memberships`).
--   * Helper predicates live in the private `app` schema. That schema is not
--     exposed through the Data API, its functions are SECURITY DEFINER only
--     where required to break RLS recursion, and every one pins search_path.
--   * Compliance/risk data lives in the private `compliance` schema so it can
--     never be reached by an ordinary Data API caller, whatever the UI does.
-- =============================================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext" with schema extensions;

-- Private schemas. Neither is added to the PostgREST `db-schemas` list, so
-- nothing inside them is reachable from the Data API.
create schema if not exists app;
create schema if not exists compliance;

revoke all on schema app from public, anon, authenticated;
revoke all on schema compliance from public, anon, authenticated;
grant usage on schema app to authenticated, service_role;
grant usage on schema compliance to service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.organization_kind as enum ('customer', 'partner');

create type public.organization_role as enum (
  'customer_owner',
  'customer_member',
  'partner_owner',
  'partner_staff'
);

-- Platform (BDoor-internal) roles. Deliberately separate from organization
-- membership so a staff member is never "a member of every customer".
create type public.platform_role as enum (
  'case_manager',
  'compliance_officer',
  'finance',
  'admin',
  'super_admin'
);

create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create type public.case_status as enum (
  'draft',
  'awaiting_kyc',
  'kyc_review',
  'quote_ready',
  'awaiting_acceptance',
  'awaiting_payment',
  'documents_required',
  'partner_review',
  'ready_to_submit',
  'submitted',
  'authority_query',
  'customer_action_required',
  'approved',
  'rejected',
  'closed',
  'cancelled'
);

-- What the clock is waiting on. Estimated completion pauses while this is not
-- 'none', so we never show a countdown that is really blocked on someone else.
create type public.case_waiting_on as enum ('none', 'customer', 'partner', 'authority', 'payment');

create type public.milestone_status as enum ('pending', 'in_progress', 'blocked', 'complete', 'skipped');

create type public.task_status as enum ('open', 'in_progress', 'blocked', 'done', 'cancelled');

create type public.task_visibility as enum ('customer', 'internal', 'partner');

create type public.document_status as enum (
  'requested',
  'uploaded',
  'under_review',
  'accepted',
  'replacement_requested',
  'expired',
  'archived'
);

create type public.document_scan_status as enum ('pending', 'clean', 'infected', 'quarantined', 'skipped');

create type public.document_visibility as enum ('customer', 'internal', 'partner_shared');

create type public.publication_status as enum ('draft', 'published', 'coming_soon', 'retired');

create type public.quote_status as enum ('draft', 'internal_review', 'sent', 'accepted', 'expired', 'superseded', 'withdrawn');

create type public.quote_item_category as enum (
  'platform_service_fee',
  'government_fee_estimate',
  'partner_professional_fee',
  'third_party_cost',
  'tax',
  'payment_processing_fee',
  'discount'
);

create type public.payee_type as enum ('bdoor', 'government_authority', 'partner_firm', 'third_party');

create type public.invoice_status as enum ('draft', 'issued', 'part_paid', 'paid', 'void', 'refunded');

create type public.payment_status as enum (
  'pending',
  'paid',
  'failed',
  'cancelled',
  'partially_refunded',
  'refunded'
);

create type public.currency_code as enum ('BDT', 'USD');

create type public.kyc_subject_type as enum ('individual', 'entity');

create type public.kyc_check_type as enum (
  'identity',
  'address',
  'beneficial_owner',
  'pep',
  'sanctions',
  'adverse_media',
  'source_of_funds'
);

create type public.kyc_check_status as enum ('not_started', 'pending', 'passed', 'failed', 'manual_review', 'waived');

create type public.risk_rating as enum ('low', 'medium', 'high', 'prohibited');

create type public.compliance_decision_type as enum ('approved', 'rejected', 'escalated', 'more_information_required');

create type public.partner_verification_status as enum ('unverified', 'in_review', 'verified', 'suspended', 'rejected');

create type public.assignment_status as enum ('offered', 'accepted', 'declined', 'withdrawn', 'completed');

create type public.obligation_status as enum ('upcoming', 'due', 'overdue', 'in_progress', 'completed', 'waived');

create type public.notification_channel as enum ('in_app', 'email');

create type public.consent_type as enum (
  'terms_of_service',
  'privacy_policy',
  'kyc_declaration',
  'quote_acceptance',
  'partner_engagement',
  'partner_data_sharing',
  'marketing'
);

create type public.locale_code as enum ('en', 'bn');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest.
-- ---------------------------------------------------------------------------
create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Block UPDATE/DELETE outright. Used by append-only tables (audit, history).
-- ---------------------------------------------------------------------------
create or replace function app.reject_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Table %.% is append-only; % is not permitted',
    tg_table_schema, tg_table_name, tg_op
    using errcode = 'raise_exception';
end;
$$;
